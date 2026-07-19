export function matchesQuery(query: string, searchableValues: Array<string | undefined>): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;
  return searchableValues.some((value) => value?.toLowerCase().includes(normalizedQuery));
}
