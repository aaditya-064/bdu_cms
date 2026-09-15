import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Receipt,
  Percent,
  Upload,
  Calendar,
} from 'lucide-react';
import api from '../services/api';
import type { AnalyticsSummary, TrendResponse } from '../types';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#f97316'];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [trend, setTrend] = useState<TrendResponse | null>(null);
  const [categories, setCategories] = useState<{ sales?: Array<{ name: string; revenue: number; count: number }>; expenses?: Array<{ name: string; amount: number; count: number }> }>({});
  const [topCustomers, setTopCustomers] = useState<Array<{ name: string; totalSpent: number; orderCount: number }>>([]);
  const [topProducts, setTopProducts] = useState<Array<{ name: string; totalRevenue: number; totalQuantity: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [importType, setImportType] = useState<'sales' | 'purchases' | 'expenses'>('sales');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { startDate?: string; endDate?: string } = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const [summaryData, trendData, catData, customers, products] = await Promise.all([
        api.getAnalyticsSummary(params),
        api.getAnalyticsTrend({ ...params, groupBy: 'month' }),
        api.getAnalyticsCategories(),
        api.getTopCustomers(5),
        api.getTopProducts(5),
      ]);

      setSummary(summaryData);
      setTrend(trendData);
      setCategories(catData);
      setTopCustomers(customers.customers);
      setTopProducts(products.products);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleImport = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.querySelector('input[type="file"]') as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);
    try {
      const result = await api.importData(importType, file);
      setImportResult(
        `Imported ${result.imported} of ${result.totalRows} records. ` +
        `${result.duplicates} duplicates, ${result.invalid} invalid. ` +
        `Quality score: ${result.qualityScore}%`
      );
      fileInput.value = '';
      fetchData();
    } catch (err) {
      setImportResult(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setImporting(false);
    }
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          Retry
        </button>
      </div>
    );
  }

  const hasData = summary && (summary.sales.count > 0 || summary.purchases.count > 0 || summary.expenses.count > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Business overview and analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-400" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2 py-1 text-sm border border-gray-300 rounded-lg"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2 py-1 text-sm border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      {/* Import Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <Upload size={16} />
          Import Data
        </h3>
        <form onSubmit={handleImport} className="flex flex-wrap items-end gap-3">
          <select
            value={importType}
            onChange={(e) => setImportType(e.target.value as 'sales' | 'purchases' | 'expenses')}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg"
          >
            <option value="sales">Sales</option>
            <option value="purchases">Purchases</option>
            <option value="expenses">Expenses</option>
          </select>
          <input
            type="file"
            accept=".xlsx,.xls,.csv,.json"
            className="text-sm"
          />
          <button
            type="submit"
            disabled={importing}
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {importing ? 'Importing...' : 'Upload & Import'}
          </button>
        </form>
        {importResult && (
          <p className={`mt-2 text-sm ${importResult.includes('failed') ? 'text-red-600' : 'text-green-600'}`}>
            {importResult}
          </p>
        )}
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Revenue"
            value={formatCurrency(summary.sales.totalRevenue)}
            subtitle={`${summary.sales.count} transactions`}
            icon={<DollarSign size={20} />}
            color="indigo"
          />
          <KPICard
            title="Total Purchases"
            value={formatCurrency(summary.purchases.totalAmount)}
            subtitle={`${summary.purchases.count} transactions`}
            icon={<ShoppingCart size={20} />}
            color="purple"
          />
          <KPICard
            title="Total Expenses"
            value={formatCurrency(summary.expenses.totalAmount)}
            subtitle={`${summary.expenses.count} entries`}
            icon={<Receipt size={20} />}
            color="pink"
          />
          <KPICard
            title="Net Profit"
            value={formatCurrency(summary.netProfit)}
            subtitle={`Margin: ${summary.grossMargin}%`}
            icon={summary.netProfit >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            color={summary.netProfit >= 0 ? 'green' : 'red'}
          />
        </div>
      )}

      {!hasData && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No data yet</h3>
          <p className="text-gray-500 mb-4">
            Upload your sales, purchases, or expenses data using the import form above to see analytics.
          </p>
          <p className="text-sm text-gray-400">
            Supported formats: XLSX, CSV, JSON
          </p>
        </div>
      )}

      {/* Charts */}
      {hasData && trend && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Revenue & Profit Trend</h3>
            {trend.sales.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trend.sales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#6366f1" name="Revenue" strokeWidth={2} />
                  <Line type="monotone" dataKey="profit" stroke="#10b981" name="Profit" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">No sales trend data</p>
            )}
          </div>

          {/* Expense Trend */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Expense Trend</h3>
            {trend.expenses.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={trend.expenses}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="amount" fill="#ec4899" name="Expenses" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">No expense trend data</p>
            )}
          </div>

          {/* Sales by Category */}
          {categories.sales && categories.sales.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Sales by Category</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categories.sales}
                    dataKey="revenue"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {categories.sales.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Customers */}
          {topCustomers.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Top Customers</h3>
              <div className="space-y-3">
                {topCustomers.map((customer, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-400 w-4">{i + 1}</span>
                      <span className="text-sm text-gray-700">{customer.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(customer.totalSpent)}</span>
                      <span className="text-xs text-gray-400 ml-2">{customer.orderCount} orders</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Products */}
          {topProducts.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 lg:col-span-2">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Top Products</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="totalRevenue" fill="#6366f1" name="Revenue" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function KPICard({ title, value, subtitle, icon, color }: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    purple: 'bg-purple-50 text-purple-600',
    pink: 'bg-pink-50 text-pink-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500">{title}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClasses[color] || colorClasses.indigo}`}>
          {icon}
        </div>
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
    </div>
  );
}
