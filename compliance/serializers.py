from rest_framework import serializers
from .models import TaxDocument, UserProfile, ComplianceQuery, GlobalNotification

class TaxDocumentSerializer(serializers.ModelSerializer):
    # We add a calculated field to make the status color-coded in frontend easily
    status_color = serializers.SerializerMethodField()

    class Meta:
        model = TaxDocument
        fields = [
            'id', 
            'file', 
            'original_filename', 
            'status', 
            'status_color', 
            'flag_reason', 
            'is_processed', 
            'uploaded_at'
        ]
        read_only_fields = ['status', 'flag_reason', 'is_processed', 'uploaded_at', 'original_filename', 'status_color']

    def get_status_color(self, obj):
        if obj.status == 'VALID': return 'green'
        if obj.status == 'FLAGGED': return 'orange'
        if obj.status == 'ERROR': return 'red'
        return 'gray' # Pending

    def create(self, validated_data):
        # Auto-save the original filename for display
        file_obj = validated_data.get('file')
        if file_obj:
            validated_data['original_filename'] = file_obj.name
        return super().create(validated_data)

class UserProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['profession', 'company_name', 'bio', 'email', 'full_name', 'updated_at']
        read_only_fields = ['updated_at']

class ComplianceQuerySerializer(serializers.ModelSerializer):
    class Meta:
        model = ComplianceQuery
        fields = ['id', 'conversation_id', 'query', 'response', 'timestamp', 'status']

class GlobalNotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = GlobalNotification
        fields = ['id', 'title', 'message', 'doc_name', 'source_url', 'impact_level', 'action_draft', 'created_at']
        read_only_fields = ['timestamp', 'status']