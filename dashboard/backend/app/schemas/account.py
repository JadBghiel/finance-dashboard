from pydantic import BaseModel, ConfigDict

class AccountBase(BaseModel):
    name: str

class AccountCreate(AccountBase):
    pass

class Account(AccountBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# a new "public" schema that is safe for API responses
class AccountPublic(AccountBase):
    id: int
    model_config = ConfigDict(from_attributes=True)