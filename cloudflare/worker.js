/**
 * NUZANTARA Edge Worker
 * 
 * Implements geographic routing to regional backends with cache-first strategy
 * for global latency reduction.
 */

// Regional backend URLs
const BACKEND_URLS = {
  asia: 'https://ts-backend-production-568d.up.railway.app',
  europe: 'https://ts-backend-production-568d.up.railway.app',
  americas: 'https://ts-backend-production-568d.up.railway.app',
  default: 'https://ts-backend-production-568d.up.railway.app'
};

// Cache TTL in seconds
const CACHE_TTL = 3600; // 1 hour

// Continent to region mapping
const CONTINENT_MAP = {
  'AS': 'asia',
  'AF': 'africa',
  'EU': 'europe',
  'NA': 'americas',
  'SA': 'americas',
  'OC': 'asia',
  'AN': 'default'
};

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Bypass cache for certain paths
  const bypassCache = 
    request.method !== 'GET' ||
    url.pathname.startsWith('/api/auth') ||
    url.pathname.startsWith('/api/admin') ||
    url.pathname.includes('/webhook');

  if (bypassCache) {
    return forwardToBackend(request);
  }

  // Try cache first
  const cache = caches.default;
  const cacheKey = new Request(url.toString(), request);
  
  let response = await cache.match(cacheKey);
  
  if (response) {
    // Cache hit
    response = new Response(response.body, response);
    response.headers.set('X-Cache', 'HIT');
    response.headers.set('X-Cache-Age', getAge(response));
    return response;
  }

  // Cache miss - forward to backend
  response = await forwardToBackend(request);
  
  // Cache successful responses
  if (response.ok) {
    const clonedResponse = response.clone();
    response = new Response(clonedResponse.body, clonedResponse);
    response.headers.set('X-Cache', 'MISS');
    response.headers.set('Cache-Control', `public, max-age=${CACHE_TTL}`);
    
    // Store in cache
    event.waitUntil(cache.put(cacheKey, response.clone()));
  }

  return response;
}

async function forwardToBackend(request) {
  const backendUrl = selectBackend(request);
  const url = new URL(request.url);
  
  // Create new URL with backend
  const backendRequest = new Request(
    `${backendUrl}${url.pathname}${url.search}`,
    {
      method: request.method,
      headers: request.headers,
      body: request.body,
      redirect: 'follow'
    }
  );

  try {
    const response = await fetch(backendRequest);
    
    // Add region header
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('X-Backend-Region', getRegion(request));
    
    return newResponse;
  } catch (error) {
    console.error('Backend error:', error);
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'Backend unavailable',
        message: error.message
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

function selectBackend(request) {
  const region = getRegion(request);
  return BACKEND_URLS[region] || BACKEND_URLS.default;
}

function getRegion(request) {
  // Try Cloudflare continent code
  const continent = request.cf?.continent;
  if (continent && CONTINENT_MAP[continent]) {
    return CONTINENT_MAP[continent];
  }

  // Fallback to default
  return 'default';
}

function getAge(response) {
  const dateHeader = response.headers.get('Date');
  if (!dateHeader) return '0';
  
  const responseTime = new Date(dateHeader).getTime();
  const now = Date.now();
  const age = Math.floor((now - responseTime) / 1000);
  
  return age.toString();
}

// Health check endpoint
addEventListener('scheduled', event => {
  event.waitUntil(healthCheck());
});

async function healthCheck() {
  const regions = ['asia', 'europe', 'americas'];
  const results = {};

  for (const region of regions) {
    const url = `${BACKEND_URLS[region]}/health`;
    try {
      const response = await fetch(url, { method: 'GET' });
      results[region] = {
        status: response.status,
        ok: response.ok,
        latency: response.headers.get('X-Response-Time') || 'N/A'
      };
    } catch (error) {
      results[region] = {
        status: 503,
        ok: false,
        error: error.message
      };
    }
  }

  console.log('Health check results:', JSON.stringify(results));
  return results;
}
