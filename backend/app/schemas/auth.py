from pydantic import BaseModel

class SendOTPRequest(BaseModel):
    phone: str

class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str

class Token(BaseModel):
    access_token: str
    token_type: str
