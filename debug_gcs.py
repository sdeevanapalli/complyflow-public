import os
import django
from django.conf import settings
from google.cloud import storage

# 1. Setup Django (to get your credentials from settings.py)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'complyflow_backend.settings')
django.setup()

def inspect_bucket():
    print(f"🕵️ Inspecting Bucket: {settings.GS_BUCKET_NAME}")
    
    try:
        # 2. Connect to Storage
        storage_client = storage.Client(credentials=settings.GS_CREDENTIALS)
        bucket = storage_client.bucket(settings.GS_BUCKET_NAME)
        
        # 3. List all files (Blobs)
        blobs = list(bucket.list_blobs())
        
        if not blobs:
            print("❌ The bucket is EMPTY.")
            print("   -> This means Django failed to upload the file entirely.")
        else:
            print(f"✅ Found {len(blobs)} files in the bucket:")
            print("-" * 40)
            for blob in blobs:
                print(f"   📄 Name: '{blob.name}'")
                print(f"      Size: {blob.size} bytes")
                print(f"      Type: {blob.content_type}")
            print("-" * 40)
            
            # 4. Verify the specific upload path logic
            # We simulate what the signal is trying to find
            print("\n🔍 Troubleshooting your specific error:")
            # Grab the last uploaded file for reference
            last_blob = blobs[-1] 
            print(f"   The actual file in cloud is:  '{last_blob.name}'")
            
            # Does it match the folder structure we expected?
            if "documents/user_" not in last_blob.name:
                print("   ⚠️ WARNING: The folder structure looks wrong.")
                
    except Exception as e:
        print(f"❌ Connection Error: {e}")

if __name__ == "__main__":
    inspect_bucket()
    