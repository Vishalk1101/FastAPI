import os
from dotenv import load_dotenv
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALOGRITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 

oauth2_schema = OAuth2PasswordBearer(tokenUrl="login")

#token create
def creat_token(data: dict):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})

    return jwt.encode(to_encode,SECRET_KEY,algorithm=ALOGRITHM)

def verify_token(token: str = Depends(oauth2_schema)):
    try:
        payload = jwt.decode(token,SECRET_KEY,algorithms=ALOGRITHM)
        return payload
    except JWTError:
        raise HTTPException(
            status_code= 401,
            detail= "Invalid Token!"
        )
