import { useState, useEffect } from 'react';
import { Workflow, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api';
import type { N8NWorkflow } from '../types';

export default function N8NPage() {
  const [workflows, setWorkflows] = useState<N8NWorkflow[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getN8NWorkflows();
        setWorkflows(data.workflows);
        setConfigured(data.configured);
        if (data.error) setError(data.error);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load n8n workflows');
        setConfigured(false);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">n8n Workflow Integration</h1>
        <p className="text-gray-500 text-sm mt-1">Automated workflows and integrations</p>
      </div>

      {error && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
          <AlertCircle size={16} className="text-yellow-600 mt-0.5 shrink-0" />
          <p className="text-sm text-yellow-700">{error}</p>
        </div>
      )}

      {configured === false ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Workflow className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">n8n not configured</h3>
          <p className="text-gray-500 mb-4">
            To enable n8n integration, set the following environment variables on the backend:
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-left max-w-md mx-auto">
            <code className="text-sm text-gray-700 block">
              N8N_BASE_URL=https://your-n8n-instance.com
              <br />
              N8N_API_KEY=your-api-key
            </code>
          </div>
        </div>
      ) : workflows.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workflows.map((workflow) => (
            <div key={workflow.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-medium text-gray-900 text-sm">{workflow.name}</h4>
                {workflow.active ? (
                  <span className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                    <CheckCircle size={10} />
                    Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    <XCircle size={10} />
                    Inactive
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-400">
                <p>ID: {workflow.id}</p>
                <p>Updated: {new Date(workflow.updatedAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      ) : configured ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Workflow className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows found</h3>
          <p className="text-gray-500">n8n is connected but no workflows are configured.</p>
        </div>
      ) : null}
    </div>
  );
}
