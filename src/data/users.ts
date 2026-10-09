import { env } from '@config';

export interface Credentials {
  username: string;
  password: string;
}

/** Accounts provided by saucedemo.com. Keys describe the account's behaviour, not its name. */
export const users = {
  standard: { username: 'standard_user', password: env.password },
  lockedOut: { username: 'locked_out_user', password: env.password },
  invalid: { username: 'not_a_real_user', password: 'wrong_password' },
} satisfies Record<string, Credentials>;
