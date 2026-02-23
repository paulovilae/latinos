from fastapi import APIRouter, Depends, HTTPException, status, Response, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
import boto3
import os
import uuid

from .. import schemas, models, crud
from ..db import get_db
from ..dependencies import get_current_user, require_admin

router = APIRouter(
    prefix="/api/users",
    tags=["users"],
)

@router.get("/me", response_model=schemas.UserOut)
def get_me(user: models.User = Depends(get_current_user)):
    return user

@router.options("/me")
def options_me():
    """Handle CORS preflight for /me endpoint"""
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )

@router.put("/me", response_model=schemas.UserOut)
def update_me(payload: schemas.UserUpdateRequest, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.name:
        user.name = payload.name
    if payload.mfa_enabled is not None:
        user.mfa_enabled = payload.mfa_enabled
    if payload.avatar_url is not None:
        user.avatar_url = payload.avatar_url
    # SECURITY: Users should not be able to change their own role.
    # if payload.role:
    #     user.role = payload.role 
    db.commit()
    db.refresh(user)
    return user

# MinIO Client Configuration
s3_client = boto3.client(
    's3',
    endpoint_url=os.getenv('MINIO_URL', 'http://127.0.0.1:9000'),
    aws_access_key_id=os.getenv('MINIO_ACCESS_KEY', 'minioadmin'),
    aws_secret_access_key=os.getenv('MINIO_SECRET_KEY', 'imaginos_secure_2026')
)
BUCKET_NAME = "latinos-avatars"

# Ensure bucket exists on startup
try:
    s3_client.create_bucket(Bucket=BUCKET_NAME)
    # Set bucket policy to public read
    public_policy = f'{{"Version":"2012-10-17","Statement":[{{"Sid":"PublicRead","Effect":"Allow","Principal":"*","Action":["s3:GetObject"],"Resource":["arn:aws:s3:::{BUCKET_NAME}/*"]}}]}}'
    s3_client.put_bucket_policy(Bucket=BUCKET_NAME, Policy=public_policy)
except Exception as e:
    print(f"Bucket init (expected mostly): {e}")

@router.post("/me/avatar", response_model=schemas.UserOut)
async def upload_avatar(file: UploadFile = File(...), user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    file_extension = file.filename.split('.')[-1] if '.' in file.filename else "jpg"
    unique_filename = f"{user.id}_{uuid.uuid4().hex[:8]}.{file_extension}"

    try:
        content = await file.read()
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=unique_filename,
            Body=content,
            ContentType=file.content_type
        )
        
        # Build the public URL. Default to local if not running under Sentinel.
        minio_base = os.getenv('MINIO_PUBLIC_URL', 'http://127.0.0.1:9000')
        avatar_url = f"{minio_base}/{BUCKET_NAME}/{unique_filename}"
        
        user.avatar_url = avatar_url
        db.commit()
        db.refresh(user)
        return user
    except Exception as e:
        print(f"S3 Upload failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload image")

@router.get("/", response_model=List[schemas.UserOut])
def list_users(_: models.User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(models.User).all()
