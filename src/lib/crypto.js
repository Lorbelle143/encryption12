/**
 * Hash a password using SHA-256 via Web Crypto API.
 * Used for folder passwords and master key comparison.
 */
export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compare a plain password against a stored hash.
 */
export async function verifyPassword(plain, hash) {
  const hashed = await hashPassword(plain);
  return hashed === hash;
}
