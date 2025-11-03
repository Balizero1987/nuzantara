// Healthcare & Social Laws Module

// Define types and constants for Healthcare (UU 36/2009)
export type HealthcareType = 'public' | 'private' | 'traditional';
export interface HealthcareLaw {
  healthcareType: HealthcareType;
  licenseRequired: boolean;
  practitionerRequirements: 'WNI only' | 'WNA allowed';
  insuranceCoverage: 'BPJS' | 'private';
}

export const UU_36_2009: HealthcareLaw = {
  healthcareType: 'public',
  licenseRequired: true,
  practitionerRequirements: 'WNI only',
  insuranceCoverage: 'BPJS',
};

// Define types and constants for BPJS (UU 24/2011)
export interface BPJSLaw {
  mandatoryFor: 'WNI' | 'WNA with KITAS' | 'employers';
  contributionRate: number; // percentage of salary
  coverageType: 'Kesehatan' | 'Ketenagakerjaan';
  benefits: string[];
  penalties: string;
}

export const UU_24_2011: BPJSLaw = {
  mandatoryFor: 'WNI',
  contributionRate: 5,
  coverageType: 'Kesehatan',
  benefits: ['hospitalization', 'medication'],
  penalties: 'Fines for non-compliance',
};

// Define types and constants for Education (UU 20/2003, PP 47/2008)
export interface EducationLaw {
  educationLevel: 'SD' | 'SMP' | 'SMA' | 'universitas';
  mandatoryYears: 9 | 12;
  foreignSchools: boolean; // Requirements for WNA children
  teacherRequirements: 'WNI only' | 'WNA with permit';
}

export const UU_20_2003: EducationLaw = {
  educationLevel: 'SD',
  mandatoryYears: 9,
  foreignSchools: true,
  teacherRequirements: 'WNI only',
};

export const PP_47_2008: EducationLaw = {
  educationLevel: 'SMP',
  mandatoryYears: 12,
  foreignSchools: true,
  teacherRequirements: 'WNA with permit',
};

// Utility functions to query laws
export function getHealthcareLaw(): HealthcareLaw {
  return UU_36_2009;
}

export function getBPJSLaw(): BPJSLaw {
  return UU_24_2011;
}

export function getEducationLaw(): EducationLaw[] {
  return [UU_20_2003, PP_47_2008];
}