import { useRouter } from 'next/router';
import QuerySearch from '@/components/QuerySearch';
import Pagination from '@/components/Pagination';
import { pagination, canonicalPage, type Paging } from '@/lib/pagination';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { GetServerSideProps } from 'next';
import AdminLayout from '@/components/AdminLayout';
import { sizes, money, type Product } from '@/lib/catalog';
import { productSlug } from '@/lib/product-slug';

const blank: Product = {
  slug: '',
  name: '',
  caption: '',
  price: 69000,
  color: 'Vintage white',
  imageUrl: '',
  availableSizes: [...sizes],
  active: true,
  design: 'off duty',
  ink: '#702c3c',
  bg: '#e9e5dd',
  sub: '',
  tag: '',
};
export default function Products({
  products,
  paging,
  published,
  error,
}: {
  products: Product[];
  error: string;
  paging: Paging;
  published: number;
}) {
  const router = useRouter();
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const [deleteError, setDeleteError] = useState('');
  const [autoSlug, setAutoSlug] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null),
    [price, setPrice] = useState('690.00'),
    [message, setMessage] = useState(error),
    [busy, setBusy] = useState(false),
    [deleting, setDeleting] = useState<Product | null>(null);
  useEffect(() => {
    if (!deleting) return;
    const dialog = deleteDialog.current;
    dialog?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [deleting]);
  function edit(product: Product) {
    setAutoSlug(!product.id);
    setDeleting(null);
    setUploadMessage('');
    setEditing({ ...product });
    setPrice((product.price / 100).toFixed(2));
    setMessage('');
  }
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState('');
  async function uploadImage(file: File | undefined) {
    if (!file || !editing) return;
    setUploadMessage('');
    if (file.size > 10 * 1024 * 1024) {
      setUploadMessage('Maximum upload size is 10 MB.');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setUploadMessage('Choose a JPEG, PNG, or WebP image.');
      return;
    }
    setUploading(true);
    setBusy(true);
    try {
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Upload failed.');
      setEditing((current) => (current ? { ...current, imageUrl: data.url } : current));
      setUploadMessage(
        `Image ready: ${(data.originalBytes / 1024).toFixed(0)} KB → ${(data.compressedBytes / 1024).toFixed(0)} KB WebP (${data.width} × ${data.height}). Save product to apply.`,
      );
    } catch (error) {
      setUploadMessage(error instanceof Error ? error.message : 'Image upload failed.');
    } finally {
      setUploading(false);
      setBusy(false);
    }
  }
  async function refresh() {
    await router.replace(router.asPath, undefined, { scroll: false });
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || busy) return;
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`/api/admin/products${editing.id ? `?id=${editing.id}` : ''}`, {
        method: editing.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editing,
          autoSlug: !editing.id && autoSlug,
          price: Math.round(Number(price) * 100),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setEditing(null);
      await refresh();
      setMessage('Product saved. Storefront and overview now use the updated catalog.');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Unable to save product.');
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!deleting?.id || busy) return;
    setBusy(true);
    setDeleteError('');
    try {
      const r = await fetch(`/api/admin/products?id=${deleting.id}`, { method: 'DELETE' });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setDeleting(null);
      try {
        await refresh();
        setMessage('Product deleted from the catalog. Existing orders are preserved.');
      } catch {
        setMessage(
          'Product deleted. Refresh the page to update the list. Existing orders are preserved.',
        );
      }
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Unable to delete product.');
    } finally {
      setBusy(false);
    }
  }
  const visible = products;
  return (
    <AdminLayout>
      <div className="eyebrow">LIGHTMARE PH / PRODUCTS</div>
      <div className="section-heading">
        <div>
          <h1>
            Your collection, <em>your way.</em>
          </h1>
          <p>
            {paging.total} matching products · {published} published
          </p>
        </div>
        {!editing && (
          <button className="button" disabled={busy} onClick={() => edit(blank)}>
            Add product +
          </button>
        )}
      </div>
      {message && (
        <p className="notice" role="status">
          {message}
        </p>
      )}
      {!editing && (
        <>
          <div className="order-filters">
            <QuerySearch label="Search products" placeholder="Search product name or URL slug…" />
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>PRODUCT</th>
                  <th>PRICE</th>
                  <th>SIZES</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>
                      <small className="date">/products/{p.slug}</small>
                    </td>
                    <td>{money(p.price)}</td>
                    <td>{p.availableSizes?.join(', ')}</td>
                    <td>
                      <span className={`badge ${p.active ? 'paid' : ''}`}>
                        {p.active ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td>
                      <div className="product-actions">
                        <button className="text-link" disabled={busy} onClick={() => edit(p)}>
                          Edit
                        </button>
                        <button
                          className="text-link"
                          disabled={busy}
                          onClick={() => {
                            setDeleting(p);
                            setDeleteError('');
                            setMessage('');
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!visible.length && (
              <p className="empty">No products found. Add a product to start your collection.</p>
            )}
          </div>
          <Pagination paging={paging} />
        </>
      )}
      {deleting && (
        <dialog
          ref={deleteDialog}
          className="delete-product-dialog"
          role="alertdialog"
          aria-labelledby="delete-title"
          aria-describedby="delete-description"
          onCancel={(event) => {
            event.preventDefault();
            if (!busy) setDeleting(null);
          }}
        >
          <h2 id="delete-title">Delete {deleting.name}?</h2>
          <p id="delete-description">
            This removes the product from the shop and prevents new orders. Existing order records
            are kept.
          </p>
          {deleteError && (
            <p className="error" role="alert">
              {deleteError}
            </p>
          )}
          <div className="product-actions">
            <button className="button" disabled={busy} onClick={remove}>
              {busy ? 'Deleting…' : 'Delete product'}
            </button>
            <button
              type="button"
              className="text-link"
              autoFocus
              disabled={busy}
              onClick={() => setDeleting(null)}
            >
              Cancel
            </button>
          </div>
        </dialog>
      )}
      {editing && (
        <section className="order-panel">
          <div className="section-heading">
            <h2>{editing.id ? 'Edit product' : 'New product'}</h2>
            <button disabled={busy} onClick={() => setEditing(null)}>
              Cancel ×
            </button>
          </div>
          <form onSubmit={save}>
            <div className="form-grid product-editor">
              <label>
                Product name
                <input
                  required
                  maxLength={100}
                  value={editing.name}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      name: e.target.value,
                      ...(!editing.id && autoSlug ? { slug: productSlug(e.target.value) } : {}),
                    })
                  }
                />
              </label>
              <label>
                URL slug
                <input
                  required
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  maxLength={100}
                  placeholder="my-new-tee"
                  value={editing.slug}
                  onChange={(e) => {
                    setAutoSlug(false);
                    setEditing({ ...editing, slug: e.target.value });
                  }}
                />
                <small>
                  {editing.id
                    ? 'Changing the name keeps this URL. Editing the slug changes shared links.'
                    : 'Generated from the name. Duplicate URLs get a numbered suffix when saved. You can also enter a custom slug.'}
                </small>
              </label>
              <label className="full">
                Description
                <textarea
                  required
                  maxLength={1000}
                  rows={3}
                  value={editing.caption}
                  onChange={(e) => setEditing({ ...editing, caption: e.target.value })}
                />
              </label>
              <label>
                Price (PHP)
                <input
                  required
                  type="number"
                  min="1"
                  max="1000000"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </label>
              <label>
                Color name
                <input
                  required
                  maxLength={50}
                  value={editing.color}
                  onChange={(e) => setEditing({ ...editing, color: e.target.value })}
                />
              </label>
              <label className="full">
                Upload product image (maximum 10 MB)
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={busy}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = '';
                    void uploadImage(file);
                  }}
                />
                <small>JPEG, PNG, or WebP. Automatically resized and compressed to WebP.</small>
              </label>
              {(uploading || uploadMessage) && (
                <p className="full form-note" role="status">
                  {uploading ? 'Uploading and compressing…' : uploadMessage}
                </p>
              )}
              {editing.imageUrl && (
                <div className="full">
                  <img
                    src={editing.imageUrl}
                    alt="Selected product preview"
                    style={{ width: 160, height: 160, objectFit: 'contain', background: '#eee8dd' }}
                  />
                </div>
              )}
              <label className="full">
                Product image URL
                <input
                  maxLength={2000}
                  placeholder="https://… or /images/your-tee.png"
                  value={editing.imageUrl}
                  onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })}
                />
                <small>
                  Upload above or paste a hosted HTTPS image. An empty image shows “Image coming
                  soon”.
                </small>
              </label>
              <fieldset className="full">
                <legend>Available sizes</legend>
                <div className="product-actions">
                  {sizes.map((size) => (
                    <label className="checkbox" key={size}>
                      <input
                        type="checkbox"
                        checked={editing.availableSizes?.includes(size)}
                        onChange={(e) =>
                          setEditing({
                            ...editing,
                            availableSizes: e.target.checked
                              ? [...(editing.availableSizes || []), size]
                              : (editing.availableSizes || []).filter((s) => s !== size),
                          })
                        }
                      />
                      {size}
                    </label>
                  ))}
                </div>
              </fieldset>
              <label>
                Visibility
                <select
                  value={editing.active ? 'published' : 'draft'}
                  onChange={(e) =>
                    setEditing({ ...editing, active: e.target.value === 'published' })
                  }
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft (hidden from shop)</option>
                </select>
              </label>
              <label>
                Card background
                <input
                  type="color"
                  value={editing.bg}
                  onChange={(e) => setEditing({ ...editing, bg: e.target.value })}
                />
              </label>
            </div>
            <button className="button" disabled={busy || !editing.availableSizes?.length}>
              {busy ? 'Saving…' : 'Save product'}
            </button>
          </form>
        </section>
      )}
    </AdminLayout>
  );
}
export const getServerSideProps: GetServerSideProps = async ({ req, res, query }) => {
  res.setHeader('Cache-Control', 'no-store');
  const { isAdmin } = await import('@/lib/auth');
  if (!(await isAdmin(req))) return { redirect: { destination: '/admin/login', permanent: false } };
  try {
    const { productPage } = await import('@/lib/list-data');
    const result = await productPage(query, true);
    if (query.page !== undefined && query.page !== String(result.paging.page))
      return {
        redirect: {
          destination: canonicalPage('/admin/products', query, result.paging.page),
          permanent: false,
        },
      };
    return { props: { ...result, error: '', demo: false } };
  } catch {
    return {
      props: {
        products: [],
        paging: pagination(0, 1),
        published: 0,
        demo: false,
        error: 'Unable to load products. Please try again.',
      },
    };
  }
};
