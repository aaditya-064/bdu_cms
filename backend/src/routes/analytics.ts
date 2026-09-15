import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { SaleRecord } from '../models/SaleRecord.js';
import { PurchaseRecord } from '../models/PurchaseRecord.js';
import { ExpenseRecord } from '../models/ExpenseRecord.js';

const router = Router();

// GET /api/analytics/summary
router.get('/summary', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, category } = req.query;

    const dateFilter: Record<string, unknown> = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) (dateFilter.date as Record<string, Date>).$gte = new Date(startDate as string);
      if (endDate) (dateFilter.date as Record<string, Date>).$lte = new Date(endDate as string);
    }

    const categoryFilter = category ? { category: category as string } : {};
    const combinedFilter = { ...dateFilter, ...categoryFilter };

    // Sales aggregation
    const salesAgg = await SaleRecord.aggregate([
      { $match: combinedFilter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalAmount' },
          totalCost: { $sum: { $multiply: ['$costPrice', '$quantity'] } },
          totalProfit: { $sum: '$profit' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Purchases aggregation
    const purchasesAgg = await PurchaseRecord.aggregate([
      { $match: combinedFilter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Expenses aggregation
    const expensesAgg = await ExpenseRecord.aggregate([
      { $match: combinedFilter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const sales = salesAgg[0] || { totalRevenue: 0, totalCost: 0, totalProfit: 0, count: 0 };
    const purchases = purchasesAgg[0] || { totalAmount: 0, count: 0 };
    const expenses = expensesAgg[0] || { totalAmount: 0, count: 0 };

    const netProfit = sales.totalProfit - expenses.totalAmount;
    const grossMargin = sales.totalRevenue > 0 ? (sales.totalProfit / sales.totalRevenue) * 100 : 0;

    res.json({
      sales: {
        totalRevenue: sales.totalRevenue,
        totalCost: sales.totalCost,
        totalProfit: sales.totalProfit,
        count: sales.count,
      },
      purchases: {
        totalAmount: purchases.totalAmount,
        count: purchases.count,
      },
      expenses: {
        totalAmount: expenses.totalAmount,
        count: expenses.count,
      },
      netProfit,
      grossMargin: Math.round(grossMargin * 100) / 100,
    });
  } catch (err) {
    console.error('Analytics summary error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/trend
router.get('/trend', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { startDate, endDate, groupBy } = req.query;
    const period = (groupBy as string) || 'month';

    const dateFilter: Record<string, unknown> = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) (dateFilter.date as Record<string, Date>).$gte = new Date(startDate as string);
      if (endDate) (dateFilter.date as Record<string, Date>).$lte = new Date(endDate as string);
    }

    let dateFormat: string;
    if (period === 'day') dateFormat = '%Y-%m-%d';
    else if (period === 'week') dateFormat = '%Y-W%V';
    else dateFormat = '%Y-%m';

    const salesTrend = await SaleRecord.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$date' } },
          revenue: { $sum: '$totalAmount' },
          profit: { $sum: '$profit' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const expensesTrend = await ExpenseRecord.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$date' } },
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const purchasesTrend = await PurchaseRecord.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: '$date' } },
          amount: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      sales: salesTrend.map((item) => ({
        period: item._id,
        revenue: item.revenue,
        profit: item.profit,
        count: item.count,
      })),
      expenses: expensesTrend.map((item) => ({
        period: item._id,
        amount: item.amount,
        count: item.count,
      })),
      purchases: purchasesTrend.map((item) => ({
        period: item._id,
        amount: item.amount,
        count: item.count,
      })),
    });
  } catch (err) {
    console.error('Analytics trend error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/categories
router.get('/categories', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { type } = req.query;

    if (type === 'sales' || !type) {
      const categories = await SaleRecord.aggregate([
        { $match: { category: { $ne: '' } } },
        {
          $group: {
            _id: '$category',
            revenue: { $sum: '$totalAmount' },
            profit: { $sum: '$profit' },
            count: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
      ]);
      res.json({
        sales: categories.map((c) => ({ name: c._id, revenue: c.revenue, profit: c.profit, count: c.count })),
      });
    } else if (type === 'expenses') {
      const categories = await ExpenseRecord.aggregate([
        { $match: { category: { $ne: '' } } },
        {
          $group: {
            _id: '$category',
            amount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { amount: -1 } },
      ]);
      res.json({
        expenses: categories.map((c) => ({ name: c._id, amount: c.amount, count: c.count })),
      });
    } else {
      res.json({});
    }
  } catch (err) {
    console.error('Analytics categories error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/top-customers
router.get('/top-customers', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { limit } = req.query;
    const topCustomers = await SaleRecord.aggregate([
      { $match: { customerName: { $ne: '' } } },
      {
        $group: {
          _id: '$customerName',
          totalSpent: { $sum: '$totalAmount' },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: parseInt(limit as string) || 10 },
    ]);

    res.json({
      customers: topCustomers.map((c) => ({
        name: c._id,
        totalSpent: c.totalSpent,
        orderCount: c.orderCount,
      })),
    });
  } catch (err) {
    console.error('Analytics top-customers error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/analytics/top-products
router.get('/top-products', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { limit } = req.query;
    const topProducts = await SaleRecord.aggregate([
      { $match: { productName: { $ne: '' } } },
      {
        $group: {
          _id: '$productName',
          totalRevenue: { $sum: '$totalAmount' },
          totalQuantity: { $sum: '$quantity' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: parseInt(limit as string) || 10 },
    ]);

    res.json({
      products: topProducts.map((p) => ({
        name: p._id,
        totalRevenue: p.totalRevenue,
        totalQuantity: p.totalQuantity,
        count: p.count,
      })),
    });
  } catch (err) {
    console.error('Analytics top-products error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
