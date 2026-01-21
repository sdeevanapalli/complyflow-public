# 🔧 ComplyFlow - Detailed Setup Guide

This guide provides comprehensive instructions for setting up ComplyFlow on your local machine or deploying it to production.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Google Cloud Platform Setup](#google-cloud-platform-setup)
3. [Database Setup](#database-setup)
4. [Backend Installation](#backend-installation)
5. [Frontend Installation](#frontend-installation)
6. [Running the Application](#running-the-application)
7. [Ingesting Documents](#ingesting-documents)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)
10. [Production Deployment](#production-deployment)

---

## 1. Prerequisites

### Required Software

Install the following on your system:

- **Python 3.10 or higher**
  - Windows: Download from [python.org](https://www.python.org/downloads/)
  - Mac: `brew install python@3.10`
  - Linux: `sudo apt-get install python3.10`

- **Node.js 18 or higher**
  - Download from [nodejs.org](https://nodejs.org/)
  - Or use nvm: `nvm install 18`

- **PostgreSQL 14+**
  - Windows: Download installer from [postgresql.org](https://www.postgresql.org/download/)
  - Mac: `brew install postgresql@14`
  - Linux: `sudo apt-get install postgresql-14`
  - **OR** use [Supabase](https://supabase.com/) (recommended)

- **Git**
  - Download from [git-scm.com](https://git-scm.com/)

### Required Accounts

1. **Google Cloud Platform Account**
   - Sign up at [cloud.google.com](https://cloud.google.com/)
   - Free tier includes $300 credit

2. **Supabase Account** (recommended for database)
   - Sign up at [supabase.com](https://supabase.com/)
   - Free tier available

---

## 2. Google Cloud Platform Setup

### Step 1: Create a GCP Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown → "New Project"
3. Enter project name: `complyflow` (or your choice)
4. Click "Create"

### Step 2: Enable Required APIs

Navigate to "APIs & Services" → "Library" and enable:

1. **Vertex AI API**
   - Search for "Vertex AI API"
   - Click "Enable"

2. **Document AI API**
   - Search for "Document AI API"
   - Click "Enable"

3. **Cloud Storage API**
   - Search for "Cloud Storage API"
   - Click "Enable"

4. **Google Drive API** (optional, for monitoring)
   - Search for "Google Drive API"
   - Click "Enable"

### Step 3: Create a Service Account

1. Go to "IAM & Admin" → "Service Accounts"
2. Click "+ CREATE SERVICE ACCOUNT"
3. Enter details:
   - **Name**: `complyflow-service-account`
   - **Description**: `Service account for ComplyFlow application`
4. Click "Create and Continue"
5. Grant the following roles:
   - `Vertex AI User`
   - `Document AI Editor`
   - `Storage Admin`
   - `Storage Object Admin`
6. Click "Continue" → "Done"

### Step 4: Generate Service Account Key

1. Click on the service account you just created
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Choose "JSON" format
5. Click "Create" - this downloads the key file
6. Save this file as `credentials.json` in your project root
   ```bash
   # Move the downloaded file to your project
   mv ~/Downloads/your-project-id-xxxxx.json /path/to/complyflow/credentials.json
   ```

⚠️ **SECURITY WARNING**: Never commit `credentials.json` to version control!

### Step 5: Create Cloud Storage Bucket

1. Go to "Cloud Storage" → "Buckets"
2. Click "CREATE BUCKET"
3. Enter bucket name: `complyflow-documents` (must be globally unique)
4. Choose location: `us-central1` (or your preferred region)
5. Choose "Standard" storage class
6. Access control: "Fine-grained"
7. Click "Create"

### Step 6: Set Up Document AI Processor

1. Go to "Document AI" → "Processors"
2. Click "CREATE PROCESSOR"
3. Select "Form Parser" or "Document OCR"
4. Choose region: `us` or `eu`
5. Enter processor name: `complyflow-parser`
6. Click "Create"
7. **Copy the Processor ID** from the URL:
   ```
   https://console.cloud.google.com/ai/document-ai/processors/[YOUR-PROCESSOR-ID]
   ```

### Step 7: Set Up OAuth 2.0 (for Google Sign-In)

1. Go to "APIs & Services" → "Credentials"
2. Click "+ CREATE CREDENTIALS" → "OAuth client ID"
3. If prompted, configure OAuth consent screen:
   - User Type: External
   - App name: ComplyFlow
   - User support email: [Your email]
   - Developer contact: [Your email]
   - Add scopes: `email`, `profile`, `openid`
4. Create OAuth Client ID:
   - Application type: "Web application"
   - Name: `ComplyFlow Web Client`
   - Authorized JavaScript origins:
     - `http://localhost:5173` (development)
     - Your production URL (e.g., `https://complyflow.app`)
   - Authorized redirect URIs:
     - `http://localhost:5173/auth/callback`
     - Your production callback URL
5. Click "Create"
6. **Copy the Client ID and Client Secret**

---

## 3. Database Setup

### Option A: Supabase (Recommended)

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com/)
   - Click "New Project"
   - Enter:
     - Name: `complyflow`
     - Database Password: [choose a strong password]
     - Region: Choose closest to you
   - Click "Create new project"

2. **Enable pgvector Extension**:
   - Go to "SQL Editor" in Supabase dashboard
   - Run this SQL:
     ```sql
     CREATE EXTENSION IF NOT EXISTS vector;
     ```

3. **Get Connection String**:
   - Go to "Settings" → "Database"
   - Under "Connection string" → "URI", copy the connection string
   - It looks like:
     ```
     postgresql://postgres:[YOUR-PASSWORD]@[HOST]:5432/postgres
     ```

### Option B: Local PostgreSQL

1. **Install PostgreSQL**:
   ```bash
   # Mac
   brew install postgresql@14
   brew services start postgresql@14

   # Ubuntu/Debian
   sudo apt-get install postgresql-14
   sudo systemctl start postgresql

   # Windows - use installer from postgresql.org
   ```

2. **Create Database**:
   ```bash
   # Connect to PostgreSQL
   psql postgres

   # In psql prompt:
   CREATE DATABASE complyflow;
   CREATE USER complyflow_user WITH PASSWORD '[your_secure_password]';
   GRANT ALL PRIVILEGES ON DATABASE complyflow TO complyflow_user;
   \q
   ```

3. **Install pgvector Extension**:
   ```bash
   # Mac
   brew install pgvector

   # Ubuntu/Debian
   sudo apt-get install postgresql-14-pgvector

   # Then in psql:
   psql complyflow
   CREATE EXTENSION vector;
   \q
   ```

4. **Connection String**:
   ```
   postgresql://complyflow_user:[your_secure_password]@localhost:5432/complyflow
   ```

---

## 4. Backend Installation

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/complyflow.git
cd complyflow
```

### Step 2: Create Virtual Environment

```bash
# Create virtual environment
python -m venv .venv

# Activate it:
# Windows:
.venv\Scripts\activate

# Mac/Linux:
source .venv/bin/activate
```

### Step 3: Install Python Dependencies

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**If you encounter issues**:
```bash
# Install system dependencies first (Ubuntu/Debian)
sudo apt-get install python3-dev libpq-dev

# Mac
brew install postgresql
```

### Step 4: Configure Environment Variables

1. **Copy template**:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file**:
   ```env
   # Database
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:5432/postgres

   # Django
   SECRET_KEY=django-insecure-CHANGE-THIS-IN-PRODUCTION
   DEBUG=True
   FRONTEND_URL=http://localhost:5173

   # Google Cloud
   GCP_PROJECT_ID=your-gcp-project-id
   GCS_BUCKET_NAME=your-bucket-name
   DOCAI_PROJECT_ID=your-gcp-project-id
   DOCAI_LOCATION=us
   DOCAI_PROCESSOR_ID=your-processor-id-from-step-2-6
   VERTEX_LOCATION=us-central1
   GEMINI_MODEL=gemini-2.0-flash

   # Google OAuth
   GOOGLE_CLIENT_ID=your-oauth-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-oauth-client-secret

   # CORS
   CORS_ALLOW_ALL_ORIGINS=True
   ```

3. **Generate a secure SECRET_KEY** (for production):
   ```bash
   python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
   ```

### Step 5: Place Service Account Credentials

```bash
# Copy your downloaded GCP credentials file
cp /path/to/downloaded/credentials.json ./credentials.json

# Verify it exists
ls -la credentials.json
```

### Step 6: Run Database Migrations

```bash
python manage.py migrate
```

Expected output:
```
Operations to perform:
  Apply all migrations: admin, auth, compliance, contenttypes, sessions, ...
Running migrations:
  Applying compliance.0001_initial... OK
  Applying compliance.0002_userprofile... OK
  ...
```

### Step 7: Create Superuser (Optional)

```bash
python manage.py createsuperuser
```

Follow prompts to create an admin account.

### Step 8: Test Backend

```bash
python manage.py runserver
```

Visit `http://localhost:8000/admin` - you should see the Django admin login.

---

## 5. Frontend Installation

### Step 1: Navigate to Frontend Directory

```bash
cd frontend
```

### Step 2: Install Node Dependencies

```bash
npm install
```

### Step 3: Configure Environment

1. **Copy template**:
   ```bash
   cp .env.example .env
   ```

2. **Edit `frontend/.env`**:
   ```env
   VITE_API_BASE_URL=http://localhost:8000/api
   VITE_GOOGLE_CLIENT_ID=your-oauth-client-id.apps.googleusercontent.com
   ```

### Step 4: Test Frontend

```bash
npm run dev
```

Visit `http://localhost:5173` - you should see the ComplyFlow homepage.

---

## 6. Running the Application

### Development Mode

You need **two terminal windows**:

**Terminal 1 - Backend**:
```bash
# From project root
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
python manage.py runserver
```

**Terminal 2 - Frontend**:
```bash
# From project root
cd frontend
npm run dev
```

### Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api
- **Admin Panel**: http://localhost:8000/admin
- **API Docs**: http://localhost:8000/api/schema/swagger-ui/

---

## 7. Ingesting Documents

ComplyFlow needs a knowledge base of tax documents to answer questions.

### Option 1: Use Sample Documents

The repository includes sample PDFs in `data/raw_pdfs/`.

```bash
# Run ingestion script
python compliance/ingest_to_db.py
```

This will:
1. Read all PDFs from `data/raw_pdfs/`
2. Extract text from each document
3. Split into chunks
4. Generate embeddings using Vertex AI
5. Store in PostgreSQL with pgvector

### Option 2: Add Your Own Documents

1. Place PDF files in appropriate folders:
   ```
   data/raw_pdfs/
   ├── acts/
   │   └── your-act.pdf
   ├── circulars/
   │   └── your-circular.pdf
   └── notifications/
       └── your-notification.pdf
   ```

2. Run ingestion:
   ```bash
   python compliance/ingest_to_db.py
   ```

### Verify Ingestion

```bash
# Run test query
python compliance/retriever.py
```

Expected output: Search results from your ingested documents.

---

## 8. Testing

### Backend Tests

```bash
# Run Django tests
python manage.py test

# Run specific app tests
python manage.py test compliance

# With coverage
pip install coverage
coverage run --source='.' manage.py test
coverage report
```

### Frontend Tests

```bash
cd frontend

# Run tests
npm test

# With coverage
npm test -- --coverage
```

### Manual Testing

1. **Test Authentication**:
   - Go to http://localhost:5173
   - Click "Sign in with Google"
   - Verify successful login

2. **Test Chat**:
   - Navigate to Chat page
   - Ask: "What is GST?"
   - Verify response with citations

3. **Test Document Upload**:
   - Go to Upload page
   - Upload a sample invoice PDF
   - Verify processing and compliance analysis

---

## 9. Troubleshooting

### Common Issues

#### Database Connection Error

```
django.db.utils.OperationalError: could not connect to server
```

**Solution**:
- Verify `DATABASE_URL` in `.env` is correct
- Check if PostgreSQL is running
- Test connection: `psql [YOUR_DATABASE_URL]`

#### Google Cloud Authentication Error

```
google.auth.exceptions.DefaultCredentialsError
```

**Solution**:
- Verify `credentials.json` exists in project root
- Check file permissions: `chmod 600 credentials.json`
- Verify service account has required roles

#### Frontend Can't Connect to Backend

```
Network Error / CORS Error
```

**Solution**:
- Verify backend is running on port 8000
- Check `VITE_API_BASE_URL` in `frontend/.env`
- Verify `CORS_ALLOW_ALL_ORIGINS=True` in backend `.env`

#### Vertex AI / Gemini Error

```
403 Forbidden: Vertex AI API not enabled
```

**Solution**:
- Enable Vertex AI API in GCP Console
- Wait 5-10 minutes for API to propagate
- Verify service account has "Vertex AI User" role

#### pgvector Extension Not Found

```
django.db.utils.ProgrammingError: type "vector" does not exist
```

**Solution**:
```sql
-- Connect to database
psql [YOUR_DATABASE_URL]

-- Create extension
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## 10. Production Deployment

### Environment Configuration

1. **Update `.env` for production**:
   ```env
   DEBUG=False
   SECRET_KEY=[generate-new-secure-key]
   ALLOWED_HOSTS=your-domain.com
   FRONTEND_URL=https://your-frontend-domain.com
   CORS_ALLOW_ALL_ORIGINS=False
   ```

2. **Update `settings.py`**:
   - Add your domain to `ALLOWED_HOSTS`
   - Configure `CORS_ALLOWED_ORIGINS`
   - Set up `STATIC_ROOT` and run `collectstatic`

### Deployment Options

#### Option 1: Render.com

**Backend**:
1. Create new Web Service
2. Connect GitHub repository
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `gunicorn complyflow_backend.wsgi:application`
5. Add environment variables from `.env`
6. Add `credentials.json` content as environment variable

**Frontend**:
1. Create new Static Site
2. Build Command: `cd frontend && npm install && npm run build`
3. Publish Directory: `frontend/dist`
4. Add environment variables

#### Option 2: Railway.app

1. Connect GitHub repository
2. Railway auto-detects Django
3. Add PostgreSQL database
4. Add environment variables
5. Deploy

#### Option 3: Google Cloud Run

```bash
# Build and deploy backend
gcloud run deploy complyflow-backend \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated

# Deploy frontend to Cloud Storage + Cloud CDN
cd frontend
npm run build
gsutil -m rsync -r dist gs://your-frontend-bucket
```

### Post-Deployment Checklist

- [ ] SSL/TLS certificate installed
- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Static files collected
- [ ] CORS configured for your domain
- [ ] Monitoring and logging set up
- [ ] Backups configured for database
- [ ] Health check endpoint working
- [ ] Rate limiting enabled
- [ ] Security headers configured

---

## 🎉 You're All Set!

If you've followed this guide, you should have:
- ✅ A fully functional local development environment
- ✅ Google Cloud services configured
- ✅ Database with pgvector extension
- ✅ Frontend and backend communicating
- ✅ Knowledge base ingested and searchable

### Next Steps

1. **Customize the knowledge base** with your own documents
2. **Configure the autonomous agent** for Google Drive monitoring
3. **Deploy to production** using your preferred platform
4. **Set up monitoring** and logging
5. **Invite users** and gather feedback

### Need Help?

- 📖 Check the [README.md](README.md) for feature overview
- 🐛 Report issues on [GitHub Issues](https://github.com/yourusername/complyflow/issues)
- 💬 Join discussions on [GitHub Discussions](https://github.com/yourusername/complyflow/discussions)

---

**Happy Coding! 🚀**
