from datetime import datetime
from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    created_at: datetime
    
    # create user from object attributes
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class PostCreate(BaseModel):
    title: str
    description: str
    category: str
    location: str
    event_date: datetime

class PostResponse(BaseModel):
    id: int
    owner_id: int
    title: str
    description: str
    category: str
    location: str
    event_date: datetime
    created_at: datetime

    class Config:

        from_attributes = True