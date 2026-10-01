export type Query = Record<string, string | string[] | undefined>;
export const queryText = (value: string | string[] | undefined) =>
  typeof value === 'string' ? value.trim().slice(0, 200) : '';
export function pageNumber(value: string | string[] | undefined) {
  const raw = queryText(value);
  return /^\d+$/.test(raw) && Number.isSafeInteger(Number(raw)) && Number(raw) > 0
    ? Number(raw)
    : 1;
}
export function pagination(total: number, requested: number, size = 10) {
  const pages = Math.max(1, Math.ceil(total / size));
  const page = Math.min(Math.max(1, requested), pages);
  return { page, pages, total, pageSize: size, offset: (page - 1) * size };
}
export type Paging = ReturnType<typeof pagination>;
export function pageLinks(page: number, pages: number) {
  return [
    ...new Set([
      1,
      ...Array.from({ length: 5 }, (_, i) => page + i - 2).filter((n) => n > 1 && n < pages),
      pages,
    ]),
  ].sort((a, b) => a - b);
}
export function canonicalPage(path: string, query: Query, page: number) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query))
    if (key !== 'page' && typeof value === 'string') params.set(key, value);
  if (page > 1) params.set('page', String(page));
  return path + (params.size ? `?${params}` : '');
}
