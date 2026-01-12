"""
Device Images API Router
Handles image upload, retrieval, and deletion for survey devices
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from typing import List, Optional
import uuid
from datetime import datetime
from supabase import Client

from dashboard_app.core.config import get_settings
from dashboard_app.auth.permissions import get_current_user
from dashboard_app.schemas.user import User

router = APIRouter(prefix="/device-images", tags=["Device Images"])

# Supabase client dependency
def get_supabase() -> Client:
    settings = get_settings()
    from supabase import create_client
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)


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
    Upload an image for a specific device
    
    Args:
        survey_code: Device survey code (e.g., BW-001, SM-001)
        file: Image file to upload
        caption: Optional image caption
        is_primary: Set as primary image for device
        
    Returns:
        Image URL and metadata
    """
    try:
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Validate file size (15MB limit)
        contents = await file.read()
        if len(contents) > 15 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size must be less than 15MB")
        
        # Generate unique filename
        file_ext = file.filename.split('.')[-1]
        unique_filename = f"{survey_code}/{uuid.uuid4()}.{file_ext}"
        
        # Upload to Supabase Storage
        storage_response = supabase.storage.from_('device-images').upload(
            unique_filename,
            contents,
            file_options={"content-type": file.content_type}
        )
        
        # Get public URL
        public_url = supabase.storage.from_('device-images').get_public_url(unique_filename)
        
        # Save metadata to database
        image_data = {
            "survey_code": survey_code,
            "image_url": public_url,
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
