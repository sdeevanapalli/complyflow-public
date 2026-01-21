"""
Django settings for complyflow_backend project.
"""

from pathlib import Path
import environ
import os
import dj_database_url
from google.oauth2 import service_account

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()
# Allow reading .env file if it exists (for local dev)
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env('SECRET_KEY', default='django-insecure-fallback-key')

# SECURITY WARNING: don't run with debug turned on in production!
# Set DEBUG to False in your .env on Render
DEBUG = env.bool('DEBUG', default=True)

ALLOWED_HOSTS = ['*'] # Allow all hosts for now (Restrict this later for production)

# CORS Configuration
# Allow toggling via env for production debugging: CORS_ALLOW_ALL_ORIGINS=true
if env.bool('CORS_ALLOW_ALL_ORIGINS', default=DEBUG):
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOWED_ORIGINS = [
        env('FRONTEND_URL', default='http://localhost:5173'),
        "http://localhost:3000",
        "http://localhost:8080",
        "http://localhost:5173",  # Vite default port
    ]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    'rest_framework', 
    'rest_framework.authtoken',
    'rest_framework_simplejwt',
    'corsheaders', 
    'storages',  # ### NEW: Required for Google Cloud Storage
    
    # Auth Apps
    'dj_rest_auth',
    'dj_rest_auth.registration',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'django.contrib.sites',

    # Your Custom App
    'compliance',
]

SITE_ID = 1

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # ### RECOMMENDED: For static files on Render
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware', # ### NEW: Add CORS before CommonMiddleware
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'allauth.account.middleware.AccountMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'complyflow_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'complyflow_backend.wsgi.application'


# Database
# https://docs.djangoproject.com/en/6.0/ref/settings/#databases
# Ensure your .env has DATABASE_URL=postgres://user:pass@supabas...
DATABASES = {
    'default': dj_database_url.config(
        default=os.getenv('DATABASE_URL'),
        conn_max_age=600
    )
}


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    { 'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator', },
    { 'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator', },
]

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

ACCOUNT_LOGIN_METHODS = {'email'}
ACCOUNT_SIGNUP_FIELDS = ['email*', 'password1*', 'password2*']
ACCOUNT_USER_MODEL_USERNAME_FIELD = 'username'
ACCOUNT_EMAIL_VERIFICATION = 'none' 

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles') # ### NEW: Required for Render

# GOOGLE CLOUD STORAGE CONFIGURATION
# ----------------------------------
# GOOGLE_CREDS_PATH is set to the path of your service account credentials file.
# For open source, this file is not included. See credentials.json.example for the format.
GOOGLE_CREDS_PATH = os.path.join(BASE_DIR, 'credentials.json')

# Only load creds if the file exists (for local development or deployment)
if os.path.exists(GOOGLE_CREDS_PATH):
    GS_CREDENTIALS = service_account.Credentials.from_service_account_file(
        GOOGLE_CREDS_PATH,
        scopes=['https://www.googleapis.com/auth/cloud-platform']
    )
    # Set this for other libraries (like Vertex AI) to find automatically
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = GOOGLE_CREDS_PATH
else:
    GS_CREDENTIALS = None  # Credentials not loaded. See documentation for setup.

GS_BUCKET_NAME = env('GCS_BUCKET_NAME', default='your-bucket-name')
GS_PROJECT_ID = env('GCP_PROJECT_ID', default='your-project-id')

# Security: Make files private by default
GS_DEFAULT_ACL = None
GS_QUERYSTRING_AUTH = True 
GS_FILE_OVERWRITE = False
GS_EXPIRATION = 3600  # Links expire after 1 hour

# Connect Django to GCS
STORAGES = {
    "default": {
        "BACKEND": "storages.backends.gcloud.GoogleCloudStorage",
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}
# DOCUMENT AI CONFIGURATION
# ----------------------------------
DOCAI_PROJECT_ID = env('DOCAI_PROJECT_ID', default=env('GCP_PROJECT_ID', default='your-project-id'))
DOCAI_LOCATION = env('DOCAI_LOCATION', default='us')
DOCAI_PROCESSOR_ID = env('DOCAI_PROCESSOR_ID', default='your-processor-id')

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework Configuration
REST_FRAMEWORK = {
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'compliance.authentication_backends.GoogleTokenAuthentication',
        'dj_rest_auth.jwt_auth.JWTCookieAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
}

REST_AUTH = {
    'USE_JWT': True,
    'JWT_AUTH_COOKIE': 'complyflow-auth',
    'JWT_AUTH_REFRESH_COOKIE': 'complyflow-refresh-token',
    'JWT_AUTH_HTTPONLY': False, 
}

# Social Account Configuration
SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'APP': {
            # Set your Google OAuth credentials in your .env file. See .env.example for details.
            'client_id': env('GOOGLE_CLIENT_ID', default='YOUR_CLIENT_ID_HERE'),
            'secret': env('GOOGLE_CLIENT_SECRET', default='YOUR_CLIENT_SECRET_HERE'),
            'key': ''
        },
        'SCOPE': [
            'profile',
            'email',
        ],
        'AUTH_PARAMS': {
            'access_type': 'online',
        }
    }
}

# CSRF Configuration for API
CSRF_TRUSTED_ORIGINS = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8000',
    'http://localhost:8080',
]

# Optionally trust a configured production frontend origin
_frontend_url = env('FRONTEND_URL', default=None)
if _frontend_url:
    CSRF_TRUSTED_ORIGINS.append(_frontend_url)

