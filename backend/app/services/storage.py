"""
Supabase Storage Service — handles image upload/delete to Supabase Storage.

IMPORTANT: For product images to be publicly visible, the Supabase bucket
must be set to public. Go to:
  Supabase Dashboard → Storage → Buckets → product-images → Edit → Public: ON

If the bucket is private, images will return HTTP 400 when accessed directly.
"""
import uuid
import os
from flask import current_app
from supabase import create_client


def _get_supabase_client():
    """Create a Supabase client from app config."""
    url = current_app.config.get('SUPABASE_URL', '')
    key = current_app.config.get('SUPABASE_KEY', '')
    if not url or not key:
        raise ValueError('SUPABASE_URL and SUPABASE_KEY must be configured')
    return create_client(url, key)


def upload_image(file_data, file_name, folder='products'):
    """
    Upload an image to Supabase Storage.

    Returns:
        dict with 'url' (public URL) and 'path' (storage path)
    """
    try:
        supabase = _get_supabase_client()
        bucket = current_app.config.get('SUPABASE_BUCKET', 'product-images')

        # Generate unique filename to avoid collisions
        ext = os.path.splitext(file_name)[1].lower() or '.jpg'
        unique_name = f"{uuid.uuid4().hex}{ext}"
        storage_path = f"{folder}/{unique_name}"

        # Read file bytes
        if hasattr(file_data, 'read'):
            content = file_data.read()
        else:
            content = file_data

        # Upload to Supabase Storage
        supabase.storage.from_(bucket).upload(
            path=storage_path,
            file=content,
            file_options={"content-type": _get_content_type(ext)}
        )

        # Get public URL — works only if bucket is set to public in Supabase
        public_url = supabase.storage.from_(bucket).get_public_url(storage_path)

        # Ensure we got a plain string (newer SDK versions return str directly)
        if isinstance(public_url, dict):
            public_url = public_url.get('publicUrl') or public_url.get('publicURL', '')

        return {
            'url': str(public_url),
            'path': storage_path,
        }

    except Exception as e:
        current_app.logger.error(f'Image upload failed: {str(e)}')
        raise


def delete_image(storage_path):
    """Delete an image from Supabase Storage."""
    try:
        supabase = _get_supabase_client()
        bucket = current_app.config.get('SUPABASE_BUCKET', 'product-images')
        supabase.storage.from_(bucket).remove([storage_path])
    except Exception as e:
        current_app.logger.error(f'Image delete failed: {str(e)}')
        # Don't raise — deletion failures shouldn't break the flow


def _get_content_type(ext):
    """Map file extension to MIME type."""
    types = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
    }
    return types.get(ext, 'image/jpeg')
