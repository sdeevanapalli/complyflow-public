import logging
from django.contrib.auth.models import User
from rest_framework import authentication
from rest_framework import exceptions
from google.oauth2 import id_token
from google.auth.transport import requests
from django.conf import settings

logger = logging.getLogger(__name__)

class GoogleTokenAuthentication(authentication.BaseAuthentication):
    """
    Custom authentication backend for verifying Google ID tokens.
    
    The frontend sends the Google ID token in the Authorization header:
    Authorization: Bearer <google_id_token>
    """
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header:
            return None

        try:
            # Format should be: Bearer <token>
            parts = auth_header.split()
            if len(parts) != 2 or parts[0].lower() != 'bearer':
                return None
            
            token = parts[1]
            
            # 1. Get Client ID from settings
            # We first check SOCIALACCOUNT_PROVIDERS, then fall back to env/direct setting
            client_id = None
            if hasattr(settings, 'SOCIALACCOUNT_PROVIDERS'):
                google_provider = settings.SOCIALACCOUNT_PROVIDERS.get('google', {})
                client_id = google_provider.get('APP', {}).get('client_id')
            
            if not client_id:
                # Last resort - check env named variable directly if social-auth isn't fully set
                client_id = getattr(settings, 'GOOGLE_CLIENT_ID', None)

            if not client_id:
                logger.error("GOOGLE_CLIENT_ID not found in settings. Check SOCIALACCOUNT_PROVIDERS.")
                return None

            # 2. Verify with Google
            try:
                idinfo = id_token.verify_oauth2_token(token, requests.Request(), client_id)
                
                # 3. Validation
                if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                    raise exceptions.AuthenticationFailed('Wrong issuer.')

                # 4. Get/Create User
                email = idinfo.get('email')
                if not email:
                    raise exceptions.AuthenticationFailed('Email not provided by Google.')

                given_name = (idinfo.get('given_name') or '').strip()
                family_name = (idinfo.get('family_name') or '').strip()
                display_name = (idinfo.get('name') or '').strip()

                # We use email as the lookup. In some setups, 'sub' (google id) is better.
                user, created = User.objects.get_or_create(
                    email=email,
                    defaults={
                        'username': email,  # Fallback username
                        'first_name': given_name or (display_name if display_name else ''),
                        'last_name': family_name,
                    }
                )

                # Keep user profile details fresh on subsequent logins
                changed = False
                if not user.username:
                    user.username = email
                    changed = True
                # Update names if missing, or set from display_name/email local part
                if not user.first_name:
                    if given_name:
                        user.first_name = given_name
                    elif display_name:
                        user.first_name = display_name
                    else:
                        user.first_name = email.split('@')[0]
                    changed = True
                if not user.last_name and family_name:
                    user.last_name = family_name
                    changed = True

                if changed:
                    user.save(update_fields=['username', 'first_name', 'last_name'])
                    logger.info(f"Updated user details from Google Login: {email}")

                if created:
                    logger.info(f"Created new user via Google Login: {email}")

                return (user, token)

            except ValueError as e:
                # Invalid token
                logger.warning(f"Invalid Google ID Token attempt: {str(e)}")
                raise exceptions.AuthenticationFailed(f'Invalid Google Token: {str(e)}')

        except Exception as e:
            logger.error(f"Unexpected error in GoogleTokenAuthentication: {str(e)}")
            return None

    def authenticate_header(self, request):
        return 'Bearer'
