import { z } from 'zod';

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
  ['footerNote', 'Header & footer', 'Footer note', 'Made for your everyday.'],
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
const carouselImageUrl = z
  .url()
  .max(1000)
  .refine(
    (value) => value.startsWith('https://res.cloudinary.com/'),
    'Carousel images must be hosted on Cloudinary.',
  );
export const landingSchema = z.object({
  copy: z.object(
    Object.fromEntries(contentFields.map(([key]) => [key, text])) as Record<
      ContentKey,
      typeof text
    >,
  ),
  contactEmail: z.email().max(200),
  instagram: socialUrl,
  tiktok: socialUrl,
  featuredSlug: z
    .string()
    .max(100)
    .regex(/^$|^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  carouselSlides: z
    .array(
      z.object({
        imageUrl: carouselImageUrl,
        alt: z.string().trim().min(1).max(160),
      }),
    )
    .length(4),
  ticker: z.array(z.string().trim().min(1).max(100)).length(4),
  steps: z.array(z.object({ title: z.string().trim().min(1).max(100), body: text })).length(4),
  faqs: z
    .array(z.object({ question: z.string().trim().min(1).max(200), answer: text }))
    .min(1)
    .max(12),
  measurements: z
    .array(
      z.object({
        size: z.enum(['XS', 'S', 'M', 'L', 'XL']),
        width: z.number().positive().max(200),
        length: z.number().positive().max(200),
      }),
    )
    .length(5)
    .refine((rows) => new Set(rows.map((r) => r.size)).size === 5, 'Each size must appear once.'),
});
export type LandingContent = z.infer<typeof landingSchema>;
export const defaultLanding: LandingContent = {
  copy: Object.fromEntries(contentFields.map(([key, , , value]) => [key, value])) as Record<
    ContentKey,
    string
  >,
  contactEmail: 'hello@example.com',
  instagram: '',
  tiktok: '',
  featuredSlug: '',
  carouselSlides: [
    {
      imageUrl:
        'https://res.cloudinary.com/ybxh4efa/image/upload/v1790900887/lightmare/carousel/lightmare-ph-celestial-2026.webp',
      alt: 'Model wearing a cream celestial graphic tee',
    },
    {
      imageUrl:
        'https://res.cloudinary.com/ybxh4efa/image/upload/v1790900888/lightmare/carousel/lightmare-ph-dusty-rose-2026.webp',
      alt: 'Model wearing a dusty rose floral graphic tee',
    },
    {
      imageUrl:
        'https://res.cloudinary.com/ybxh4efa/image/upload/v1790900889/lightmare/carousel/lightmare-ph-friends-2026.webp',
      alt: 'Friends wearing butter yellow and powder blue graphic tees',
    },
    {
      imageUrl:
        'https://res.cloudinary.com/ybxh4efa/image/upload/v1790900890/lightmare/carousel/lightmare-ph-starburst-2026.webp',
      alt: 'Model wearing a burgundy starburst graphic tee',
    },
  ],
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
  measurements: ['XS', 'S', 'M', 'L', 'XL'].map((size, i) => ({
    size: size as 'XS' | 'S' | 'M' | 'L' | 'XL',
    width: 46 + i * 3,
    length: 64 + i * 3,
  })),
};
