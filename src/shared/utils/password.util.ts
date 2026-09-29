import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/** Compared against when a user isn't found, so sign-in timing doesn't leak which emails exist. */
export const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', SALT_ROUNDS);

export function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
	return bcrypt.compare(password, hash);
}
