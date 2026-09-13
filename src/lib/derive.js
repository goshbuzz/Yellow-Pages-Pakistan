// Deterministic derivation of "detail" fields for generated listings.
// Each record carries only [name, catId, cityIdx, areaIdx, streetIdx, bldg, seed];
// everything below is derived from the seed at runtime — identical every time.

import { CATEGORIES, CATEGORY_BY_ID } from '../data/categories.js';
import { CITIES } from '../data/geo.js';
import { mulberry32, pick, randInt } from './rng.js';

const EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
const SITE_TLDS = ['.com', '.com.pk', '.pk', '.net'];

// Opening-hours templates by category group
const HOURS = {
  mfg: 'Mon–Sat · 9:00 AM – 6:00 PM',
  retail: 'Mon–Sun · 11:00 AM – 10:00 PM',
  prof: 'Mon–Fri · 9:00 AM – 6:00 PM',
  tech: 'Mon–Sat · 10:00 AM – 7:00 PM',
  prop: 'Mon–Sat · 10:00 AM – 8:00 PM',
  auto: 'Mon–Sat · 9:00 AM – 7:00 PM',
  food: 'Daily · 12:00 PM – 11:30 PM',
  health: 'Mon–Sat · 9:00 AM – 9:00 PM',
  edu: 'Mon–Sat · 8:00 AM – 2:00 PM',
  home: 'Mon–Sat · 9:00 AM – 7:00 PM',
  agri: 'Mon–Sat · 8:00 AM – 6:00 PM',
};

const EMPLOYEE_RANGE = {
  mfg: [40, 900], retail: [4, 45], prof: [5, 300], tech: [4, 180], prop: [5, 220],
  auto: [5, 250], food: [5, 90], health: [4, 260], edu: [8, 400], home: [2, 30], agri: [3, 120],
};

export function slugifyName(name) {
  return name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '').slice(0, 34);
}

// row: [name, catId, cityIdx, areaIdx, streetIdx, bldg, seed]
export function derive(row) {
  const [name, catId, cityIdx, areaIdx, streetIdx, bldg, seed] = row;
  const rand = mulberry32(seed);
  const cat = CATEGORY_BY_ID[catId] || CATEGORIES[0];
  const city = CITIES[cityIdx] || CITIES[0];

  // Contact
  // Cities without a landline area code (smaller towns) are mobile-only.
  const mobileBias = city.code ? (city.mobileBias ?? 0.55) : 1;
  const isMobile = rand() < mobileBias;
  let phone;
  if (isMobile) {
    const prefixes = ['0300', '0301', '0302', '0303', '0304', '0305', '0306', '0307', '0308', '0309', '0311', '0312', '0313', '0314', '0315', '0320', '0321', '0322', '0324', '0331', '0332', '0333', '0334', '0335', '0336', '0340', '0341', '0342', '0343', '0345', '0346', '0347', '0348', '0349', '0355'];
    phone = `${pick(rand, prefixes)}-${String(randInt(rand, 1000000, 9999999))}`;
  } else {
    phone = `${city.code}-${String(randInt(rand, 10 ** (city.digits - 1), 10 ** city.digits - 1))}`;
  }
  const whatsapp = isMobile && rand() < 0.42;

  const slug = slugifyName(name);
  const hasEmail = rand() < 0.62;
  const hasWebsite = rand() < 0.46;
  const ownDomain = hasWebsite && rand() < 0.55;
  const tld = pick(rand, SITE_TLDS);
  const email = hasEmail
    ? ownDomain
      ? `info@${slug.slice(0, 26)}${tld === '.com' ? '.com' : tld === '.net' ? '.net' : '.com.pk'}`
      : `${pick(rand, ['info', 'contact', 'sales', 'team', 'hello'])}.${slug.slice(0, 18)}@${pick(rand, EMAIL_DOMAINS)}`
    : null;
  const website = hasWebsite ? `${slug.slice(0, 30)}${tld}` : null;

  // Geo — real pin coordinates around the city centre
  const lat = +(city.lat + (rand() - 0.5) * 0.056).toFixed(6);
  const lng = +(city.lng + (rand() - 0.5) * 0.064).toFixed(6);

  // Reputation
  const rating = +(3.3 + rand() * 1.6).toFixed(1);
  const reviews = randInt(rand, 3, 1100);
  const [eMin, eMax] = EMPLOYEE_RANGE[cat.group] || [5, 100];
  const employees = randInt(rand, eMin, eMax);
  const est = randInt(rand, 1972, 2024);
  const hours = HOURS[cat.group] || 'Mon–Sat · 9:00 AM – 6:00 PM';

  const area = city.areas[areaIdx % city.areas.length];
  const street = city.streets[streetIdx % city.streets.length];
  const address = `${bldg}, ${street}, ${area}, ${city.name}`;

  const description = `${name} is a ${cat.name.toLowerCase()} business located in ${area}, ${city.name} — serving customers across ${city.province} since ${est}. Reach out for ${cat.name.toLowerCase()} services, quotes and support.`;

  return {
    name, catId, cat, city: city.name, province: city.province, area, street, address, bldg,
    phone, whatsapp, email, website, lat, lng, rating, reviews, employees, est, hours, description,
    verified: false,
  };
}

export function googleMapsUrl(d) {
  return `https://www.google.com/maps/search/?api=1&query=${d.lat},${d.lng}`;
}
export function googleMapsEmbedUrl(d) {
  return `https://maps.google.com/maps?q=${d.lat},${d.lng}&z=15&output=embed`;
}
export function telHref(phone) {
  return `tel:+92${phone.replace(/^0/, '').replace(/-/g, '')}`;
}
export function waHref(phone) {
  return `https://wa.me/92${phone.replace(/^0/, '').replace(/-/g, '')}`;
}
