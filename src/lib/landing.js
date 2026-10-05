// Shared builders for crawlable landing pages (categories, cities, hubs).
// Used by BOTH the React app (src/pages, src/components/LandingInfo.jsx) and the
// build-time prerenderer (scripts/prerender.mjs) so the HTML a crawler sees is
// identical in substance to what a visitor sees. Pure JS, no JSX, no DOM.
//
// NOTE: only real facts are used here (names, provinces, population, GeoNames
// coordinates, telephone area codes). Nothing is claimed about individual listings.

import { CATEGORIES, CATEGORY_GROUPS, slug } from '../data/categories.js';
import { CITIES, PROVINCES, slugify } from '../data/geo.js';

export const SITE_NAME = 'Yellow Pages Pakistan';
export const SITE_URL = (typeof process !== 'undefined' && process.env && process.env.SITE_URL) || 'https://yellowpagespakistan.goshbuzz.com';

export const categoryPath = (c) => `/category/${slug(c.name)}`;
export const cityPath = (c) => `/city/${slugify(c.name)}`;

const GROUP_BY_ID = Object.fromEntries(CATEGORY_GROUPS.map((g) => [g.id, g]));
const CITIES_BY_POP = [...CITIES].sort((a, b) => b.pop - a.pop);
const CATS_BY_WEIGHT = [...CATEGORIES].sort((a, b) => b.weight - a.weight);

export const CATEGORY_SLUGS = Object.fromEntries(CATEGORIES.map((c) => [slug(c.name), c]));
export const CITY_SLUGS = Object.fromEntries(CITIES.map((c) => [slugify(c.name), c]));

function fit(str, max) {
  if (str.length <= max) return str;
  return str.slice(0, max - 1).replace(/[\s,;:&-]+\S*$/, '') + '…';
}

function breadcrumb(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path === '/' ? '' : it.path}`,
    })),
  };
}

function faqSchema(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}

function join(list) {
  if (list.length <= 1) return list.join('');
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
}

// ── Category landing page ────────────────────────────────────────────────────
export function buildCategoryPage(cat) {
  const path = categoryPath(cat);
  const group = GROUP_BY_ID[cat.group];
  const topCities = CITIES_BY_POP.slice(0, 12);
  const related = CATEGORIES.filter((c) => c.group === cat.group && c.id !== cat.id).slice(0, 12);

  const title = fit(`${cat.name} in Pakistan | Yellow Pages PK`, 60);
  const description = fit(
    `Find ${cat.name.toLowerCase()} across Pakistan. Browse by city, see phone numbers, WhatsApp and map pins in the free ${SITE_NAME} business directory.`,
    155,
  );
  const h1 = `${cat.name} in Pakistan`;
  const intro = [
    `Browse ${cat.name.toLowerCase()} listed in the ${SITE_NAME} directory${group ? `, part of the ${group.label} sector` : ''}. Each listing shows the business name, city, phone number, WhatsApp link where available and a Google Maps pin, so you can contact companies directly.`,
    `Use the city links below to narrow results to ${join(topCities.slice(0, 5).map((c) => c.name))} or any of ${CITIES.length} other cities and towns in Punjab, Sindh, Khyber Pakhtunkhwa, Balochistan, Islamabad, Azad Kashmir and Gilgit-Baltistan.`,
  ];
  const faqs = [
    {
      q: `How do I find ${cat.name.toLowerCase()} in Pakistan?`,
      a: `Open the ${cat.name} page on ${SITE_NAME}, then filter by city. Each listing has a Call button, a WhatsApp button where available and a map link.`,
    },
    {
      q: `Which cities can I search for ${cat.name.toLowerCase()}?`,
      a: `You can search in all ${CITIES.length} cities and towns in the directory, including ${join(topCities.slice(0, 8).map((c) => c.name))}.`,
    },
    {
      q: `How can I add my ${cat.name.toLowerCase()} business to the directory?`,
      a: `Use the free listing form at ${SITE_URL}/add. Choose ${cat.name} as the category, add your city and phone number, and submit it for review.`,
    },
  ];
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Categories', path: '/categories' },
    { name: cat.name, path },
  ];
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: h1,
      description,
      url: `${SITE_URL}${path}`,
      isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
    },
    breadcrumb(crumbs),
    faqSchema(faqs),
  ];
  return {
    kind: 'category', path, title, description, h1, intro, faqs, schema, crumbs,
    linkGroups: [
      { heading: `${cat.name} by city`, links: topCities.map((c) => ({ href: `/browse?cat=${cat.id}&city=${encodeURIComponent(c.name)}`, text: `${cat.name} in ${c.name}` })) },
      ...(related.length ? [{ heading: `More in ${group?.label || 'this sector'}`, links: related.map((c) => ({ href: categoryPath(c), text: c.name })) }] : []),
      { heading: 'Explore the directory', links: [{ href: '/categories', text: 'All categories' }, { href: '/cities', text: 'All cities' }, { href: '/add', text: 'List your business free' }] },
    ],
  };
}

// ── City landing page ────────────────────────────────────────────────────────
export function buildCityPage(city) {
  const path = cityPath(city);
  const sameProvince = CITIES_BY_POP.filter((c) => c.province === city.province && c.name !== city.name).slice(0, 12);
  const topCats = CATS_BY_WEIGHT.slice(0, 24);
  const popTxt = city.pop >= 1000 ? `about ${Math.round(city.pop / 1000).toLocaleString('en-US')},000 people` : null;

  const title = fit(`Business Directory ${city.name}, Pakistan | Yellow Pages PK`, 60);
  const description = fit(
    `Find businesses in ${city.name}, ${city.province}. Browse categories, phone numbers, WhatsApp and map pins in the free ${SITE_NAME} directory.`,
    155,
  );
  const h1 = `Business Directory ${city.name}`;
  const intro = [
    `${city.name} is a city in ${city.province}, Pakistan${popTxt ? ` with ${popTxt} (census figures)` : ''}. This page lists the business categories you can browse in ${city.name} on ${SITE_NAME}, with phone numbers, WhatsApp links where available and Google Maps pins.`,
    `Pick a category below to see businesses in ${city.name}, or move to a nearby ${city.province} city.`,
  ];
  const faqs = [
    {
      q: `How do I find a business in ${city.name}?`,
      a: `Open the ${city.name} page on ${SITE_NAME}, choose a category such as ${join(topCats.slice(0, 3).map((c) => c.name))}, and tap Call, WhatsApp or Directions on any listing.`,
    },
    ...(city.code
      ? [{
        q: `What is the telephone area code of ${city.name}?`,
        a: `Landline numbers in ${city.name} use the area code ${city.code} (+92 ${city.code.replace(/^0/, '')} when calling from abroad). Mobile numbers start with 03xx.`,
      }]
      : []),
    {
      q: `How can I list my business in ${city.name}?`,
      a: `Use the free listing form at ${SITE_URL}/add, select ${city.name} as your city and submit it for review.`,
    },
  ];
  const crumbs = [
    { name: 'Home', path: '/' },
    { name: 'Cities', path: '/cities' },
    { name: city.name, path },
  ];
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: h1,
      description,
      url: `${SITE_URL}${path}`,
      isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL },
      about: {
        '@type': 'City',
        name: city.name,
        containedInPlace: { '@type': 'AdministrativeArea', name: city.province },
        geo: { '@type': 'GeoCoordinates', latitude: city.lat, longitude: city.lng },
      },
    },
    breadcrumb(crumbs),
    faqSchema(faqs),
  ];
  return {
    kind: 'city', path, title, description, h1, intro, faqs, schema, crumbs,
    linkGroups: [
      { heading: `Business categories in ${city.name}`, links: topCats.map((c) => ({ href: `/browse?cat=${c.id}&city=${encodeURIComponent(city.name)}`, text: `${c.name} in ${city.name}` })) },
      ...(sameProvince.length ? [{ heading: `Other cities in ${city.province}`, links: sameProvince.map((c) => ({ href: cityPath(c), text: c.name })) }] : []),
      { heading: 'Explore the directory', links: [{ href: '/cities', text: 'All cities' }, { href: '/categories', text: 'All categories' }, { href: '/add', text: 'List your business free' }] },
    ],
  };
}

// ── Cities hub (links to every city page) ────────────────────────────────────
export function buildCitiesHub() {
  const path = '/cities';
  const title = 'Business Directory by City in Pakistan | Yellow Pages PK';
  const description = fit(`Browse the ${SITE_NAME} directory by city: ${CITIES.length} cities and towns across Punjab, Sindh, Khyber Pakhtunkhwa, Balochistan, Islamabad, AJK and Gilgit-Baltistan.`, 155);
  const h1 = 'Business Directory by City';
  const intro = [`Choose a city or town to browse local businesses on ${SITE_NAME}. ${CITIES.length} places are covered across all provinces and territories.`];
  const crumbs = [{ name: 'Home', path: '/' }, { name: 'Cities', path }];
  return {
    kind: 'hub', path, title, description, h1, intro, faqs: [], crumbs,
    schema: [
      { '@context': 'https://schema.org', '@type': 'CollectionPage', name: h1, description, url: `${SITE_URL}${path}`, isPartOf: { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL } },
      breadcrumb(crumbs),
    ],
    linkGroups: PROVINCES.map((p) => ({
      heading: p,
      links: CITIES_BY_POP.filter((c) => c.province === p).map((c) => ({ href: cityPath(c), text: c.name })),
    })),
  };
}

// ── Categories hub (links to every category page) ────────────────────────────
export function buildCategoriesHub() {
  return {
    heading: 'All business categories',
    groups: CATEGORY_GROUPS.map((g) => ({
      heading: g.label,
      links: CATEGORIES.filter((c) => c.group === g.id).map((c) => ({ href: categoryPath(c), text: c.name })),
    })),
  };
}

// ── Static (non-generated) pages: SEO identity used by the prerenderer ───────
export const STATIC_PAGES = [
  { path: '/', title: 'Yellow Pages Pakistan — Business Directory & B2B Leads', description: 'Search Pakistani businesses across 420 cities and 130 categories. Phone numbers, WhatsApp and map pins, plus a lead workspace for agencies.', h1: 'Yellow Pages Pakistan — free business directory', intro: ['Search businesses across 420 cities and 130 categories in Pakistan, with phone numbers, WhatsApp links and Google Maps pins. Free to use, free to list.'] },
  { path: '/app', title: 'Directory Web App — Search Pakistani Businesses | YP PK', description: 'Use the interactive web app to search Pakistani businesses, save B2B leads, work offline and message on WhatsApp in one tap.', h1: 'Yellow Pages Pakistan web app', intro: ['The installable directory app: search, save leads and work offline.'] },
  { path: '/categories', title: '130 Business Categories in Pakistan | Yellow Pages PK', description: 'Explore 130 industry categories across Pakistan: manufacturing, retail, IT, healthcare, food, construction, logistics and more.', h1: 'Browse business categories', intro: ['Pick an industry to see businesses listed in that category across Pakistan.'] },
  { path: '/browse', title: 'Search Pakistani Businesses | Yellow Pages PK', description: 'Search the directory by name, category and city. Find phone numbers, WhatsApp links and Google Maps directions for businesses across Pakistan.', h1: 'Search the Pakistan business directory', intro: ['Search by business name, category or city.'] },
  { path: '/nearby', title: 'Find Businesses Near Me (GPS) | Yellow Pages PK', description: 'Find businesses closest to you using GPS. Restaurants, clinics, repair shops and stores across Pakistan, ranked by distance.', h1: 'Nearby businesses', intro: ['Allow location access to see businesses closest to you.'] },
  { path: '/leads', title: 'B2B Lead Workspace & CSV Export | Yellow Pages PK', description: 'Save Pakistani company leads, track outreach, draft WhatsApp and email pitches and export contacts to CSV.', h1: 'Lead workspace for agencies and freelancers', intro: ['Save businesses into lead lists, track their status and export them to CSV.'] },
  { path: '/add', title: 'List Your Business in Pakistan Free | Yellow Pages PK', description: 'Add your business to the Pakistan directory for free. Add phone, WhatsApp and a map pin, then submit it for review.', h1: 'List your business free', intro: ['Submit your business name, category, city and phone number. Listings are reviewed before they appear.'] },
  { path: '/faq', title: 'Help Centre & FAQ | Yellow Pages Pakistan', description: 'Answers about finding companies, free business listings, B2B lead generation and installing the app on Yellow Pages Pakistan.', h1: 'Help centre and FAQ', intro: ['Answers to common questions about the directory.'] },
];

// Every indexable URL, in sitemap order.
export function allIndexablePaths() {
  return [
    ...STATIC_PAGES.map((p) => p.path),
    '/cities',
    ...CATEGORIES.map(categoryPath),
    ...CITIES_BY_POP.map(cityPath),
  ];
}
