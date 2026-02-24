from pydantic import BaseModel, EmailStr


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    is_admin: bool

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str = ""


class TokenResponse(BaseModel):
    access_token: str
    id_token: str
    token_type: str = "Bearer"
    expires_in: int
    scope: str
