import { useState, type FormEvent } from 'react';
import type { GetServerSideProps } from 'next';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import {
  contentFields,
  defaultLanding,
  landingSchema,
  type LandingContent,
} from '@/lib/landing-content';

const categories = ['Page content', 'Shopping help', 'Contact & socials', 'Settings'] as const;
type Category = (typeof categories)[number];
const editableContentFields = contentFields.filter(
  ([key, group]) =>
    !['Hero', 'Our story', 'Socials'].includes(group) &&
    (group !== 'Shipping & care' ||
      ['shippingTitle', 'shippingAreas', 'shippingEstimate'].includes(key)),
);
function categoryFor(group: string): Category {
  if (['Size guide', 'How to order', 'Shipping & care', 'FAQs'].includes(group))
    return 'Shopping help';
  if (group === 'Socials') return 'Contact & socials';
  if (['SEO', 'Header & footer'].includes(group)) return 'Settings';
  return 'Page content';
}

export default function ContentEditor({
  content,
  revision: initialRevision,
  error,
}: {
  content: LandingContent;
  revision: number;
  error: string;
}) {
  const [draft, setDraft] = useState(content),
    [saved, setSaved] = useState(content),
    [revision, setRevision] = useState(initialRevision),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(error);
  const [category, setCategory] = useState<Category>('Page content');
  const [uploadingSlide, setUploadingSlide] = useState<number | null>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  async function uploadCarouselImage(index: number, file: File | undefined) {
    if (!file) return;
    setMessage('');
    if (file.size > 10 * 1024 * 1024) {
      setMessage('Maximum upload size is 10 MB.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setMessage('Choose a JPEG, PNG, or WebP image.');
      return;
    }
    setUploadingSlide(index);
    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Upload failed.');
      setDraft((current) => ({
        ...current,
        carouselSlides: current.carouselSlides.map((slide, slideIndex) =>
          slideIndex === index ? { ...slide, imageUrl: result.url } : slide,
        ),
      }));
      setMessage('Image uploaded. Publish changes to show it on the storefront.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Image upload failed.');
    } finally {
      setUploadingSlide(null);
    }
  }
  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const publishedContent = landingSchema.parse(draft);
      const response = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: publishedContent, revision }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setRevision(result.revision);
      setDraft(publishedContent);
      setSaved(publishedContent);
      setMessage('Published. Your landing page now shows the updated content.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to publish content.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <AdminLayout>
      <div className="eyebrow">LIGHTMARE PH / LANDING PAGE CMS</div>
      <h1>Landing page content</h1>
      <p>Only content currently displayed on the storefront is available here.</p>
      <Link className="text-link" href="/" target="_blank" rel="noreferrer">
        View published landing page ↗
      </Link>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      <form
        onSubmit={publish}
        onInvalidCapture={(event) => {
          event.preventDefault();
          const input = event.target as HTMLInputElement;
          setMessage(input.validationMessage || 'Please check the highlighted field.');
          const section = input.closest<HTMLDetailsElement>('details[data-category]');
          if (section) {
            setCategory(section.dataset.category as Category);
            section.open = true;
          }
          requestAnimationFrame(() => {
            input.focus();
          });
        }}
      >
        <div className="cms-toolbar">
          <span>{dirty ? 'Unpublished changes' : 'All changes published'}</span>
          <div className="product-actions">
            <button
              className="text-link"
              type="button"
              disabled={busy || uploadingSlide !== null || !dirty}
              onClick={() => setDraft(saved)}
            >
              Discard changes
            </button>
            <button
              className="button"
              disabled={busy || uploadingSlide !== null || !dirty || revision < 1}
            >
              {busy ? 'Publishing…' : 'Publish changes'}
            </button>
          </div>
        </div>
        <nav className="cms-categories" aria-label="Content categories">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </nav>
        <fieldset disabled={busy || uploadingSlide !== null || revision < 1} className="cms-fields">
          <details
            className="cms-section"
            data-category="Page content"
            hidden={category !== 'Page content'}
            open
          >
            <summary>Hero carousel</summary>
            <p className="form-note">
              Four slides repeat automatically. Upload a JPEG, PNG, or WebP image up to 10 MB.
            </p>
            <div className="cms-carousel-grid">
              {draft.carouselSlides.map((slide, index) => (
                <div className="cms-carousel-item" key={index}>
                  <img src={slide.imageUrl} alt={slide.alt} />
                  <strong>Slide {index + 1}</strong>
                  <label>
                    Replacement image
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={uploadingSlide !== null}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = '';
                        void uploadCarouselImage(index, file);
                      }}
                    />
                  </label>
                  <label>
                    Image description
                    <input
                      required
                      maxLength={160}
                      value={slide.alt}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          carouselSlides: draft.carouselSlides.map((old, slideIndex) =>
                            slideIndex === index ? { ...old, alt: event.target.value } : old,
                          ),
                        })
                      }
                    />
                  </label>
                  {uploadingSlide === index && <small>Uploading and compressing…</small>}
                </div>
              ))}
            </div>
          </details>
          {[...new Set(editableContentFields.map(([, group]) => group))].map((group) => (
            <details
              className="cms-section"
              key={group}
              data-category={categoryFor(group)}
              hidden={categoryFor(group) !== category}
            >
              <summary>{group}</summary>
              <div className="form-grid">
                {editableContentFields
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
          <details
            className="cms-section"
            data-category="Contact & socials"
            hidden={category !== 'Contact & socials'}
            open
          >
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
          <details className="cms-section" data-category="Page content" hidden>
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
          <details
            className="cms-section"
            data-category="Shopping help"
            hidden={category !== 'Shopping help'}
          >
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
          <details
            className="cms-section"
            data-category="Shopping help"
            hidden={category !== 'Shopping help'}
          >
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
          <details
            className="cms-section"
            data-category="Shopping help"
            hidden={category !== 'Shopping help'}
          >
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
    const cms = await getLanding();
    return { props: { ...cms, error: '' } };
  } catch {
    return {
      props: {
        content: defaultLanding,
        revision: 0,
        error:
          'CMS is unavailable. Run npm run db:cms and check the database connection. Publishing is disabled.',
      },
    };
  }
};
