from pydantic import BaseModel

class BaseCurrencyUpdate(BaseModel):
    base_currency: str