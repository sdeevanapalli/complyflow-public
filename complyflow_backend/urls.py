from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # This connects your new API endpoints:
    path('api/', include('compliance.urls')), 
]