"""
export endpoints - download db as sql, csv, or pdf
"""
import os
import csv
import io
import sqlite3
from datetime import datetime
from fastapi import APIRouter, Response
from fastapi.responses import StreamingResponse

router = APIRouter()

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "finance.db"))

@router.get("/export/sql")
def export_sql():
    """download the raw sqlite db file"""
    if not os.path.exists(DB_PATH):
        return Response(content="db not found", status_code=404)
    
    with open(DB_PATH, "rb") as f:
        content = f.read()
    
    return Response(
        content=content,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f"attachment; filename=finance_{datetime.now().strftime('%Y%m%d')}.db"}
    )

@router.get("/export/csv")
def export_csv():
    """export all tables as a single csv (concatenated with headers)"""
    if not os.path.exists(DB_PATH):
        return Response(content="db not found", status_code=404)
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # get all table names
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'alembic_%'")
    tables = [row[0] for row in cursor.fetchall()]
    
    output = io.StringIO()
    
    for table in tables:
        output.write(f"\n# === {table} ===\n")
        cursor.execute(f"SELECT * FROM {table}")
        rows = cursor.fetchall()
        if rows:
            columns = rows[0].keys()
            writer = csv.writer(output)
            writer.writerow(columns)
            for row in rows:
                writer.writerow([row[col] for col in columns])
        output.write("\n")
    
    conn.close()
    
    content = output.getvalue()
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=finance_{datetime.now().strftime('%Y%m%d')}.csv"}
    )

@router.get("/export/pdf")
def export_pdf():
    """export a complete pdf report with all financial data"""
    if not os.path.exists(DB_PATH):
        return Response(content="db not found", status_code=404)
    
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
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
    
    cursor.execute("SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total FROM incomes")
    row = cursor.fetchone()
    total_income = float(row['total'])
    lines.append(f"  Total Income:     {row['cnt']:>6} entries   ${total_income:>12,.2f}")
    
    cursor.execute("SELECT COUNT(*) as cnt, COALESCE(SUM(amount), 0) as total FROM expenses")
    row = cursor.fetchone()
    total_expense = float(row['total'])
    lines.append(f"  Total Expenses:   {row['cnt']:>6} entries   ${total_expense:>12,.2f}")
    
    net = total_income - total_expense
    lines.append(f"  Net Balance:                       ${net:>12,.2f}")
    lines.append("")
    
    cursor.execute("SELECT COUNT(*) as cnt FROM accounts")
    row = cursor.fetchone()
    lines.append(f"  Accounts:         {row['cnt']:>6}")
    
    cursor.execute("SELECT COUNT(*) as cnt FROM categories")
    row = cursor.fetchone()
    lines.append(f"  Categories:       {row['cnt']:>6}")
    
    # investments summary
    try:
        cursor.execute("SELECT COUNT(*) as cnt, COALESCE(SUM(quantity * COALESCE(current_price, purchase_price)), 0) as total FROM investments")
        row = cursor.fetchone()
        lines.append(f"  Investments:      {row['cnt']:>6} positions ${float(row['total']):>12,.2f}")
    except:
        pass
    
    try:
        cursor.execute("SELECT COUNT(*) as cnt FROM watchlist")
        row = cursor.fetchone()
        lines.append(f"  Watchlist:        {row['cnt']:>6} items")
    except:
        pass
    
    lines.append("")
    
    #  ACCOUNTS SECTION 
    lines.append("-" * 60)
    lines.append("ACCOUNTS")
    lines.append("-" * 60)
    cursor.execute("SELECT id, name, emoji FROM accounts ORDER BY name")
    accounts = cursor.fetchall()
    for acc in accounts:
        emoji = acc['emoji'] or ''
        lines.append(f"  {emoji} {acc['name']}")
        # get account balance
        cursor.execute("SELECT COALESCE(SUM(amount), 0) as inc FROM incomes WHERE account_id = ?", (acc['id'],))
        inc = float(cursor.fetchone()['inc'])
        cursor.execute("SELECT COALESCE(SUM(amount), 0) as exp FROM expenses WHERE account_id = ?", (acc['id'],))
        exp = float(cursor.fetchone()['exp'])
        balance = inc - exp
        lines.append(f"      Income: ${inc:,.2f}  |  Expenses: ${exp:,.2f}  |  Balance: ${balance:,.2f}")
    lines.append("")
    
    #  CATEGORIES SECTION 
    lines.append("-" * 60)
    lines.append("CATEGORIES (with totals)")
    lines.append("-" * 60)
    cursor.execute("SELECT id, name FROM categories ORDER BY name")
    categories = cursor.fetchall()
    for cat in categories:
        cursor.execute("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE category_id = ?", (cat['id'],))
        total = float(cursor.fetchone()['total'])
        if total > 0:
            lines.append(f"  {cat['name']:<30} ${total:>12,.2f}")
    lines.append("")
    
    #  INCOME BREAKDOWN BY MONTH 
    lines.append("-" * 60)
    lines.append("INCOME BY MONTH")
    lines.append("-" * 60)
    cursor.execute("""
        SELECT strftime('%Y-%m', date) as month, SUM(amount) as total, COUNT(*) as cnt
        FROM incomes 
        WHERE date IS NOT NULL
        GROUP BY strftime('%Y-%m', date)
        ORDER BY month DESC
        LIMIT 12
    """)
    for row in cursor.fetchall():
        lines.append(f"  {row['month']}:  {row['cnt']:>4} entries   ${float(row['total']):>12,.2f}")
    lines.append("")
    
    #  EXPENSE BREAKDOWN BY MONTH 
    lines.append("-" * 60)
    lines.append("EXPENSES BY MONTH")
    lines.append("-" * 60)
    cursor.execute("""
        SELECT strftime('%Y-%m', date) as month, SUM(amount) as total, COUNT(*) as cnt
        FROM expenses 
        WHERE date IS NOT NULL
        GROUP BY strftime('%Y-%m', date)
        ORDER BY month DESC
        LIMIT 12
    """)
    for row in cursor.fetchall():
        lines.append(f"  {row['month']}:  {row['cnt']:>4} entries   ${float(row['total']):>12,.2f}")
    lines.append("")
    
    #  INVESTMENTS SECTION 
    try:
        lines.append("-" * 60)
        lines.append("INVESTMENT POSITIONS")
        lines.append("-" * 60)
        cursor.execute("""
            SELECT symbol, name, type, quantity, purchase_price, current_price, currency
            FROM investments
            ORDER BY type, symbol
        """)
        investments = cursor.fetchall()
        if investments:
            for inv in investments:
                qty = float(inv['quantity'] or 0)
                purchase = float(inv['purchase_price'] or 0)
                current = float(inv['current_price'] or purchase)
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
    except:
        pass
    
    #  WATCHLIST SECTION 
    try:
        lines.append("-" * 60)
        lines.append("WATCHLIST")
        lines.append("-" * 60)
        cursor.execute("SELECT symbol, name, type, target_price, notes FROM watchlist ORDER BY symbol")
        watchlist = cursor.fetchall()
        if watchlist:
            for w in watchlist:
                target = f"target: ${float(w['target_price']):,.2f}" if w['target_price'] else "no target"
                lines.append(f"  {w['symbol']:<8} {w['type']:<12} {target}")
                if w['notes']:
                    lines.append(f"           Note: {w['notes'][:50]}")
        else:
            lines.append("  No watchlist items")
        lines.append("")
    except:
        pass
    
    #  RECENT TRANSACTIONS 
    lines.append("-" * 60)
    lines.append("RECENT INCOME (last 20)")
    lines.append("-" * 60)
    cursor.execute("""
        SELECT i.date, i.amount, i.currency, i.description, a.name as account_name
        FROM incomes i
        LEFT JOIN accounts a ON i.account_id = a.id
        ORDER BY i.date DESC LIMIT 20
    """)
    for row in cursor.fetchall():
        date_str = row['date'][:10] if row['date'] else 'n/a'
        desc = (row['description'] or '')[:35]
        acc = (row['account_name'] or 'n/a')[:15]
        lines.append(f"  {date_str}  ${float(row['amount']):>10,.2f} {row['currency']}  {acc:<15}  {desc}")
    lines.append("")
    
    lines.append("-" * 60)
    lines.append("RECENT EXPENSES (last 20)")
    lines.append("-" * 60)
    cursor.execute("""
        SELECT e.date, e.amount, e.currency, e.description, a.name as account_name, c.name as category_name
        FROM expenses e
        LEFT JOIN accounts a ON e.account_id = a.id
        LEFT JOIN categories c ON e.category_id = c.id
        ORDER BY e.date DESC LIMIT 20
    """)
    for row in cursor.fetchall():
        date_str = row['date'][:10] if row['date'] else 'n/a'
        desc = (row['description'] or '')[:25]
        acc = (row['account_name'] or 'n/a')[:12]
        cat = (row['category_name'] or 'n/a')[:12]
        lines.append(f"  {date_str}  ${float(row['amount']):>10,.2f}  {acc:<12}  {cat:<12}  {desc}")
    lines.append("")
    
    lines.append("=" * 60)
    lines.append("        END OF REPORT")
    lines.append("=" * 60)
    
    conn.close()
    
    # create pdf
    text_content = "\n".join(lines)
    pdf_content = _create_simple_pdf(text_content)
    
    return Response(
        content=pdf_content,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=finance_{datetime.now().strftime('%Y%m%d')}.pdf"}
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
