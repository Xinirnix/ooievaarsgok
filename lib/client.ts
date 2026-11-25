"use client";
// Browser helpers: tokens live in localStorage, so no accounts are needed.

export const adminKey = (slug: string) => `ooievaarsgok:admin:${slug}`;
export const guessKey = (slug: string) => `ooievaarsgok:guess:${slug}`;

export function load<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

export function save(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* private mode: the token then only lives for this page view */
  }
}

export async function api<T>(url: string, init?: RequestInit & { headers?: Record<string, string> }): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || "Er ging iets mis. Probeer het opnieuw.");
  return data as T;
}
