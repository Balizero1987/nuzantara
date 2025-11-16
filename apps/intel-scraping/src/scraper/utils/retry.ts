export async function exponentialBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      if (attempt === maxAttempts - 1) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      console.log(`⏳ Retry attempt ${attempt + 1}/${maxAttempts} in ${Math.round(delay)}ms`);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

export function createRateLimiter(requestsPerMinute: number = 60) {
  const queue: Array<() => void> = [];
  let processing = false;
  const minDelay = 60000 / requestsPerMinute;

  async function processQueue() {
    if (processing || queue.length === 0) return;

    processing = true;

    while (queue.length > 0) {
      const resolve = queue.shift();
      if (resolve) resolve();

      await new Promise(r => setTimeout(r, minDelay));
    }

    processing = false;
  }

  return function waitForSlot(): Promise<void> {
    return new Promise(resolve => {
      queue.push(resolve);
      processQueue();
    });
  };
}

