import axios from 'axios';

interface Proxy {
  server: string;
  username?: string;
  password?: string;
  lastUsed?: Date;
  failCount: number;
  successCount: number;
}

export class ProxyRotator {
  private proxies: Proxy[] = [];
  private currentIndex = 0;

  constructor() {
    this.loadProxies();
  }

  private loadProxies() {
    // Free proxy services (for testing)
    // In production, use paid residential proxies
    this.proxies = [
      // Add more proxies from environment variables
      ...(process.env.PROXY_LIST?.split(',') || []).map(p => ({
        server: p.trim(),
        failCount: 0,
        successCount: 0
      }))
    ];

    // For production, use residential proxy service
    if (process.env.PROXY_SERVICE_API) {
      this.loadResidentialProxies();
    }
  }

  private async loadResidentialProxies() {
    try {
      // Example: BrightData, SmartProxy, or similar service
      const response = await axios.get(process.env.PROXY_SERVICE_API!, {
        headers: {
          'Authorization': `Bearer ${process.env.PROXY_SERVICE_KEY}`
        }
      });

      const proxies = response.data.proxies.map((p: any) => ({
        server: `http://${p.ip}:${p.port}`,
        username: p.username,
        password: p.password,
        failCount: 0,
        successCount: 0
      }));

      this.proxies.push(...proxies);
    } catch (error) {
      console.error('Failed to load residential proxies:', error);
    }
  }

  async getNext(): Promise<any> {
    if (this.proxies.length === 0) {
      return undefined; // No proxy
    }

    // Round-robin with health tracking
    const proxy = this.proxies[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.proxies.length;

    // Skip if too many failures
    if (proxy.failCount > 5) {
      return this.getNext();
    }

    proxy.lastUsed = new Date();

    return {
      server: proxy.server,
      username: proxy.username,
      password: proxy.password
    };
  }

  markSuccess(proxyServer: string) {
    const proxy = this.proxies.find(p => p.server === proxyServer);
    if (proxy) {
      proxy.successCount++;
      proxy.failCount = Math.max(0, proxy.failCount - 1);
    }
  }

  markFailure(proxyServer: string) {
    const proxy = this.proxies.find(p => p.server === proxyServer);
    if (proxy) {
      proxy.failCount++;
    }
  }

  getStats() {
    return this.proxies.map(p => ({
      server: p.server,
      health: p.failCount === 0 ? 'healthy' : p.failCount > 5 ? 'dead' : 'degraded',
      successRate: p.successCount / (p.successCount + p.failCount) || 0
    }));
  }
}

