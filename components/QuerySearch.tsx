import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { queryText } from '@/lib/pagination';
export default function QuerySearch({
  label,
  placeholder,
}: {
  label: string;
  placeholder: string;
}) {
  const router = useRouter();
  const q = queryText(router.query.q);
  const [draft, setDraft] = useState(q);
  const [error, setError] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editing = useRef(false);
  const generation = useRef(0);
  useEffect(() => {
    if (!editing.current) setDraft(q);
  }, [q]);
  useEffect(() => {
    const reset = () => {
      if (timer.current) clearTimeout(timer.current);
      editing.current = false;
      generation.current++;
    };
    window.addEventListener('popstate', reset);
    return () => {
      reset();
      window.removeEventListener('popstate', reset);
    };
  }, []);
  function search(value: string) {
    setDraft(value);
    setError('');
    editing.current = true;
    const current = ++generation.current;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const query = { ...router.query };
      delete query.page;
      value.trim() ? (query.q = value.trim()) : delete query.q;
      try {
        await router.replace({ pathname: router.pathname, query }, undefined, { scroll: false });
        if (current === generation.current) {
          editing.current = false;
          setDraft(value.trim());
        }
      } catch (error) {
        if (!(error as { cancelled?: boolean }).cancelled)
          setError('Search failed. Please try again.');
      }
    }, 400);
  }
  return (
    <>
      <input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        maxLength={200}
        value={draft}
        onChange={(event) => search(event.target.value)}
      />
      {error && <span role="alert">{error}</span>}
    </>
  );
}
