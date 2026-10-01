# Lightmare

Next.js **Pages Router**, TypeScript, React, Aiven MySQL, and Brevo. Cream/burgundy graphic tee storefront inspired by the product-first presentation of https://inprintwetrust.co/ and https://sweetbabyjane.us/. Original branding, copy, and sample designs; no copied store assets.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:3000. The product catalog requires a configured database; there is no hardcoded product fallback. Order requests return an honest unavailable message until MySQL is configured. Admin routes always require a configured login; there is no default password or authentication bypass.

Routes: `/`, `/products/off-duty`, `/products/cherry-picking`, `/products/wish-you-were-here`, `/products/romanticize-it`, `/admin/login`, `/admin`, `/admin/orders`. Admin links are intentionally absent from the public navigation. Server-side authentication protects both admin pages and APIs; URL obscurity is not the security boundary.

## Aiven MySQL

1. Create a MySQL service in your Aiven account. Copy `.env.example` to `.env.local`.
2. Populate `MYSQL_HOST`, `MYSQL_PORT` (use Aiven's actual port), `MYSQL_USER`, `MYSQL_PASSWORD`, and `MYSQL_DATABASE` from the service overview.
3. Download the project CA certificate to `certs/ca.pem`, then set `MYSQL_CA_PATH`. Alternatively set `MYSQL_CA` to PEM text with escaped `\n` separators. Certificate verification is always enabled.
4. Run `npm run db:setup`. It creates the orders table without deleting data or inserting dummy customers. Use a migration/admin database user for setup and a limited SELECT/INSERT/UPDATE user at runtime.

Reference: https://aiven.io/docs/platform/concepts/tls-ssl-certificates

## Admin login

Admin accounts live in the MySQL admins table. Passwords are stored as salted scrypt hashes; no admin email or password is read from environment variables.

1. Configure Aiven and SESSION_SECRET in .env.local.
2. Run npm run db:setup to create the orders and admins tables (safe to rerun).
3. Run npm run admin:create in an interactive terminal. Enter your email and password; password entry is hidden and requires confirmation.
4. Restart the server and visit /admin/login.

Use npm run admin:reset to change an existing account's password. This increments its session version and invalidates all previous sessions. Setting active = FALSE in the admins table disables access immediately. Session validation checks the database on every protected request and fails closed if the database is unavailable. Existing environment-based sessions no longer work.

Keep SESSION_SECRET in environment configuration: it signs the eight-hour HTTP-only session cookies and is not an admin credential. Use a random value of at least 32 characters. Production cookies require HTTPS. Runtime access to admins only needs SELECT; the account-management command requires INSERT/UPDATE privileges.

## Brevo

Set `BREVO_API_KEY` and a verified `BREVO_SENDER_EMAIL`. Set `ORDER_NOTIFICATION_EMAIL` to receive a separate admin order summary. Customers receive an HTML invoice with unit prices, quantity, subtotal, shipping, total, delivery details, and payment status. Admin summaries include contact details and order notes. Both use email-compatible tables and inline CSS, escaped customer content, and plain-text alternatives. The invoice is an order reference, not an official tax invoice or proof of payment.

Orders are saved before sending. No payment is collected. Email status is aggregate: `sent` means Brevo accepted all configured messages, not confirmed inbox delivery. Any send failure preserves the order and marks email status failed. Admin can resend both messages; partial failures can therefore result in duplicate delivery to a recipient. Resends use saved prices and the current order status. Pending email records also need review if the process stops between saving and sending.

Run `npx tsx scripts/preview-emails.ts` to generate dummy-data HTML previews in `docs/email-previews/` without sending mail. Open `customer.html` or `admin.html` in a browser. Live inbox rendering has not been verified.

Reference: https://developers.brevo.com/docs/send-a-transactional-email

## Edit the sample content

### Landing page CMS

The **Landing Page** admin tab at `/admin/content` edits hero and section copy, SEO text, the featured product, ticker messages, size measurements, four ordering steps, shipping/care descriptions, FAQs, public contact email, social URLs, and footer copy. Run `npm run db:cms` to create and initialize the CMS table; reruns preserve published content. The shipping fee, payment logic, layout, branding, and product data are intentionally outside this editor. Product images are managed in Products.

**Publish changes** saves to MySQL and updates the public landing page on the next request, without a rebuild. Header/footer contact links also update on shop and product pages. Unpublished changes remain local to the editor; **Discard changes** restores the last saved content. Revision checks prevent another session's newer edits from being overwritten. Content is plain text rendered by React, never injected HTML. FAQs support adding, removing, and moving questions up. No draft-history or file-upload system is included.

### Product management

The Overview page (`/admin`) shows the database product count, including drafts and excluding deleted products. The separate Products tab (`/admin/products`) supports creating, editing, publishing/unpublishing, and deleting products. Run `npm run db:products` once to create the product table and import the four initial designs. Rerunning preserves edited and deleted products. `npm run db:setup` also creates the table, without seeding it.

Product fields include a PHP price, URL slug, name, description, color, available sizes, image URL, and card background. Upload JPEG, PNG, or WebP files up to **10 MB (10,485,760 bytes)** in Products. Both browser and server enforce the limit. The server decodes actual image contents, rejects animation and images over 40 megapixels, strips metadata, preserves aspect ratio, and converts to WebP at quality 82 with a maximum 1600-pixel edge. Output is capped at 2 MB. The editor displays a preview and original/compressed file sizes; click **Save product** to apply the image.

Compressed images are uploaded to Cloudinary; MySQL stores the resulting HTTPS URL. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in `.env.local` and your deployment environment, then restart the app. These settings stay on the server; no unsigned upload preset is needed. Uploads require admin authentication, same-origin requests, and are limited to 20 per 10 minutes per connection IP. Configure the hosting proxy to accept 10 MB request bodies; any lower platform request limit still applies. Uploaded images are public assets, including those not yet assigned to a product. Unused uploads are retained; automatic cleanup is not included.

After configuring Cloudinary, run `npm run images:migrate` to upload existing database images and local product images and update their product URLs. The migration skips Cloudinary URLs and retains original files/database blobs for rollback. Other externally hosted images are skipped and can be replaced through Products. Existing `/api/product-images/<uuid>` URLs continue working until migrated. New uploads require Cloudinary and do not fall back to database storage.

HTTPS image URLs and paths under `public/images` are still supported. Deletion removes a product from storefront queries while preserving its record and old order details. Deleted slugs stay reserved. Runtime database access requires SELECT/INSERT/UPDATE on products and SELECT on product_images for legacy images. Image processing uses [Sharp](https://sharp.pixelplumbing.com/api-output/). Cloudinary uploads use its [signed upload API](https://cloudinary.com/documentation/upload_images#generating_authentication_signatures).

The landing page, shop, individual product pages, and order pricing read the database. New products need no rebuild. Draft/deleted products return 404 and cannot be ordered. Catalog failures do not fall back to stale sample products when a database is configured. Seed fixtures live under scripts/fixtures and are only used by setup scripts and tests, never by storefront rendering.

`lib/catalog.ts` contains initial sample products and the PHP 120 flat shipping fee, country, contact email, and social URLs. Manage live product prices in the Products tab (stored as integer centavos). Add your Instagram/TikTok URLs to turn the coming-soon text into real links. Update the sample size measurements, delivery estimates, and return/payment policies in `pages/index.tsx` before opening orders. Default payment flow is manual: staff supplies instructions and verifies payment before marking an order paid. No payment gateway or automatic payment verification is included.

The generated default product photograph is `public/images/off-duty.png`; the other three designs are original SVG mockups in `components/Tee.tsx`. Image generation used the built-in image tool; the exact prompt is in `docs/image-prompt.txt`.

## Verify and deploy

Prettier is configured in `.prettierrc.json`. Run `npm run format` to format the codebase or `npm run format:check` to check formatting. VS Code format-on-save settings and a recommendation for the official Prettier extension are included in `.vscode/`; install that extension to enable editor formatting.

```sh
npm run test
npm run typecheck
npm run build
npm start
```

Deploy to a Node.js host that supports Next.js API routes (not a static export). Set all environment variables securely and set `APP_URL` to the exact HTTPS origin. Mount the Aiven certificate or supply `MYSQL_CA`. Run schema setup before accepting orders. Current request throttling is process-local; configure a shared edge rate limiter for a multi-instance production deployment. Behind a proxy it conservatively groups clients by socket address; do not blindly trust forwarded IP headers.

Order totals are computed server-side. Validated values use parameterized SQL. Order requests carry an idempotency key to avoid duplicates when retrying the same form. No live Aiven/Brevo account is provisioned by this repository, and those integrations require real credentials to verify end-to-end. Overview shows five recent orders and five recent products; aggregate counts and totals cover all records. Admin product/order lists use database pagination with 10 results per page; the shop shows 12 per page.

## Search and pagination

Search uses URL query parameters (q, page, and applicable status/color/sort filters), with a 400 ms typing debounce. Results are queried in MySQL using parameterized predicates, COUNT, LIMIT, and OFFSET; no client-side array filtering is used. Filters and search reset to page 1, page navigation preserves filters, and invalid or out-of-range pages redirect to the valid page. Numbered controls include previous/next, the active page, ellipses, and the matching result range. Product mutations refresh the current filtered page and clamp it after deletion.

Shipping addresses use cascading province (including Metro Manila and independent cities), city/municipality, and barangay selectors backed by the committed local snapshot in data/addresses/philippines.json. Both dropdowns and server validation use this dataset; checkout makes no external address API calls. The browser requests only the selected branch from our own /api/locations endpoint. House/street details are entered manually. Postal codes are suggested from a local PHLPost snapshot for 774 exact province/city matches and remain editable. Unmatched locations require manual entry. Postal codes must contain four digits. Refresh the snapshot with `npm run postal:update`, review changes, and redeploy. Changing city/province resets the ZIP; changing barangay preserves customer corrections. Run npm run addresses:update to download a replacement snapshot from the PSGC API, then review and commit its diff and redeploy. Retrieval time and source are recorded in the JSON; retrieval time does not indicate the source's geographic revision date.
