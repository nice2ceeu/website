import { useState, type FormEvent } from 'react';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { contentFields, defaultLanding, type LandingContent } from '@/lib/landing-content';
import type { Product } from '@/lib/catalog';

export default function ContentEditor({
  content,
  revision: initialRevision,
  products,
  error,
}: {
  content: LandingContent;
  revision: number;
  products: Product[];
  error: string;
}) {
  const [draft, setDraft] = useState(content),
    [saved, setSaved] = useState(content),
    [revision, setRevision] = useState(initialRevision),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(error);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: draft, revision }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setRevision(result.revision);
      setSaved(draft);
      setMessage('Published. Your landing page now shows the updated content.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to publish content.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <AdminLayout>
      <div className="eyebrow">LIGHTMARE / LANDING PAGE CMS</div>
      <h1>
        Your story. <em>Your words.</em>
      </h1>
      <p>
        Edit landing-page content here. Products and prices belong in Products; layout, checkout
        rules, and the shipping fee stay in code.
      </p>
      <Link className="text-link" href="/" target="_blank" rel="noreferrer">
        View published landing page ↗
      </Link>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      <form onSubmit={publish}>
        <div className="cms-toolbar">
          <span>{dirty ? 'Unpublished changes' : 'All changes published'}</span>
          <div className="product-actions">
            <button
              className="text-link"
              type="button"
              disabled={busy || !dirty}
              onClick={() => setDraft(saved)}
            >
              Discard changes
            </button>
            <button className="button" disabled={busy || !dirty || revision < 1}>
              {busy ? 'Publishing…' : 'Publish changes'}
            </button>
          </div>
        </div>
        <fieldset disabled={busy || revision < 1} className="cms-fields">
          {[...new Set(contentFields.map(([, group]) => group))].map((group) => (
            <details className="cms-section" key={group} open={group === 'Hero'}>
              <summary>{group}</summary>
              <div className="form-grid">
                {contentFields
                  .filter(([, g]) => g === group)
                  .map(([key, , label]) => (
                    <label className="full" key={key}>
                      {label}
                      <textarea
                        rows={key.toLowerCase().match(/body|description|note/) ? 3 : 2}
                        required
                        maxLength={2000}
                        value={draft.copy[key]}
                        onChange={(e) =>
                          setDraft({ ...draft, copy: { ...draft.copy, [key]: e.target.value } })
                        }
                      />
                    </label>
                  ))}
              </div>
            </details>
          ))}
          <details className="cms-section">
            <summary>Featured product</summary>
            <label>
              Hero product
              <select
                value={draft.featuredSlug}
                onChange={(e) => setDraft({ ...draft, featuredSlug: e.target.value })}
              >
                <option value="">Automatic (first published product)</option>
                {products.map((p) => (
                  <option value={p.slug} key={p.slug}>
                    {p.name}
                    {p.active ? '' : ' (draft)'}
                  </option>
                ))}
                {draft.featuredSlug && !products.some((p) => p.slug === draft.featuredSlug) && (
                  <option value={draft.featuredSlug}>{draft.featuredSlug} (unavailable)</option>
                )}
              </select>
            </label>
            <p className="form-note">
              An unavailable or unpublished selection falls back to the first published product.
              Manage product photos in Products.
            </p>
          </details>
          <details className="cms-section">
            <summary>Contact & social links</summary>
            <div className="form-grid">
              <label className="full">
                Public contact email
                <input
                  required
                  type="email"
                  maxLength={200}
                  value={draft.contactEmail}
                  onChange={(e) => setDraft({ ...draft, contactEmail: e.target.value })}
                />
              </label>
              {(['instagram', 'tiktok'] as const).map((key) => (
                <label key={key}>
                  {key === 'instagram' ? 'Instagram URL' : 'TikTok URL'}
                  <input
                    type="url"
                    placeholder="https://…"
                    maxLength={500}
                    value={draft[key]}
                    onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                  />
                </label>
              ))}
            </div>
            <p className="form-note">
              These are public links. Brevo sender and admin notification settings are separate.
            </p>
          </details>
          <details className="cms-section">
            <summary>Scrolling messages</summary>
            {draft.ticker.map((value, i) => (
              <label key={i}>
                Message {i + 1}
                <input
                  required
                  maxLength={100}
                  value={value}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      ticker: draft.ticker.map((old, j) => (i === j ? e.target.value : old)),
                    })
                  }
                />
              </label>
            ))}
          </details>
          <details className="cms-section">
            <summary>Order steps</summary>
            {draft.steps.map((step, i) => (
              <div className="cms-item" key={i}>
                <h3>Step {i + 1}</h3>
                <label>
                  Title
                  <input
                    required
                    maxLength={100}
                    value={step.title}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        steps: draft.steps.map((old, j) =>
                          i === j ? { ...old, title: e.target.value } : old,
                        ),
                      })
                    }
                  />
                </label>
                <label>
                  Description
                  <textarea
                    required
                    maxLength={2000}
                    value={step.body}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        steps: draft.steps.map((old, j) =>
                          i === j ? { ...old, body: e.target.value } : old,
                        ),
                      })
                    }
                  />
                </label>
              </div>
            ))}
          </details>
          <details className="cms-section">
            <summary>Size measurements (cm)</summary>
            <p className="form-note">
              Update garment measurements only. Product size availability is managed in Products.
            </p>
            {draft.measurements.map((row, i) => (
              <div className="cms-measurement" key={row.size}>
                <strong>{row.size}</strong>
                <label>
                  Width
                  <input
                    required
                    type="number"
                    min="0.1"
                    max="200"
                    step="0.1"
                    value={row.width}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        measurements: draft.measurements.map((old, j) =>
                          i === j ? { ...old, width: Number(e.target.value) } : old,
                        ),
                      })
                    }
                  />
                </label>
                <label>
                  Length
                  <input
                    required
                    type="number"
                    min="0.1"
                    max="200"
                    step="0.1"
                    value={row.length}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        measurements: draft.measurements.map((old, j) =>
                          i === j ? { ...old, length: Number(e.target.value) } : old,
                        ),
                      })
                    }
                  />
                </label>
              </div>
            ))}
          </details>
          <details className="cms-section">
            <summary>FAQ questions & answers</summary>
            {draft.faqs.map((faq, i) => (
              <div className="cms-item" key={i}>
                <label>
                  Question {i + 1}
                  <input
                    required
                    maxLength={200}
                    value={faq.question}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        faqs: draft.faqs.map((old, j) =>
                          i === j ? { ...old, question: e.target.value } : old,
                        ),
                      })
                    }
                  />
                </label>
                <label>
                  Answer
                  <textarea
                    required
                    rows={4}
                    maxLength={2000}
                    value={faq.answer}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        faqs: draft.faqs.map((old, j) =>
                          i === j ? { ...old, answer: e.target.value } : old,
                        ),
                      })
                    }
                  />
                </label>
                <div className="product-actions">
                  <button
                    type="button"
                    className="text-link"
                    disabled={i === 0}
                    onClick={() => {
                      const faqs = [...draft.faqs];
                      [faqs[i - 1], faqs[i]] = [faqs[i], faqs[i - 1]];
                      setDraft({ ...draft, faqs });
                    }}
                  >
                    Move up
                  </button>
                  <button
                    type="button"
                    className="text-link"
                    disabled={draft.faqs.length === 1}
                    onClick={() =>
                      setDraft({ ...draft, faqs: draft.faqs.filter((_, j) => j !== i) })
                    }
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <button
              type="button"
              className="text-link"
              disabled={draft.faqs.length >= 12}
              onClick={() =>
                setDraft({ ...draft, faqs: [...draft.faqs, { question: '', answer: '' }] })
              }
            >
              Add FAQ +
            </button>
          </details>
        </fieldset>
      </form>
    </AdminLayout>
  );
}
export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  res.setHeader('Cache-Control', 'no-store');
  const { isAdmin } = await import('@/lib/auth');
  if (!(await isAdmin(req))) return { redirect: { destination: '/admin/login', permanent: false } };
  try {
    const { getLanding } = await import('@/lib/cms');
    const { getProducts } = await import('@/lib/products');
    const [cms, products] = await Promise.all([getLanding(), getProducts(true)]);
    return { props: { ...cms, products, error: '' } };
  } catch {
    return {
      props: {
        content: defaultLanding,
        revision: 0,
        products: [],
        error:
          'CMS is unavailable. Run npm run db:cms and check the database connection. Publishing is disabled.',
      },
    };
  }
};
