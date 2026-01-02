import { isUnauthorizedError } from '@/lib/authUtils';

describe('isUnauthorizedError', () => {
  it('returns true for 401 errors', () => {
    expect(isUnauthorizedError(new Error('401: Unauthorized - invalid token'))).toBe(true);
  });

  it('returns false otherwise', () => {
    expect(isUnauthorizedError(new Error('403: Forbidden'))).toBe(false);
  });
});


