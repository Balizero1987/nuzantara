/**
 * @nuzantara/utils
 * Shared utility functions for the Nuzantara monorepo
 */

// String utilities
export const capitalize = (str: string): string => 
  str.charAt(0).toUpperCase() + str.slice(1);

export const slugify = (str: string): string =>
  str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Array utilities
export const unique = <T>(arr: T[]): T[] => [...new Set(arr)];

export const chunk = <T>(arr: T[], size: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

// Object utilities
export const omit = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...obj };
  keys.forEach(key => delete result[key]);
  return result;
};

// Date utilities
export const formatDate = (date: Date | number): string => {
  const d = typeof date === 'number' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
};

// Export all utils
export * from './utils/index.js';
