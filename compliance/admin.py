from django.contrib import admin
from .models import TaxDocument

@admin.register(TaxDocument)
class TaxDocumentAdmin(admin.ModelAdmin):
    # Columns to show in the list view
    list_display = ('id', 'user', 'original_filename', 'status', 'uploaded_at', 'is_processed')
    
    # Filters on the right side
    list_filter = ('status', 'is_processed', 'uploaded_at')
    
    # Search bar behavior
    search_fields = ('user__username', 'original_filename', 'flag_reason')
    
    # Make these fields read-only so you don't accidentally edit AI results
    readonly_fields = ('uploaded_at', 'extracted_data', 'flag_reason', 'is_processed')

    # Organize the detail view
    fieldsets = (
        ('User Info', {
            'fields': ('user', 'file', 'original_filename')
        }),
        ('AI Analysis', {
            'fields': ('status', 'flag_reason', 'is_processed', 'extracted_data')
        }),
        ('Metadata', {
            'fields': ('uploaded_at',)
        }),
    )
    