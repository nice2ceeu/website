import { z } from 'zod';
import { sizes } from './catalog';

export const contentFields = [
  [
    'announcement',
    'Header & footer',
    'Announcement',
    'A LITTLE PERSONALITY. A LOT OF EVERYDAY. ✳ MEET YOUR NEW FAVORITE TEE',
  ],
  ['metaTitle', 'SEO', 'Page title', 'Good tees. No script.'],
  [
    'metaDescription',
    'SEO',
    'Search description',
    'A little personality. A lot of everyday. Discover original graphic tees by Lightmare PH.',
  ],
  ['heroEyebrow', 'Hero', 'Eyebrow', 'INDEPENDENT SPIRIT. EVERYDAY TEES.'],
  ['heroTitle', 'Hero', 'Heading line 1', 'Good tees.'],
  ['heroAccent', 'Hero', 'Heading line 2', 'No script.'],
  [
    'heroDescription',
    'Hero',
    'Description',
    'For the plans you make.\nAnd the ones you don’t.\nGraphic tees with a little more you.',
  ],
  ['heroButton', 'Hero', 'Shop button label', 'Meet your new favorite'],
  ['heroNote', 'Hero', 'Small note', 'SMALL COLLECTION. BIG PERSONALITY.'],
  ['collectionLabel', 'Collection', 'Eyebrow', 'THE EVERYDAY COLLECTION / 01'],
  ['collectionTitle', 'Collection', 'Heading', 'Your rotation,'],
  ['collectionAccent', 'Collection', 'Heading emphasis', 'upgraded.'],
  ['shopEyebrow', 'Shop page', 'Eyebrow', 'THE EVERYDAY COLLECTION / 01'],
  ['shopTitle', 'Shop page', 'Heading', 'Find your'],
  ['shopAccent', 'Shop page', 'Heading emphasis', 'kind of tee.'],
  [
    'shopDescription',
    'Shop page',
    'Description',
    'Original designs. A little more you.\nBrowse the collection and make one yours.',
  ],
  [
    'collectionDescription',
    'Collection',
    'Description',
    'Original designs. Endless ways to wear them.\nPick the one that feels like you.',
  ],
  [
    'collectionNote',
    'Collection',
    'Collection note',
    'Preview collection — sample designs, prices, and store policies. Product images are illustrative mockups.',
  ],
  ['storyArt', 'Our story', 'Artwork line 1', 'less rules.'],
  ['storyArtAccent', 'Our story', 'Artwork line 2', 'more you.'],
  ['storyEyebrow', 'Our story', 'Eyebrow', 'A LITTLE ABOUT US'],
  ['storyTitle', 'Our story', 'Heading', 'Life doesn’t come with a'],
  ['storyAccent', 'Our story', 'Heading emphasis', 'dress code.'],
  [
    'storyBody',
    'Our story',
    'Story',
    'We’re here for the coffee runs, the wrong turns, the long weekends. The everyday moments that turn into your favorite memories.\n\nSo we made tees with personality. Easy to throw on. Hard to leave behind. Always, unapologetically you.',
  ],
  ['sizeTitle', 'Size guide', 'Heading', 'Find your'],
  ['sizeAccent', 'Size guide', 'Heading emphasis', 'comfort zone.'],
  [
    'sizeIntro',
    'Size guide',
    'Measuring instructions',
    'Measure a tee you already love, laid flat.\nBetween sizes? Go up for a roomier fit.',
  ],
  ['sizeFitTitle', 'Size guide', 'Fit heading', 'Made for taking it easy.'],
  [
    'sizeBody',
    'Size guide',
    'Fit description',
    'A classic unisex fit. Choose your usual size for an everyday fit, or size up for that effortlessly oversized look.',
  ],
  [
    'sizeNote',
    'Size guide',
    'Measurement note',
    'Sample garment measurements in cm. Width is pit-to-pit; length is shoulder-to-hem. Confirm with your supplier before launch.',
  ],
  ['orderTitle', 'How to order', 'Heading', 'Good things.'],
  ['orderAccent', 'How to order', 'Heading emphasis', 'Four little steps.'],
  ['shippingTitle', 'Shipping & care', 'Shipping heading', 'A good mail day, coming up.'],
  [
    'shippingAreas',
    'Shipping & care',
    'Shipping coverage description',
    'Shipping across the Philippines.',
  ],
  [
    'shippingEstimate',
    'Shipping & care',
    'Delivery estimate',
    'Estimated 3–7 business days after payment confirmation.',
  ],
  ['careTitle', 'Shipping & care', 'Care heading', 'A little care goes a long way.'],
  [
    'careBody',
    'Shipping & care',
    'Care instructions',
    'Wash inside out on cold. Skip the bleach.\nAir dry when you can. Keep the good days\nand your favorite print going longer.',
  ],
  ['everydayTitle', 'Shipping & care', 'Lifestyle heading', 'Made for your everyday.'],
  [
    'everydayBody',
    'Shipping & care',
    'Lifestyle description',
    'Your coffee-run companion.\nYour weekend uniform.\nYour new “I’ll just wear this” tee.',
  ],
  ['aboutLabel', 'About us', 'Section label', 'About Lightmare'],
  ['aboutHeading', 'About us', 'Main heading', ''],
  ['aboutBody', 'About us', 'Body', ''],
  ['aboutToggleText', 'About us', 'Button text', 'Explore The World of Lightmare'],
  [
    'aboutDescription',
    'About us',
    'Expandable description',
    'Our world begins with a little imagination. Discover original designs inspired by daydreams, everyday moments, and the freedom to express yourself. Each collection invites you to find a tee that feels like you.',
  ],
  ['faqTitle', 'FAQs', 'Heading', 'A few good'],
  ['faqAccent', 'FAQs', 'Heading emphasis', 'questions.'],
  ['socialTitle', 'Socials', 'Heading', 'Looks better'],
  ['socialAccent', 'Socials', 'Heading emphasis', 'on you.'],
  ['socialBody', 'Socials', 'Description', 'Outfits, everyday moments, and whatever comes next.'],
  ['ctaEyebrow', 'Bottom CTA', 'Eyebrow', 'YOUR NEW FAVORITE IS WAITING'],
  ['ctaTitle', 'Bottom CTA', 'Heading', 'Go on.'],
  ['ctaAccent', 'Bottom CTA', 'Heading emphasis', 'Wear your personality.'],
  ['ctaButton', 'Bottom CTA', 'Shop button label', 'Shop the tees'],
  ['footerTagline', 'Header & footer', 'Footer tagline', 'Wear what feels like you.'],
  [
    'footerCopyright',
    'Header & footer',
    'Copyright text (displayed after © 2026)',
    'LIGHTMARE PH. A little out of line.',
  ],
  ['footerNote', 'Header & footer', 'Footer note', 'See you in your next lightmare'],
] as const;
export type ContentKey = (typeof contentFields)[number][0];
const text = z.string().trim().min(1).max(2000);
const socialUrl = z
  .string()
  .trim()
  .max(500)
  .refine(
    (value) =>
      !value ||
      (() => {
        try {
          const url = new URL(value);
          return url.protocol === 'https:' && !url.username && !url.password;
        } catch {
          return false;
        }
      })(),
    'Use an HTTPS URL or leave blank.',
  );
const heroSchema = z.object({
  title: z.string().trim().min(1).max(160).default('Welcome to\nyour Lightmare'),
  subtitle: z.string().trim().max(400).default('Soft Cotton, Better Feel.\nWear what you dream of'),
  button: z.string().trim().min(1).max(80).default('Shop Now'),
  imageUrl: z
    .string()
    .max(1000)
    .refine(
      (value) =>
        value === '/images/lightmare-sky-stars.webp' ||
        /^https:\/\/res\.cloudinary\.com\//.test(value),
      'Upload a hero image to Cloudinary.',
    )
    .default('/images/lightmare-sky-stars.webp'),
  alt: z
    .string()
    .trim()
    .min(1)
    .max(160)
    .default('Dreamy blue sky with cream clouds and scattered stars'),
  buttonHref: z
    .string()
    .max(200)
    .regex(/^\/(?!\/)[a-zA-Z0-9/#?=&_-]*$/)
    .default('/shop'),
  textColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default('#ffffff'),
  buttonColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default('#f0f0f0'),
  buttonTextColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default('#8eabc0'),
  imagePosition: z.number().min(0).max(100).default(50),
});
export const landingSchema = z.object({
  faviconUrl: z
    .union([
      z.literal('/favicon-32.png'),
      z
        .url()
        .max(1000)
        .refine((value) => {
          try {
            const url = new URL(value);
            return (
              url.protocol === 'https:' &&
              url.hostname === 'res.cloudinary.com' &&
              !url.username &&
              !url.password
            );
          } catch {
            return false;
          }
        }, 'Upload a tab icon to Cloudinary.'),
    ])
    .default('/favicon-32.png'),
  hero: heroSchema.default(() => heroSchema.parse({})),
  copy: z
    .object(
      Object.fromEntries(contentFields.map(([key]) => [key, text])) as Record<
        ContentKey,
        typeof text
      >,
    )
    .extend({
      shopEyebrow: text.default('THE EVERYDAY COLLECTION / 01'),
      shopTitle: text.default('Find your'),
      shopAccent: text.default('kind of tee.'),
      shopDescription: text.default(
        'Original designs. A little more you.\nBrowse the collection and make one yours.',
      ),
      footerCopyright: text.default('LIGHTMARE PH. A little out of line.'),
      aboutLabel: text.default('About Lightmare'),
      aboutHeading: z.string().trim().max(2000).default(''),
      aboutBody: z.string().trim().max(2000).default(''),
      aboutToggleText: text.default('Explore The World of Lightmare'),
      aboutDescription: text.default(
        'Our world begins with a little imagination. Discover original designs inspired by daydreams, everyday moments, and the freedom to express yourself. Each collection invites you to find a tee that feels like you.',
      ),
    }),
  contactEmail: z.email().max(200),
  instagram: socialUrl,
  tiktok: socialUrl,
  featuredSlug: z
    .string()
    .max(100)
    .regex(/^$|^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  ticker: z.array(z.string().trim().min(1).max(100)).length(4),
  steps: z.array(z.object({ title: z.string().trim().min(1).max(100), body: text })).length(4),
  faqs: z
    .array(z.object({ question: z.string().trim().min(1).max(200), answer: text }))
    .min(1)
    .max(12),
  measurements: z.preprocess(
    (value) => (Array.isArray(value) ? value.filter((row) => row?.size !== 'XS') : value),
    z
      .array(
        z.object({
          size: z.enum(sizes),
          width: z.number().positive().max(200),
          length: z.number().positive().max(200),
        }),
      )
      .length(sizes.length)
      .refine(
        (rows) => new Set(rows.map((r) => r.size)).size === sizes.length,
        'Each size must appear once.',
      ),
  ),
});
export type LandingContent = z.infer<typeof landingSchema>;
export const defaultLanding: LandingContent = {
  faviconUrl: '/favicon-32.png',
  hero: heroSchema.parse({}),
  copy: Object.fromEntries(contentFields.map(([key, , , value]) => [key, value])) as Record<
    ContentKey,
    string
  >,
  contactEmail: 'hello@example.com',
  instagram: '',
  tiktok: '',
  featuredSlug: '',
  ticker: [
    'NOT MADE TO BLEND IN',
    'GOOD TEES, GOOD DAYS',
    'A LITTLE OUT OF LINE',
    'WEAR WHAT FEELS LIKE YOU',
  ],
  steps: [
    { title: 'Pick your personality', body: 'Choose your tee, color, and perfect fit.' },
    { title: 'Make it yours', body: 'Fill out the order form on the product page.' },
    { title: 'Make it official', body: 'Follow the payment instructions sent by our team.' },
    {
      title: 'We’ll take it from here',
      body: 'Get your confirmation, then wait for a good mail day.',
    },
  ],
  faqs: [
    {
      question: 'What payment methods do you accept?',
      answer:
        'This preview uses manual payment confirmation. Available payment methods and payment details will be provided by the store team after your order request. No payment is collected on this website.',
    },
    {
      question: 'How long does shipping take?',
      answer:
        'The sample delivery estimate is 3–7 business days within the Philippines after payment confirmation. Timing can vary by location.',
    },
    {
      question: 'Can I change or cancel my order?',
      answer:
        'Contact us with your order reference as soon as possible. Changes and cancellations can be requested before dispatch; our team will confirm what is possible.',
    },
    {
      question: 'Are items returnable or exchangeable?',
      answer:
        'Contact us if an item arrives damaged or incorrect. The final returns and size-exchange policy will be published before the store launches.',
    },
  ],
  measurements: sizes.map((size, i) => ({
    size,
    width: 49 + i * 3,
    length: 67 + i * 3,
  })),
};
