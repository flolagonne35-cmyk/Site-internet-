"""Turn the Orus supplier stock spreadsheet into data/stock/orus.json.

Usage: python scripts/orus_stock.py STOCK.xlsx YYYY-MM-DD [valid_until]

Expected sheet: column A = reference, column B = quantity (header on row 1).
Quantities are capped at 2 (0 = none, 1 = last piece, 2 = two or more).
Until valid_until (default: 1 January following the stock date), sync_stock.py
sells Orus items that are out of our own stock only if the supplier has them;
after that date it falls back to selling every Orus item on order.
Needs openpyxl.
"""
import json
import sys
from datetime import date
from pathlib import Path

import openpyxl

OUT = Path(__file__).resolve().parent.parent / 'data' / 'stock' / 'orus.json'
# Typos in the supplier file -> our reference
ALIASES = {'COD053LACKRH': 'COD053BLACKRH'}


def main(path, stock_date, valid_until=None):
    stock_date = date.fromisoformat(stock_date)
    valid_until = date.fromisoformat(valid_until) if valid_until else date(stock_date.year + 1, 1, 1)
    ws = openpyxl.load_workbook(path, read_only=True, data_only=True).worksheets[0]
    refs = {}
    for row in list(ws.iter_rows(values_only=True))[1:]:
        if not row or not row[0]:
            continue
        ref = str(row[0]).strip().upper()
        ref = ALIASES.get(ref, ref)
        try:
            qty = int(float(row[1] or 0))
        except (TypeError, ValueError):
            qty = 0
        refs[ref] = min(2, refs.get(ref, 0) + max(0, qty))
    if len(refs) < 100:
        sys.exit(f'Only {len(refs)} references read; refusing to write {OUT.name}.')
    OUT.write_text(json.dumps({'source_date': stock_date.isoformat(), 'valid_until': valid_until.isoformat(),
                               'refs': dict(sorted(refs.items()))}, ensure_ascii=False, separators=(',', ':')),
                   encoding='utf-8')
    print(f'{OUT.name}: {len(refs)} refs, {sum(1 for v in refs.values() if v)} available, {sum(1 for v in refs.values() if v == 1)} last pieces, valid until {valid_until}.')


if __name__ == '__main__':
    if len(sys.argv) not in (3, 4):
        sys.exit(__doc__)
    main(*sys.argv[1:])
