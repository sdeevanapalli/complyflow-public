from django.urls import path
from . import views

urlpatterns = [
    # Document management endpoint
    path('documents/', views.DocumentListCreateView.as_view(), name='document-list-create'),
    path('documents/<int:pk>/', views.DocumentDetailView.as_view(), name='document-detail'),
    # Chat endpoint for compliance queries
    path('chat/', views.chat_view, name='chat'),
    # Query history endpoint: now returns unique sessions
    path('history/', views.history_view, name='history'),
    # Specific conversation messages
    path('history/<uuid:conversation_id>/', views.conversation_detail_view, name='conversation-detail'),
    # Notification endpoints
    path('notifications/', views.notifications_view, name='notifications'),
    path('notifications/<int:pk>/', views.notifications_view, name='notification-detail'),
    path('notifications/stream/', views.notifications_stream, name='notifications-stream'),
    # Profile management endpoint
    path('profile/', views.UserProfileView.as_view(), name='profile'),
]