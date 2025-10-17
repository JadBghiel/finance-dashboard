import os
from dotenv import load_dotenv

load_dotenv()

# db config (using SQLite)
DATABASE_URL = "sqlite:///./finance.db"

# API keys
# replace with my actual keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "mock_openai_key")
EXCHANGERATE_API_KEY = os.getenv("EXCHANGERATE_API_KEY", "mock_exchangerate_key")
YAHOO_FINANCE_API_KEY = os.getenv("YAHOO_FINANCE_API_KEY", "mock_yahoo_key")

# base currency
BASE_CURRENCY = os.getenv("BASE_CURRENCY", "USD")