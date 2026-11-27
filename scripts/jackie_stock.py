"""Convert the Jackie Gold stock Excel (sent by hand) into data/stock/jackie.json.

Usage: python scripts/jackie_stock.py JACKIE_STOCKS_dd-mm-yyyy.xls
Needs xlrd. Only availability, restock dates and in-stock sizes are written —
never quantities, since the repository is public.
"""
import json
import re
import sys
from collections import defaultdict
from pathlib import Path

import xlrd

OUT = Path(__file__).resolve().parent.parent / 'data' / 'stock' / 'jackie.json'


def size_label(raw):
    raw = str(raw).strip()
    if not raw or raw.upper() == 'STUKS':
        return None
    try:
        f = float(raw)
        return str(int(f)) if f.is_integer() else str(f)
    except ValueError:
        return raw


def main(path):
    book = xlrd.open_workbook(path)
    sheet = book.sheet_by_index(0)
    header = [str(c.value).strip().upper() for c in sheet.row(0)]
    col = {name: header.index(name) for name in ('REF', 'TAILLE', 'STOCKS')}
    date_col = next((i for i, h in enumerate(header) if h.startswith('DATE')), None)

    qty = defaultdict(float)
    sizes = defaultdict(list)
    restock = {}
    for r in range(1, sheet.nrows):
        row = sheet.row(r)
        ref = str(row[col['REF']].value).strip()
        if not ref:
            continue
        try:
            q = float(row[col['STOCKS']].value or 0)
        except ValueError:
            q = 0.0
        qty[ref] += q
        size = size_label(row[col['TAILLE']].value)
        if size and q > 0:
            sizes[ref].append(size)
        if date_col is not None:
            cell = row[date_col]
            if cell.ctype in (xlrd.XL_CELL_NUMBER, xlrd.XL_CELL_DATE) and cell.value:
                d = xlrd.xldate_as_datetime(cell.value, book.datemode).date().isoformat()
                if ref not in restock or d < restock[ref]:
                    restock[ref] = d

    refs = {}
    for ref, q in sorted(qty.items()):
        entry = {'a': 'in' if q > 0 else 'out', 'restock': None if q > 0 else restock.get(ref)}
        if q == 1:
            entry['last'] = True  # only one piece left (all sizes together)
        if sizes.get(ref):
            entry['sizes'] = sorted(set(sizes[ref]), key=lambda s: float(s) if re.fullmatch(r'[\d.]+', s) else 0)
        refs[ref] = entry

    m = re.search(r'(\d{2})-(\d{2})-(\d{4})', Path(path).name)
    source_date = f'{m.group(3)}-{m.group(2)}-{m.group(1)}' if m else None
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({'source_date': source_date, 'refs': refs}, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    n_in = sum(1 for e in refs.values() if e['a'] == 'in')
    print(f'{OUT}: {len(refs)} refs, {n_in} in stock, {len(refs) - n_in} out (source {source_date})')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
