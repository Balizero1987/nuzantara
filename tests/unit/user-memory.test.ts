import { userMemorySave, userMemoryRetrieve, userMemoryLogin, userMemoryList } from '../../src/handlers/memory/user-memory.js';

describe('user.memory.* handlers', () => {
  const uid = 'TestUser@Email.com';

  it('saves memory facts and returns counts', async () => {
    const res1 = await userMemorySave({ userId: uid, profile_facts: ['loves TypeScript'], summary: 'Initial' });
    expect(res1.ok).toBe(true);
    expect(res1.data.facts_count).toBeGreaterThanOrEqual(1);

    const res2 = await userMemorySave({ userId: uid, profile_facts: ['works on ZANTARA'] });
    expect(res2.ok).toBe(true);
    expect(res2.data.facts_count).toBeGreaterThanOrEqual(2);
  });

  it('retrieves user profile with facts', async () => {
    const r = await userMemoryRetrieve({ userId: uid });
    expect(r.ok).toBe(true);
    expect(r.data.profile.facts.length).toBeGreaterThan(0);
    expect(typeof r.data.profile.summary).toBe('string');
  });

  it('increments login counter', async () => {
    const before = await userMemoryRetrieve({ userId: uid });
    const prev = before.data.profile.counters.logins || 0;
    const login = await userMemoryLogin({ userId: uid });
    expect(login.ok).toBe(true);
    expect(login.data.login_count).toBe(prev + 1);
  });

  it('lists users for admin Zero only', async () => {
    const list = await userMemoryList({ adminUser: 'zero' });
    expect(list.ok).toBe(true);
    expect(Array.isArray(list.data.users)).toBe(true);
  });
});

