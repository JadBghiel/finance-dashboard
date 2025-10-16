from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import category, income, expense

app = FastAPI(
    title="Personal Finance Dashboard API",
    description="API for tracking income, expenses, savings, and investments.",
    version="0.1.0",
)

# --- CORS Configuration ---
origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Include API routers with trailing slash fix ---
# By using include_router this way, FastAPI handles the trailing slash automatically.
app.include_router(category.router, prefix="/api", tags=["Categories"])
app.include_router(income.router, prefix="/api", tags=["Incomes"])
app.include_router(expense.router, prefix="/api", tags=["Expenses"])


@app.get("/", tags=["Root"])
def read_root():
    """A welcome message to confirm the API is running."""
    return {"message": "Welcome to the Personal Finance Dashboard API"}