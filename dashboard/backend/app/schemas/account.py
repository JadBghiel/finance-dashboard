from pydantic import BaseModel, ConfigDict

class AccountBase(BaseModel):
    name: str

class AccountCreate(AccountBase):
    pass

class Account(AccountBase):
    id: int
    model_config = ConfigDict(from_attributes=True)