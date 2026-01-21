# Dockerfile for Django backend on Render
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# System deps for psycopg2
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt ./
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Create needed dirs
RUN mkdir -p data/live_downloads data/raw_pdfs/acts data/raw_pdfs/circulars data/raw_pdfs/notifications documents || true

# Skip collectstatic during build to avoid requiring runtime env vars

# Render will set PORT env var
EXPOSE 8080

# Run migrations, then start gunicorn
CMD python manage.py migrate && \
    gunicorn complyflow_backend.wsgi:application --bind 0.0.0.0:${PORT:-8080}
