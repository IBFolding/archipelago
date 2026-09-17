/**
 * Prefixes a public asset with the deployment base path, so the same code
 * works at a domain root and under a GitHub Pages project path.
 */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export function asset(path: string): string {
  return `${BASE}${path.startsWith('/') ? path : `/${path}`}`;
}
