import { z } from "zod";

/** Instagram-style username rules: starts with a letter, then letters/numbers/_/., 4-30 chars. */
export const USERNAME_REGEX = /^[a-z][a-z0-9._]{3,29}$/;

export type UsernameIssue =
  | "empty"
  | "too_short"
  | "too_long"
  | "start_letter"
  | "invalid_chars"
  | null;

export function checkUsername(raw: string): { valid: boolean; issue: UsernameIssue } {
  const value = raw.trim().toLowerCase();
  if (!value) return { valid: false, issue: "empty" };
  if (value.length < 4) return { valid: false, issue: "too_short" };
  if (value.length > 30) return { valid: false, issue: "too_long" };
  if (!/^[a-z]/.test(value)) return { valid: false, issue: "start_letter" };
  if (!/^[a-z0-9._]+$/.test(value)) return { valid: false, issue: "invalid_chars" };
  return { valid: USERNAME_REGEX.test(value), issue: null };
}

export const USERNAME_HINTS: Record<Exclude<UsernameIssue, null>, string> = {
  empty: "Pick a username",
  too_short: "Use at least 4 characters",
  too_long: "Use at most 30 characters",
  start_letter: "Must start with a letter",
  invalid_chars: "Only letters, numbers, underscore and period",
};

export type PasswordStrength = "weak" | "medium" | "strong";

export type PasswordChecks = {
  length: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  special: boolean;
};

export function passwordChecks(pw: string): PasswordChecks {
  return {
    length: pw.length >= 8,
    upper: /[A-Z]/.test(pw),
    lower: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
  };
}

export function passwordStrength(pw: string): { score: number; level: PasswordStrength } {
  const c = passwordChecks(pw);
  const score = Object.values(c).filter(Boolean).length + (pw.length >= 12 ? 1 : 0);
  const level: PasswordStrength = score >= 5 ? "strong" : score >= 3 ? "medium" : "weak";
  return { score: Math.min(score, 6), level };
}

export function isPasswordValid(pw: string): boolean {
  const c = passwordChecks(pw);
  return c.length && c.upper && c.lower && c.number && c.special;
}

/**
 * Students sign in with a username, but the auth service needs an email address.
 * We derive a deterministic internal address so the username stays the only credential.
 */
export function usernameToAuthEmail(username: string): string {
  return `${username.trim().toLowerCase()}@student.vidya-ai.app`;
}

export const signUpSchema = z
  .object({
    fullName: z.string().trim().min(2).max(100),
    educationType: z.enum(["school", "intermediate"]),
    gradeNumber: z.number().int().min(1).max(10).nullable(),
    interYear: z.enum(["first", "second"]).nullable(),
    stream: z.enum(["MPC", "BiPC", "MEC", "CEC", "HEC"]).nullable(),
    username: z.string().regex(USERNAME_REGEX),
    password: z.string().min(8).max(72),
    language: z.string().min(2).max(3),
  })
  .refine(
    (v) =>
      v.educationType === "school"
        ? v.gradeNumber !== null
        : v.interYear !== null && v.stream !== null,
    { message: "Complete your education details" },
  );

export type SignUpInput = z.infer<typeof signUpSchema>;
