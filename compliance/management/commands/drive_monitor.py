import os
import io
import time
from django.core.management.base import BaseCommand
from googleapiclient.discovery import build
from google.oauth2 import service_account
from googleapiclient.http import MediaIoBaseDownload
from django.conf import settings
from compliance.models import GlobalNotification
from compliance.ingest_to_db import ingest_single_file

class Command(BaseCommand):
    help = 'Monitors a Google Drive folder for new PDF files and ingests them.'

    # --- CONFIGURATION ---
    SERVICE_ACCOUNT_FILE = 'credentials.json' 
    SCOPES = ['https://www.googleapis.com/auth/drive.readonly']
    FOLDER_ID = '1djanZLwobsVmBDY7XAmlZyU5zT-_2D7Y'
    DOWNLOAD_DIR = "data/live_downloads/"

    def handle(self, *args, **options):
        os.makedirs(self.DOWNLOAD_DIR, exist_ok=True)
        self.stdout.write(self.style.SUCCESS("[Start] Google Drive Monitor Command Started..."))
        
        while True:
            try:
                self.check_drive_folder()
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"[Error] Monitor Error: {e}"))
                
            # Poll every 120 seconds
            time.sleep(120)

    def authenticate_drive(self):
        creds = service_account.Credentials.from_service_account_file(
            self.SERVICE_ACCOUNT_FILE, scopes=self.SCOPES)
        return build('drive', 'v3', credentials=creds)

    def download_file(self, service, file_id, file_name):
        request = service.files().get_media(fileId=file_id)
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request)
        
        done = False
        while done is False:
            status, done = downloader.next_chunk()
        
        local_path = os.path.join(self.DOWNLOAD_DIR, file_name)
        with open(local_path, 'wb') as f:
            f.write(fh.getvalue())
            
        return local_path

    def check_drive_folder(self):
        service = self.authenticate_drive()
        self.stdout.write(f"[Monitor] Watching Google Drive Folder: {self.FOLDER_ID}...")
        
        query = f"'{self.FOLDER_ID}' in parents and mimeType='application/pdf' and trashed=false"
        
        results = service.files().list(
            q=query, pageSize=10, fields="nextPageToken, files(id, name)").execute()
        items = results.get('files', [])

        if not items:
            return

        for item in items:
            file_name = item['name']
            file_id = item['id']
            local_path = os.path.join(self.DOWNLOAD_DIR, file_name)

            # Check if notification already exists for this file
            if GlobalNotification.objects.filter(doc_name=file_name).exists():
                self.stdout.write(f"   (Skipping {file_name} - already notified)")
                continue

            # Check local file as backup check
            if os.path.exists(local_path):
                self.stdout.write(f"   (Skipping {file_name} - file exists locally)")
                continue
            
            self.stdout.write(self.style.SUCCESS(f"[New] New Document Detected: {file_name}"))
            try:
                saved_path = self.download_file(service, file_id, file_name)
                
                # 1. Ingest into Knowledge Base
                ingest_single_file(saved_path, category="circulars", source_url=f"gdrive://{file_id}")
                
                # 2. Create Global Notification
                notif = GlobalNotification.objects.create(
                    title="New Legal Document Alert",
                    message=f"A new document '{file_name}' has been added to the compliance database. Click to discuss its impact.",
                    doc_name=file_name,
                    source_url=f"gdrive://{file_id}"
                )
                self.stdout.write(self.style.SUCCESS(f"[Done] Created Notification ID {notif.id} for: {file_name}"))
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"[Error] Failed to process {file_name}: {e}"))
