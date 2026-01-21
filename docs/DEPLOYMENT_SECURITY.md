# ComplyFlow - Comprehensive Security & Deployment Guide

## 🔒 Security Best Practices

### 1. Credentials & Secrets Management
- **Never commit credentials to Git**: Use `.env.example` and `credentials.json.example` as templates
- **Use environment variables**: All sensitive data should be in `.env` file (excluded from Git)
- **Rotate credentials regularly**: Generate new API keys and update them periodically
- **Use secrets management**: In production, use cloud providers' secret managers (e.g., AWS Secrets Manager, Google Secret Manager)

### 2. Google Cloud Setup

#### Create a GCP Project
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project called "ComplyFlow"
3. Enable billing for your project

#### Enable Required APIs
1. Navigate to **APIs & Services** → **Library**
2. Search for and enable:
   - Vertex AI API
   - Document AI API
   - Cloud Storage API
   - Google Drive API (optional, for document monitoring)

#### Create Service Account
1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **Service Account**
3. Fill in service account details:
   - Service Account Name: `django-backend-agent`
   - Service Account ID: auto-generated
4. Grant roles: `Editor` (for development, use `Viewer` + specific roles for production)
5. Create and download a JSON key:
   - Click on the service account
   - Go to **Keys** tab
   - Add Key → Create new key → JSON
   - Save as `credentials.json` in project root

#### Create Cloud Storage Bucket
1. Go to **Cloud Storage** → **Buckets**
2. Create a bucket:
   - Name: `complyflow-{your-project-id}`
   - Region: Choose closest to your users
   - Uniform bucket-level access: Enable
3. Update `GCS_BUCKET_NAME` in `.env`

### 3. Database Security (PostgreSQL with Supabase)

1. Go to [Supabase](https://supabase.com) and create a new project
2. Get your connection string from **Project Settings** → **Database**
3. Add to `.env`:
   ```
   DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres
   ```
4. Run migrations:
   ```bash
   python manage.py migrate
   ```

**Production Tips**:
- Use strong passwords (20+ characters, mix of letters/numbers/symbols)
- Enable SSL connections
- Restrict database access to your application servers only
- Use read-only replicas for analytics
- Enable automated backups

### 4. OAuth 2.0 Setup (Google Sign-In)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. **APIs & Services** → **Credentials**
3. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
4. Configure OAuth consent screen:
   - User type: External
   - Fill in app information
   - Add required scopes: `email`, `profile`
5. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Name: ComplyFlow Frontend
   - Authorized JavaScript origins:
     - `http://localhost:5173` (dev)
     - `https://yourdomain.com` (production)
   - Authorized redirect URIs:
     - `http://localhost:8000/auth/callback` (dev)
     - `https://yourdomain.com/auth/callback` (production)
6. Copy Client ID and Client Secret to `.env`:
   ```
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

### 5. Django Secret Key

Generate a secure SECRET_KEY for production:
```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Add to `.env`:
```
SECRET_KEY=your-generated-key-here
```

---

## 🚀 Deployment Guide

### Local Development

1. **Clone and setup**:
   ```bash
   git clone https://github.com/yourusername/complyflow.git
   cd complyflow
   
   # Copy environment templates
   cp .env.example .env
   cp credentials.json.example credentials.json
   cp frontend/.env.example frontend/.env
   
   # Edit .env files with your values
   ```

2. **Backend setup**:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver
   ```

3. **Frontend setup**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. Access at: `http://localhost:5173`

### Production Deployment (Render)

#### Backend Deployment

1. **Create Render account** and connect your GitHub repo
2. **Create new Web Service**:
   - Name: `complyflow-backend`
   - Environment: Python 3.11
   - Build command: `pip install -r requirements.txt && python manage.py migrate`
   - Start command: `gunicorn complyflow_backend.wsgi:application --bind 0.0.0.0:$PORT`

3. **Set environment variables**:
   - Add all `.env` variables in Render dashboard
   - Never paste actual credentials; use Render's secret management

4. **Database setup**:
   - Use Supabase PostgreSQL
   - Add `DATABASE_URL` to environment variables

#### Frontend Deployment (Vercel)

1. **Create Vercel account** and connect your GitHub repo
2. **Deploy frontend**:
   - Framework: Vite
   - Root Directory: `frontend`
   - Build command: `npm run build`
   - Install command: `npm install`

3. **Set environment variables**:
   - `VITE_API_BASE_URL`: Your Render backend URL
   - `VITE_GOOGLE_CLIENT_ID`: Your production OAuth Client ID

### Production Checklist

- [ ] Set `DEBUG=False` in production `.env`
- [ ] Generate and use a secure `SECRET_KEY`
- [ ] Configure `ALLOWED_HOSTS` to your domain
- [ ] Set proper CORS origins (not `*`)
- [ ] Use HTTPS/SSL certificates
- [ ] Enable database backups
- [ ] Set up logging and monitoring
- [ ] Configure email notifications
- [ ] Test OAuth flow end-to-end
- [ ] Set up rate limiting
- [ ] Enable CSRF protection
- [ ] Review and harden security headers

---

## 🔧 Docker Deployment

```bash
# Build image
docker build -t complyflow .

# Run locally
docker run -p 8000:8000 \
  --env-file .env \
  complyflow

# Push to Docker Hub
docker tag complyflow yourusername/complyflow:latest
docker push yourusername/complyflow:latest
```

---

## 📊 Monitoring & Logging

### Application Logs
```bash
# Local development
python manage.py runserver --verbosity 3

# Production (Render)
# View in Render dashboard → Logs
```

### Error Tracking
Consider using services like:
- Sentry (error tracking)
- LogRocket (frontend monitoring)
- DataDog (infrastructure monitoring)

---

## 🛡️ Security Headers

The Django backend should include security headers:
```python
# Already configured in settings.py
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = 'DENY'
```

---

## 📝 Compliance & Legal

- Review and comply with GDPR, CCPA, and local data protection laws
- Obtain proper user consent for data collection
- Document data processing activities
- Implement data retention policies
- Set up user data export/deletion capabilities

---

## 🆘 Getting Help

- Review documentation in [docs/](../docs/)
- Check GitHub Issues for similar problems
- See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines
- For security issues, report privately to maintainers

---

**Last Updated**: January 2026
