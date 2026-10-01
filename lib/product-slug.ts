export function productSlug(name: string, attempt = 1): string {
  const base =
    name
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'product';
  const suffix = attempt > 1 ? `-${attempt}` : '';
  return base.slice(0, 100 - suffix.length).replace(/-+$/g, '') + suffix;
}
