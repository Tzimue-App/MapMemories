import { adminLevelBadge, adminLevelLabel } from './admin-level';

describe('admin level helpers', () => {
  it('maps admin levels to the config-panel label', () => {
    expect(adminLevelLabel(2)).toBe('Country');
    expect(adminLevelLabel(4)).toBe('Region');
    expect(adminLevelLabel(6)).toBe('Department');
    expect(adminLevelLabel(8)).toBe('Municipality');
    expect(adminLevelLabel(10)).toBe('Level 10');
  });

  it('maps admin levels to the search badge (label, icon, colour classes)', () => {
    expect(adminLevelBadge(2)).toEqual(expect.objectContaining({ label: 'Country', icon: '🌍' }));
    expect(adminLevelBadge(4)).toEqual(expect.objectContaining({ label: 'Region', icon: '🏛️' }));
    expect(adminLevelBadge(6)).toEqual(expect.objectContaining({ label: 'Department', icon: '🏢' }));
    expect(adminLevelBadge(8)).toEqual(expect.objectContaining({ label: 'City', icon: '🏙️' }));
    expect(adminLevelBadge(9)).toEqual(expect.objectContaining({ label: 'Level 9', icon: '🗺️' }));
    expect(adminLevelBadge(2).colorClass).toContain('bg-emerald-100');
  });
});
