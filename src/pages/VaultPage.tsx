import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Plus,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Copy,
  ExternalLink,
} from 'lucide-react';
import api from '../services/api';
import type { VaultRecord } from '../types';

export default function VaultPage() {
  const [records, setRecords] = useState<VaultRecord[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<VaultRecord | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    username: '',
    password: '',
    url: '',
    notes: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [recordsData, categoriesData] = await Promise.all([
        api.getVaultRecords(selectedCategory || undefined),
        api.getVaultCategories(),
      ]);
      setRecords(recordsData.records);
      setCategories(categoriesData.categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vault');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.category || !formData.password) return;

    try {
      if (editingRecord) {
        await api.updateVaultRecord(editingRecord._id, formData);
      } else {
        await api.createVaultRecord(formData);
      }
      resetForm();
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    }
  };

  const resetForm = () => {
    setFormData({ title: '', category: '', username: '', password: '', url: '', notes: '' });
    setShowForm(false);
    setEditingRecord(null);
  };

  const handleEdit = (record: VaultRecord) => {
    setEditingRecord(record);
    setFormData({
      title: record.title,
      category: record.category,
      username: record.username,
      password: '',
      url: record.url,
      notes: record.notes,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await api.deleteVaultRecord(id);
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const handleReveal = async (id: string) => {
    if (revealedPasswords[id]) {
      setRevealedPasswords((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }
    try {
      const { password } = await api.revealVaultPassword(id);
      setRevealedPasswords((prev) => ({ ...prev, [id]: password }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reveal password');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading && records.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Credential Vault</h1>
          <p className="text-gray-500 text-sm mt-1">Securely stored credentials (encrypted with AES-256-GCM)</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus size={16} />
          Add Credential
        </button>
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-3 py-1 text-sm rounded-full ${!selectedCategory ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-sm rounded-full ${selectedCategory === cat ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {editingRecord ? 'Edit Credential' : 'Add Credential'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                list="vault-categories"
                required
              />
              <datalist id="vault-categories">
                {categories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <input
                type="text"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required={!editingRecord}
                placeholder={editingRecord ? 'Leave blank to keep current' : ''}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="sm:col-span-2 flex items-center gap-2">
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700">
                {editingRecord ? 'Update' : 'Save'}
              </button>
              <button type="button" onClick={resetForm} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Records */}
      {records.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {records.map((record) => (
            <div key={record._id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium text-gray-900">{record.title}</h4>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{record.category}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(record)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(record._id, record.title)} className="p-1.5 text-gray-400 hover:text-red-500 rounded">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {record.username && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <span className="text-gray-400">User:</span>
                  <span className="font-mono">{record.username}</span>
                  <button onClick={() => copyToClipboard(record.username)} className="p-0.5 text-gray-400 hover:text-indigo-600">
                    <Copy size={12} />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <span className="text-gray-400">Pass:</span>
                {revealedPasswords[record._id] ? (
                  <>
                    <span className="font-mono bg-yellow-50 px-2 py-0.5 rounded">{revealedPasswords[record._id]}</span>
                    <button onClick={() => copyToClipboard(revealedPasswords[record._id])} className="p-0.5 text-gray-400 hover:text-indigo-600">
                      <Copy size={12} />
                    </button>
                    <button onClick={() => handleReveal(record._id)} className="p-0.5 text-gray-400 hover:text-indigo-600">
                      <EyeOff size={12} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="font-mono">••••••••</span>
                    <button onClick={() => handleReveal(record._id)} className="p-0.5 text-gray-400 hover:text-indigo-600">
                      <Eye size={12} />
                    </button>
                  </>
                )}
              </div>
              {record.url && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-gray-400">URL:</span>
                  <a href={record.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline truncate flex items-center gap-1">
                    {record.url}
                    <ExternalLink size={10} />
                  </a>
                </div>
              )}
              {record.notes && (
                <p className="text-xs text-gray-400 mt-2">{record.notes}</p>
              )}
            </div>
          ))}
        </div>
      ) : !showForm ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Shield className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Vault is empty</h3>
          <p className="text-gray-500">Add credentials to securely store them with AES-256-GCM encryption.</p>
        </div>
      ) : null}
    </div>
  );
}
