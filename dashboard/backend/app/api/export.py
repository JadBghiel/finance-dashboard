"""
export endpoints - download db as sql, csv, or pdf
"""
import os
import csv
import io
from datetime import datetime
from decimal import Decimal
from typing import Dict, List

from fastapi import APIRouter, Depends, Response
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from app.core.database import get_db

router = APIRouter()

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "finance.db"))


def _ident(name: str) -> str:
    return '"' + name.replace('"', '""') + '"'


def _to_float(value) -> float:
    if value is None:
        return 0.0
    return float(value)


def _sql_literal(value) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, (int, float, Decimal)):
        return str(value)
    if isinstance(value, datetime):
        return "'" + value.isoformat(sep=" ") + "'"
    if isinstance(value, bytes):
        return "X'" + value.hex() + "'"
    return "'" + str(value).replace("'", "''") + "'"


def _load_table_names(db: Session) -> List[str]:
    table_names = inspect(db.bind).get_table_names()  # type: ignore[arg-type]
    skip = {"alembic_version", "sqlite_sequence"}
    return [t for t in table_names if t not in skip and not t.startswith("sqlite_") and not t.startswith("alembic_")]


def _month_key(value) -> str:
    if value is None:
        return "n/a"
    s = str(value)
    return s[:7] if len(s) >= 7 else s

@router.get("/export/sql")
def export_sql(db: Session = Depends(get_db)):
    """export all tables as a sql script (works for sqlite and postgres)."""
    tables = _load_table_names(db)
    if not tables:
        return Response(content="no tables found", status_code=404)

    lines = [
        f"-- personal finance export ({datetime.now().isoformat()})",
        "-- generated from current database",
        "",
    ]

    for table in tables:
        table_ident = _ident(table)
        cols = [c["name"] for c in inspect(db.bind).get_columns(table)]  # type: ignore[arg-type]
        col_list = ", ".join(_ident(c) for c in cols)
        lines.append(f"-- table: {table}")
        result = db.execute(text(f"SELECT * FROM {table_ident}"))
        rows = result.mappings().all()
        if not rows:
            lines.append(f"-- no rows in {table}")
            lines.append("")
            continue
        for row in rows:
            values = ", ".join(_sql_literal(row.get(c)) for c in cols)
            lines.append(f"INSERT INTO {table_ident} ({col_list}) VALUES ({values});")
        lines.append("")

    content = "\n".join(lines)
    return Response(
        content=content,
        media_type="application/sql",
        headers={"Content-Disposition": f"attachment; filename=finance_{datetime.now().strftime('%Y%m%d')}.sql"},
    )

@router.get("/export/csv")
def export_csv(db: Session = Depends(get_db)):
    """export all tables as a single csv (concatenated with headers)."""
    tables = _load_table_names(db)
    if not tables:
        return Response(content="no tables found", status_code=404)

    output = io.StringIO()

    for table in tables:
        output.write(f"\n# === {table} ===\n")
        table_ident = _ident(table)
        result = db.execute(text(f"SELECT * FROM {table_ident}"))
        rows = result.mappings().all()
        if rows:
            columns = list(rows[0].keys())
            writer = csv.writer(output)
            writer.writerow(columns)
            for row in rows:
                writer.writerow([row[col] for col in columns])
        output.write("\n")

    content = output.getvalue()
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=finance_{datetime.now().strftime('%Y%m%d')}.csv"},
    )

@router.get("/export/pdf")
def export_pdf(db: Session = Depends(get_db)):
    """export a complete pdf report with all financial data (sqlite/postgres)."""
    # build text content
    lines = []
    lines.append("=" * 60)
    lines.append("        PERSONAL FINANCE REPORT")
    lines.append(f"        Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    lines.append("=" * 60)
    lines.append("")
    
    #  SUMMARY SECTION 
    lines.append("-" * 60)
    lines.append("SUMMARY")
    lines.append("-" * 60)
    
    row = db.execute(text("SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total FROM incomes")).mappings().first() or {"cnt": 0, "total": 0}
    total_income = _to_float(row["total"])
    lines.append(f"  Total Income:     {row['cnt']:>6} entries   ${total_income:>12,.2f}")
    
    row = db.execute(text("SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total FROM expenses")).mappings().first() or {"cnt": 0, "total": 0}
    total_expense = _to_float(row["total"])
    lines.append(f"  Total Expenses:   {row['cnt']:>6} entries   ${total_expense:>12,.2f}")
    
    net = total_income - total_expense
    lines.append(f"  Net Balance:                       ${net:>12,.2f}")
    lines.append("")
    
    row = db.execute(text("SELECT COUNT(*) as cnt FROM accounts")).mappings().first() or {"cnt": 0}
    lines.append(f"  Accounts:         {row['cnt']:>6}")
    
    row = db.execute(text("SELECT COUNT(*) as cnt FROM categories")).mappings().first() or {"cnt": 0}
    lines.append(f"  Categories:       {row['cnt']:>6}")
    
    # investments summary
    try:
        row = db.execute(text("SELECT COUNT(*) as cnt, COALESCE(SUM(quantity * COALESCE(current_price, purchase_price)), 0) as total FROM investments")).mappings().first() or {"cnt": 0, "total": 0}
        lines.append(f"  Investments:      {row['cnt']:>6} positions ${_to_float(row['total']):>12,.2f}")
    except Exception:
        pass
    
    try:
        row = db.execute(text("SELECT COUNT(*) as cnt FROM watchlist")).mappings().first() or {"cnt": 0}
        lines.append(f"  Watchlist:        {row['cnt']:>6} items")
    except Exception:
        pass
    
    lines.append("")
    
    #  ACCOUNTS SECTION 
    lines.append("-" * 60)
    lines.append("ACCOUNTS")
    lines.append("-" * 60)
    accounts = db.execute(text("SELECT id, name, emoji FROM accounts ORDER BY name")).mappings().all()
    for acc in accounts:
        emoji = acc["emoji"] or ""
        lines.append(f"  {emoji} {acc['name']}")
        # get account balance
        inc_row = db.execute(text("SELECT COALESCE(SUM(amount), 0) as inc FROM incomes WHERE account_id = :aid"), {"aid": acc["id"]}).mappings().first() or {"inc": 0}
        exp_row = db.execute(text("SELECT COALESCE(SUM(amount), 0) as exp FROM expenses WHERE account_id = :aid"), {"aid": acc["id"]}).mappings().first() or {"exp": 0}
        inc = _to_float(inc_row["inc"])
        exp = _to_float(exp_row["exp"])
        balance = inc - exp
        lines.append(f"      Income: ${inc:,.2f}  |  Expenses: ${exp:,.2f}  |  Balance: ${balance:,.2f}")
    lines.append("")
    
    #  CATEGORIES SECTION 
    lines.append("-" * 60)
    lines.append("CATEGORIES (with totals)")
    lines.append("-" * 60)
    categories = db.execute(text("SELECT id, name FROM categories ORDER BY name")).mappings().all()
    for cat in categories:
        total_row = db.execute(text("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE category_id = :cid"), {"cid": cat["id"]}).mappings().first() or {"total": 0}
        total = _to_float(total_row["total"])
        if total > 0:
            lines.append(f"  {cat['name']:<30} ${total:>12,.2f}")
    lines.append("")
    
    #  INCOME BREAKDOWN BY MONTH 
    lines.append("-" * 60)
    lines.append("INCOME BY MONTH")
    lines.append("-" * 60)
    income_rows = db.execute(text("SELECT date, amount FROM incomes WHERE date IS NOT NULL")).mappings().all()
    income_by_month: Dict[str, Dict[str, float]] = {}
    for row in income_rows:
        month = _month_key(row["date"])
        bucket = income_by_month.setdefault(month, {"total": 0.0, "cnt": 0.0})
        bucket["total"] += _to_float(row["amount"])
        bucket["cnt"] += 1
    for month in sorted(income_by_month.keys(), reverse=True)[:12]:
        bucket = income_by_month[month]
        lines.append(f"  {month}:  {int(bucket['cnt']):>4} entries   ${bucket['total']:>12,.2f}")
    lines.append("")
    
    #  EXPENSE BREAKDOWN BY MONTH 
    lines.append("-" * 60)
    lines.append("EXPENSES BY MONTH")
    lines.append("-" * 60)
    expense_rows = db.execute(text("SELECT date, amount FROM expenses WHERE date IS NOT NULL")).mappings().all()
    expense_by_month: Dict[str, Dict[str, float]] = {}
    for row in expense_rows:
        month = _month_key(row["date"])
        bucket = expense_by_month.setdefault(month, {"total": 0.0, "cnt": 0.0})
        bucket["total"] += _to_float(row["amount"])
        bucket["cnt"] += 1
    for month in sorted(expense_by_month.keys(), reverse=True)[:12]:
        bucket = expense_by_month[month]
        lines.append(f"  {month}:  {int(bucket['cnt']):>4} entries   ${bucket['total']:>12,.2f}")
    lines.append("")
    
    #  INVESTMENTS SECTION 
    try:
        lines.append("-" * 60)
        lines.append("INVESTMENT POSITIONS")
        lines.append("-" * 60)
        investments = db.execute(text("""
            SELECT symbol, name, "type", quantity, purchase_price, current_price, currency
            FROM investments
            ORDER BY "type", symbol
        """)).mappings().all()
        if investments:
            for inv in investments:
                qty = _to_float(inv["quantity"])
                purchase = _to_float(inv["purchase_price"])
                current = _to_float(inv["current_price"]) or purchase
                value = qty * current
                cost = qty * purchase
                pnl = value - cost
                pnl_pct = (pnl / cost * 100) if cost > 0 else 0
                sign = '+' if pnl >= 0 else ''
                lines.append(f"  {inv['symbol']:<8} {inv['type']:<12} {qty:>10.2f} shares")
                lines.append(f"           Buy: ${purchase:>10.2f}  |  Now: ${current:>10.2f}  |  Value: ${value:>12,.2f}")
                lines.append(f"           P&L: {sign}${pnl:>10,.2f} ({sign}{pnl_pct:.2f}%)")
                lines.append("")
        else:
            lines.append("  No investment positions")
        lines.append("")
    except Exception:
        pass
    
    #  WATCHLIST SECTION 
    try:
        lines.append("-" * 60)
        lines.append("WATCHLIST")
        lines.append("-" * 60)
        watchlist = db.execute(text("SELECT symbol, name, ""type"", target_price, notes FROM watchlist ORDER BY symbol")).mappings().all()
        if watchlist:
            for w in watchlist:
                target = f"target: ${_to_float(w['target_price']):,.2f}" if w['target_price'] is not None else "no target"
                lines.append(f"  {w['symbol']:<8} {w['type']:<12} {target}")
                if w['notes']:
                    lines.append(f"           Note: {str(w['notes'])[:50]}")
        else:
            lines.append("  No watchlist items")
        lines.append("")
    except Exception:
        pass
    
    #  RECENT TRANSACTIONS 
    lines.append("-" * 60)
    lines.append("RECENT INCOME (last 20)")
    lines.append("-" * 60)
    income_recent = db.execute(text("""
        SELECT i.date, i.amount, i.currency, i.description, a.name as account_name
        FROM incomes i
        LEFT JOIN accounts a ON i.account_id = a.id
        ORDER BY i.date DESC LIMIT 20
    """)).mappings().all()
    for row in income_recent:
        date_str = str(row['date'])[:10] if row['date'] else 'n/a'
        desc = (row['description'] or '')[:35]
        acc = (row['account_name'] or 'n/a')[:15]
        lines.append(f"  {date_str}  ${_to_float(row['amount']):>10,.2f} {row['currency']}  {acc:<15}  {desc}")
    lines.append("")
    
    lines.append("-" * 60)
    lines.append("RECENT EXPENSES (last 20)")
    lines.append("-" * 60)
    expense_recent = db.execute(text("""
        SELECT e.date, e.amount, e.currency, e.description, a.name as account_name, c.name as category_name
        FROM expenses e
        LEFT JOIN accounts a ON e.account_id = a.id
        LEFT JOIN categories c ON e.category_id = c.id
        ORDER BY e.date DESC LIMIT 20
    """)).mappings().all()
    for row in expense_recent:
        date_str = str(row['date'])[:10] if row['date'] else 'n/a'
        desc = (row['description'] or '')[:25]
        acc = (row['account_name'] or 'n/a')[:12]
        cat = (row['category_name'] or 'n/a')[:12]
        lines.append(f"  {date_str}  ${_to_float(row['amount']):>10,.2f}  {acc:<12}  {cat:<12}  {desc}")
    lines.append("")
    
    lines.append("=" * 60)
    lines.append("        END OF REPORT")
    lines.append("=" * 60)
    
    # create pdf
    text_content = "\n".join(lines)
    pdf_content = _create_simple_pdf(text_content)
    
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=finance_{datetime.now().strftime('%Y%m%d')}.pdf"},
    )

def _create_simple_pdf(text: str) -> bytes:
    """create a minimal valid pdf from text with multi-page support"""
    lines = text.split("\n")
    
    # split into pages (about 50 lines per page)
    lines_per_page = 50
    pages = []
    for i in range(0, len(lines), lines_per_page):
        pages.append(lines[i:i + lines_per_page])
    
    if not pages:
        pages = [[]]
    
    # build content streams for each page
    content_objects = []
    for page_lines in pages:
        y = 750
        content_lines = ["BT", "/F1 9 Tf"]
        for line in page_lines:
            if y < 40:
                break
            # escape special chars for pdf
            safe_line = line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
            content_lines.append(f"1 0 0 1 40 {y} Tm")
            content_lines.append(f"({safe_line}) Tj")
            y -= 14
        content_lines.append("ET")
        stream = "\n".join(content_lines)
        content_objects.append(stream.encode("latin-1", errors="replace"))
    
    # build pdf structure
    objects = []
    obj_num = 1
    
    # catalog (obj 1)
    objects.append(f"{obj_num} 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n".encode())
    obj_num += 1
    
    # pages parent (obj 2) - will reference page objects starting at obj 4
    page_refs = " ".join([f"{4 + i*2} 0 R" for i in range(len(pages))])
    objects.append(f"{obj_num} 0 obj\n<< /Type /Pages /Kids [{page_refs}] /Count {len(pages)} >>\nendobj\n".encode())
    obj_num += 1
    
    # font (obj 3)
    objects.append(f"{obj_num} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n".encode())
    obj_num += 1
    
    # page objects and content streams
    for i, content_bytes in enumerate(content_objects):
        page_obj_num = obj_num
        content_obj_num = obj_num + 1
        
        # page object
        objects.append(f"{page_obj_num} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents {content_obj_num} 0 R /Resources << /Font << /F1 3 0 R >> >> >>\nendobj\n".encode())
        obj_num += 1
        
        # content stream
        objects.append(f"{content_obj_num} 0 obj\n<< /Length {len(content_bytes)} >>\nstream\n".encode() + content_bytes + b"\nendstream\nendobj\n")
        obj_num += 1
    
    # build final pdf
    pdf = b"%PDF-1.4\n"
    offsets = []
    for obj in objects:
        offsets.append(len(pdf))
        pdf += obj
    
    # xref table
    xref_offset = len(pdf)
    pdf += b"xref\n"
    pdf += f"0 {len(objects) + 1}\n".encode()
    pdf += b"0000000000 65535 f \n"
    for off in offsets:
        pdf += f"{off:010d} 00000 n \n".encode()
    
    # trailer
    pdf += f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n".encode()
    pdf += f"startxref\n{xref_offset}\n%%EOF".encode()
    
    return pdf
