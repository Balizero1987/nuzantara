import { buildInstagramPrompt } from '../../src/handlers/communication/instagram.js';
import { buildWhatsappPrompt } from '../../src/handlers/communication/whatsapp.js';

describe('Social prompt builders', () => {
  it('buildInstagramPrompt includes username, followers and context', () => {
    const ctx = {
      username: 'balizero0',
      userInfo: { is_verified: true, follower_count: 1234 },
      sentiment: { label: 'POS', score: 7.5 },
    };
    const prompt = buildInstagramPrompt(ctx, 'Prev context', 'How much is KITAS?');
    expect(prompt).toContain('@balizero0');
    expect(prompt).toContain('1234');
    expect(prompt).toContain('Prev context');
    expect(prompt).toContain('How much is KITAS?');
  });

  it('buildWhatsappPrompt includes user/group info and context', () => {
    const ctx = {
      userName: 'Amanda',
      isGroup: true,
      groupId: 'group-001',
      sentiment: { label: 'NEU', score: 5 },
    };
    const prompt = buildWhatsappPrompt(ctx, 'No previous context', 'kbli untuk restoran?');
    expect(prompt).toContain('Amanda');
    expect(prompt).toContain('Group: group-001');
    expect(prompt).toContain('No previous context');
    expect(prompt).toContain('kbli untuk restoran?');
  });
});

