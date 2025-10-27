"""
simple seeder for finance.db

usage:
  cd dashboard/backend
  python3 scripts/seed_transactions.py --incomes <amount> --expenses <amount>

the script will:
 - ensure requested categories/accounts exist (create if missing)
 - insert the requested number of income and expense rows
 - guarantee total expenses < total incomes (positive balance)
"""
import os
import sqlite3
import argparse
import random
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, timedelta

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'finance.db'))

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
    "New Car", "Parents"
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

def get_or_create_category(conn: sqlite3.Connection, name: str, ctype: str) -> int:
    cur = conn.execute("SELECT id FROM categories WHERE name = ?", (name,))
    r = cur.fetchone()
    if r:
        return r[0]
    cur = conn.execute("INSERT INTO categories (name, type) VALUES (?, ?)", (name, ctype))
    return cur.lastrowid

def get_or_create_account(conn: sqlite3.Connection, name: str) -> int:
    cur = conn.execute("SELECT id FROM accounts WHERE name = ?", (name,))
    r = cur.fetchone()
    if r:
        return r[0]
    cur = conn.execute("INSERT INTO accounts (name) VALUES (?)", (name,))
    return cur.lastrowid

def insert_income(conn: sqlite3.Connection, amount: Decimal, currency: str, description: str, date_iso: str, category_id: int, account_id: int):
    conn.execute(
        "INSERT INTO incomes (amount, currency, description, date, category_id, account_id) VALUES (?, ?, ?, ?, ?, ?)",
        (str(amount), currency, description, date_iso, category_id, account_id)
    )

def insert_expense(conn: sqlite3.Connection, amount: Decimal, currency: str, description: str, date_iso: str, category_id: int, account_id: int):
    conn.execute(
        "INSERT INTO expenses (amount, currency, description, date, category_id, account_id) VALUES (?, ?, ?, ?, ?, ?)",
        (str(amount), currency, description, date_iso, category_id, account_id)
    )

def random_past_date(days_back=365):
    d = datetime.now() - timedelta(days=random.randint(0, days_back))
    return d.replace(hour=12, minute=0, second=0, microsecond=0).isoformat(sep=' ')

def main():
    p = argparse.ArgumentParser(description="Seed finance.db with random incomes and expenses.")
    p.add_argument("--incomes", type=int, default=20, help="Number of income entries to create")
    p.add_argument("--expenses", type=int, default=10, help="Number of expense entries to create")
    args = p.parse_args()

    if not os.path.exists(DB_PATH):
        print(f"DB not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    try:
        # make sure tables exist
        cur = conn.execute("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('accounts','categories','incomes','expenses')")
        found = {r["name"] for r in cur.fetchall()}
        needed = {'accounts','categories','incomes','expenses'}
        if not needed.issubset(found):
            print("Required tables not found in DB. Check migrations/models.")
            return

        # ensure categories & accounts exist (create if missing)
        category_name_to_id = {}
        for name in INCOME_CATEGORIES:
            cid = get_or_create_category(conn, name, 'income')
            category_name_to_id[name] = cid
        for name in EXPENSE_CATEGORIES:
            cid = get_or_create_category(conn, name, 'expense')
            category_name_to_id[name] = cid

        account_name_to_id = {}
        for name in ACCOUNTS:
            aid = get_or_create_account(conn, name)
            account_name_to_id[name] = aid

        conn.commit()

        # insert incomes
        incomes_total = Decimal("0")
        incomes = []
        for _ in range(args.incomes):
            amt = quantize_amount(random.uniform(1, 1000))
            curc = random.choice(CURRENCIES)
            desc = random.choice(LOREM)
            date_iso = random_past_date(365)
            cat = random.choice(INCOME_CATEGORIES)
            acc = random.choice(list(account_name_to_id.keys()))
            cid = category_name_to_id[cat]
            aid = account_name_to_id[acc]

            insert_income(conn, amt, curc, desc, date_iso, cid, aid)
            incomes_total += amt
            incomes.append(amt)

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
            date_iso = random_past_date(365)
            cat = random.choice(EXPENSE_CATEGORIES)
            acc = random.choice(list(account_name_to_id.keys()))
            cid = category_name_to_id[cat]
            aid = account_name_to_id[acc]

            insert_expense(conn, amt, curc, desc, date_iso, cid, aid)
            expenses_total += amt

            # if adding this would exceed allowed by a hair due to rounding, clamp and adjust
            if expenses_total > max_expense_allowed:
                # reduce last inserted expense in DB
                excess = expenses_total - max_expense_allowed
                new_amt = (amt - excess).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                if new_amt < Decimal("0.01"):
                    new_amt = Decimal("1.00")
                # update last row: find last inserted rowid for expenses
                last_id = conn.execute("SELECT id FROM expenses ORDER BY id DESC LIMIT 1").fetchone()[0]
                conn.execute("UPDATE expenses SET amount = ? WHERE id = ?", (str(new_amt), last_id))
                expenses_total = expenses_total - (amt - new_amt)

        conn.commit()

        print("Seeding complete.")
        print(f"Inserted incomes: {args.incomes}, total incomes = {incomes_total}")
        print(f"Inserted expenses: {args.expenses}, total expenses = {expenses_total}")
        print(f"DB path: {DB_PATH}")

    finally:
        conn.close()

if __name__ == "__main__":
    main()