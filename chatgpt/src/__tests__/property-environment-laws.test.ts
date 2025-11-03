import { Laws, isEligibleForLandRight, validateEnvironmentalPermit, canWNAOwnHousing } from '../laws/property-environment-laws.js';

describe('Property & Environment Laws Module', () => {
  test('Laws constants should be defined', () => {
    expect(Laws).toBeDefined();
    expect(Laws.LAND_LAW.UU_5_1960).toBe('UUPA (Agraria - Land Law)');
  });

  test('isEligibleForLandRight should validate correctly', () => {
    expect(isEligibleForLandRight('Hak Milik', 'WNI')).toBe(true);
    expect(isEligibleForLandRight('Hak Milik', 'WNA')).toBe(false);
  });

  test('validateEnvironmentalPermit should validate correctly', () => {
    expect(validateEnvironmentalPermit('AMDAL', 'high')).toBe(true);
    expect(validateEnvironmentalPermit('UKL-UPL', 'low')).toBe(true);
    expect(validateEnvironmentalPermit('UKL-UPL', 'high')).toBe(false);
  });

  test('canWNAOwnHousing should validate correctly', () => {
    expect(canWNAOwnHousing('apartemen', 'allowed', 1000000000, 500000000)).toBe(true);
    expect(canWNAOwnHousing('apartemen', 'restricted', 1000000000, 500000000)).toBe(false);
    expect(canWNAOwnHousing('apartemen', 'allowed', 400000000, 500000000)).toBe(false);
  });
});