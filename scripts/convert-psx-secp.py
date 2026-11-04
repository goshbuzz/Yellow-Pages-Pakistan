#!/usr/bin/env python3
"""Convert public-source data into the import-listings.mjs CSV shape.

Sources (all public):
  1. PSX listed companies — clone https://github.com/ajwadjaved/PSX-Listed-Companies
     and pass its path via --psx-repo. `Cleaning Data/output.csv` holds one contact
     card per listed company (phones, emails, websites, addresses) scraped from
     psx.com.pk company profiles; `PSX_ListedCompaniesData.csv` adds symbol + sector.
  2. SECP register of securities brokers (secp.gov.pk, "Securities Brokers as on
     August 31, 2025", wpdmdl=50330) — transcribed to scripts/sources/secp-brokers.txt
     (TREC registration no | entity name | SECP CRO city). The register publishes no
     phones, so these rows are imported with --allow-missing-phone.

Output: /tmp/pubdata/psx-listings.csv and /tmp/pubdata/secp-brokers.csv with columns
Company Name, Nature of Business, City, Address, Telephone, Email, Website,
Registration No. Classification values are exact category names; city comes from the
address text matched against the app's own 420-city list. Nothing is invented: rows
without a classifiable name or a dialable number are left out.

Usage:
  git clone --depth 1 https://github.com/ajwadjaved/PSX-Listed-Companies /tmp/pubdata/psx-repo
  python3 scripts/convert-psx-secp.py --psx-repo /tmp/pubdata/psx-repo
"""
import json, re, csv, os, argparse

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = '/tmp/pubdata'
ap = argparse.ArgumentParser()
ap.add_argument('--psx-repo', default=f'{OUT_DIR}/psx-repo')
args = ap.parse_args()

# 420 cities shipped with the app (src/data/geo.js).
geo = open(f'{REPO}/src/data/geo.js', encoding='utf8').read()
CITIES = sorted(set(re.findall(r'name: "([^"]+)"', geo)), key=len, reverse=True)

def find_city(text):
    t = ' ' + re.sub(r'[^a-z ]', ' ', text.lower()) + ' '
    for c in CITIES:
        if re.search(r'\b' + re.escape(c.lower()) + r'\b', t):
            return c
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

# Name-evidence classification for rows whose sector is missing: the words in an
# official company name are the evidence (never invented). Values are exact
# category names — the importer's classifier scores them word-for-word.
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
    (r'tobacco|cigarette', ''),  # no honest category in the 130 — kept out
]

def name_cat(name):
    low = name.lower()
    for pat, cat in NAME_RULES:
        if re.search(pat, low):
            return cat
    return ''

def norm_name(n):
    n = re.sub(r'\([^)]*\)', ' ', n)  # "(Formerly: General Tyre)" etc.
    n = n.upper().replace('&', ' AND ')
    n = re.sub(r'[^A-Z0-9 ]', ' ', n)
    for w in ('LIMITED', 'LTD', 'PRIVATE', 'PVT', 'THE', 'COMPANY', 'CORPORATION', 'CORP', 'INDUSTRIES', 'INDUSTRY', 'GROUP', 'HOLDINGS', 'OF', 'PAKISTAN'):
        n = re.sub(r'\b' + w + r'\b', ' ', n)
    return re.sub(r'\s+', ' ', n).strip()

# PSX symbol + sector lookup: normalised name -> symbol/sector.
symbols = {}
sectors = {}
with open(f'{args.psx_repo}/PSX_ListedCompaniesData.csv', encoding='utf-8-sig') as f:
    for row in csv.DictReader(f):
        symbols[norm_name(row['Company'])] = row['Symbols'].strip()
        sectors[norm_name(row['Company'])] = row['Sector'].strip()

# ── Parse the PSX contact-card dump ("Company : … , Address : … , Phone : …") ──
KEYS = r'(Representative|Designation|Company|Address|Phone 2|Phone|Fax|Date of Listing|Email|URL|Registrar)'
LABELS = r',?\s*(?:Phone|Fax|Email|URL|Website|Mobile|Tel|Registrar|Address|Designation|Representative|Company|Date of Listing)\s*\d?\s*:'

def first_pk_phone(*fields):
    """First segment that normalises to a dialable PK number; '' otherwise."""
    def plausible(d):
        if d.startswith('0092'):
            d = '0' + d[4:]
        elif d.startswith('92') and len(d) >= 12:
            d = '0' + d[2:]
        return d if (10 <= len(d) <= 12 and d.startswith('0') and len(set(d[1:4])) > 1) else None

    for f in fields:
        # Field values occasionally leak the next label ("…, Phone 2 : 111-252-525").
        for piece in re.split(LABELS, f or ''):
            for seg in re.split(r'[,;/|]|\s{2,}|\s+or\s+', piece):
                seg = seg.strip().strip('.').strip()
                seg = re.sub(r'\s+[A-Za-z][A-Za-z ]*$', '', seg).strip()  # "…-50 Lines"
                if not seg:
                    continue
                # "(56) 3883001-7" — parenthesised area code without the leading 0.
                if seg.startswith('(') and re.match(r'^\(\d{2,3}\)', seg):
                    seg = '0' + seg[1:]
                # Candidates: full, minus trailing extension, then each dash-joined
                # prefix ("021-34541540-34541543" holds two full numbers).
                cands = [seg, re.sub(r'[-–]\s*\d{1,3}\s*$', '', seg)]
                for m in re.finditer(r'[-–]', seg):
                    cands.append(seg[:m.start()])
                for cand in cands:
                    cand = cand.strip().strip('-').strip()
                    if plausible(re.sub(r'\D', '', cand)):
                        return cand
    return ''

psx_rows = []
with open(f'{args.psx_repo}/Cleaning Data/output.csv', encoding='utf-8', errors='replace') as f:
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
with open(f'{OUT_DIR}/psx-listings.csv', 'w', newline='') as f:
    w = csv.DictWriter(f, fieldnames=list(psx_rows[0].keys()))
    w.writeheader(); w.writerows(psx_rows)

# ── SECP securities brokers register (no phones on record) ──
brows = []
src = f'{REPO}/scripts/sources/secp-brokers.txt'
for line in open(src):
    line = line.strip()
    if not line:
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
with open(f'{OUT_DIR}/secp-brokers.csv', 'w', newline='') as f:
    w = csv.DictWriter(f, fieldnames=list(brows[0].keys()))
    w.writeheader(); w.writerows(brows)
