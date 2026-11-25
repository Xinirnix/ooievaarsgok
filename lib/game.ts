// Pure game rules, shared by server and browser.

export type Gender = "boy" | "girl";

export interface Guess {
  id: string;
  guesserName: string;
  gender: Gender;
  babyName: string;
  createdAt: string;
}

export interface Reveal {
  gender: Gender;
  name: string;
}

export const LIMITS = { name: 40, title: 80, prize: 200 } as const;

export function clean(value: unknown, max: number): string {
  return String(value ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, max);
}

/** Compares names case- and accent-insensitively: "Zoë" matches "zoe". */
export function sameName(a: string, b: string): boolean {
  const n = (s: string) =>
    s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
  return n(a) !== "" && n(a) === n(b);
}

export function isGender(value: unknown): value is Gender {
  return value === "boy" || value === "girl";
}

/**
 * Winners are everyone with both gender and name right.
 * If nobody has the name right, everyone with the gender right wins.
 */
export function winnerIds(guesses: Guess[], reveal: Reveal | null): Set<string> {
  if (!reveal) return new Set();
  const genderRight = guesses.filter((g) => g.gender === reveal.gender);
  const bothRight = genderRight.filter((g) => sameName(g.babyName, reveal.name));
  return new Set((bothRight.length ? bothRight : genderRight).map((g) => g.id));
}
