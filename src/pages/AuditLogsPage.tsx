import { useState, useEffect, useCallback } from "react";
import { ClipboardList, ChevronLeft, ChevronRight } from "lucide-react";
import api from "../services/api";
import type { AuditLogEntry, PaginationInfo } from "../types";

const ACTION_LABELS: Record<string, string> = {
  LOGIN: "Login",
  LOGOUT: "Logout",
  DATA_IMPORT: "Data Import",
  FILE_UPLOAD: "File Upload",
  FILE_DELETE: "File Delete",
  FOLDER_CREATE: "Folder Created",
  FOLDER_RENAME: "Folder Renamed",
  FOLDER_DELETE: "Folder Deleted",
  VAULT_CREATE: "Credential Added",
  VAULT_UPDATE: "Credential Updated",
  VAULT_DELETE: "Credential Deleted",
  VAULT_REVEAL: "Password Revealed",
  USER_CREATE: "User Created",
  USER_UPDATE: "User Updated",
  USER_DELETE: "User Deleted",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterAction, setFilterAction] = useState("");
  const [filterResourceType, setFilterResourceType] = useState("");

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, limit: 30 };
      if (filterAction) params.action = filterAction;
      if (filterResourceType) params.resourceType = filterResourceType;
      const data = await api.getAuditLogs(params);
      setLogs(data.logs);
      setPagination(data.pagination);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load audit logs",
      );
    } finally {
      setLoading(false);
    }
  }, [page, filterAction, filterResourceType]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const getUserName = (log: AuditLogEntry): string => {
    if (log.userName) return log.userName;
    if (log.userId && typeof log.userId === "object") return log.userId.name;
    return "System";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-gray-500 text-sm mt-1">
          Activity history and security events
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filterAction}
          onChange={(e) => {
            setFilterAction(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
        >
          <option value="">All Actions</option>
          {Object.entries(ACTION_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={filterResourceType}
          onChange={(e) => {
            setFilterResourceType(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
        >
          <option value="">All Resources</option>
          <option value="auth">Authentication</option>
          <option value="sales">Sales</option>
          <option value="purchases">Purchases</option>
          <option value="expenses">Expenses</option>
          <option value="file">Files</option>
          <option value="folder">Folders</option>
          <option value="vault">Vault</option>
          <option value="user">Users</option>
        </select>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {loading && logs.length === 0 ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : logs.length > 0 ? (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">
                      Time
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">
                      User
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">
                      Action
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden md:table-cell">
                      Resource
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3 hidden lg:table-cell">
                      IP
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log._id}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {getUserName(log)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            log.action.includes("DELETE")
                              ? "bg-red-100 text-red-700"
                              : log.action.includes("REVEAL")
                                ? "bg-yellow-100 text-yellow-700"
                                : log.action.includes("CREATE") ||
                                    log.action.includes("IMPORT") ||
                                    log.action.includes("UPLOAD")
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {ACTION_LABELS[log.action] || log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">
                        {log.resourceLabel || log.resourceType || "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-400 hidden lg:table-cell font-mono text-xs">
                        {log.ipAddress || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.totalPages} (
                {pagination.total} records)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() =>
                    setPage(Math.min(pagination.totalPages, page + 1))
                  }
                  disabled={page === pagination.totalPages}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 hover:bg-gray-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <ClipboardList className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No audit logs
          </h3>
          <p className="text-gray-500">
            Activity will be recorded here as actions are performed.
          </p>
        </div>
      )}
    </div>
  );
}
