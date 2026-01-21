# ComplyFlow API Documentation

## Overview

ComplyFlow provides a comprehensive REST API for compliance queries, document management, and user profiles.

## Authentication

All endpoints require authentication via:
- **Google OAuth 2.0 tokens** (frontend)
- **JWT tokens** (backend)

### Authentication Header
```
Authorization: Bearer <your-token>
```

---

## Core Endpoints

### Chat API

#### Send Query
```
POST /api/chat/
Content-Type: application/json
Authorization: Bearer <token>

{
  "message": "What is the GST rate for consulting services?",
  "conversation_id": "optional-uuid"
}
```

**Response**:
```json
{
  "id": "message-uuid",
  "content": "The GST rate for consulting services is...",
  "role": "assistant",
  "timestamp": "2025-01-21T10:30:00Z",
  "citations": [
    {
      "id": "cite-1",
      "source": "cir-189-01-2023-cgst.pdf",
      "section": "Section 2.3",
      "content": "Consulting services..."
    }
  ],
  "suggestions": [
    "What documents are needed?",
    "Are there ITC blocks?"
  ]
}
```

#### Get Chat History
```
GET /api/history/?conversation_id=<uuid>
Authorization: Bearer <token>
```

**Response**: Array of conversation messages

#### Get All Conversations
```
GET /api/history/
Authorization: Bearer <token>
```

---

### Document Management

#### Upload Document
```
POST /api/documents/upload/
Content-Type: multipart/form-data
Authorization: Bearer <token>

Form Data:
- file: <PDF file>
- category: "invoice" | "circular" | "notification"
```

**Response**:
```json
{
  "id": "doc-uuid",
  "filename": "invoice_001.pdf",
  "category": "invoice",
  "upload_date": "2025-01-21T10:30:00Z",
  "status": "processing"
}
```

#### Get Documents
```
GET /api/documents/
Authorization: Bearer <token>
```

#### Get Document Details
```
GET /api/documents/<id>/
Authorization: Bearer <token>
```

---

### User Profile

#### Get Profile
```
GET /api/profile/
Authorization: Bearer <token>
```

**Response**:
```json
{
  "id": "user-uuid",
  "email": "user@company.com",
  "name": "Sample User",
  "organization": "Company Name",
  "created_at": "2025-01-21T10:30:00Z"
}
```

#### Update Profile
```
PUT /api/profile/
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Sample User",
  "organization": "Company Name"
}
```

---

### Notifications

#### Get Notifications
```
GET /api/notifications/
Authorization: Bearer <token>
```

**Response**:
```json
[
  {
    "id": "notif-uuid",
    "title": "New GST Circular",
    "message": "Circular 244/01/2025 regarding co-insurance premium",
    "impact_level": "HIGH",
    "created_at": "2025-01-21T10:30:00Z",
    "read": false
  }
]
```

#### Mark Notification as Read
```
DELETE /api/notifications/<id>/
Authorization: Bearer <token>
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request",
  "details": "field_name: error message"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication failed",
  "message": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "error": "Permission denied",
  "message": "You don't have access to this resource"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

---

## Rate Limiting

- **Requests per minute**: 60 (will be implemented)
- **Requests per hour**: 1000 (will be implemented)
- **Headers**:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Reset timestamp

---

## Pagination

For list endpoints, use query parameters:
```
GET /api/documents/?page=1&page_size=10
```

**Response**:
```json
{
  "count": 100,
  "next": "http://api/documents/?page=2",
  "previous": null,
  "results": [...]
}
```

---

## WebSocket (Future)

Real-time chat updates via WebSocket:
```
ws://localhost:8000/ws/chat/<conversation_id>/
```

---

## Webhooks (Future)

Subscribe to events:
- `notification.created`
- `document.processed`
- `chat.completed`

---

## Code Examples

### Python (requests)
```python
import requests

headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json"
}

# Send query
response = requests.post(
    "http://localhost:8000/api/chat/",
    json={"message": "What is GST?"},
    headers=headers
)
print(response.json())
```

### JavaScript (fetch)
```javascript
const token = localStorage.getItem('google_token');

const response = await fetch('http://localhost:8000/api/chat/', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: 'What is GST?'
  })
});

const data = await response.json();
console.log(data);
```

---

## Support

- **Issues**: Open a GitHub Issue
- **Discussions**: GitHub Discussions
- **Security**: Report privately to maintainers

---

**Last Updated**: January 2026
