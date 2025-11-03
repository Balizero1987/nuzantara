import { RouteDefinition, HTTPMethod } from './unified-router.js';

/**
 * Route conflict types
 */
export enum ConflictType {
  EXACT_DUPLICATE = 'exact_duplicate', // Same method + path
  PATH_OVERLAP = 'path_overlap', // Different params but same structure
  AMBIGUOUS = 'ambiguous', // Could match multiple routes
}

/**
 * Route conflict information
 */
export interface RouteConflict {
  type: ConflictType;
  route1: RouteInfo;
  route2: RouteInfo;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Registered route information
 */
export interface RouteInfo {
  method: HTTPMethod;
  path: string;
  name?: string;
  pattern: string; // Normalized pattern for comparison
  params: string[]; // Extracted parameter names
}

/**
 * Registry statistics
 */
export interface RegistryStats {
  totalRoutes: number;
  routesByMethod: Record<string, number>;
  conflicts: RouteConflict[];
  warnings: string[];
}

/**
 * RouteRegistry - Centralized route management with conflict detection
 */
export class RouteRegistry {
  private readonly routes: Map<string, RouteInfo> = new Map();
  private conflicts: RouteConflict[] = [];
  private warnings: string[] = [];

  /**
   * Register a route with conflict detection
   */
  register(def: RouteDefinition): void {
    const info = this.extractRouteInfo(def);
    const key = this.makeKey(info.method, info.path);

    // Check for exact duplicates
    if (this.routes.has(key)) {
      const existing = this.routes.get(key)!;
      this.conflicts.push({
        type: ConflictType.EXACT_DUPLICATE,
        route1: existing,
        route2: info,
        message: `Duplicate route registration: ${info.method.toUpperCase()} ${info.path}`,
        severity: 'error',
      });
      return;
    }

    // Check for ambiguous patterns
    const ambiguousRoutes = this.findAmbiguousRoutes(info);
    for (const ambiguous of ambiguousRoutes) {
      this.conflicts.push({
        type: ConflictType.AMBIGUOUS,
        route1: ambiguous,
        route2: info,
        message: `Ambiguous routes detected: ${ambiguous.pattern} vs ${info.pattern}`,
        severity: 'warning',
      });
    }

    // Check for path overlaps
    const overlapping = this.findOverlappingRoutes(info);
    for (const overlap of overlapping) {
      this.conflicts.push({
        type: ConflictType.PATH_OVERLAP,
        route1: overlap,
        route2: info,
        message: `Path overlap detected: ${overlap.path} vs ${info.path}`,
        severity: 'warning',
      });
    }

    // Register the route
    this.routes.set(key, info);
  }

  /**
   * Bulk register routes
   */
  registerMany(defs: RouteDefinition[]): void {
    for (const def of defs) {
      this.register(def);
    }
  }

  /**
   * Check if a route exists
   */
  has(method: HTTPMethod, path: string): boolean {
    return this.routes.has(this.makeKey(method, path));
  }

  /**
   * Get route information
   */
  get(method: HTTPMethod, path: string): RouteInfo | undefined {
    return this.routes.get(this.makeKey(method, path));
  }

  /**
   * Get all registered routes
   */
  getAll(): RouteInfo[] {
    return Array.from(this.routes.values());
  }

  /**
   * Get routes by method
   */
  getByMethod(method: HTTPMethod): RouteInfo[] {
    return Array.from(this.routes.values()).filter((r) => r.method === method);
  }

  /**
   * Get all conflicts
   */
  getConflicts(): RouteConflict[] {
    return [...this.conflicts];
  }

  /**
   * Get conflicts by severity
   */
  getConflictsBySeverity(severity: 'error' | 'warning'): RouteConflict[] {
    return this.conflicts.filter((c) => c.severity === severity);
  }

  /**
   * Check if there are any errors
   */
  hasErrors(): boolean {
    return this.conflicts.some((c) => c.severity === 'error');
  }

  /**
   * Get registry statistics
   */
  getStats(): RegistryStats {
    const routesByMethod: Record<string, number> = {};

    for (const route of this.routes.values()) {
      const method = route.method.toUpperCase();
      routesByMethod[method] = (routesByMethod[method] || 0) + 1;
    }

    return {
      totalRoutes: this.routes.size,
      routesByMethod,
      conflicts: [...this.conflicts],
      warnings: [...this.warnings],
    };
  }

  /**
   * Clear all routes
   */
  clear(): void {
    this.routes.clear();
    this.conflicts = [];
    this.warnings = [];
  }

  /**
   * Validate registry (throws if errors exist)
   */
  validate(): void {
    const errors = this.getConflictsBySeverity('error');

    if (errors.length > 0) {
      const messages = errors.map((e) => `  - ${e.message}`).join('\n');
      throw new Error(`Route registration errors:\n${messages}`);
    }
  }

  /**
   * Extract route information from definition
   */
  private extractRouteInfo(def: RouteDefinition): RouteInfo {
    const params = this.extractParams(def.path);
    const pattern = this.normalizePattern(def.path);

    return {
      method: def.method,
      path: def.path,
      name: def.name,
      pattern,
      params,
    };
  }

  /**
   * Extract parameter names from path
   */
  private extractParams(path: string): string[] {
    const params: string[] = [];
    const matches = path.matchAll(/:([a-zA-Z_]\w*)/g);

    for (const match of matches) {
      if (match[1]) params.push(match[1]);
    }

    return params;
  }

  /**
   * Normalize path pattern for comparison
   */
  private normalizePattern(path: string): string {
    // Replace :param with :* for pattern matching
    return path.replaceAll(/:([a-zA-Z_]\w*)/g, ':*');
  }

  /**
   * Find routes with ambiguous patterns
   */
  private findAmbiguousRoutes(info: RouteInfo): RouteInfo[] {
    const ambiguous: RouteInfo[] = [];

    for (const [key, existing] of this.routes) {
      if (existing.method !== info.method) continue;
      if (key === this.makeKey(info.method, info.path)) continue;

      // Check if patterns could match the same request
      if (this.patternsAmbiguous(existing.pattern, info.pattern)) {
        ambiguous.push(existing);
      }
    }

    return ambiguous;
  }

  /**
   * Find routes with overlapping paths
   */
  private findOverlappingRoutes(info: RouteInfo): RouteInfo[] {
    const overlapping: RouteInfo[] = [];

    for (const [key, existing] of this.routes) {
      if (existing.method !== info.method) continue;
      if (key === this.makeKey(info.method, info.path)) continue;

      // Check if paths have structural overlap
      if (this.pathsOverlap(existing.path, info.path)) {
        overlapping.push(existing);
      }
    }

    return overlapping;
  }

  /**
   * Check if two patterns are ambiguous
   */
  private patternsAmbiguous(pattern1: string, pattern2: string): boolean {
    // Split into segments
    const segments1 = pattern1.split('/').filter(Boolean);
    const segments2 = pattern2.split('/').filter(Boolean);

    // Different lengths generally not ambiguous
    if (segments1.length !== segments2.length) return false;

    // Check each segment
    for (let i = 0; i < segments1.length; i++) {
      const seg1 = segments1[i];
      const seg2 = segments2[i];

      if (!seg1 || !seg2) continue;

      // Both params - ambiguous
      if (seg1 === ':*' && seg2 === ':*') continue;

      // One param, one static - not ambiguous
      if (seg1 === ':*' || seg2 === ':*') return false;

      // Both static but different - not ambiguous
      if (seg1 !== seg2) return false;
    }

    return true;
  }

  /**
   * Check if two paths overlap structurally
   */
  private pathsOverlap(path1: string, path2: string): boolean {
    const pattern1 = this.normalizePattern(path1);
    const pattern2 = this.normalizePattern(path2);

    // Same pattern = overlap
    if (pattern1 === pattern2 && path1 !== path2) return true;

    // Check if one is a prefix of the other
    const segments1 = pattern1.split('/').filter(Boolean);
    const segments2 = pattern2.split('/').filter(Boolean);

    const minLen = Math.min(segments1.length, segments2.length);

    for (let i = 0; i < minLen; i++) {
      const seg1 = segments1[i];
      const seg2 = segments2[i];

      if (!seg1 || !seg2) continue;

      if (seg1 !== seg2 && seg1 !== ':*' && seg2 !== ':*') {
        return false;
      }
    }

    return false;
  }

  /**
   * Create unique key for route
   */
  private makeKey(method: HTTPMethod, path: string): string {
    return `${method.toUpperCase()}:${path}`;
  }
}
