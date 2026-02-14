"""
simple seeder for finance.db

usage:
    cd dashboard/backend
    python3 scripts/seed_transactions.py --incomes <amount> --expenses <amount> --investments <amount> --watchlist <amount> --db auto|sqlite|postgres

examples:
    python3 scripts/seed_transactions.py --incomes 10 --expenses 5 --investments 3 --watchlist 3 --db sqlite
    STORAGE_DATABASE_URL="postgresql://..." python3 scripts/seed_transactions.py --incomes 10 --expenses 5 --investments 3 --watchlist 3 --db postgres

the script will:
 - ensure requested categories/accounts exist (create if missing)
 - insert the requested number of income and expense rows
 - insert requested investment positions and watchlist items
 - guarantee total expenses < total incomes (positive balance)
"""
import os
import sqlite3
import argparse
import random
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, timedelta
from typing import Optional

try:
    import psycopg2
    from psycopg2 import extras as pg_extras
except Exception:
    psycopg2 = None
    pg_extras = None

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'finance.db'))

def get_db_url() -> Optional[str]:
    return os.getenv("STORAGE_DATABASE_URL") or os.getenv("DATABASE_URL")

def is_postgres_url(url: Optional[str]) -> bool:
    if not url:
        return False
    return url.startswith("postgres://") or url.startswith("postgresql://")

def normalize_pg_url(url: str) -> str:
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql://", 1)
    return url

def connect_db(db_mode: str = "auto"):
    url = get_db_url()
    if db_mode == "postgres":
        if not url:
            raise RuntimeError("STORAGE_DATABASE_URL or DATABASE_URL is required for Postgres seeding")
        if psycopg2 is None:
            raise RuntimeError("psycopg2 is required for Postgres seeding")
        pg_url = normalize_pg_url(url)
        conn = psycopg2.connect(pg_url)
        return conn, True
    if db_mode == "sqlite":
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn, False
    # auto
    if is_postgres_url(url):
        if psycopg2 is None:
            raise RuntimeError("psycopg2 is required for Postgres seeding")
        pg_url = normalize_pg_url(url)
        conn = psycopg2.connect(pg_url)
        return conn, True
    # default: sqlite
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn, False

def ph(is_postgres: bool) -> str:
    return "%s" if is_postgres else "?"

# control how far back to seed in days, default 10 years
DAYS_BACK = 3650

CURRENCIES = ['EUR', 'USD', 'GBP', 'JPY', 'CAD', 'MAD', 'AED', 'AUD', 'CHF', 'CNY']

INCOME_CATEGORIES = [
    "Salary", "Side hustle", "Allowance", "Interest & Dividends",
    "Tips", "Bonus", "Commissions", "Rental Income", "Capital gains",
    "Inheritance", "Social Security", "Government Benefits", "Gifts"
]

EXPENSE_CATEGORIES = [
    "Rent & Utilities", "Groceries", "Travel",
    "Property Taxes", "Maintenance & Repairs", "Household Supplies",
    "Phone & Internet", "Streaming Service", "Car Payment", "Car Insurance",
    "Health Insurance", "Dining Out", "Snacks & Drinks", "Gym", "Entertainment",
    "Pet Care", "Student Loan", "Car Loan", "Credit Card Loan", "Gifts",
    "Hobbies", "Education", "Childcare"
]

ACCOUNTS = [
    "Main", "Savings", "High Yield Savings Accounts", "Joint", "Emergency Fund",
    "Christmas Club", "Vacation Club", "Wedding Fund", "Pension", "Health Savings",
    "New Car", "Parents", "Investment"
]

INVESTMENT_CATALOG = [
    {"symbol": "AAPL", "name": "Apple Inc.", "type": "stock", "currency": "USD", "base_price": 190.0},
    {"symbol": "MSFT", "name": "Microsoft Corp.", "type": "stock", "currency": "USD", "base_price": 410.0},
    {"symbol": "TSLA", "name": "Tesla Inc.", "type": "stock", "currency": "USD", "base_price": 210.0},
    {"symbol": "NVDA", "name": "NVIDIA Corp.", "type": "stock", "currency": "USD", "base_price": 650.0},
    {"symbol": "AMZN", "name": "Amazon.com", "type": "stock", "currency": "USD", "base_price": 175.0},
    {"symbol": "SPY", "name": "SPDR S&P 500 ETF", "type": "etf", "currency": "USD", "base_price": 510.0},
    {"symbol": "QQQ", "name": "Invesco QQQ ETF", "type": "etf", "currency": "USD", "base_price": 430.0},
    {"symbol": "VTI", "name": "Vanguard Total Stock Market ETF", "type": "etf", "currency": "USD", "base_price": 250.0},
    {"symbol": "BTC-USD", "name": "Bitcoin", "type": "crypto", "currency": "USD", "base_price": 43000.0},
    {"symbol": "ETH-USD", "name": "Ethereum", "type": "crypto", "currency": "USD", "base_price": 2300.0},
    {"symbol": "VTSAX", "name": "Vanguard Total Stock Market Index Fund", "type": "mutual_fund", "currency": "USD", "base_price": 120.0},
    {"symbol": "SWPPX", "name": "Schwab S&P 500 Index Fund", "type": "mutual_fund", "currency": "USD", "base_price": 78.0}
]

WATCHLIST_CATALOG = [
    {"symbol": "GOOGL", "name": "Alphabet Inc.", "type": "stock", "target": 180.0},
    {"symbol": "META", "name": "Meta Platforms", "type": "stock", "target": 460.0},
    {"symbol": "AMD", "name": "Advanced Micro Devices", "type": "stock", "target": 170.0},
    {"symbol": "SMH", "name": "VanEck Semiconductor ETF", "type": "etf", "target": 260.0},
    {"symbol": "SOL-USD", "name": "Solana", "type": "crypto", "target": 180.0},
    {"symbol": "BND", "name": "Vanguard Total Bond Market ETF", "type": "etf", "target": 76.0}
]

LOREM = [
    "Lorem ipsum dolor sit amet",
    "Payment for services rendered",
    "Monthly subscription",
    "Freelance work",
    "Gift received",
    "Refund",
    "Transfer",
    "Dividend payment",
    "Bonus payout",
    "Miscellaneous",
    "Dinner with friends",
    "Utility bill",
    "Car maintenance",
    "Online shopping",
    "Coffee run",
    "Book purchase",
    "Gym membership",
    "Concert tickets",
    "Childcare payment",
    "Medical expenses",
    "Rent payment",
    "Vacation booking",
    "Pet food",
    "Streaming subscription",
    "Loan repayment",
    "Allowance received",
    "Interest income",
    "Birthday gift",
    "Workshop fee",
    "Transportation cost",
    "Home repairs",
    "Office supplies",
    "Parking fee",
    "Snack purchase",
    "Phone recharge",
    "Insurance premium",
    "Capital gains",
    "Government benefits",
    "Car insurance",
    "Education materials",
    "Hobby supplies",
    "Side hustle income",
    "Tip received",
    "Commission payout",
    "Rental income",
    "Investment refund",
    "Miscellaneous donation",
    "Charity contribution",
    "Unexpected expense",
    "Cash withdrawal"
]

def quantize_amount(x: float) -> Decimal:
    return (Decimal(x).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))

def get_or_create_category(conn, name: str, ctype: str, is_postgres: bool) -> int:
    placeholder = ph(is_postgres)
    if is_postgres:
        cur = conn.cursor()
        cur.execute(f"SELECT id FROM categories WHERE name = {placeholder}", (name,))
        r = cur.fetchone()
        if r:
            return r[0]
        cur.execute(
            f"INSERT INTO categories (name, type) VALUES ({placeholder}, {placeholder}) RETURNING id",
            (name, ctype)
        )
        return cur.fetchone()[0]
    cur = conn.execute("SELECT id FROM categories WHERE name = ?", (name,))
    r = cur.fetchone()
    if r:
        return r[0]
    cur = conn.execute("INSERT INTO categories (name, type) VALUES (?, ?)", (name, ctype))
    return cur.lastrowid

def get_or_create_account(conn, name: str, is_postgres: bool) -> int:
    placeholder = ph(is_postgres)
    if is_postgres:
        cur = conn.cursor()
        cur.execute(f"SELECT id FROM accounts WHERE name = {placeholder}", (name,))
        r = cur.fetchone()
        if r:
            return r[0]
        cur.execute(
            f"INSERT INTO accounts (name, emoji) VALUES ({placeholder}, {placeholder}) RETURNING id",
            (name, None)
        )
        return cur.fetchone()[0]
    cur = conn.execute("SELECT id FROM accounts WHERE name = ?", (name,))
    r = cur.fetchone()
    if r:
        return r[0]
    # insert emoji column if present in schema (set to NULL by default)
    try:
        cur = conn.execute("INSERT INTO accounts (name, emoji) VALUES (?, ?)", (name, None))
    except sqlite3.OperationalError:
        # fallback if emoji column not present
        cur = conn.execute("INSERT INTO accounts (name) VALUES (?)", (name,))
    return cur.lastrowid

def insert_income(conn, amount: Decimal, currency: str, description: str, date_iso: str, category_id: int, account_id: int, is_postgres: bool):
    placeholder = ph(is_postgres)
    sql = (
        "INSERT INTO incomes (amount, currency, description, date, category_id, account_id) "
        f"VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder})"
    )
    cur = conn.cursor() if is_postgres else conn
    cur.execute(sql, (str(amount), currency, description, date_iso, category_id, account_id))

def insert_expense(conn, amount: Decimal, currency: str, description: str, date_iso: str, category_id: int, account_id: int, is_postgres: bool):
    placeholder = ph(is_postgres)
    sql = (
        "INSERT INTO expenses (amount, currency, description, date, category_id, account_id) "
        f"VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder})"
    )
    cur = conn.cursor() if is_postgres else conn
    cur.execute(sql, (str(amount), currency, description, date_iso, category_id, account_id))

def insert_investment(conn, symbol: str, name: str, inv_type: str, quantity: Decimal,
                      purchase_price: Decimal, purchase_date: str, current_price: Decimal,
                      currency: str, account_id: int, notes: str = "", is_postgres: bool = False):
    placeholder = ph(is_postgres)
    sql = (
        "INSERT INTO investments "
        "(symbol, name, type, quantity, purchase_price, purchase_date, current_price, currency, account_id, notes) "
        f"VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder})"
    )
    cur = conn.cursor() if is_postgres else conn
    cur.execute(
        sql,
        (symbol, name, inv_type, str(quantity), str(purchase_price), purchase_date, str(current_price), currency, account_id, notes)
    )

def insert_watchlist(conn, symbol: str, name: str, inv_type: str, target_price: Decimal, notes: str = "", is_postgres: bool = False):
    placeholder = ph(is_postgres)
    sql = (
        "INSERT INTO watchlist (symbol, name, type, target_price, notes) "
        f"VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder})"
    )
    cur = conn.cursor() if is_postgres else conn
    cur.execute(sql, (symbol, name, inv_type, str(target_price), notes))

def random_past_date(days_back=DAYS_BACK):
    """
    return an ISO timestamp randomly chosen in the past "days_back" days
    default uses DAYS_BACK so gen entries are spread across multiple years
    uses standard ISO T separator (datetime.isoformat) so JS/SQL parsing is consistent
    """
    d = datetime.now() - timedelta(days=random.randint(0, days_back))
    return d.replace(hour=12, minute=0, second=0, microsecond=0).isoformat()  # ISO with 'T'

def delete_entries(conn, count: int, table: str = 'both', randomize: bool = False, is_postgres: bool = False) -> int:
    """
    delete `count` entries from the db
    - table: 'incomes', 'expenses' or 'both'
    - randomize: if true delete random rows, otherwise delete newest (by id desc)
    returns number of rows deleted
    """
    cur = conn.cursor()

    valid_tables = {'incomes', 'expenses', 'both', 'investments', 'watchlist', 'all'}
    t = table.lower()
    if t not in valid_tables:
        raise ValueError("table must be 'incomes', 'expenses' or 'both'")

    # fetch candidate rows (returns list of (id, table_name))
    def fetch_candidates():
        if t == 'incomes':
            rows = cur.execute("SELECT id FROM incomes").fetchall()
            return [(r[0], 'incomes') for r in rows]
        if t == 'expenses':
            rows = cur.execute("SELECT id FROM expenses").fetchall()
            return [(r[0], 'expenses') for r in rows]
        if t == 'investments':
            rows = cur.execute("SELECT id FROM investments").fetchall()
            return [(r[0], 'investments') for r in rows]
        if t == 'watchlist':
            rows = cur.execute("SELECT id FROM watchlist").fetchall()
            return [(r[0], 'watchlist') for r in rows]
        if t == 'all':
            rows_inc = cur.execute("SELECT id FROM incomes").fetchall()
            rows_exp = cur.execute("SELECT id FROM expenses").fetchall()
            rows_inv = cur.execute("SELECT id FROM investments").fetchall()
            rows_wl = cur.execute("SELECT id FROM watchlist").fetchall()
            return (
                [(r[0], 'incomes') for r in rows_inc]
                + [(r[0], 'expenses') for r in rows_exp]
                + [(r[0], 'investments') for r in rows_inv]
                + [(r[0], 'watchlist') for r in rows_wl]
            )
        # both
        rows_inc = cur.execute("SELECT id FROM incomes").fetchall()
        rows_exp = cur.execute("SELECT id FROM expenses").fetchall()
        return [(r[0], 'incomes') for r in rows_inc] + [(r[0], 'expenses') for r in rows_exp]

    candidates = fetch_candidates()
    total_available = len(candidates)
    if total_available == 0:
        return 0

    # choose rows to delete
    if randomize:
        import random as _random
        to_delete = _random.sample(candidates, min(count, total_available))
    else:
        # delete newest by id (descending)
        candidates.sort(key=lambda x: x[0], reverse=True)
        to_delete = candidates[:min(count, total_available)]

    # confirmation prompt
    print(f"about to delete {len(to_delete)} rows (table={table}, random={randomize}).")
    ok = input("aree you sure? type yes to proceed: ").strip().lower()
    if ok != 'yes':
        print("annulé by user")
        return 0

    deleted = 0
    for rid, tbl in to_delete:
        # delete by id per-table
        placeholder = ph(is_postgres)
        cur.execute(f"DELETE FROM {tbl} WHERE id = {placeholder}", (rid,))
        deleted += cur.rowcount if cur.rowcount is not None else 1

    conn.commit()
    return deleted

def main():
    import sys
    p = argparse.ArgumentParser(description="Seed finance.db with random incomes and expenses.")
    p.add_argument("--incomes", type=int, default=20, help="Number of income entries to create")
    p.add_argument("--expenses", type=int, default=10, help="Number of expense entries to create")
    p.add_argument("--investments", type=int, default=8, help="Number of investment positions to create")
    p.add_argument("--watchlist", type=int, default=6, help="Number of watchlist items to create")
    p.add_argument("--years", type=int, default=None, help="Spread entries across N years (overrides internal DAYS_BACK when provided)")
    p.add_argument("--db", type=str, default="auto", choices=["auto", "sqlite", "postgres"], help="Target database: auto|sqlite|postgres")
    args, unknown = p.parse_known_args()

    if len(sys.argv) > 1 and sys.argv[1] == 'delete':
        # parse simple delete args
        delete_count = 0
        try:
            delete_count = int(sys.argv[2]) if len(sys.argv) > 2 else 0
        except Exception:
            print("Usage: python3 scripts/seed_transactions.py delete <count> [--random] [--table incomes|expenses|both|investments|watchlist|all]")
            return

        randomize = '--random' in sys.argv or '-r' in sys.argv
        table = 'both'
        if '--table' in sys.argv:
            idx = sys.argv.index('--table')
            if idx + 1 < len(sys.argv):
                table = sys.argv[idx + 1]
        elif '-t' in sys.argv:
            idx = sys.argv.index('-t')
            if idx + 1 < len(sys.argv):
                table = sys.argv[idx + 1]

        if not os.path.exists(DB_PATH) and not is_postgres_url(get_db_url()):
            print(f"DB not found at {DB_PATH}")
            return

        conn, is_postgres = connect_db(args.db)
        try:
            deleted = delete_entries(conn, delete_count, table=table, randomize=randomize, is_postgres=is_postgres)
            print(f"Deleted {deleted} rows.")
        finally:
            conn.close()
        return

    days_back = DAYS_BACK
    if args.years and args.years > 0:
        days_back = args.years * 365

    if not os.path.exists(DB_PATH) and not is_postgres_url(get_db_url()) and args.db != "postgres":
        print(f"DB not found at {DB_PATH}")
        return

    conn, is_postgres = connect_db(args.db)

    try:
        # make sure tables exist
        if is_postgres:
            cur = conn.cursor()
            cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('accounts','categories','incomes','expenses','investments','watchlist')")
            found = {r[0] for r in cur.fetchall()}
        else:
            cur = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('accounts','categories','incomes','expenses','investments','watchlist')")
            found = {r["name"] for r in cur.fetchall()}
        needed = {'accounts','categories','incomes','expenses'}
        if not needed.issubset(found):
            print("Required tables not found in DB. Check migrations/models.")
            return

        # ensure categories & accounts exist (create if missing)
        category_name_to_id = {}
        for name in INCOME_CATEGORIES:
            cid = get_or_create_category(conn, name, 'income', is_postgres)
            category_name_to_id[name] = cid
        for name in EXPENSE_CATEGORIES:
            cid = get_or_create_category(conn, name, 'expense', is_postgres)
            category_name_to_id[name] = cid

        account_name_to_id = {}
        for name in ACCOUNTS:
            aid = get_or_create_account(conn, name, is_postgres)
            account_name_to_id[name] = aid

        conn.commit()

        # ensure investment account exists
        investment_account_id = account_name_to_id.get("Investment")

        # insert incomes
        incomes_total = Decimal("0")
        for _ in range(args.incomes):
            amt = quantize_amount(random.uniform(1, 1000))
            curc = random.choice(CURRENCIES)
            desc = random.choice(LOREM)
            date_iso = random_past_date(days_back)
            cat = random.choice(INCOME_CATEGORIES)
            acc = random.choice(list(account_name_to_id.keys()))
            cid = category_name_to_id[cat]
            aid = account_name_to_id[acc]

            insert_income(conn, amt, curc, desc, date_iso, cid, aid, is_postgres)
            incomes_total += amt

        conn.commit()

        # insert expenses but ensure total expenses stays below incomes_total * 0.95
        expenses_total = Decimal("0")
        max_expense_allowed = (incomes_total * Decimal("0.95"))
        remaining = args.expenses

        for i in range(args.expenses):
            remaining -= 1
            # compute safe upper bound for this expense so we can still place remaining items with at least 1 unit
            remaining_min_total = Decimal(remaining) * Decimal("1.00")
            allowed = max_expense_allowed - expenses_total - remaining_min_total
            if allowed <= Decimal("1.00"):
                # only min values are possible
                amt_val = 1.00
            else:
                # cap per item to 1000 but also to allowed
                cap = float(min(1000.0, float(allowed)))
                amt_val = random.uniform(1.0, cap)
            amt = quantize_amount(amt_val)
            # pick random currency, description, date, category, account
            curc = random.choice(CURRENCIES)
            desc = random.choice(LOREM)
            date_iso = random_past_date(days_back)
            cat = random.choice(EXPENSE_CATEGORIES)
            acc = random.choice(list(account_name_to_id.keys()))
            cid = category_name_to_id[cat]
            aid = account_name_to_id[acc]

            insert_expense(conn, amt, curc, desc, date_iso, cid, aid, is_postgres)
            expenses_total += amt

            # if adding this would exceed allowed by a hair due to rounding, clamp and adjust
            if expenses_total > max_expense_allowed:
                # reduce last inserted expense in DB
                excess = expenses_total - max_expense_allowed
                new_amt = (amt - excess).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                if new_amt < Decimal("0.01"):
                    new_amt = Decimal("1.00")
                # update last row: find last inserted rowid for expenses
                if is_postgres:
                    cur2 = conn.cursor()
                    cur2.execute("SELECT id FROM expenses ORDER BY id DESC LIMIT 1")
                    last_id_row = cur2.fetchone()
                else:
                    last_id_row = conn.execute("SELECT id FROM expenses ORDER BY id DESC LIMIT 1").fetchone()
                if last_id_row:
                    last_id = last_id_row[0]
                    placeholder = ph(is_postgres)
                    cur3 = conn.cursor() if is_postgres else conn
                    cur3.execute(f"UPDATE expenses SET amount = {placeholder} WHERE id = {placeholder}", (str(new_amt), last_id))
                    expenses_total = expenses_total - (amt - new_amt)

        conn.commit()

        # insert investments
        if args.investments and args.investments > 0:
            if 'investments' not in found:
                print("Investments table not found; skipping investment seeding.")
            else:
                for _ in range(args.investments):
                    item = random.choice(INVESTMENT_CATALOG)
                    base = float(item["base_price"])
                    purchase = quantize_amount(random.uniform(base * 0.85, base * 1.15))
                    current = quantize_amount(float(purchase) * random.uniform(0.9, 1.2))

                    if item["type"] == "crypto":
                        qty = Decimal(str(random.uniform(0.05, 3.0))).quantize(Decimal("0.000001"), rounding=ROUND_HALF_UP)
                    elif item["type"] == "mutual_fund":
                        qty = Decimal(str(random.uniform(10, 200))).quantize(Decimal("0.000001"), rounding=ROUND_HALF_UP)
                    else:
                        qty = Decimal(str(random.uniform(1, 50))).quantize(Decimal("0.000001"), rounding=ROUND_HALF_UP)

                    purchase_date = random_past_date(days_back)
                    notes = random.choice(["Long-term hold", "Dividend play", "Growth", "Value", "DCA", "Speculative"])

                    insert_investment(
                        conn,
                        symbol=item["symbol"],
                        name=item["name"],
                        inv_type=item["type"],
                        quantity=qty,
                        purchase_price=purchase,
                        purchase_date=purchase_date,
                        current_price=current,
                        currency=item["currency"],
                        account_id=investment_account_id or list(account_name_to_id.values())[0],
                        notes=notes,
                        is_postgres=is_postgres
                    )
                conn.commit()

        # insert watchlist items
        if args.watchlist and args.watchlist > 0:
            if 'watchlist' not in found:
                print("Watchlist table not found; skipping watchlist seeding.")
            else:
                for _ in range(args.watchlist):
                    item = random.choice(WATCHLIST_CATALOG)
                    target = quantize_amount(random.uniform(item["target"] * 0.9, item["target"] * 1.1))
                    notes = random.choice(["Watch for breakout", "Buy on dip", "Earnings catalyst", "Long-term candidate", "Trend reversal"])
                    insert_watchlist(
                        conn,
                        symbol=item["symbol"],
                        name=item["name"],
                        inv_type=item["type"],
                        target_price=target,
                        notes=notes,
                        is_postgres=is_postgres
                    )
                conn.commit()

        print("Seeding complete")
        print(f"Inserted incomes: {args.incomes}, total incomes = {incomes_total}")
        print(f"Inserted expenses: {args.expenses}, total expenses = {expenses_total}")
        print(f"Inserted investments: {args.investments}")
        print(f"Inserted watchlist items: {args.watchlist}")
        print(f"DB path: {DB_PATH}")

    finally:
        conn.close()

if __name__ == "__main__":
    main()