"""Apply supplier stock to data/products.json.

Usage: python scripts/sync_stock.py odeis_cat_web_stocks.csv

Sets on each product:
  availability  "in" (shown), "out" (hidden), "preorder" (limited editions out of stock)
                or "order" (Orus out of our stock: still sold, supplier ships in 10-15 days).
                While data/stock/orus.json is valid, Orus ignores the FTP entirely:
                "in" if the spreadsheet has it, else hidden.
  restock       ISO date of the next delivery when known, else null
  sizes_in_stock  Jackie rings only: sizes currently available

Jackie Gold comes from data/stock/jackie.json (see jackie_stock.py); every
other brand from the supplier FTP CSV (latin-1, ';', no header):
ref;size;qty;incoming_qty;incoming_date. Quantities are never written out.
"""
import csv
import json
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PRODUCTS = ROOT / 'data' / 'products.json'
JACKIE = ROOT / 'data' / 'stock' / 'jackie.json'
ORUS = ROOT / 'data' / 'stock' / 'orus.json'
LAST_SYNC = ROOT / 'data' / 'stock' / 'last_sync.json'
MIN_ROWS = 500
JACKIE_SLUG = 'jackie-gold'
ORDER_SLUG = 'orus-bijoux'


def to_int(v):
    try:
        return int(float(str(v).replace(',', '.').strip() or 0))
    except ValueError:
        return 0


def to_iso(v):
    v = (v or '').strip()
    for fmt in ('%d/%m/%Y', '%Y-%m-%d', '%d/%m/%y'):
        try:
            return datetime.strptime(v, fmt).date().isoformat()
        except ValueError:
            pass
    return None


def read_csv(path):
    stock = defaultdict(lambda: {'qty': 0, 'restock': None})
    rows = 0
    with open(path, encoding='latin-1', newline='') as f:
        for row in csv.reader(f, delimiter=';'):
            if not row or not row[0].strip():
                continue
            rows += 1
            ref = row[0].strip().upper()
            entry = stock[ref]
            entry['qty'] += to_int(row[2] if len(row) > 2 else 0)
            incoming = to_int(row[3] if len(row) > 3 else 0)
            date = to_iso(row[4] if len(row) > 4 else '')
            if incoming > 0 and date and (entry['restock'] is None or date < entry['restock']):
                entry['restock'] = date
    return rows, stock


def is_limited(p):
    text = ' '.join([p.get('name', ''), p.get('name_en') or '', p.get('desc') or '', p.get('desc_en') or '',
                     json.dumps(p.get('specs') or {}, ensure_ascii=False)]).lower()
    return 'limit' in text


def main(csv_path):
    rows, stock = read_csv(csv_path)
    if rows < MIN_ROWS:
        sys.exit(f'Stock file has only {rows} rows (< {MIN_ROWS}); refusing to update the catalogue.')
    jackie = json.loads(JACKIE.read_text(encoding='utf-8'))['refs'] if JACKIE.exists() else {}
    jackie = {k.upper(): v for k, v in jackie.items()}
    orus = None  # None = no supplier list in force: every Orus item is sold on order
    if ORUS.exists():
        o = json.loads(ORUS.read_text(encoding='utf-8'))
        if datetime.now(timezone.utc).date().isoformat() < o['valid_until']:
            orus = {k.upper(): v for k, v in o['refs'].items()}

    products = json.loads(PRODUCTS.read_text(encoding='utf-8'))
    before = json.dumps(products, ensure_ascii=False, separators=(',', ':'))
    summary = defaultdict(lambda: defaultdict(int))
    for p in products:
        ref = p['ref'].strip().upper()
        sizes = None
        if p.get('brand_slug') == ORDER_SLUG and orus is not None:
            in_stock, restock = bool(orus.get(ref)), None
        elif p.get('brand_slug') == JACKIE_SLUG:
            j = jackie.get(ref)
            in_stock = bool(j and j['a'] == 'in')
            restock = j.get('restock') if j else None
            sizes = j.get('sizes') if j else None
        else:
            s = stock.get(ref)
            in_stock = bool(s and s['qty'] > 0)
            restock = s['restock'] if s else None
        if in_stock:
            state, restock = 'in', None
        else:
            if is_limited(p):
                state = 'preorder'
            elif p.get('brand_slug') == ORDER_SLUG and orus is None:
                state, restock = 'order', None
            else:
                state = 'out'
        p['availability'] = state
        p['restock'] = restock
        if sizes and state == 'in':
            p['sizes_in_stock'] = sizes
        else:
            p.pop('sizes_in_stock', None)
        summary[p['brand']][state] += 1

    after = json.dumps(products, ensure_ascii=False, separators=(',', ':'))
    if after != before:
        PRODUCTS.write_text(after, encoding='utf-8')
    LAST_SYNC.write_text(json.dumps({'at': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'), 'rows': rows}), encoding='utf-8')

    print(f'Stock rows read: {rows}. Catalogue {"updated" if after != before else "unchanged"}.')
    totals = defaultdict(int)
    for brand in sorted(summary):
        counts = summary[brand]
        for k, v in counts.items():
            totals[k] += v
        print(f'  {brand:<22} in={counts["in"]:<4} out={counts["out"]:<4} preorder={counts["preorder"]:<4} order={counts["order"]}')
    print(f'  {"TOTAL":<22} in={totals["in"]:<4} out={totals["out"]:<4} preorder={totals["preorder"]:<4} order={totals["order"]}')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
