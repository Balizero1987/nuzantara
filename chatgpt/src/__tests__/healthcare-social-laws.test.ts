import { describe, it, expect } from 'vitest';
import {
  getHealthcareLaw,
  getBPJSLaw,
  getEducationLaw,
  UU_36_2009,
  UU_24_2011,
  UU_20_2003,
  PP_47_2008,
} from '../laws/healthcare-social-laws';

describe('Healthcare & Social Laws Module', () => {
  it('should return the correct healthcare law (UU 36/2009)', () => {
    const healthcareLaw = getHealthcareLaw();
    expect(healthcareLaw).toEqual(UU_36_2009);
  });

  it('should return the correct BPJS law (UU 24/2011)', () => {
    const bpjsLaw = getBPJSLaw();
    expect(bpjsLaw).toEqual(UU_24_2011);
  });

  it('should return the correct education laws (UU 20/2003, PP 47/2008)', () => {
    const educationLaws = getEducationLaw();
    expect(educationLaws).toContainEqual(UU_20_2003);
    expect(educationLaws).toContainEqual(PP_47_2008);
  });
});
