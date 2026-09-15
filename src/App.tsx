import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import api from './services/api';
import type { User } from './types';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import FilesPage from './pages/FilesPage';
import VaultPage from './pages/VaultPage';
import AuditLogsPage from './pages/AuditLogsPage';
import UsersPage from './pages/UsersPage';
import N8NPage from './pages/N8NPage';
import Layout from './components/Layout';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    // Check for existing token
    const token = sessionStorage.getItem('auth_token');
    if (token) {
      api.setToken(token);
      api.getMe()
        .then(({ user }) => {
          setUser(user);
          setConnectionError(null);
        })
        .catch((err) => {
          console.error('Auth check failed:', err);
          sessionStorage.removeItem('auth_token');
          api.setToken(null);
          if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
            setConnectionError('Unable to connect to server. Please check that the backend is running.');
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = useCallback(async (email: string, password: string) => {
    const result = await api.login(email, password);
    api.setToken(result.token);
    sessionStorage.setItem('auth_token', result.token);
    setUser(result.user);
    setConnectionError(null);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // Ignore logout errors
    }
    api.setToken(null);
    sessionStorage.removeItem('auth_token');
    setUser(null);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (connectionError && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Connection Error</h1>
          <p className="text-gray-600 mb-4">{connectionError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={handleLogin} error={connectionError} />}
        />
        {user ? (
          <>
            <Route
              path="/dashboard"
              element={
                <Layout user={user} onLogout={handleLogout}>
                  <DashboardPage />
                </Layout>
              }
            />
            <Route
              path="/files"
              element={
                <Layout user={user} onLogout={handleLogout}>
                  <FilesPage />
                </Layout>
              }
            />
            <Route
              path="/vault"
              element={
                <Layout user={user} onLogout={handleLogout}>
                  <VaultPage />
                </Layout>
              }
            />
            <Route
              path="/audit-logs"
              element={
                <Layout user={user} onLogout={handleLogout}>
                  <AuditLogsPage />
                </Layout>
              }
            />
            <Route
              path="/users"
              element={
                <Layout user={user} onLogout={handleLogout}>
                  <UsersPage />
                </Layout>
              }
            />
            <Route
              path="/n8n"
              element={
                <Layout user={user} onLogout={handleLogout}>
                  <N8NPage />
                </Layout>
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}
