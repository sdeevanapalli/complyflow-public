import os
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import time
from .ingest_to_db import ingest_single_file # Import our new helper

# CONFIG
CBIC_URL = "https://taxinformation.cbic.gov.in/central-tax-notifications" 
# ^ Note: You might need to inspect the network tab if they use an API.
# For this example, let's assume we are scraping a generic list page.

DOWNLOAD_DIR = "data/live_downloads/"
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

def get_latest_notifications():
    print("[Monitor] Checking CBIC Portal for updates...")
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        response = requests.get(CBIC_URL, headers=headers)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        new_docs = []
        
        # LOGIC: Find all links ending in .pdf
        # You will need to inspect the CBIC HTML to find the exact Table Class
        # This is a generic finder for demonstration:
        for link in soup.find_all('a', href=True):
            href = link['href']
            if href.endswith('.pdf'):
                full_url = urljoin(CBIC_URL, href)
                title = link.get_text(strip=True) or "Untitled Notification"
                new_docs.append({"url": full_url, "title": title})
                
        return new_docs[:5] # Just check the top 5 newest ones
        
    except Exception as e:
        print(f"[Error] Connection failed: {e}")
        return []

def check_and_ingest():
    latest_docs = get_latest_notifications()
    
    for doc in latest_docs:
        filename = doc['url'].split('/')[-1]
        local_path = os.path.join(DOWNLOAD_DIR, filename)
        
        # 1. CHECK LOCAL: Have we processed this file session?
        # (Better: Check Supabase DB, but file check is faster for hackathon)
        if os.path.exists(local_path):
            print(f"SKIP: Already have {filename}")
            continue
            
        # 2. DOWNLOAD
        print(f"[New] New Update Found: {doc['title']}")
        try:
            r = requests.get(doc['url'])
            with open(local_path, 'wb') as f:
                f.write(r.content)
            
            # 3. TRIGGER INGESTION (The "Live" part)
            # We assume these are 'notifications' category
            ingest_single_file(local_path, category="notifications", source_url=doc['url'])
            
        except Exception as e:
            print(f"Failed to download {filename}: {e}")

if __name__ == "__main__":
    # Run this loop forever (or set as a Cron job)
    print("[Start] CBIC Live Monitor Started...")
    while True:
        check_and_ingest()
        print("zzZ Sleeping for 1 hour...")
        time.sleep(3600) # Check every hour