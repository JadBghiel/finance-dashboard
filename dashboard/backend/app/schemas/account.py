from pydantic import BaseModel, ConfigDict

class AccountBase(BaseModel):
    """Base schema for account data."""
    name: str

class AccountCreate(AccountBase):
    """Schema for creating a new account."""
    pass

class Account(AccountBase):
    """Schema for returning an account from the API."""
    id: int
    model_config = ConfigDict(from_attributes=True)