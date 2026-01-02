import { cn } from '@/lib/utils';

describe('cn', () => {
  it('merges class names correctly', () => {
    expect(cn('a', 'b')).toContain('a');
    expect(cn('a', 'b')).toContain('b');
  });

  it('dedupes tailwind classes', () => {
    const result = cn('p-2', 'p-4');
    expect(result).toContain('p-4');
    expect(result.includes('p-2')).toBe(false);
  });
});


