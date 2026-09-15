export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'STAFF';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface AnalyticsSummary {
  sales: {
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    count: number;
  };
  purchases: {
    totalAmount: number;
    count: number;
  };
  expenses: {
    totalAmount: number;
    count: number;
  };
  netProfit: number;
  grossMargin: number;
}

export interface TrendDataPoint {
  period: string;
  revenue?: number;
  profit?: number;
  amount?: number;
  count?: number;
}

export interface TrendResponse {
  sales: TrendDataPoint[];
  expenses: TrendDataPoint[];
  purchases: TrendDataPoint[];
}

export interface CategoryData {
  name: string;
  revenue?: number;
  profit?: number;
  amount?: number;
  count?: number;
}

export interface CustomerData {
  name: string;
  totalSpent: number;
  orderCount: number;
}

export interface ProductData {
  name: string;
  totalRevenue: number;
  totalQuantity: number;
  count: number;
}

export interface ImportResult {
  success: boolean;
  type: string;
  fileName: string;
  totalRows: number;
  imported: number;
  duplicates: number;
  invalid: number;
  errors: string[];
  qualityScore: number;
}

export interface FileItem {
  _id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  folderId: string | null;
  uploadedBy: { _id: string; name: string; email: string } | string;
  createdAt: string;
  updatedAt: string;
}

export interface FolderItem {
  _id: string;
  name: string;
  parentId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface VaultRecord {
  _id: string;
  title: string;
  category: string;
  username: string;
  url: string;
  notes: string;
  createdBy: { _id: string; name: string; email: string } | string;
  lastAccessedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  _id: string;
  userId: { _id: string; name: string; email: string } | string | null;
  userName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  resourceLabel: string;
  metadata: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface N8NWorkflow {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  error: string;
}
