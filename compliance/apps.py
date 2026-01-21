import os
import threading
from django.apps import AppConfig

class ComplianceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'compliance'

    def ready(self):
        # 1. Import Signals (so the Signal logic works)
        import compliance.signals
        
        # 2. Start the Drive Monitor (Background Thread)
        # We check 'RUN_MAIN' to ensure this ONLY runs in the actual server process,
        # not the "reloader" process (preventing duplicate watchers).
        if os.environ.get('RUN_MAIN') == 'true':
            from .google_drive_monitor import start_watcher
            
            watcher_thread = threading.Thread(target=start_watcher, daemon=True)
            watcher_thread.start()