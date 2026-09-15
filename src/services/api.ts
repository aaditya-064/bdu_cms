import type {
  LoginResponse,
  AnalyticsSummary,
  TrendResponse,
  ImportResult,
  FileItem,
  FolderItem,
  VaultRecord,
  AuditLogEntry,
  PaginationInfo,
  N8NWorkflow,
  User,
  ApiError,
} from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    isFormData = false
  ): Promise<T> {
    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      if (isFormData) {
        options.body = body as FormData;
      } else {
        options.body = JSON.stringify(body);
      }
    }

    const response = await fetch(`${API_BASE}${path}`, options);

    if (!response.ok) {
      let errorMessage = 'Request failed';
      try {
        const errorData = await response.json() as ApiError;
        errorMessage = errorData.error || errorMessage;
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json() as Promise<T>;
  }

  // Auth
  async login(email: string, password: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('POST', '/api/auth/login', { email, password });
  }

  async getMe(): Promise<{ user: User }> {
    return this.request<{ user: User }>('GET', '/api/auth/me');
  }

  async logout(): Promise<void> {
    return this.request<void>('POST', '/api/auth/logout');
  }

  // Analytics
  async getAnalyticsSummary(params?: { startDate?: string; endDate?: string; category?: string }): Promise<AnalyticsSummary> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (params?.category) searchParams.set('category', params.category);
    const query = searchParams.toString();
    return this.request<AnalyticsSummary>('GET', `/api/analytics/summary${query ? '?' + query : ''}`);
  }

  async getAnalyticsTrend(params?: { startDate?: string; endDate?: string; groupBy?: string }): Promise<TrendResponse> {
    const searchParams = new URLSearchParams();
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    if (params?.groupBy) searchParams.set('groupBy', params.groupBy);
    const query = searchParams.toString();
    return this.request<TrendResponse>('GET', `/api/analytics/trend${query ? '?' + query : ''}`);
  }

  async getAnalyticsCategories(type?: string): Promise<{ sales?: Array<{ name: string; revenue: number; profit: number; count: number }>; expenses?: Array<{ name: string; amount: number; count: number }> }> {
    const query = type ? `?type=${type}` : '';
    return this.request('GET', `/api/analytics/categories${query}`);
  }

  async getTopCustomers(limit = 10): Promise<{ customers: Array<{ name: string; totalSpent: number; orderCount: number }> }> {
    return this.request('GET', `/api/analytics/top-customers?limit=${limit}`);
  }

  async getTopProducts(limit = 10): Promise<{ products: Array<{ name: string; totalRevenue: number; totalQuantity: number; count: number }> }> {
    return this.request('GET', `/api/analytics/top-products?limit=${limit}`);
  }

  // Import
  async importData(type: string, file: File): Promise<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    return this.request<ImportResult>('POST', `/api/import/${type}`, formData, true);
  }

  // Files
  async getFiles(folderId?: string): Promise<{ files: FileItem[] }> {
    const query = folderId ? `?folderId=${folderId}` : '';
    return this.request<{ files: FileItem[] }>('GET', `/api/files${query}`);
  }

  async getFolders(parentId?: string): Promise<{ folders: FolderItem[] }> {
    const query = parentId ? `?parentId=${parentId}` : '';
    return this.request<{ folders: FolderItem[] }>('GET', `/api/files/folders${query}`);
  }

  async createFolder(name: string, parentId?: string): Promise<{ folder: FolderItem }> {
    return this.request<{ folder: FolderItem }>('POST', '/api/files/folders', { name, parentId: parentId || null });
  }

  async renameFolder(id: string, name: string): Promise<{ folder: FolderItem }> {
    return this.request<{ folder: FolderItem }>('PUT', `/api/files/folders/${id}`, { name });
  }

  async deleteFolder(id: string): Promise<void> {
    return this.request<void>('DELETE', `/api/files/folders/${id}`);
  }

  async uploadFile(file: File, folderId?: string): Promise<{ file: FileItem }> {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);
    return this.request<{ file: FileItem }>('POST', '/api/files/upload', formData, true);
  }

  async downloadFile(id: string): Promise<void> {
    const headers: Record<string, string> = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    const response = await fetch(`${API_BASE}/api/files/${id}/download`, { headers });
    if (!response.ok) throw new Error('Download failed');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  async deleteFile(id: string): Promise<void> {
    return this.request<void>('DELETE', `/api/files/${id}`);
  }

  // Vault
  async getVaultRecords(category?: string): Promise<{ records: VaultRecord[] }> {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    return this.request<{ records: VaultRecord[] }>('GET', `/api/vault${query}`);
  }

  async getVaultCategories(): Promise<{ categories: string[] }> {
    return this.request<{ categories: string[] }>('GET', '/api/vault/categories');
  }

  async createVaultRecord(data: { title: string; category: string; username?: string; password: string; url?: string; notes?: string }): Promise<{ record: VaultRecord }> {
    return this.request<{ record: VaultRecord }>('POST', '/api/vault', data);
  }

  async updateVaultRecord(id: string, data: Partial<{ title: string; category: string; username: string; password: string; url: string; notes: string }>): Promise<{ record: VaultRecord }> {
    return this.request<{ record: VaultRecord }>('PUT', `/api/vault/${id}`, data);
  }

  async deleteVaultRecord(id: string): Promise<void> {
    return this.request<void>('DELETE', `/api/vault/${id}`);
  }

  async revealVaultPassword(id: string): Promise<{ password: string }> {
    return this.request<{ password: string }>('POST', `/api/vault/${id}/reveal`);
  }

  // Audit Logs
  async getAuditLogs(params?: { page?: number; limit?: number; action?: string; userId?: string; resourceType?: string; startDate?: string; endDate?: string }): Promise<{ logs: AuditLogEntry[]; pagination: PaginationInfo }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.action) searchParams.set('action', params.action);
    if (params?.userId) searchParams.set('userId', params.userId);
    if (params?.resourceType) searchParams.set('resourceType', params.resourceType);
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);
    const query = searchParams.toString();
    return this.request<{ logs: AuditLogEntry[]; pagination: PaginationInfo }>('GET', `/api/audit-logs${query ? '?' + query : ''}`);
  }

  // Users
  async getUsers(): Promise<{ users: User[] }> {
    return this.request<{ users: User[] }>('GET', '/api/users');
  }

  async createUser(data: { name: string; email: string; password: string; role: string }): Promise<{ user: User }> {
    return this.request<{ user: User }>('POST', '/api/users', data);
  }

  async updateUser(id: string, data: Partial<{ name: string; email: string; role: string; isActive: boolean; password: string }>): Promise<{ user: User }> {
    return this.request<{ user: User }>('PUT', `/api/users/${id}`, data);
  }

  async deleteUser(id: string): Promise<void> {
    return this.request<void>('DELETE', `/api/users/${id}`);
  }

  // n8n
  async getN8NWorkflows(): Promise<{ workflows: N8NWorkflow[]; configured: boolean; error?: string }> {
    return this.request<{ workflows: N8NWorkflow[]; configured: boolean; error?: string }>('GET', '/api/n8n/workflows');
  }

  async getN8NStatus(): Promise<{ configured: boolean; status: string; message?: string }> {
    return this.request<{ configured: boolean; status: string; message?: string }>('GET', '/api/n8n/status');
  }
}

export const api = new ApiClient();
export default api;
