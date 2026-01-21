/**
 * ComplyFlow API Service
 * 
 * This file handles all API communications with the Django backend.
 * It manages authentication, chat interactions, document uploads, and notifications.
 * 
 * Note: Configure API_BASE_URL in your .env file (VITE_API_BASE_URL).
 * All requests require authentication via Google OAuth tokens.
 */

// API Base URL - Configure in .env file
// Fallback to same-origin `/api` in production if not set
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || `${window.location.origin}/api`;

// Types
export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  citations?: Citation[];
  suggestions?: string[];
}

export interface Citation {
  id: string;
  section: string;
  title: string;
  content: string;
  source: string;
}

export interface ComplianceQuery {
  id: string;
  conversation_id: string;
  query: string;
  response: string;
  timestamp: Date;
  status: 'pending' | 'completed' | 'error';
  citations?: Citation[];
}

export interface ChatSession {
  conversation_id: string;
  title: string;
  timestamp: Date;
  last_query: string;
}

export interface UserProfile {
  profession: string;
  company_name: string;
  bio: string;
  email: string;
  full_name: string;
}

export interface UploadedDocument {
  id: number;
  name: string;
  uploadedAt: Date;
  status: 'PENDING' | 'VALID' | 'FLAGGED' | 'ERROR';
  status_color?: string;
  flag_reason?: string;
}

export interface GlobalNotification {
  id: number;
  title: string;
  message: string;
  doc_name: string;
  source_url: string;
  impact_level: string;
  action_draft?: string;
  created_at: string;
}

/**
 * Helper to get the auth header using the token from localStorage
 */
function getAuthHeader() {
  const token = localStorage.getItem('google_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

/**
 * Send a message to the AI compliance assistant
 */
export async function sendMessage(
  content: string,
  history: Message[] = [],
  conversationId?: string,
  docId?: string,
  discussDoc?: string
): Promise<Message & { conversation_id?: string }> {
  try {
    // Send compact conversation history for better multi-turn context
    const condensedHistory = history.slice(-8).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const url = new URL(`${API_BASE_URL}/chat/`);
    if (docId) url.searchParams.append('docId', docId);
    if (discussDoc) url.searchParams.append('discussDoc', discussDoc);

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        message: content,
        history: condensedHistory,
        conversation_id: conversationId
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      id: crypto.randomUUID(),
      content: data.response,
      role: 'assistant',
      timestamp: new Date(data.timestamp || Date.now()),
      citations: data.citations,
      suggestions: data.suggestions,
      conversation_id: data.conversation_id
    };
  } catch (error) {
    console.error('Error sending message:', error);
    return {
      id: crypto.randomUUID(),
      content: 'I apologize, but I am currently unable to process your request. Please ensure the backend is running.',
      role: 'assistant',
      timestamp: new Date(),
      citations: [],
    };
  }
}

/**
 * Delete an entire chat session
 */
export async function deleteSession(conversationId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/history/${conversationId}/`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Error deleting chat session:', error);
    return false;
  }
}

export async function deleteDocument(id: number): Promise<boolean> {
  const response = await fetch(`${API_BASE_URL}/documents/${id}/`, {
    method: 'DELETE',
  });
  return response.ok;
}

/**
 * Get unique chat sessions
 */
export async function getChatSessions(): Promise<ChatSession[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/history/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.map((item: any) => ({
      conversation_id: item.conversation_id,
      title: item.title,
      timestamp: new Date(item.timestamp),
      last_query: item.last_query,
    }));
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return [];
  }
}

/**
 * Get all messages for a specific session
 */
export async function getSessionMessages(conversationId: string): Promise<Message[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/history/${conversationId}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    const messages: Message[] = [];

    data.forEach((query: any) => {
      // Add user query
      messages.push({
        id: `u-${query.id}`,
        content: query.query,
        role: 'user',
        timestamp: new Date(query.timestamp),
      });

      // Add assistant response
      messages.push({
        id: `a-${query.id}`,
        content: query.response,
        role: 'assistant',
        timestamp: new Date(query.timestamp),
        citations: query.citations,
      });
    });

    return messages;
  } catch (error) {
    console.error('Error fetching session messages:', error);
    return [];
  }
}

/**
 * Get compliance query history (Backwards compatibility/Dashboard)
 */
export async function getQueryHistory(): Promise<ComplianceQuery[]> {
  // We can still use this but it might be better to fetch all queries directly if needed
  // For now, let's keep it simple or redirect to history list
  return [];
}

/**
 * Upload a document for processing
 */
export async function uploadDocument(file: File): Promise<UploadedDocument> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/documents/`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      id: data.id,
      name: data.original_filename || file.name,
      uploadedAt: new Date(data.uploaded_at || Date.now()),
      status: data.status || 'PENDING',
      status_color: data.status_color,
      flag_reason: data.flag_reason,
    };
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
}

/**
 * Get uploaded documents
 */
export async function getDocuments(): Promise<UploadedDocument[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/documents/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.map((doc: any) => ({
      id: doc.id,
      name: doc.original_filename,
      uploadedAt: new Date(doc.uploaded_at),
      status: doc.status || 'PENDING',
      status_color: doc.status_color || 'gray',
      flag_reason: doc.flag_reason,
    }));
  } catch (error) {
    console.error('Error fetching documents:', error);
    return [];
  }
}

/**
 * User Profile API
 */
export async function getProfile(): Promise<UserProfile | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/profile/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
}

export async function updateProfile(data: Partial<UserProfile>): Promise<UserProfile | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/profile/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('Error updating profile:', error);
    return null;
  }
}

/**
 * Get latest global notifications
 */
export async function getNotifications(): Promise<GlobalNotification[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.map((n: any) => ({
      ...n,
      created_at: new Date(n.created_at)
    }));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

/**
 * Delete a global notification
 */
export async function deleteNotification(id: number): Promise<boolean> {
  try {
    console.log(`[API] Attempting to delete notification ${id}...`);
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
    });

    console.log(`[API] Delete response status: ${response.status}`);
    if (!response.ok) {
      const text = await response.text();
      console.error(`[API] Delete failed: ${text}`);
    }
    return response.ok;
  } catch (error) {
    console.error('[API] Error deleting notification:', error);
    return false;
  }
}

// Export API configuration for future backend integration
export const apiConfig = {
  baseUrl: API_BASE_URL,
  endpoints: {
    chat: '/chat',
    documents: '/documents',
    profile: '/profile',
    notifications: '/notifications',
    notifications_stream: '/notifications/stream/',
  },
};
