#!/usr/bin/env python3
"""One-off converter: ypages.pk internship xlsx dumps -> clean CSV for
scripts/import-listings.mjs --source=csv (which applies all quality gates).

Columns out: name, category, city, address, phone, email
"""
import glob, os, re, csv, openpyxl

# filename stem -> exact category name from src/data/categories.js
CAT_MAP = {
    'Addiction Center': 'Clinics & Specialists',
    'Architects': 'Architecture & Town Planning',
    'Automatic Doors': 'Industrial Equipment & Supplies',
    'Banquet Halls': 'Wedding Halls & Marquees',
    'Beauty Salons': 'Salons, Spas & Barbers',
    'Boutiques': 'Clothing & Fashion Stores',
    'Cosmetic Surgeons': 'Cosmetic & Aesthetic Clinics',
    'Courier Services': 'Courier & Cargo Services',
    'Dental Clinics': 'Dentists & Dental Clinics',
    'Educational Consultants': 'Colleges & Higher Education',
    'Event Management': 'Wedding Halls & Marquees',
    'Fans Manufacturers': 'Electrical Equipment & Cables',
    'Fiberglass Security': 'CCTV & Security Systems',
    'Furniture Manufacturers': 'Furniture Manufacturing',
    'Hair Transplant': 'Cosmetic & Aesthetic Clinics',
    'Heart Clinics': 'Clinics & Specialists',
    'Interior Designers': 'Interior Design & Decoration',
    'Marriage Bureau': 'Wedding Halls & Marquees',
    'Packers and Movers': 'Movers & Packers',
    'Paints Manufactures': 'Paint & Coatings',
    'Plastic Surgeons': 'Cosmetic & Aesthetic Clinics',
    'Racks Manufactuers': 'Industrial Equipment & Supplies',
    'Rent A Car': 'Car Rentals & Care',
    'Resturants': 'Restaurants & Fast Food',
    'Security Equipments': 'CCTV & Security Systems',
    'Security Services': 'Security Services',
    'Swimming Pool Equipment': 'Hardware & Sanitary',
    'Travel Agencies': 'Airlines & Air Cargo',
    'Umrah Services': 'Airlines & Air Cargo',
    'Wallcovering Wallpapers': 'Home Décor & Furnishings',
}

PHONE_RE = re.compile(r'(?:\+?92|0)\s?[\-\(\)]?\s?\d{2,3}[\-\(\)]?\s?\d{6,8}')

def normalize(raw):
    """Return 0-prefixed national number ('0333-4295356' / '042-37812913') or None."""
    if not raw:
        return None
    d = re.sub(r'\D', '', str(raw))
    if d.startswith('0092'):
        d = d[4:]
    elif d.startswith('92') and len(d) > 11:
        d = d[2:]
    if d.startswith('0'):
        d = d[1:]
    if re.fullmatch(r'3\d{9}', d):          # mobile
        return f'0{d[:4]}-{d[4:]}'
    if 7 <= len(d) <= 10:                    # landline area-code + number
        return f'0{d[:2]}-{d[2:]}' if len(d) >= 9 else f'0{d}'
    return None

def pick_phones(cell):
    """All numbers in a cell; prefer a mobile (WhatsApp-capable) first."""
    if not cell:
        return []
    found = []
    for m in PHONE_RE.findall(str(cell)):
        n = normalize(m)
        if n and n not in [x for x, _ in found]:
            found.append((n, n.startswith('03')))
    found.sort(key=lambda t: not t[1])
    return [n for n, _ in found]

def cat_for(fname):
    base = os.path.basename(fname).replace('.xlsx', '')
    for key, cat in CAT_MAP.items():
        if base.startswith(key):
            return cat
    return None

# The app's 420 real cities — the only city names we may publish.
with open('/tmp/ypdata/cities.txt', encoding='utf-8') as fh:
    KNOWN_CITIES = sorted({l.strip() for l in fh if l.strip()}, key=len, reverse=True)

def resolve_city(city_cell, address):
    """Find a real city in the city column, then in the address (longest match)."""
    for text in (city_cell or '', address or ''):
        low = ' ' + text.lower() + ' '
        for c in KNOWN_CITIES:
            if f' {c.lower()} ' in low or f' {c.lower()},' in low or f' {c.lower()}.' in low:
                return c
    return None

rows = []
for f in sorted(glob.glob('/tmp/ypdata/*.xlsx')):
    cat = cat_for(f)
    if not cat:
        print('NO CATEGORY MAPPING FOR', f)
        continue
    wb = openpyxl.load_workbook(f, read_only=True)
    ws = wb.active
    for r in ws.iter_rows(min_row=2, values_only=True):
        if not r or not r[0]:
            continue
        name = re.sub(r'\s+', ' ', str(r[0]).replace('\xa0', ' ')).strip()
        address = re.sub(r'\s+', ' ', str(r[1]).replace('\xa0', ' ')).strip() if len(r) > 1 and r[1] else ''
        city = re.sub(r'\s+', ' ', str(r[2]).replace('\xa0', ' ')).strip() if len(r) > 2 and r[2] else ''
        city = resolve_city(city, address) or ''
        if not city:
            continue
        phones = pick_phones(r[3] if len(r) > 3 else None)
        if not phones:
            continue
        email = ''
        if len(r) > 4 and r[4] and 'not-listed' not in str(r[4]).lower() and '@' in str(r[4]):
            email = str(r[4]).strip()
        rows.append({
            'name': name, 'category': cat, 'city': city, 'address': address,
            'phone': phones[0], 'email': email,
        })

with open('/tmp/ypdata/ypages.csv', 'w', newline='', encoding='utf-8') as fh:
    w = csv.DictWriter(fh, fieldnames=['name', 'category', 'city', 'address', 'phone', 'email'])
    w.writeheader()
    w.writerows(rows)

from collections import Counter
print('rows written:', len(rows))
print('by category:', dict(Counter(r['category'] for r in rows).most_common()))
print('mobiles:', sum(1 for r in rows if r['phone'].startswith('03')))
