// Week 15 (Operator brief): when the reader is rate-limited or times out, that's our capacity, not the buyer's screenshot.
export const BUSY_MESSAGE =
  "The reader is busy right now (too many checks at once). Try again in a minute. Your free check wasn't used.";

/** Gemini quota / rate limit / overload, or our own deadline. */
export function isBusy(msg: string): boolean {
  return /\b(429|503)\b|RESOURCE_EXHAUSTED|quota|rate.?limit|overloaded|UNAVAILABLE|Timeout|timed out|aborted/i.test(msg);
}
