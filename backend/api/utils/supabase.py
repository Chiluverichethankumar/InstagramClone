# backend/api/utils/supabase.py
import os
from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "files")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def upload_to_supabase(file_obj, path: str):
    try:
        file_obj.seek(0)
        data = file_obj.read()
        if not data:
            print("[ERROR] File is empty!")
            return None

        content_type = getattr(file_obj, "content_type", "application/octet-stream")
        print(f"[UPLOAD START] Path: {path} | Size: {len(data)} bytes | Type: {content_type}")

        res = supabase.storage.from_(SUPABASE_BUCKET).upload(
            path=path,
            file=data,
            file_options={"content-type": content_type}
        )

        print(f"[SUPABASE UPLOAD RESPONSE] {res}")

        if isinstance(res, dict) and res.get("error"):
            print(f"[UPLOAD ERROR] {res['error']}")
            return None
        if hasattr(res, "error") and res.error:
            print(f"[UPLOAD ERROR] {res.error}")
            return None

        public_url_res = supabase.storage.from_(SUPABASE_BUCKET).get_public_url(path)
        print(f"[PUBLIC URL RAW] {public_url_res}")

        if isinstance(public_url_res, dict):
            url = public_url_res.get("public_url") or public_url_res.get("publicURL")
        else:
            url = str(public_url_res)

        if not url or "supabase.co" not in url:
            print(f"[ERROR] Invalid public URL: {url}")
            return None

        print(f"[SUCCESS] Final URL: {url}")
        return url

    except Exception as e:
        print(f"[FATAL EXCEPTION] Upload failed for {path}: {e}")
        import traceback
        traceback.print_exc()
        return None

def remove_paths(paths: list):
    try:
        if not paths:
            return
        print(f"[DELETE] Removing: {paths}")
        res = supabase.storage.from_(SUPABASE_BUCKET).remove(paths)
        print(f"[DELETE RESPONSE] {res}")
    except Exception as e:
        print(f"[DELETE EXCEPTION] {e}")
        import traceback
        traceback.print_exc()