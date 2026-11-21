// Must match Supabase → Authentication → Password settings (see README checklist).
export const PASSWORD_RULES = [
  { id: 'length', label: 'At least 10 characters', test: (p: string) => p.length >= 10 },
  { id: 'lower', label: 'A lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { id: 'upper', label: 'An uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { id: 'digit', label: 'A number', test: (p: string) => /[0-9]/.test(p) },
] as const;

export const PASSWORD_MAX = 72; // Supabase (bcrypt) limit

export function passwordProblems(password: string): string[] {
  const problems: string[] = PASSWORD_RULES.filter((r) => !r.test(password)).map((r) => r.label);
  if (password.length > PASSWORD_MAX) problems.push(`At most ${PASSWORD_MAX} characters`);
  return problems;
}
