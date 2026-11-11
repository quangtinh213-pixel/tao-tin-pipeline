export function deriveSlug(context: string): string {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const slug = context
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .split('-')
    .filter(Boolean)
    .slice(0, 8)
    .join('-');
  return `${today}-${slug}`;
}
