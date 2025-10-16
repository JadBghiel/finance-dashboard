import os
from dotenv import load_dotenv

load_dotenv()

# --- Database Configuration (Using SQLite) ---
DATABASE_URL = "sqlite:///./finance.db"

# --- API Keys (mocked for now) ---
# Replace with your actual keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "mock_openai_key")
EXCHANGERATE_API_KEY = os.getenv("EXCHANGERATE_API_KEY", "mock_exchangerate_key")
YAHOO_FINANCE_API_KEY = os.getenv("YAHOO_FINANCE_API_KEY", "mock_yahoo_key")

# --- Base Currency ---
BASE_CURRENCY = os.getenv("BASE_CURRENCY", "USD")