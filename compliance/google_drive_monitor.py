import os
import sys
# Add the project root directory to Python's search path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import time
import io
from googleapiclient.discovery import build
from google.oauth2 import service_account
from googleapiclient.http import MediaIoBaseDownload
from .ingest_to_db import ingest_single_file  # Uses your existing ingestion logic
from .models import GlobalNotification

# --- CONFIGURATION ---
# 1. Use the SAME credentials you used for Django/GCS
SERVICE_ACCOUNT_FILE = 'credentials.json' 
SCOPES = ['https://www.googleapis.com/auth/drive.readonly']

# 2. Paste your Google Drive Folder ID here
FOLDER_ID = '1djanZLwobsVmBDY7XAmlZyU5zT-_2D7Y'

DOWNLOAD_DIR = "data/live_downloads/"
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

# Use monitor start time as cutoff for "new" documents
# Google Drive API uses RFC 3339 format
MONITOR_START_TIME = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())

def authenticate_drive():
    creds = service_account.Credentials.from_service_account_file(
        SERVICE_ACCOUNT_FILE, scopes=SCOPES)
    return build('drive', 'v3', credentials=creds)

def download_file(service, file_id, file_name):
    request = service.files().get_media(fileId=file_id)
    fh = io.BytesIO()
    downloader = MediaIoBaseDownload(fh, request)
    
    done = False
    while done is False:
        status, done = downloader.next_chunk()
    
    # Save to local disk
    local_path = os.path.join(DOWNLOAD_DIR, file_name)
    with open(local_path, 'wb') as f:
        f.write(fh.getvalue())
        
    return local_path

def check_drive_folder():
    service = authenticate_drive()
    # Query: List ALL PDF files for total count reference
    total_query = f"'{FOLDER_ID}' in parents and mimeType='application/pdf' and trashed=false"
    total_results = service.files().list(q=total_query, pageSize=100, fields="files(id, name)").execute()
    total_pdfs = total_results.get('files', [])
    print(f"   (Folder contains {len(total_pdfs)} total PDFs)")

    # Query: List only NEW PDF files added AFTER the monitor started
    new_query = (
        f"'{FOLDER_ID}' in parents and "
        f"mimeType='application/pdf' and "
        f"trashed=false and "
        f"createdTime > '{MONITOR_START_TIME}'"
    )
    
    results = service.files().list(
        q=new_query, pageSize=10, fields="nextPageToken, files(id, name, createdTime)").execute()
    items = results.get('files', [])

    print(f"   (Detected {len(items)} NEW documents since startup)")

    if not items:
        return

    for item in items:
        file_name = item['name']
        file_id = item['id']
        local_path = os.path.join(DOWNLOAD_DIR, file_name)

        # 1. CHECK: Do we already have this file notified?
        if GlobalNotification.objects.filter(doc_name=file_name).exists():
            continue

        # 2. DOWNLOAD
        print(f"[Monitor] New Document Detected: {file_name}")
        try:
            saved_path = download_file(service, file_id, file_name)
            
            # 3. Trigger Ingestion (Uses the correct function name from imports)
            ingest_single_file(saved_path, category="notifications")
            
            # --- NEW: AGENTIC IMPACT ANALYSIS ---
            from .agent_logic import generate_autonomous_action
            
            # Extract basic text for analysis
            try:
                import pypdf
                reader = pypdf.PdfReader(saved_path)
                preview_text = ""
                for page in reader.pages[:3]: # Take first 3 pages
                    preview_text += page.extract_text()
            except Exception as e:
                print(f"[Monitor] PDF text extraction failed: {e}")
                preview_text = f"New document {file_name} was added. Please review details."

            agent_analysis = generate_autonomous_action(preview_text, file_name)
            
            # 4. Create Notification with Agent Insight
            GlobalNotification.objects.create(
                title=f"New Document: {file_name}",
                message=agent_analysis.get('ai_analysis', f"A new PDF '{file_name}' has been added to your drive and is now searchable."),
                doc_name=file_name,
                source_url=f"gdrive://{file_id}",
                impact_level=agent_analysis.get('impact_level', 'LOW'),
                action_draft=agent_analysis.get('action_draft', '')
            )
            print(f"[Done] Agentized notification created for {file_name}")
            
        except Exception as e:
            print(f"[Error] Failed to process {file_name}: {e}")

def start_watcher():
    """
    The main loop that runs forever.
    """
    print("[Start] Google Drive Monitor Background Task Started...")
    
    global service
    while True:
        try:
            check_drive_folder()
        except Exception as e:
            # Re-initialize service if it looks like a connection/auth error
            print(f"[Error] Monitor Error: {e}. Attempting to reconnect...")
            try:
                creds = service_account.Credentials.from_service_account_file(
                    SERVICE_ACCOUNT_FILE, scopes=SCOPES)
                service = build('drive', 'v3', credentials=creds)
            except:
                pass
            
        # Poll every 45 seconds
        time.sleep(45)