const API_BASE_URL = "http://localhost:8000/api/v1";

export interface Document {
  id: string;
  name: string;
  type: "contract" | "policy" | "memo";
  size: string;
  uploadDate: string;
  status: "processing" | "ready" | "error";
  url?: string;
}

export interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: Array<{
    document: string;
    page?: number;
    relevance: number;
  }>;
}

export interface ChatSession {
  id: string;
  name: string;
  createdAt: string;
  lastMessage?: string;
}

export interface Conflict {
  id: string;
  type: "conflict" | "similarity" | "reference" | "precedent";
  documents: Array<{
    name: string;
    section?: string;
  }>;
  description: string;
  severity: "high" | "medium" | "low";
  status: "active" | "resolved" | "dismissed";
}

export interface Change {
  id: string;
  document: string;
  type: "created" | "modified" | "analyzed" | "conflict_detected";
  description: string;
  timestamp: string;
  user?: string;
}

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      throw new ApiError(
        response.status,
        `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }

    return response as unknown as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      0,
      `Network error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// Document Management API
export const documentApi = {
  async upload(files: FileList | File[]): Promise<Document[]> {
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });

    return fetchApi<Document[]>("/documents/upload", {
      method: "POST",
      headers: {}, // Remove Content-Type to let browser set it with boundary
      body: formData,
    });
  },

  async list(): Promise<Document[]> {
    return fetchApi<Document[]>("/documents/");
  },

  async get(id: string): Promise<Document> {
    return fetchApi<Document>(`/documents/${id}`);
  },

  async delete(id: string): Promise<void> {
    return fetchApi<void>(`/documents/${id}`, {
      method: "DELETE",
    });
  },

  async getStatus(
    id: string
  ): Promise<{ status: Document["status"]; progress?: number }> {
    return fetchApi<{ status: Document["status"]; progress?: number }>(
      `/documents/${id}/status`
    );
  },
};

// Chat Interface API
export const chatApi = {
  async query(
    message: string,
    sessionId?: string
  ): Promise<{
    message: ChatMessage;
    sessionId: string;
  }> {
    return fetchApi<{ message: ChatMessage; sessionId: string }>(
      "/chat/query",
      {
        method: "POST",
        body: JSON.stringify({ message, sessionId }),
      }
    );
  },

  async getSessions(): Promise<ChatSession[]> {
    return fetchApi<ChatSession[]>("/chat/sessions");
  },

  async getMessages(sessionId: string): Promise<ChatMessage[]> {
    return fetchApi<ChatMessage[]>(`/chat/sessions/${sessionId}/messages`);
  },
};

// Change History API
export const historyApi = {
  async getClauseHistory(clauseId: string): Promise<Change[]> {
    return fetchApi<Change[]>(`/history/clauses/${clauseId}`);
  },

  async getDocumentChanges(documentId: string): Promise<Change[]> {
    return fetchApi<Change[]>(`/history/documents/${documentId}/changes`);
  },

  async getRecentChanges(): Promise<Change[]> {
    return fetchApi<Change[]>("/history/recent");
  },
};

// Conflict Detection API
export const conflictApi = {
  async list(): Promise<Conflict[]> {
    return fetchApi<Conflict[]>("/conflicts/");
  },

  async get(id: string): Promise<Conflict> {
    return fetchApi<Conflict>(`/conflicts/${id}`);
  },

  async updateStatus(
    id: string,
    status: Conflict["status"]
  ): Promise<Conflict> {
    return fetchApi<Conflict>(`/conflicts/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
};

// Utility function to check if API is available
export async function checkApiHealth(): Promise<boolean> {
  try {
    await fetch(`${API_BASE_URL}/health`);
    return true;
  } catch {
    return false;
  }
}

export { ApiError };
