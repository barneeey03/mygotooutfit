'use client';

import { useData } from '@/lib/data-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Package, ShoppingCart, FileText, TrendingUp, AlertCircle, DollarSign } from 'lucide-react';

export default function DashboardPage() {
  const { products, orders, invoices, expenses } = useData();

  // Calculate metrics
  const totalInventoryValue = products.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
  const lowStockItems = products.filter(p => p.quantity <= p.reorderLevel);
  const totalOrders = orders.length;
  const totalInvoices = invoices.length;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const paidInvoices = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);

  // Chart data - Category distribution
  const categoryData = products.reduce((acc, p) => {
    const existing = acc.find(item => item.name === p.category);
    if (existing) {
      existing.value += p.quantity;
      existing.stock += p.quantity * p.unitPrice;
    } else {
      acc.push({ name: p.category, value: p.quantity, stock: p.quantity * p.unitPrice });
    }
    return acc;
  }, [] as Array<{ name: string; value: number; stock: number }>);

  // Chart data - Monthly expenses
  const expensesByMonth = expenses.reduce((acc, e) => {
    const month = new Date(e.date).toLocaleDateString('en-US', { month: 'short' });
    const existing = acc.find(item => item.month === month);
    if (existing) {
      existing.amount += e.amount;
    } else {
      acc.push({ month, amount: e.amount });
    }
    return acc;
  }, [] as Array<{ month: string; amount: number }>).slice(-6);

  // Chart data - Invoice status
  const invoiceStatus = [
    { name: 'Paid', value: invoices.filter(i => i.status === 'paid').length },
    { name: 'Pending', value: invoices.filter(i => i.status === 'sent').length },
    { name: 'Overdue', value: invoices.filter(i => i.status === 'overdue').length },
  ];

  const colors = ['#f946d0', '#ec4899', '#db2777'];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Overview of your inventory management system</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Inventory Value */}
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <DollarSign className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(totalInventoryValue / 1000).toFixed(1)}K
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {products.length} products
            </p>
          </CardContent>
        </Card>

        {/* Orders */}
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {orders.filter(o => o.status === 'pending').length} pending
            </p>
          </CardContent>
        </Card>

        {/* Invoices */}
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="w-4 h-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoices}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {(paidInvoices / 1000).toFixed(1)}K collected
            </p>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingUp className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(totalExpenses / 1000).toFixed(1)}K
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {expenses.length} transactions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <CardTitle>Low Stock Alert</CardTitle>
            </div>
            <span className="text-sm font-medium text-destructive">{lowStockItems.length} items</span>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {lowStockItems.map(item => (
                <div key={item.id} className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-destructive/20">
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Stock: {item.quantity} / Reorder: {item.reorderLevel}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Inventory by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#f946d0" name="Quantity" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-secondary" />
              Invoice Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {invoiceStatus.some(item => item.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={invoiceStatus.filter(item => item.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#f946d0"
                    dataKey="value"
                  >
                    {colors.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground">
                No invoices yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Expenses */}
        {expensesByMonth.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-destructive" />
                Monthly Expenses Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={expensesByMonth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#f946d0" name="Expenses" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
