// Dynamic module loader for code splitting and lazy loading
class ModuleLoader {
  constructor() {
    this.loadedModules = new Map();
    this.loadingPromises = new Map();
    this.preloadQueue = new Set();
    this.criticalModules = new Set([
      'config',
      'logger',
      'performance-monitor'
    ]);
  }

  // Load module dynamically
  async loadModule(moduleName, options = {}) {
    const { 
      preload = false, 
      critical = false,
      timeout = 10000 
    } = options;

    // Return cached module if already loaded
    if (this.loadedModules.has(moduleName)) {
      return this.loadedModules.get(moduleName);
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises.has(moduleName)) {
      return this.loadingPromises.get(moduleName);
    }

    // Create loading promise
    const loadingPromise = this.createLoadingPromise(moduleName, timeout);
    this.loadingPromises.set(moduleName, loadingPromise);

    try {
      const module = await loadingPromise;
      this.loadedModules.set(moduleName, module);
      this.loadingPromises.delete(moduleName);
      return module;
    } catch (error) {
      this.loadingPromises.delete(moduleName);
      throw error;
    }
  }

  // Create loading promise with timeout
  createLoadingPromise(moduleName, timeout) {
    const moduleUrl = this.getModuleUrl(moduleName);
    
    return Promise.race([
      import(moduleUrl),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Module ${moduleName} failed to load within ${timeout}ms`));
        }, timeout);
      })
    ]);
  }

  // Get module URL
  getModuleUrl(moduleName) {
    const baseUrl = '/js/';
    const moduleMap = {
      // Core utilities
      'config': 'config.js',
      'logger': 'utils/logger.js',
      'performance-monitor': 'utils/performance-monitor.js',
      'image-optimizer': 'utils/image-optimizer.js',
      
      // Components
      'chat-component': 'components/ChatComponent.js',
      
      // Features
      'streaming-client': 'streaming-client.js',
      'streaming-ui': 'streaming-ui.js',
      'streaming-toggle': 'streaming-toggle.js',
      'theme-switcher': 'theme-switcher.js',
      'feature-discovery': 'feature-discovery.js',
      'onboarding-system': 'onboarding-system.js',
      'message-virtualization': 'message-virtualization.js',
      'test-console': 'test-console.js',
      
      // Core services
      'api-client': 'core/api-client.js',
      'state-manager': 'core/state-manager.js',
      'router': 'core/router.js',
      'jwt-service': 'auth/jwt-service.js'
    };

    return baseUrl + (moduleMap[moduleName] || `${moduleName}.js`);
  }

  // Preload modules
  async preloadModules(moduleNames) {
    const preloadPromises = moduleNames.map(moduleName => {
      if (!this.loadedModules.has(moduleName) && !this.preloadQueue.has(moduleName)) {
        this.preloadQueue.add(moduleName);
        return this.loadModule(moduleName, { preload: true });
      }
      return Promise.resolve();
    });

    return Promise.allSettled(preloadPromises);
  }

  // Load critical modules first
  async loadCriticalModules() {
    const criticalModules = Array.from(this.criticalModules);
    return this.preloadModules(criticalModules);
  }

  // Lazy load module when needed
  async lazyLoad(moduleName, condition = () => true) {
    if (!condition()) {
      return null;
    }

    try {
      return await this.loadModule(moduleName);
    } catch (error) {
      console.warn(`Failed to lazy load module ${moduleName}:`, error);
      return null;
    }
  }

  // Load module on user interaction
  loadOnInteraction(moduleName, triggerSelector, eventType = 'click') {
    const elements = document.querySelectorAll(triggerSelector);
    
    elements.forEach(element => {
      const handler = async () => {
        try {
          await this.loadModule(moduleName);
          element.removeEventListener(eventType, handler);
        } catch (error) {
          console.warn(`Failed to load module ${moduleName} on interaction:`, error);
        }
      };
      
      element.addEventListener(eventType, handler, { once: true });
    });
  }

  // Load module when element becomes visible
  loadOnVisible(moduleName, targetSelector) {
    const target = document.querySelector(targetSelector);
    if (!target) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        async (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              try {
                await this.loadModule(moduleName);
                observer.disconnect();
              } catch (error) {
                console.warn(`Failed to load module ${moduleName} on visible:`, error);
              }
            }
          }
        },
        { threshold: 0.1 }
      );

      observer.observe(target);
    } else {
      // Fallback: load immediately
      this.loadModule(moduleName);
    }
  }

  // Load module after delay
  loadAfterDelay(moduleName, delay = 1000) {
    setTimeout(() => {
      this.loadModule(moduleName).catch(error => {
        console.warn(`Failed to load module ${moduleName} after delay:`, error);
      });
    }, delay);
  }

  // Load module on idle
  loadOnIdle(moduleName) {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.loadModule(moduleName).catch(error => {
          console.warn(`Failed to load module ${moduleName} on idle:`, error);
        });
      });
    } else {
      // Fallback: load after short delay
      this.loadAfterDelay(moduleName, 100);
    }
  }

  // Get loading status
  getLoadingStatus() {
    return {
      loaded: Array.from(this.loadedModules.keys()),
      loading: Array.from(this.loadingPromises.keys()),
      preloaded: Array.from(this.preloadQueue)
    };
  }

  // Check if module is loaded
  isLoaded(moduleName) {
    return this.loadedModules.has(moduleName);
  }

  // Unload module (for memory management)
  unloadModule(moduleName) {
    this.loadedModules.delete(moduleName);
    this.preloadQueue.delete(moduleName);
  }

  // Clear all modules
  clearAll() {
    this.loadedModules.clear();
    this.loadingPromises.clear();
    this.preloadQueue.clear();
  }
}

// Create global instance
export const moduleLoader = new ModuleLoader();

// Auto-load critical modules
moduleLoader.loadCriticalModules().catch(error => {
  console.warn('Failed to load critical modules:', error);
});

// Preload common modules based on page
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  
  if (path.includes('chat') || path.includes('syncra')) {
    // Preload chat-related modules
    moduleLoader.preloadModules([
      'streaming-client',
      'streaming-ui',
      'chat-component',
      'message-virtualization'
    ]);
  }
  
  if (path.includes('login')) {
    // Preload auth modules
    moduleLoader.preloadModules([
      'jwt-service',
      'api-client'
    ]);
  }
  
  // Load theme switcher on idle
  moduleLoader.loadOnIdle('theme-switcher');
  
  // Load feature discovery when user interacts
  moduleLoader.loadOnInteraction('feature-discovery', '.feature-trigger', 'mouseover');
  
  // Load test console only when needed
  moduleLoader.loadOnVisible('test-console', '.test-console-trigger');
});

// Export utility functions
export const loadModule = (moduleName, options) => moduleLoader.loadModule(moduleName, options);
export const preloadModules = (moduleNames) => moduleLoader.preloadModules(moduleNames);
export const lazyLoad = (moduleName, condition) => moduleLoader.lazyLoad(moduleName, condition);