from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from app import models
from app.auth import SECRET_KEY, ALGORITHM
from app.database import SessionLocal

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()

def get_current_user(
        # get Bearer from Authorization header
        token:str = Depends(oauth2_scheme),
        db: Session = Depends(get_db),
):
    unauthorized_creds = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid Token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # check if token is still valid
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        username: str | None = payload.get("sub")

        if username is None:
            raise unauthorized_creds
        
    except JWTError:
        raise unauthorized_creds
    
    user = db.query(models.User).filter(
        models.User.username == username
    ).first()

    if user is None:
        raise unauthorized_creds
    
    return user



    
