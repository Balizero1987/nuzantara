// Property & Environment Laws Module

// Constants for Laws
export const Laws = {
  LAND_LAW: {
    UU_5_1960: 'UUPA (Agraria - Land Law)',
    PP_18_2021: 'Hak Pengelolaan, Hak Atas Tanah',
  },
  ENVIRONMENT: {
    UU_32_2009: 'Lingkungan Hidup',
    PP_22_2021: 'Perlindungan Lingkungan Hidup',
  },
  HOUSING: {
    UU_1_2011: 'Perumahan dan Kawasan Permukiman',
  },
} as const;

// Types for Critical Signals
export type LandLawSignals = {
  land_right_type: 'Hak Milik' | 'Hak Guna Usaha' | 'Hak Guna Bangunan' | 'Hak Pakai';
  citizenship_requirement: 'WNI_only' | 'WNA_allowed';
  duration: '20yr' | '30yr' | '80yr' | 'indefinite';
  renewable: boolean;
  transferable: boolean;
  location_restrictions?: string[]; // Optional: Specific provinces/zones
};

export type EnvironmentSignals = {
  environmental_permit: 'AMDAL' | 'UKL-UPL';
  business_impact: 'low' | 'medium' | 'high';
  monitoring_required: boolean;
  sanctions: 'administrative' | 'criminal';
};

export type HousingSignals = {
  housing_type: 'rumah tinggal' | 'apartemen' | 'rusunawa';
  ownership_by_WNA: 'allowed' | 'restricted';
  minimum_price: number; // Minimum price in IDR for WNA purchases
};

// Utility Functions
export const isEligibleForLandRight = (
  landRightType: LandLawSignals['land_right_type'],
  citizenship: 'WNI' | 'WNA'
): boolean => {
  if (landRightType === 'Hak Milik' && citizenship === 'WNA') {
    return false; // Hak Milik is for WNI only
  }
  return true; // Other types are allowed
};

export const validateEnvironmentalPermit = (
  permit: EnvironmentSignals['environmental_permit'],
  impact: EnvironmentSignals['business_impact']
): boolean => {
  if (permit === 'AMDAL' && impact === 'high') {
    return true; // AMDAL required for high-impact businesses
  }
  if (permit === 'UKL-UPL' && impact !== 'high') {
    return true; // UKL-UPL for low/medium impact
  }
  return false; // Invalid combination
};

export const canWNAOwnHousing = (
  housingType: HousingSignals['housing_type'],
  ownership: HousingSignals['ownership_by_WNA'],
  price: number,
  minimumPrice: HousingSignals['minimum_price']
): boolean => {
  if (ownership === 'restricted') {
    return false; // WNA cannot own this type of housing
  }
  return price >= minimumPrice; // Check if price meets the minimum requirement
};
