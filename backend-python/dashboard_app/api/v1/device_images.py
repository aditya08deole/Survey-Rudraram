"""
Device Images API Router
Handles image upload, retrieval, and deletion for survey devices
Includes automatic thumbnail generation
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import List, Optional
from pydantic import BaseModel
import uuid
from datetime import datetime
from supabase import Client
from io import BytesIO
from PIL import Image
import logging

from dashboard_app.core.config import get_settings
from dashboard_app.auth.permissions import get_current_user
from dashboard_app.schemas.user import User
from dashboard_app.database.supabase_client import get_supabase

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/device-images", tags=["Device Images"])

class ImageMetadataSchema(BaseModel):
    survey_id: str
    image_url: str
    thumbnail_url: Optional[str] = None
    caption: Optional[str] = None
    is_primary: bool = False

@router.post("/meta")
async def save_image_metadata(
    meta: ImageMetadataSchema,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Save metadata for a directly uploaded image
    """
    try:
        # Extract storage path from URL
        # Assumption: URL format ends with /device-images/<path>
        storage_path = meta.image_url.split('/device-images/')[-1]
        
        image_data = {
            "survey_code": meta.survey_id,
            "image_url": meta.image_url,
            "thumbnail_url": meta.thumbnail_url or meta.image_url, # Fallback to main if no thumb
            "storage_path": storage_path,
            "caption": meta.caption,
            "is_primary": meta.is_primary,
            "uploaded_by": str(current_user.id),
            "uploaded_at": datetime.utcnow().isoformat()
        }
        
        db_response = supabase.table('device_images').insert(image_data).execute()
        
        return JSONResponse(
            status_code=201,
            content={
                "success": True,
                "message": "Metadata saved successfully",
                "data": db_response.data[0] if db_response.data else image_data
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Metadata save failed: {str(e)}")


def generate_thumbnail(image_bytes: bytes, max_size: tuple = (400, 400)) -> bytes:
    """
    Generate a thumbnail from image bytes
    
    Args:
        image_bytes: Original image bytes
        max_size: Maximum thumbnail dimensions (width, height)
        
    Returns:
        bytes: Thumbnail image bytes in WebP format
    """
    try:
        # Open image from bytes
        img = Image.open(BytesIO(image_bytes))
        
        # Convert RGBA to RGB if necessary
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background
        
        # Generate thumbnail (maintains aspect ratio)
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        
        # Save to bytes
        output = BytesIO()
        img.save(output, format='WEBP', quality=80)
        output.seek(0)
        
        return output.getvalue()
    except Exception as e:
        logger.error(f"Thumbnail generation failed: {e}")
        return None


@router.post("/upload/{survey_code}")
async def upload_device_image(
    survey_code: str,
    file: UploadFile = File(...),
    caption: Optional[str] = None,
    is_primary: bool = False,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Upload an image for a specific device with automatic thumbnail generation
    
    Args:
        survey_code: Device survey code (e.g., BW-001, SM-001)
        file: Image file to upload
        caption: Optional image caption
        is_primary: Set as primary image for device
        
    Returns:
        Image URL, thumbnail URL, and metadata
    """
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Validate file size (30MB limit)
        contents = await file.read()
        if len(contents) > 30 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size must be less than 30MB")
        
        # Generate unique filenames
        file_ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
        unique_id = uuid.uuid4()
        main_filename = f"{survey_code}/{unique_id}.{file_ext}"
        thumb_filename = f"{survey_code}/{unique_id}_thumb.webp"
        
        # Upload main image to Supabase Storage
        storage_response = supabase.storage.from_('device-images').upload(
            main_filename,
            contents,
            file_options={"content-type": file.content_type}
        )
        
        # Get public URL for main image
        public_url = supabase.storage.from_('device-images').get_public_url(main_filename)
        
        # Generate and upload thumbnail
        thumbnail_url = public_url  # Fallback to main image
        try:
            thumbnail_bytes = generate_thumbnail(contents, max_size=(400, 400))
            if thumbnail_bytes:
                thumb_response = supabase.storage.from_('device-images').upload(
                    thumb_filename,
                    thumbnail_bytes,
                    file_options={"content-type": "image/webp"}
                )
                thumbnail_url = supabase.storage.from_('device-images').get_public_url(thumb_filename)
                logger.info(f"✅ Thumbnail generated: {thumb_filename}")
        except Exception as thumb_error:
            logger.warning(f"⚠️  Thumbnail generation failed, using main image: {thumb_error}")
        
        # Save metadata to database
        image_data = {
            "survey_code": survey_code,
            "image_url": public_url,
            "thumbnail_url": thumbnail_url,
            "storage_path": unique_filename,
            "caption": caption,
            "is_primary": is_primary,
            "uploaded_by": str(current_user.id),
            "uploaded_at": datetime.utcnow().isoformat()
        }
        
        db_response = supabase.table('device_images').insert(image_data).execute()
        
        return JSONResponse(
            status_code=201,
            content={
                "success": True,
                "message": "Image uploaded successfully",
                "data": db_response.data[0] if db_response.data else image_data
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.get("/{survey_code}")
async def get_device_images(
    survey_code: str,
    supabase: Client = Depends(get_supabase)
):
    """
    Get all images for a specific device
    
    Args:
        survey_code: Device survey code
        
    Returns:
        List of images with metadata
    """
    try:
        response = supabase.table('device_images')\
            .select('*')\
            .eq('survey_code', survey_code)\
            .order('uploaded_at', desc=True)\
            .execute()
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "count": len(response.data),
                "data": response.data
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch images: {str(e)}")


@router.delete("/{image_id}")
async def delete_device_image(
    image_id: str,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Delete a device image
    
    Args:
        image_id: UUID of the image to delete
        
    Returns:
        Success message
    """
    try:
        # Get image metadata
        image_response = supabase.table('device_images')\
            .select('*')\
            .eq('id', image_id)\
            .single()\
            .execute()
        
        if not image_response.data:
            raise HTTPException(status_code=404, detail="Image not found")
        
        image_data = image_response.data
        
        # Delete from storage
        supabase.storage.from_('device-images').remove([image_data['storage_path']])
        
        # Delete from database
        supabase.table('device_images').delete().eq('id', image_id).execute()
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Image deleted successfully"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete image: {str(e)}")


@router.patch("/{image_id}/primary")
async def set_primary_image(
    image_id: str,
    survey_code: str,
    current_user: User = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Set an image as the primary image for a device
    
    Args:
        image_id: UUID of the image
        survey_code: Device survey code
        
    Returns:
        Success message
    """
    try:
        # Unset all primary flags for this device
        supabase.table('device_images')\
            .update({"is_primary": False})\
            .eq('survey_code', survey_code)\
            .execute()
        
        # Set this image as primary
        supabase.table('device_images')\
            .update({"is_primary": True})\
            .eq('id', image_id)\
            .execute()
        
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "message": "Primary image updated"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update primary image: {str(e)}")
