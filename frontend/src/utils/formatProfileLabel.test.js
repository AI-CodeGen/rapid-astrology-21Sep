import { formatProfileLabel } from './formatProfileLabel';

describe('formatProfileLabel', () => {
  test('returns Profile for empty/undefined', () => {
    expect(formatProfileLabel(undefined)).toBe('Profile');
    expect(formatProfileLabel('')).toBe('Profile');
    expect(formatProfileLabel('   ')).toBe('Profile');
  });
  test("adds apostrophe-s for normal first names", () => {
    expect(formatProfileLabel('Adam Hall')).toBe("Adam's Profile");
    expect(formatProfileLabel('Lia')).toBe("Lia's Profile");
  });
  test("uses trailing apostrophe for names ending with s", () => {
    expect(formatProfileLabel('James Stone')).toBe("James' Profile");
    expect(formatProfileLabel('JAMES')).toBe("JAMES' Profile");
  });
  test('handles multiple spaces and trims correctly', () => {
    expect(formatProfileLabel('  Maria   Clara  ')).toBe("Maria's Profile");
  });
  test('ignores non-string input gracefully', () => {
    // @ts-expect-error intentional wrong types
    expect(formatProfileLabel(123)).toBe('Profile');
    // @ts-expect-error
    expect(formatProfileLabel(null)).toBe('Profile');
  });
});
