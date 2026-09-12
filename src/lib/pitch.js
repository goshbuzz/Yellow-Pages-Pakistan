// Pitch drafter — generates personalized cold-outreach drafts for each business.
// Seeded by business name so every business gets a stable, distinct variant.

import { hashStr, mulberry32, pick } from './rng.js';

export const SERVICE_TYPES = [
  { id: 'web', label: 'Website / Web App', emoji: '🌐' },
  { id: 'social', label: 'Social Media Marketing', emoji: '📱' },
  { id: 'seo', label: 'SEO & Google Ranking', emoji: '🔍' },
  { id: 'branding', label: 'Branding & Design', emoji: '🎨' },
  { id: 'video', label: 'Video & Content', emoji: '🎬' },
  { id: 'ads', label: 'Paid Ads (Meta / Google)', emoji: '🎯' },
];

export const TONES = [
  { id: 'friendly', label: 'Friendly', emoji: '😄' },
  { id: 'professional', label: 'Professional', emoji: '🤝' },
  { id: 'local', label: 'Desi-flavoured', emoji: '🇵🇰' },
];

const HOOKS = {
  web: [
    'I noticed {name} doesn\'t have a website listed in the directory yet — that\'s free customers going to competitors on Google.',
    'When people search for {cat} in {city} online, {name} is invisible. A clean 5-page website fixes that in a week.',
    'Most {cat} businesses in {city} now get enquiries through their website. Happy to build one for {name} — no upfront payment until you like the design.',
  ],
  social: [
    '{name} has great reviews ({rating}★) — but almost no social presence. Imagine those happy customers tagging you on Instagram.',
    'I help {cat} businesses in {city} turn Instagram into a 24/7 shopfront. Can I send 3 free post ideas for {name}?',
    'Your competitors in {city} are posting daily and capturing the market. Let\'s get {name} a proper content calendar.',
  ],
  seo: [
    'Right now "{cat} in {city}" on Google shows everyone except {name}. Local SEO fixes that in 4–6 weeks.',
    'I ran a quick search: {name} doesn\'t appear on page 1 for {cat} in {city}. I can change that — I\'ve done it for similar businesses.',
    'Customers are searching for {cat} near {area} every day. Let\'s make sure they find {name} first.',
  ],
  branding: [
    'A memorable logo + consistent look can lift walk-ins for a {cat} business like {name}. Want to see 2 free concepts?',
    '{name} deserves branding as good as its {rating}★ reputation. I\'d love to send a free mini brand audit.',
    'Great {cat} businesses in {city} win trust with sharp visuals. Can I show you what that looks like for {name}?',
  ],
  video: [
    'A 30-second reel of {name} in action could bring in more customers than a month of flyers in {city}.',
    'I shoot short promo videos for {cat} businesses — affordable packages, filmed at your {area} location.',
    'Video is why some {cat} spots in {city} always look busy. Let\'s make one for {name}.',
  ],
  ads: [
    'With PKR 15k/month on Meta ads, {cat} businesses in {city} typically see 50–150 qualified leads. Want a free plan for {name}?',
    'I manage paid ads for local businesses — {name} could be capturing {city} searches today with a small test budget.',
    'Instead of waiting for walk-ins, {name} can appear in every "{cat} near me" search in {area}. I can set that up this week.',
  ],
};

const OPENERS = {
  friendly: ['Assalam-o-Alaikum! 👋', 'Hi there! 👋', 'Hello {name} team!'],
  professional: ['Dear {name} Management,', 'Dear Sir/Madam,', 'Greetings from {sender}!'],
  local: ['Assalam-o-Alaikum!', 'Salam & greetings!', 'Assalam-o-Alaikum, {name} team!'],
};

const CLOSERS = {
  friendly: [
    'Would you be open to a quick 10-minute call this week?\n\nBest,\n{sender}',
    'Just reply "YES" and I\'ll send over a couple of ideas — no obligation.\n\nCheers,\n{sender}',
  ],
  professional: [
    'I would welcome the opportunity to discuss this further at your convenience.\n\nKind regards,\n{sender}',
    'Please let me know a suitable time for a brief call.\n\nSincerely,\n{sender}',
  ],
  local: [
    'Ek chhoti si call kar lein? 10 minute mein poora plan bata doonga. 🙏\n\nBest regards,\n{sender}',
    'Reply karein, main 2-3 free ideas bhej deta hoon — koi zaroori nahi.\n\nShukriya!\n{sender}',
  ],
};

const SUBJECTS = {
  web: ['A website idea for {name}', '{name} on Google — quick idea', 'Website for {name}?'],
  social: ['3 free post ideas for {name}', 'Instagram for {name} 📱', '{name} on social media?'],
  seo: ['{name} isn\'t on page 1 of Google (yet)', 'SEO for {name}', 'Getting {name} found in {city}'],
  branding: ['2 free logo concepts for {name}', 'Branding idea for {name}', 'A fresh look for {name}'],
  video: ['A 30-sec reel idea for {name}', 'Video for {name} 🎬', 'Show {city} what {name} does best'],
  ads: ['150 leads/month for {name}?', 'Paid ads plan for {name}', '{name} ads — free plan inside'],
};

export function draftPitch({ name, cat, city, area, rating }, service, tone, sender = 'Ahmed (Freelancer)') {
  const seed = hashStr(name + service + tone);
  const rand = mulberry32(seed);
  const catName = typeof cat === 'object' && cat !== null ? cat.name : cat || 'local business';
  const fill = (s) => s
    .replaceAll('{name}', name)
    .replaceAll('{cat}', catName.toLowerCase())
    .replaceAll('{city}', city || 'your city')
    .replaceAll('{area}', area || city || 'your area')
    .replaceAll('{rating}', String(rating || 4))
    .replaceAll('{sender}', sender);

  const subject = fill(pick(rand, SUBJECTS[service] || SUBJECTS.web));
  const hook = fill(pick(rand, HOOKS[service] || HOOKS.web));
  const opener = fill(pick(rand, OPENERS[tone] || OPENERS.friendly));
  const closer = fill(pick(rand, CLOSERS[tone] || CLOSERS.friendly));
  const body = `${opener}\n\n${hook}\n\nI work with ${catName.toLowerCase()} businesses across ${city || 'Pakistan'} and keep things simple: clear pricing, fast delivery, real results.\n\n${closer}`;
  return { subject, body };
}

export function pitchMailto(email, subject, body) {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
