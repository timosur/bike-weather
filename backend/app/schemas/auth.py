from pydantic import BaseModel


class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    is_admin: bool

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    username: str
    password: str
    captcha_token: str | None = None


class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    name: str = ""
    captcha_token: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    id_token: str
    token_type: str = "Bearer"
    expires_in: int
    scope: str
    refresh_token: str | None = None


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: str
    captcha_token: str | None = None


class ResetPasswordRequest(BaseModel):
    token: str
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class MessageResponse(BaseModel):
    message: str
