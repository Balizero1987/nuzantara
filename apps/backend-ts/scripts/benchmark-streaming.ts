/**
 * Performance Benchmarking Tool for SSE Streaming
 * 
 * Measures:
 * - First token latency (target: <100ms)
 * - Inter-token latency (target: <50ms)
 * - Connection stability
 * - Error rates
 */

import { EventSource } from 'eventsource';

interface BenchmarkResult {
  firstTokenLatency: number;
  avgInterTokenLatency: number;
  totalTokens: number;
  totalDuration: number;
  errors: number;
  connectionStable: boolean;
}

async function benchmarkStream(baseUrl: string, query: string): Promise<BenchmarkResult> {
  const url = `${baseUrl}?query=${encodeURIComponent(query)}`;
  const result: BenchmarkResult = {
    firstTokenLatency: 0,
    avgInterTokenLatency: 0,
    totalTokens: 0,
    totalDuration: 0,
    errors: 0,
    connectionStable: true
  };

  const startTime = Date.now();
  let firstTokenTime: number | null = null;
  let lastTokenTime: number | null = null;
  const interTokenLatencies: number[] = [];

  return new Promise((resolve, reject) => {
    const eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'token') {
          const now = Date.now();
          
          if (!firstTokenTime) {
            firstTokenTime = now;
            result.firstTokenLatency = firstTokenTime - startTime;
          } else if (lastTokenTime) {
            const interTokenLatency = now - lastTokenTime;
            interTokenLatencies.push(interTokenLatency);
          }
          
          lastTokenTime = now;
          result.totalTokens++;
        }

        if (data.type === 'done') {
          result.totalDuration = Date.now() - startTime;
          
          if (interTokenLatencies.length > 0) {
            result.avgInterTokenLatency = interTokenLatencies.reduce((a, b) => a + b, 0) / interTokenLatencies.length;
          }

          eventSource.close();
          resolve(result);
        }

        if (data.type === 'error') {
          result.errors++;
          eventSource.close();
          reject(new Error(data.data?.message || 'Stream error'));
        }
      } catch (error) {
        result.errors++;
        eventSource.close();
        reject(error);
      }
    };

    eventSource.onerror = (error) => {
      result.errors++;
      result.connectionStable = false;
      eventSource.close();
      reject(error);
    };

    // Timeout after 30 seconds
    setTimeout(() => {
      eventSource.close();
      reject(new Error('Benchmark timeout'));
    }, 30000);
  });
}

async function runBenchmarks(baseUrl: string, iterations: number = 10) {
  const query = 'What documents do I need for B211A visa extension?';
  const results: BenchmarkResult[] = [];

  console.log(`\n🚀 Starting SSE Streaming Benchmark (${iterations} iterations)`);
  console.log(`Target: First token <100ms, Inter-token <50ms\n`);

  for (let i = 0; i < iterations; i++) {
    try {
      const result = await benchmarkStream(baseUrl, query);
      results.push(result);
      
      const status = 
        result.firstTokenLatency < 100 && result.avgInterTokenLatency < 50 
          ? '✅' 
          : '⚠️';
      
      console.log(`${status} Iteration ${i + 1}:`);
      console.log(`   First token: ${result.firstTokenLatency}ms`);
      console.log(`   Avg inter-token: ${result.avgInterTokenLatency.toFixed(2)}ms`);
      console.log(`   Tokens: ${result.totalTokens}`);
      console.log(`   Duration: ${result.totalDuration}ms`);
      
      // Small delay between iterations
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error: any) {
      console.error(`❌ Iteration ${i + 1} failed:`, error.message);
    }
  }

  // Calculate statistics
  if (results.length > 0) {
    const firstTokenLatencies = results.map(r => r.firstTokenLatency);
    const interTokenLatencies = results.map(r => r.avgInterTokenLatency);
    
    const avgFirstToken = firstTokenLatencies.reduce((a, b) => a + b, 0) / firstTokenLatencies.length;
    const avgInterToken = interTokenLatencies.reduce((a, b) => a + b, 0) / interTokenLatencies.length;
    
    const p50FirstToken = firstTokenLatencies.sort((a, b) => a - b)[Math.floor(firstTokenLatencies.length * 0.5)];
    const p95FirstToken = firstTokenLatencies.sort((a, b) => a - b)[Math.floor(firstTokenLatencies.length * 0.95)];
    const p99FirstToken = firstTokenLatencies.sort((a, b) => a - b)[Math.floor(firstTokenLatencies.length * 0.99)];

    console.log(`\n📊 Benchmark Results:`);
    console.log(`   First Token Latency:`);
    console.log(`     Average: ${avgFirstToken.toFixed(2)}ms`);
    console.log(`     P50: ${p50FirstToken}ms`);
    console.log(`     P95: ${p95FirstToken}ms`);
    console.log(`     P99: ${p99FirstToken}ms`);
    console.log(`   Inter-Token Latency:`);
    console.log(`     Average: ${avgInterToken.toFixed(2)}ms`);
    
    const targetMet = avgFirstToken < 100 && avgInterToken < 50;
    console.log(`\n${targetMet ? '✅' : '⚠️'} Performance Targets: ${targetMet ? 'MET' : 'NOT MET'}`);
    console.log(`   Target: First token <100ms, Inter-token <50ms`);
    console.log(`   Actual: First token ${avgFirstToken.toFixed(2)}ms, Inter-token ${avgInterToken.toFixed(2)}ms`);
  }
}

// Run if executed directly
if (require.main === module) {
  const baseUrl = process.env.BENCHMARK_URL || 'http://localhost:8080/api/v2/bali-zero/chat-stream';
  const iterations = parseInt(process.env.BENCHMARK_ITERATIONS || '10', 10);
  
  runBenchmarks(baseUrl, iterations).catch(error => {
    console.error('Benchmark failed:', error);
    process.exit(1);
  });
}

export { benchmarkStream, runBenchmarks };

