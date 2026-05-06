'use client';

import { useState } from 'react';
import { useData, Expense } from '@/lib/data-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrendingUp, Plus, Edit2, Trash2, Search, DollarSign } from 'lucide-react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import ExpenseDialog from '@/components/expense-dialog';
import ConfirmationDialog from '@/components/confirmation-dialog';

const expenseCategories = ['Supplies', 'Transportation', 'Rent', 'Utilities', 'Staff', 'Marketing', 'Maintenance', 'Other'];

export default function ExpensesPage() {
  const { expenses, addExpense, updateExpense, deleteExpense } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('date-desc');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  const filteredExpenses = expenses.filter(e =>
    e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    switch (sortOption) {
      case 'date-asc':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'date-desc':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'amount-desc':
        return b.amount - a.amount;
      case 'category-asc':
        return a.category.localeCompare(b.category);
      case 'paymentMethod-asc':
        return a.paymentMethod.localeCompare(b.paymentMethod);
      default:
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

  const handleAddExpense = async (expense: Omit<Expense, 'id'>) => {
    try {
      await addExpense(expense);
      setIsDialogOpen(false);
    } catch (error) {
      alert('Failed to add expense');
      console.error(error);
    }
  };

  const handleUpdateExpense = async (expense: Partial<Expense>) => {
    if (editingExpense) {
      try {
        await updateExpense(editingExpense.id, expense);
        setEditingExpense(null);
        setIsDialogOpen(false);
      } catch (error) {
        alert('Failed to update expense');
        console.error(error);
      }
    }
  };

  const handleDeleteExpense = (id: string) => {
    setExpenseToDelete(id);
    setConfirmDialogOpen(true);
  };

  const confirmDeleteExpense = async () => {
    if (expenseToDelete) {
      try {
        await deleteExpense(expenseToDelete);
      } catch (error) {
        alert('Failed to delete expense');
        console.error(error);
      }
      setExpenseToDelete(null);
    }
  };

  // Calculate metrics
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const monthlyExpenses = expenses.reduce((acc, e) => {
    const month = new Date(e.date).toLocaleDateString('en-US', { month: 'short' });
    const existing = acc.find(item => item.month === month);
    if (existing) {
      existing.amount += e.amount;
    } else {
      acc.push({ month, amount: e.amount });
    }
    return acc;
  }, [] as Array<{ month: string; amount: number }>).slice(-6);

  // Category breakdown
  const categoryBreakdown = expenses.reduce((acc, e) => {
    const existing = acc.find(item => item.name === e.category);
    if (existing) {
      existing.value += e.amount;
    } else {
      acc.push({ name: e.category, value: e.amount });
    }
    return acc;
  }, [] as Array<{ name: string; value: number }>);

  const colors = ['#f946d0', '#ec4899', '#db2777', '#be185d', '#9d174d', '#831843', '#500724', '#f5c2e8'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Expenses Tracking</h1>
          <p className="text-muted-foreground mt-2">Track and manage business expenses</p>
        </div>
        <Button
          onClick={() => {
            setEditingExpense(null);
            setIsDialogOpen(true);
          }}
          className="bg-primary hover:bg-primary/90 text-white gap-2 w-fit"
        >
          <Plus className="w-4 h-4" />
          Add Expense
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₱{(totalExpenses / 1000).toFixed(1)}K
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {expenses.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Expense</CardTitle>
            <TrendingUp className="w-4 h-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {expenses.length > 0 ? `₱${(totalExpenses / expenses.length).toLocaleString()}` : '₱0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average amount
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="w-4 h-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthlyExpenses.length > 0 ? `฿${(monthlyExpenses[monthlyExpenses.length - 1].amount / 1000).toFixed(1)}K` : '฿0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Current month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses by Category */}
        {categoryBreakdown.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ฿${(value / 1000).toFixed(1)}K`}
                    outerRadius={80}
                    fill="#f946d0"
                    dataKey="value"
                  >
                    {colors.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `฿${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Monthly Trend */}
        {monthlyExpenses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Monthly Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyExpenses}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `฿${value.toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#f946d0" strokeWidth={2} name="Expenses" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Search + Sort */}
      <div className="grid gap-4 md:grid-cols-[1fr_auto] items-center">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-primary/20"
          />
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="expense-sort" className="text-sm font-medium text-muted-foreground">
            Sort by
          </label>
          <select
            id="expense-sort"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="px-3 py-2 border border-primary/20 rounded-md bg-background text-foreground"
          >
            <option value="date-desc">Date (Newest)</option>
            <option value="date-asc">Date (Oldest)</option>
            <option value="amount-desc">Amount (High to Low)</option>
            <option value="category-asc">Category</option>
            <option value="paymentMethod-asc">Payment Method</option>
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-destructive" />
            Recent Expenses ({filteredExpenses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No expenses found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold">Date</th>
                    <th className="text-left py-3 px-4 font-semibold">Category</th>
                    <th className="text-left py-3 px-4 font-semibold">Description</th>
                    <th className="text-left py-3 px-4 font-semibold">Payment Method</th>
                    <th className="text-right py-3 px-4 font-semibold">Amount</th>
                    <th className="text-right py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedExpenses.map((expense) => (
                    <tr key={expense.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4">{new Date(expense.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {expense.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium">{expense.description}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{expense.paymentMethod}</td>
                      <td className="py-3 px-4 text-right font-semibold">฿{expense.amount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingExpense(expense);
                            setIsDialogOpen(true);
                          }}
                          className="text-primary hover:bg-primary/10"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <ExpenseDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingExpense(null);
        }}
        onSave={editingExpense ? handleUpdateExpense : handleAddExpense}
        expense={editingExpense}
        categories={expenseCategories}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialogOpen}
        onClose={() => {
          setConfirmDialogOpen(false);
          setExpenseToDelete(null);
        }}
        onConfirm={confirmDeleteExpense}
        title="Delete Expense"
        description="Are you sure you want to delete this expense? This action cannot be undone."
        confirmText="Delete Expense"
        variant="destructive"
      />
    </div>
  );
}
