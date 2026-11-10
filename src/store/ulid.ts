import { randomBytes } from "node:crypto";

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * A ULID: 48 bits of milliseconds then 80 random bits, as 26 Crockford base32 characters. Ids from two worktrees do not
 * collide, and sort by the time they were made.
 */
export function ulid(now: Date): string {
  let time = now.getTime();
  let head = "";
  for (let i = 0; i < 10; i++) {
    head = CROCKFORD[time % 32] + head;
    time = Math.floor(time / 32);
  }
  const bytes = randomBytes(16);
  let tail = "";
  for (let i = 0; i < 16; i++) tail += CROCKFORD[bytes[i]! % 32];
  return head + tail;
}
