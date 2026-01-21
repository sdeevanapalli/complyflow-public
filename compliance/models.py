from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
import uuid
import os

# 1. Dynamic Path Function
# This ensures every user gets their own folder: "documents/user_1/..."
def user_directory_path(instance, filename):
    # Extension extraction (e.g., '.pdf')
    ext = filename.split('.')[-1]
    # New filename: UUID + extension (prevents name collisions)
    filename = f'{uuid.uuid4()}.{ext}'
    # Return path: documents/user_<id>/<filename>
    return f'documents/user_{instance.user.id}/{filename}'

# 2. The Main Model
class TaxDocument(models.Model):
    # Relationship: One User can have many Documents
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents')
    
    # The File: Stored in GCS
    file = models.FileField(upload_to=user_directory_path)
    original_filename = models.CharField(max_length=255, help_text="Original name of the uploaded file")
    
    # Metadata
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    # AI Processing Status
    is_processed = models.BooleanField(default=False)
    
    # Extracted Data (Stores the JSON returned by Google Doc AI)
    extracted_data = models.JSONField(null=True, blank=True)
    
    # Verification Status (Result of Supabase cross-check)
    STATUS_CHOICES = [
        ('PENDING', 'Pending Analysis'),
        ('VALID', 'Valid'),
        ('FLAGGED', 'Flagged for Review'),
        ('ERROR', 'Processing Error'),
    ]
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    flag_reason = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Doc {self.id} - {self.user.username} ({self.status})"

    # Helper to print the file name nicely
    def save(self, *args, **kwargs):
        # If this is a new file (no ID yet), save the original name
        if not self.pk and self.file:
            self.original_filename = self.file.name
        super().save(*args, **kwargs)

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    profession = models.CharField(max_length=100, blank=True, null=True, help_text="User's profession (e.g., CA, Lawyer, Business Owner)")
    company_name = models.CharField(max_length=200, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Profile for {self.user.email}"

class ComplianceQuery(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='queries')
    conversation_id = models.UUIDField(default=uuid.uuid4, help_text="Groups messages in a single chat session")
    query = models.TextField()
    response = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, default='completed')

    class Meta:
        verbose_name_plural = "Compliance Queries"
        ordering = ['-timestamp']
    def __str__(self):
        return f"Query by {self.user.username} - {self.timestamp.strftime('%Y-%m-%d')}"

class GlobalNotification(models.Model):
    title = models.CharField(max_length=255)
    message = models.TextField()
    doc_name = models.CharField(max_length=255)
    source_url = models.URLField(max_length=500, null=True, blank=True)
    
    # Agentic Features
    impact_level = models.CharField(max_length=20, default='LOW') # LOW, MEDIUM, HIGH
    action_draft = models.TextField(null=True, blank=True) # Drafting of email/checklist
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)

@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()