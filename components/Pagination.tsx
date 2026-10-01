import Link from 'next/link';
import { useRouter } from 'next/router';
import { pageLinks, type Paging } from '@/lib/pagination';
export default function Pagination({ paging }: { paging: Paging }) {
  const router = useRouter();
  const numbers = pageLinks(paging.page, paging.pages);
  const href = (page: number) => ({
    pathname: router.pathname,
    query: { ...router.query, page: String(page) },
  });
  return (
    <div className="pagination">
      <span role="status">
        {paging.total
          ? `${paging.offset + 1}–${Math.min(paging.offset + paging.pageSize, paging.total)} of ${paging.total}`
          : '0 results'}
      </span>
      <nav aria-label="Pagination">
        {paging.page > 1 ? (
          <Link href={href(paging.page - 1)} scroll={false}>
            Previous
          </Link>
        ) : (
          <span aria-disabled="true">Previous</span>
        )}
        {numbers.map((n, i) => (
          <span className="page-group" key={n}>
            {i > 0 && n - numbers[i - 1] > 1 && <span>…</span>}
            <Link
              href={href(n)}
              scroll={false}
              aria-label={`Page ${n}`}
              aria-current={n === paging.page ? 'page' : undefined}
            >
              {n}
            </Link>
          </span>
        ))}
        {paging.page < paging.pages ? (
          <Link href={href(paging.page + 1)} scroll={false}>
            Next
          </Link>
        ) : (
          <span aria-disabled="true">Next</span>
        )}
      </nav>
    </div>
  );
}
