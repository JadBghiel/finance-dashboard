from pydantic import BaseModel, ConfigDict

class AccountBase(BaseModel):
    """base schema for account data"""
    name: str

class AccountCreate(AccountBase):
    """schema for creating a new account"""
    pass

class Account(AccountBase):
    """schema for returning an account from the API"""
    id: int
    model_config = ConfigDict(from_attributes=True)