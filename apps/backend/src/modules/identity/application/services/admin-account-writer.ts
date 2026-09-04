import { randomBytes, randomUUID, scryptSync } from 'node:crypto';
import type { DatabaseExecutor } from '../../../../database/executor.js';
import { AppError } from '../../../../errors/app-error.js';

const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d).{8,128}$/;

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('base64url');
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString('base64url')}`;
}

function generateInitialPassword(): string {
  // Each segment deliberately contains both classes; the final password satisfies
  // the existing admin credential policy without returning a caller-supplied secret.
  return `${randomBytes(12).toString('base64url')}a1`;
}

export class AdminAccountWriter {
  async create(executor: DatabaseExecutor, input: { username: string }): Promise<{ subjectId: string; initialPassword: string }> {
    const username = input.username.trim().toLowerCase();
    if (!username || username.length > 100) {
      throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid username', httpStatus: 400 });
    }
    const initialPassword = generateInitialPassword();
    if (!passwordPattern.test(initialPassword)) throw new Error('Generated password did not meet policy');
    try {
      const user = await executor.query<{ id: string; public_id: string }>(
        `INSERT INTO identity.users (public_id, status) VALUES ($1, 'active') RETURNING id, public_id`,
        [randomUUID()],
      );
      const created = user.rows[0];
      if (!created) throw new Error('Unable to create admin identity');
      await executor.query(
        `INSERT INTO identity.admin_credentials (user_id, username, password_hash) VALUES ($1, $2, $3)`,
        [created.id, username, hashPassword(initialPassword)],
      );
      return { subjectId: created.public_id, initialPassword };
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: unknown }).code === '23505') {
        throw new AppError({ code: 'ADMIN_USERNAME_CONFLICT', message: 'Username is already in use', httpStatus: 409, cause: error });
      }
      throw error;
    }
  }
}
