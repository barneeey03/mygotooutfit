'use client';

'use client';

import { useMemo, useState, useEffect } from 'react';
import { useData, Expense } from '@/lib/data-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrendingUp, Plus, Edit2, Trash2, Search, DollarSign, Layers } from 'lucide-react';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import PageHeader from '@/components/page-header';
import ExpenseDialog from '@/components/expense-dialog';
import ConfirmationDialog from '@/components/confirmation-dialog';

const defaultExpenseTypes = ['Flight Expenses', 'Transportation', 'Food Allowance', 'Medical Expenses', 'Training Expenses', 'Visa Processing', 'Documentation Fees', 'Hotel Accommodation', 'Others'];

export default function ExpensesPage() {
  const { products, expenses, expenseTypes, brands, addExpense, updateExpense, deleteExpense, syncInventoryToExpenses } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('date-desc');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  const customExpenseTypes = useMemo(() => {
    return Array.from(new Set([
      ...defaultExpenseTypes,
      ...expenseTypes.map((type) => type.name),
      ...brands.map((brand) => brand.name)
    ])).sort();
  }, [expenseTypes, brands]);

  // Automatic sync of inventory to expenses
  useEffect(() => {
    const syncAutomatically = async () => {
      if (products.length > 0 && expenses.length >= 0) {
        try {
          await syncInventoryToExpenses();
        } catch (error) {
          console.error('Automatic sync failed:', error);
        }
      }
    };

    syncAutomatically();
  }, [products, expenses, syncInventoryToExpenses]);

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
    const date = new Date(e.date);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const existing = acc.find(item => item.key === key);
    if (existing) {
      existing.amount += e.amount;
    } else {
      acc.push({ key, month: monthLabel, amount: e.amount });
    }
    return acc;
  }, [] as Array<{ key: string; month: string; amount: number }> ).sort((a, b) => a.key.localeCompare(b.key)).slice(-6);

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
      <PageHeader
        title="Expenses Tracking"
        description="Track and manage business expenses"
        icon={<TrendingUp className="w-8 h-8" />}
        action={
          <Button
            onClick={() => {
              setEditingExpense(null);
              setIsDialogOpen(true);
            }}
            className="text-white gap-2 w-fit transition-colors"
            style={{ backgroundColor: '#e68bbe' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eea1cd'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e68bbe'}
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </Button>
        }
      />

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
              {monthlyExpenses.length > 0 ? `₱${(monthlyExpenses[monthlyExpenses.length - 1].amount / 1000).toFixed(1)}K` : '₱0'}
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
                    label={({ name, value }) => `${name}: ₱${(value / 1000).toFixed(1)}K`}
                    outerRadius={80}
                    fill="#f946d0"
                    dataKey="value"
                  >
                    {colors.map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} />
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
                  <Tooltip formatter={(value) => `₱${value.toLocaleString()}`} />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#f946d0" strokeWidth={2} name="Expenses" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Search + Sort */}
      <div className="grid gap-4 md:grid-cols-[1fr_auto] items-end">
        <div className="relative">
          <label htmlFor="search" className="text-sm font-medium text-muted-foreground mb-2 block">
            Search Expenses
          </label>
          <Search className="absolute left-3 top-10 w-4 h-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search by description or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-primary/20"
          />
        </div>
        <div>
          <label htmlFor="expense-sort" className="text-sm font-medium text-muted-foreground mb-2 block">
            Sort by
          </label>
          <select
            id="expense-sort"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="px-3 py-2 border border-primary/20 rounded-md bg-background text-foreground text-sm"
          >
            <option value="date-desc">Date (Newest)</option>
            <option value="date-asc">Date (Oldest)</option>
            <option value="amount-desc">Amount (High to Low)</option>
            <option value="category-asc">Category</option>
            <option value="paymentMethod-asc">Payment Method</option>
          </select>
        </div>
      </div>

      {/* Expenses Table Card */}
      <Card className="border-primary/10 shadow-sm">
        <CardHeader className="border-b" style={{ backgroundColor: '#fde4f2', borderColor: '#f9cee7' }}>
          <CardTitle className="flex items-center gap-2" style={{ color: '#e68bbe' }}>
            <TrendingUp className="w-5 h-5" />
            Recent Expenses
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No expenses found</p>
              <p className="text-xs text-muted-foreground mt-1">Start tracking your expenses</p>
            </div>
          ) : (
            <div className="overflow-x-auto w-full max-h-[520px] overflow-y-auto">
              <table className="w-full min-w-full">
                <thead>
                  <tr className="text-white" style={{ backgroundColor: '#e68bbe' }}>
                    <th className="text-left py-4 px-6 font-semibold text-sm whitespace-nowrap">Date</th>
                    <th className="text-left py-4 px-6 font-semibold text-sm whitespace-nowrap">Category</th>
                    <th className="text-left py-4 px-6 font-semibold text-sm whitespace-nowrap">Description</th>
                    <th className="text-left py-4 px-6 font-semibold text-sm whitespace-nowrap">Payment Method</th>
                    <th className="text-right py-4 px-6 font-semibold text-sm whitespace-nowrap">Amount</th>
                    <th className="text-center py-4 px-6 font-semibold text-sm whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedExpenses.map((expense, index) => {
                    const isEvenRow = index % 2 === 0;
                    
                    return (
                      <tr
                        key={expense.id}
                        className="border-b border-border transition-colors"
                        style={{
                          backgroundColor: isEvenRow ? 'white' : '#fde4f2',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9cee7'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isEvenRow ? 'white' : '#fde4f2'}
                      >
                        <td className="py-4 px-6 text-sm text-muted-foreground font-medium whitespace-nowrap">
                          {new Date(expense.date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </td>
                        <td className="py-4 px-6 whitespace-nowrap">
                          <span 
                            className="inline-block px-3 py-1 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: '#f4b8da', color: '#e68bbe' }}
                          >
                            {expense.category}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-medium text-foreground whitespace-nowrap">
                          {expense.description}
                        </td>
                        <td className="py-4 px-6 text-muted-foreground text-xs whitespace-nowrap">
                          {expense.paymentMethod}
                        </td>
                        <td className="py-4 px-6 text-right font-semibold text-foreground whitespace-nowrap">
                          ₱{expense.amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingExpense(expense);
                                setIsDialogOpen(true);
                              }}
                              className="h-8 w-8 p-0 transition-colors"
                              style={{ color: '#e68bbe' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f4b8da'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteExpense(expense.id)}
                              className="h-8 w-8 p-0 transition-colors text-red-600"
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
        expenseTypes={customExpenseTypes}
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
