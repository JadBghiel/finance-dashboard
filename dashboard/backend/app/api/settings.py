from fastapi import APIRouter, HTTPException
from app.core import config
from app.schemas.settings import BaseCurrencyUpdate
import os

router = APIRouter()

@router.get("/settings/base-currency/")
def get_base_currency():
    """Return the configured base currency."""
    return {"base_currency": config.BASE_CURRENCY}

@router.post("/settings/base-currency/")
def set_base_currency(payload: BaseCurrencyUpdate):
    """
    Update (or create) BASE_CURRENCY entry in backend/.env file.
    Note: this writes to backend/.env for future restarts; it does not reload process env.
    """
    new = payload.base_currency.strip().upper()
    if not new:
        raise HTTPException(status_code=400, detail="Invalid base_currency")

    # locate backend folder (two levels up from this file)
    this_dir = os.path.dirname(__file__)
    backend_dir = os.path.abspath(os.path.join(this_dir, "..", ".."))
    env_path = os.path.join(backend_dir, ".env")

    line = f'BASE_CURRENCY="{new}"\n'

    try:
        if os.path.exists(env_path):
            # read and replace or append
            with open(env_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
            found = False
            for i, l in enumerate(lines):
                if l.strip().startswith("BASE_CURRENCY="):
                    lines[i] = line
                    found = True
                    break
            if not found:
                lines.append(line)
            with open(env_path, "w", encoding="utf-8") as f:
                f.writelines(lines)
        else:
            # create file
            with open(env_path, "w", encoding="utf-8") as f:
                f.write(line)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to write .env: {e}")

    return {"base_currency": new}