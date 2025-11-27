/**
 * Lazy Loader Utility
 *
 * Provides dynamic import functionality for loading modules on-demand.
 * This improves initial page load performance by deferring non-critical modules.
 */

/**
 * Load a module dynamically
 * @param {string} modulePath - Path to the module to load
 * @returns {Promise<*>} The loaded module
 */
export async function loadModule(modulePath) {
  try {
    const module = await import(modulePath);
    return module;
  } catch (error) {
    console.error(`Failed to load module: ${modulePath}`, error);
    throw error;
  }
}

/**
 * Load multiple modules in parallel
 * @param {string[]} modulePaths - Array of module paths to load
 * @returns {Promise<Array>} Array of loaded modules
 */
export async function loadModules(modulePaths) {
  try {
    const modules = await Promise.all(
      modulePaths.map(path => import(path))
    );
    return modules;
  } catch (error) {
    console.error('Failed to load modules:', error);
    throw error;
  }
}

/**
 * Check if a module is already loaded
 * @param {string} moduleName - Name of the module to check
 * @returns {boolean} True if module is loaded
 */
export function isModuleLoaded(moduleName) {
  return typeof window[moduleName] !== 'undefined';
}

/**
 * Lazy load a client module and initialize it
 * @param {string} modulePath - Path to the client module
 * @param {string} globalName - Global name to check/store the client
 * @param {Function} initCallback - Optional callback to initialize the client
 * @returns {Promise<*>} The loaded and initialized client
 */
export async function loadClient(modulePath, globalName, initCallback = null) {
  // Check if already loaded
  if (isModuleLoaded(globalName)) {
    return window[globalName];
  }

  try {
    const module = await loadModule(modulePath);

    // Store in global scope if it exports a default
    if (module.default) {
      window[globalName] = module.default;
    } else {
      // Store the entire module
      window[globalName] = module;
    }

    // Initialize if callback provided
    if (initCallback && typeof initCallback === 'function') {
      await initCallback(window[globalName]);
    }

    return window[globalName];
  } catch (error) {
    console.error(`Failed to load client: ${globalName}`, error);
    throw error;
  }
}

// Export default
export default {
  loadModule,
  loadModules,
  isModuleLoaded,
  loadClient
};
