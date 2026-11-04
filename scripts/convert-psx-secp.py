#!/usr/bin/env python3
"""Convert public-source data into the import-listings.mjs CSV shape.

Sources (all public):
  1. PSX listed companies — clone https://github.com/ajwadjaved/PSX-Listed-Companies
     and pass its path via --psx-repo. `Cleaning Data/output.csv` holds one contact
     card per listed company (phones, emails, websites, addresses) scraped from
     psx.com.pk company profiles; `PSX_ListedCompaniesData.csv` adds symbol + sector.
     (Skipped automatically when --psx-repo is not present on disk.)
  2. SECP register of securities brokers (secp.gov.pk, "Securities Brokers as on
     August 31, 2025", wpdmdl=50330) — transcribed to scripts/sources/secp-brokers.txt
     (TREC registration no | entity name | SECP CRO city). The register publishes no
     phones, so these rows are imported with --allow-missing-phone.
  3. SECP register of Non-Banking Finance Companies & Securities/Futures Advisors
     (secp.gov.pk, "List for NBFCs and SFAs as on August 31, 2026", wpdmdl=67018) —
     transcribed to scripts/sources/secp-nbfcs.txt (281 license rows across 223
     entities, with published phones and registered addresses). Multi-license rows
     for the same entity are consolidated onto one canonical record.

Output: /tmp/pubdata/{psx-listings,secp-brokers,secp-nbfcs}.csv with columns
Company Name, Nature of Business, City, Address, Telephone, Email, Website,
Registration No. Classification values are exact category names; city comes from the
address text matched against the app's own 420-city list. Nothing is invented.

Usage:
  python3 scripts/convert-psx-secp.py
  python3 scripts/convert-psx-secp.py --psx-repo /tmp/pubdata/psx-repo
"""
import re, csv, os, argparse
from collections import Counter, defaultdict

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = '/tmp/pubdata'
os.makedirs(OUT_DIR, exist_ok=True)

ap = argparse.ArgumentParser()
ap.add_argument('--psx-repo', default=f'{OUT_DIR}/psx-repo')
args = ap.parse_args()

# 420 cities shipped with the app (src/data/geo.js) + their landline trunk codes.
geo = open(f'{REPO}/src/data/geo.js', encoding='utf8').read()
CITIES = sorted(set(re.findall(r'name: "([^"]+)"', geo)), key=len, reverse=True)
CITY_CODES = dict(re.findall(r'name: "([^"]+)".*?code: \'(\d+)\'', geo))

# Spelling variants in official registers vs GeoNames in src/data/geo.js.
CITY_ALIASES = {
    'sheikhupura': 'Shekhupura',
    'sheikupura': 'Shekhupura',
    'attock': 'Attock City',
}

# Unambiguous postal neighbourhoods/sectors for SECP rows that omit the city word.
UNAMBIGUOUS_DISTRICTS = [
    (r'\bpak\s+secretariat\b', 'Islamabad'),
    (r'\bconstitution\s+ave(?:nue)?\b.*\bf-5\b', 'Islamabad'),
    (r'\bstreet\s+\d+\s*,\s*f-7/2\b', 'Islamabad'),
    (r'\bjinnah\s+boulevard\s*,\s*dha-ii\b', 'Islamabad'),
    (r'\bsaddar\s+town\s+sindh\b', 'Karachi'),
    (r'\bbukhari\s+commercial\b', 'Karachi'),
    (r'\btauheed\s+commercial\b', 'Karachi'),
    (r'\bkch\s+society\b|\bk\.?c\.?h\.?s\.?u?\b', 'Karachi'),
    (r'\bdolmen\s+city\b.*\babdul\s+sattar\s+edhi\b', 'Karachi'),
    (r'\bclifton\b', 'Karachi'),
]


def find_city(text):
    """Resolve a Pakistani street address to one of the 420 known cities.

    Strips street/building phrases ('Multan Road', 'Shikarpur Road', 'Chamber of
    Commerce') before matching so a road or building named after another town
    never overrides the postal city at the end of the address.
    """
    if not text:
        return ''
    low = text.lower()
    stripped = re.sub(r'\b[a-z]+\s+(?:road|rd|bypass|highway|expressway)\b', ' ', low)
    stripped = re.sub(r'\bchamber\s+of\s+commerce\b', ' ', stripped)
    stripped = re.sub(r'\b[a-z]+\s+chambers?\b', ' ', stripped)
    padded = ' ' + re.sub(r'[^a-z ]', ' ', stripped) + ' '

    matches = []
    for c in CITIES:
        cl = c.lower()
        if cl == 'chamber':
            continue
        for m in re.finditer(r'\b' + re.escape(cl) + r'\b', padded):
            matches.append((m.end(), len(cl), c))
    for alias, canon in CITY_ALIASES.items():
        if canon in CITIES:
            for m in re.finditer(r'\b' + re.escape(alias) + r'\b', padded):
                matches.append((m.end(), len(alias), canon))
    if matches:
        matches.sort(key=lambda x: (x[0], x[1]))
        return matches[-1][2]

    for pat, canon in UNAMBIGUOUS_DISTRICTS:
        if re.search(pat, low):
            return canon
    return ''


# PSX sector → exact category name.
SECTOR_CAT = {
    'Automobile assembler': 'Car Dealers & Showrooms',
    'Automobile parts & accessories': 'Auto Parts & Accessories',
    'Cable & electrical goods': 'Electrical Equipment & Cables',
    'Cement': 'Cement & Building Materials',
    'Chemical': 'Chemicals & Plastics',
    'Commercial banks': 'Banks & Islamic Banking',
    'Engineering': 'Engineering & Machinery',
    'Fertilizer': 'Fertilizer & Agri Inputs',
    'Food & personal care products': 'Food & Beverage Manufacturing',
    'Glass & ceramics': 'Glass & Ceramics',
    'Insurance': 'Insurance & Takaful',
    'Inv. banks / inv. cos. / securities cos.': 'Financial & Investment Services',
    'Leather & tanneries': 'Leather & Footwear Mfg.',
    'Miscellaneous': '',
    'Modarabas': 'Financial & Investment Services',
    'Oil & gas marketing companies': 'Oil, Gas & Energy',
    'Oil & gas exploration companies': 'Oil, Gas & Energy',
    'Paper & board': 'Paper & Packaging',
    'Pharmaceuticals': 'Pharmaceuticals & Medicine',
    'Power generation & distribution': 'Oil, Gas & Energy',
    'Real estate investment trust': 'Financial & Investment Services',
    'Refinery': 'Oil, Gas & Energy',
    'Sugar & allied industries': 'Food & Beverage Manufacturing',
    'Technology & communication': 'Software Houses & IT Services',
    'Textile composite': 'Textile Mills & Fabrics',
    'Textile spinning': 'Textile Mills & Fabrics',
    'Transport': 'Logistics & Freight Forwarding',
    'Woollen': 'Textile Mills & Fabrics',
}

NAME_RULES = [
    (r'cotton|weaving|spinning|textile|yarn|fabric|hosiery|knitting|polyester|woollen|jute', 'Textile Mills & Fabrics'),
    (r'sugar|foods|dairy|flour|ghee|vanaspati|oil mills|feed\b', 'Food & Beverage Manufacturing'),
    (r'paper|board|packaging', 'Paper & Packaging'),
    (r'cement|concrete', 'Cement & Building Materials'),
    (r'pvc|resins?|synthetic', 'Chemicals & Plastics'),
    (r'steel|alloys|foundry|casting|metallurg', 'Steel & Metal Works'),
    (r'fertilizer|pesticide', 'Fertilizer & Agri Inputs'),
    (r'pharma|laborator|medical|drug', 'Pharmaceuticals & Medicine'),
    (r'automobile|motors?|tractors|cars?|auto(?!n)|wheels?', 'Car Dealers & Showrooms'),
    (r'cables|electrical|batter(y|ies)|transformer|switchgear|elektron', 'Electrical Equipment & Cables'),
    (r'glass|ceramic', 'Glass & Ceramics'),
    (r'leather|tanner|footwear|shoes', 'Leather & Footwear Mfg.'),
    (r'oilfield|petroleum|refinery|exploration|energy|gas|solar|power', 'Oil, Gas & Energy'),
    (r'insurance|takaful', 'Insurance & Takaful'),
    (r'bank|banking', 'Banks & Islamic Banking'),
    (r'modaraba|investment|securities|capital|leasing|finance|asset|equity|fund|mutual|stock|trust', 'Financial & Investment Services'),
    (r'telecom|technolog|software|digital|systems|network|computer|information|communication', 'Software Houses & IT Services'),
    (r'transport|logistics|shipping|cargo|courier|aviation|airlines', 'Logistics & Freight Forwarding'),
    (r'engineering|machinery|machine', 'Engineering & Machinery'),
    (r'chemical|plastic|paint', 'Chemicals & Plastics'),
    (r'construction|builders|developers|housing', 'Construction Companies'),
    (r'surgical|instrument', 'Surgical Instruments Mfg.'),
    (r'sports|bicycle|cycle', 'Sports Goods Manufacturing'),
    (r'printing|publishing|printers', 'Printing & Publishing'),
    (r'furniture|foam|cushion', 'Furniture Manufacturing'),
    (r'hotel|tourism|travel', 'Hotels, Guest Houses & Resorts'),
    (r'education|school|college|university|academy', 'Schools & Academies'),
    (r'tobacco|cigarette', ''),
]


def name_cat(name):
    low = name.lower()
    for pat, cat in NAME_RULES:
        if re.search(pat, low):
            return cat
    return ''


def norm_name(n):
    n = re.sub(r'\([^)]*\)', ' ', n)
    n = n.upper().replace('&', ' AND ')
    n = re.sub(r'[^A-Z0-9 ]', ' ', n)
    for w in ('LIMITED', 'LTD', 'PRIVATE', 'PVT', 'THE', 'COMPANY', 'CORPORATION', 'CORP', 'INDUSTRIES', 'INDUSTRY', 'GROUP', 'HOLDINGS', 'OF', 'PAKISTAN'):
        n = re.sub(r'\b' + w + r'\b', ' ', n)
    return re.sub(r'\s+', ' ', n).strip()


FIELDNAMES = ['Company Name', 'Nature of Business', 'City', 'Address', 'Telephone', 'Email', 'Website', 'Registration No']

# ── 1. PSX listed companies (when --psx-repo is present) ────────────────────
psx_csv = f'{args.psx_repo}/PSX_ListedCompaniesData.csv'
psx_cards = f'{args.psx_repo}/Cleaning Data/output.csv'
if os.path.isfile(psx_csv) and os.path.isfile(psx_cards):
    symbols = {}
    sectors = {}
    with open(psx_csv, encoding='utf-8-sig') as f:
        for row in csv.DictReader(f):
            symbols[norm_name(row['Company'])] = row['Symbols'].strip()
            sectors[norm_name(row['Company'])] = row['Sector'].strip()

    KEYS = r'(Representative|Designation|Company|Address|Phone 2|Phone|Fax|Date of Listing|Email|URL|Registrar)'
    LABELS = r',?\s*(?:Phone|Fax|Email|URL|Website|Mobile|Tel|Registrar|Address|Designation|Representative|Company|Date of Listing)\s*\d?\s*:'

    def first_pk_phone(*fields):
        def plausible(d):
            if d.startswith('0092'):
                d = '0' + d[4:]
            elif d.startswith('92') and len(d) >= 12:
                d = '0' + d[2:]
            return d if (10 <= len(d) <= 12 and d.startswith('0') and len(set(d[1:4])) > 1) else None

        for f in fields:
            for piece in re.split(LABELS, f or ''):
                for seg in re.split(r'[,;/|]|\s{2,}|\s+or\s+', piece):
                    seg = seg.strip().strip('.').strip()
                    seg = re.sub(r'\s+[A-Za-z][A-Za-z ]*$', '', seg).strip()
                    if not seg:
                        continue
                    if seg.startswith('(') and re.match(r'^\(\d{2,3}\)', seg):
                        seg = '0' + seg[1:]
                    cands = [seg, re.sub(r'[-–]\s*\d{1,3}\s*$', '', seg)]
                    for m in re.finditer(r'[-–]', seg):
                        cands.append(seg[:m.start()])
                    for cand in cands:
                        cand = cand.strip().strip('-').strip()
                        if plausible(re.sub(r'\D', '', cand)):
                            return cand
        return ''

    psx_rows = []
    with open(psx_cards, encoding='utf-8', errors='replace') as f:
        for line in f:
            line = line.strip().rstrip(',')
            if 'Company' not in line:
                continue
            parts = re.split(r'(?:^|\s),\s*' + KEYS + r'\s*:', line)
            d = {}
            for i in range(1, len(parts) - 1, 2):
                d[parts[i].strip()] = parts[i + 1].strip().strip(',').strip()
            comp = d.get('Company', '')
            if not comp:
                continue
            addr = re.sub(r'\s+', ' ', d.get('Address', '')).strip(' ,')
            site = (d.get('URL', '') or '').strip()
            if site and not site.startswith('http'):
                site = 'https://' + site
            sector = sectors.get(norm_name(comp), '')
            psx_rows.append({
                'Company Name': comp,
                'Nature of Business': SECTOR_CAT.get(sector, '') or name_cat(comp),
                'City': find_city(addr),
                'Address': addr,
                'Telephone': first_pk_phone(d.get('Phone', ''), d.get('Phone 2', '')),
                'Email': (d.get('Email', '') or '').strip(),
                'Website': site,
                'Registration No': symbols.get(norm_name(comp), ''),
            })

    print(f'PSX rows: {len(psx_rows)} | with city: {sum(1 for r in psx_rows if r["City"])} | with phone: {sum(1 for r in psx_rows if r["Telephone"])} | with symbol: {sum(1 for r in psx_rows if r["Registration No"])}')
    with open(f'{OUT_DIR}/psx-listings.csv', 'w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=FIELDNAMES)
        w.writeheader()
        w.writerows(psx_rows)
else:
    print(f'PSX repo not found at {args.psx_repo} — skipping psx-listings.csv (pass --psx-repo to rebuild)')

# ── 2. SECP securities brokers register (no phones on record) ───────────────
brows = []
for line in open(f'{REPO}/scripts/sources/secp-brokers.txt', encoding='utf8'):
    line = line.strip()
    if not line or line.startswith('#'):
        continue
    trec, name, city = line.split('|')
    brows.append({
        'Company Name': name,
        'Nature of Business': 'Stock Brokers & Securities',
        'City': city,
        'Address': f'{city}, Pakistan',
        'Telephone': '',
        'Email': '',
        'Website': '',
        'Registration No': trec,
    })
print(f'SECP broker rows: {len(brows)}')
with open(f'{OUT_DIR}/secp-brokers.csv', 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=FIELDNAMES)
    w.writeheader()
    w.writerows(brows)


# ── 3. SECP NBFCs & Securities/Futures Advisors register ────────────────────
# Major trunk codes we can cross-check against a resolved city so spreadsheet
# typos (e.g. Sialkot 052 on a Lahore address, or Karachi 021 on Mithi/Islamabad)
# are dropped rather than published as wrong numbers.
MAJOR_TRUNK_CODES = {'21': 'Karachi', '42': 'Lahore', '52': 'Sialkot'}


def parse_secp_phones(raw, city=''):
    """Extract clean, dialable PK numbers from an SECP contact cell; mobiles first."""
    if not raw or raw.strip() in ('-', ''):
        return []
    s = raw.strip()
    if re.fullmatch(r'\d{1,2}/\d{1,2}/\d{2,4}', s):  # date pasted into phone cell
        return []
    s = re.sub(r'\.0+$', '', s)  # Excel float formatting ('923343077630.00')
    if re.fullmatch(r'021\d{8}3\d{8}', s):  # two numbers concatenated without delimiter
        s = s[:11]

    # Split multi-number cells ('042 35755165 0321 442 2222', '0518442252 03008527567').
    tokens = re.findall(
        r'\+?92[-\s]?\d{2,3}[-\s]?\d{6,8}(?:-\d{1,3})?'
        r'|0\d{2}-111-\d{3}-\d{3}'
        r'|0?3\d{2}[-\s]?\d{3}[-\s]?\d{4}'
        r'|0?3\d{9}'
        r'|0\d{2,3}[-\s]?\d{6,8}',
        s,
    )
    if not tokens:
        tokens = [s]

    out = []
    for tok in tokens:
        if re.match(r'^92-\d{2}-\d{7,8}-\d{1,3}$', tok):
            tok = tok.rsplit('-', 1)[0]
        d = re.sub(r'\D', '', tok)
        if d.startswith('0092'):
            d = d[4:]
        elif d.startswith('92') and len(d) >= 11:
            d = d[2:]
        if d.startswith('0'):
            d = d[1:]

        sub = d[-7:]
        if not sub or sub in ('1234567', '0000000', '9000000') or len(set(sub)) == 1:
            continue

        if re.fullmatch(r'3\d{9}', d):
            out.append((f'0{d[:3]}-{d[3:]}', True))
        elif re.fullmatch(r'21111\d{6}', d):
            if city and city != 'Karachi':
                continue
            out.append((f'021-111-{d[5:8]}-{d[8:]}', False))
        elif 9 <= len(d) <= 11 and d[0] != '0':
            trunk2 = d[:2]
            if trunk2 in MAJOR_TRUNK_CODES and city and city != MAJOR_TRUNK_CODES[trunk2]:
                continue
            if trunk2 in ('21', '42', '51'):
                fmt = f'0{d[:2]}-{d[2:]}'
            else:
                fmt = f'0{d[:3]}-{d[3:]}'
            out.append((fmt, False))

    seen = []
    for fmt, _ in sorted(out, key=lambda x: not x[1]):
        if fmt not in seen:
            seen.append(fmt)
    return seen


def norm_nbfc_entity(n):
    u = re.sub(r'\s+', ' ', n.strip()).upper().replace('&', ' AND ')
    u = re.sub(r'\bSMC[\s-]*PRIVATE\b|\bSMC[\s-]*PVT\b', 'SMC PVT', u)
    u = re.sub(r'\bPRIVATE\b', 'PVT', u)
    u = re.sub(r'\bLIMITED\b|\bLIMITE\b', 'LTD', u)
    u = re.sub(r'\bCOMPANY\b', 'CO', u)
    u = re.sub(r'[^A-Z0-9 ]', ' ', u)
    u = re.sub(r'\b(PVT|LTD|CO|THE)\b', ' ', u)
    u = re.sub(r'\bINVESTMENTS\b', 'INVESTMENT', u)
    u = re.sub(r'\bADVISORS\b', 'ADVISOR', u)
    u = re.sub(r'\bMANAGERS\b', 'MANAGER', u)
    return re.sub(r'\s+', ' ', u).strip()


def nbfc_category(name, activity_types, activity_cats):
    low = name.lower()
    if re.search(r'\b(insurance|takaful|assurance)\b', low):
        return 'Insurance & Takaful'
    if re.search(r'\bbank\b', low) and 'investment bank' not in low:
        return 'Banks & Islamic Banking'
    if activity_types == {'SA & FA'}:
        return 'Stock Brokers & Securities'
    return 'Financial & Investment Services'


nbfc_groups = defaultdict(list)
nbfc_order = []
for line in open(f'{REPO}/scripts/sources/secp-nbfcs.txt', encoding='utf8'):
    line = line.replace('\r', '').rstrip('\n')
    if not line or line.startswith('#'):
        continue
    sno, name, atype, acat, rdate, lrdate, raw_phone, addr = line.split('|')
    key = norm_nbfc_entity(name)
    if key not in nbfc_groups:
        nbfc_order.append(key)
    nbfc_groups[key].append({
        'sno': int(sno),
        'name': name.strip(),
        'atype': atype.strip(),
        'acat': acat.strip(),
        'raw_phone': raw_phone.strip(),
        'addr': re.sub(r'\s+', ' ', addr).strip(' ,'),
    })

nbfc_rows = []
for key in nbfc_order:
    grp = nbfc_groups[key]
    # Prefer mixed-case legal names over ALL-CAPS entries when an entity holds multiple licenses.
    names = [g['name'] for g in grp]
    best_name = sorted(names, key=lambda s: (s.isupper(), -len(s)))[0]
    if best_name.endswith(' LIMITE'):
        best_name += 'D'

    # Majority city across the entity's license rows (guards against single-row copy/paste glitches).
    row_cities = [find_city(g['addr']) for g in grp]
    valid_cities = [c for c in row_cities if c]
    city = Counter(valid_cities).most_common(1)[0][0] if valid_cities else ''

    # Pick phones + address from rows matching the resolved city first.
    aligned = [g for g, c in zip(grp, row_cities) if c == city] if city else grp
    phones = []
    for g in aligned + grp:
        for p in parse_secp_phones(g['raw_phone'], city):
            if p not in phones:
                phones.append(p)
    phones.sort(key=lambda p: not p.startswith('03'))

    addrs = [g['addr'] for g in aligned if g['addr']] or [g['addr'] for g in grp if g['addr']]
    addrs.sort(key=lambda a: a.isupper())
    best_addr = addrs[0] if addrs else (f'{city}, Pakistan' if city else '')

    cat = nbfc_category(
        best_name,
        {g['atype'] for g in grp},
        {g['acat'] for g in grp},
    )
    nbfc_rows.append({
        'Company Name': best_name,
        'Nature of Business': cat,
        'City': city,
        'Address': best_addr,
        'Telephone': phones[0] if phones else '',
        'Email': '',
        'Website': '',
        'Registration No': '',
    })

with_city = sum(1 for r in nbfc_rows if r['City'])
with_phone = sum(1 for r in nbfc_rows if r['Telephone'])
with_mob = sum(1 for r in nbfc_rows if r['Telephone'].startswith('03'))
print(f'SECP NBFC/SFA entities: {len(nbfc_rows)} (from {sum(len(v) for v in nbfc_groups.values())} license rows) | with city: {with_city} | with phone: {with_phone} (mobiles: {with_mob})')
with open(f'{OUT_DIR}/secp-nbfcs.csv', 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=FIELDNAMES)
    w.writeheader()
    w.writerows(nbfc_rows)
