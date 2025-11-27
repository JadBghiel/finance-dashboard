# finance-dashboard
💰 Personal Finance Dashboard / Track income, expenses, savings, and investments with charts, AI assistant, and multi-currency support
![alt text](image.png)

## Requirements

This project has a backend (Python/FastAPI) and a frontend (React). Before running the project, make sure you have the following installed and configured.

### System
- macOS, Linux, or Windows (Windows Subsystem for Linux recommended)

### Python (backend)
- Python 3.8 or newer
- Virtual environment tool (venv, virtualenv, or similar)

Python dependencies (stored in dashboard/backend/requirements.txt):

    - fastapi
    - uvicorn[standard]
    - sqlalchemy
    - python-dotenv
    - alembic
    - pydantic[email]
    - requests


Install backend dependencies:

### From project root
    $ python -m venv .venv
### macOS / Linux
    $ source .venv/bin/activate
### Windows (PowerShell)
    $ .venv\Scripts\Activate.ps1
### Install the dependencies
    pip install -r dashboard/backend/requirements.txt

## LAUNCH
In the root of the project:

    $ npx concurrently "cd dashboard/backend && uvicorn app.main:app --reload" "cd dashboard/frontend && npm start"

## FEATURES IMPLEMENTED
- Dashboard page:
    - Shows pie charts of income and expense, the total net liquidation value, the breakdown of each category and each account
- Income page:
    - Add, delete, edit, search and sort any entry
- Expense page
    - Add, delete, edit, search and sort any entry
- Account page
    - Add, delete and edit any entry
- Category page
    - Add, delete and edit any entry


## FEATURES TO IMPLEMENT (coming soon)
- Investment page:
    - Shows portfolio
    - Add, delete or edit any investement
    - Create and view your watchlist
    - View any available financial instrument (Yahoo Finance API)
- AI Assistant
    - Provided with the user data
    - Fine tuned to give recommendations, make projections, budgets, tax plannning, retirement planning, risk management & investement strategy
- Better UI

## KNOWN ISSUES:
- none

## GENERATE ENTRIES
For testing purposes, you can use the included python script to generate entries for both INCOME and EXPENSES, and test the project

In the root of the project (with python activated or installed):

     $ python3 dashboard/backend/scripts/seed_transactions.py --incomes <amount> --expenses <amount>

### Delete entries:
    $ python3 dashboard/backend/scripts/seed_transactions.py delete <count> [--random] --table <both> OR <expenses> OR <incomes>

- If the ```--random``` argument is not specified it will delete the newest entries