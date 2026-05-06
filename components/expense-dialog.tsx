'use client';

import { useState, useEffect } from 'react';
import { Expense } from '@/lib/data-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: any) => Promise<void>;
  expense?: Expense | null;
  categories: string[];
}

const paymentMethods = ['Cash', 'Credit Card', 'Debit Card', 'Bank Transfer', 'Cheque', 'Other'];

export default function ExpenseDialog({
  isOpen,
  onClose,
  onSave,
  expense,
  categories,
}: ExpenseDialogProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    amount: 0,
    paymentMethod: '',
    receipt: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (expense) {
      setFormData({
        date: expense.date,
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        paymentMethod: expense.paymentMethod,
        receipt: expense.receipt,
      });
    } else {
      setFormData({
        date: new Date().toISOString().split('T')[0],
        category: '',
        description: '',
        amount: 0,
        paymentMethod: '',
        receipt: '',
      });
    }
  }, [expense, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.category || !formData.description || !formData.amount || !formData.paymentMethod) {
      alert('Please fill in all required fields');
      return;
    }
    setIsSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      alert('Failed to save expense');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{expense ? 'Edit Expense' : 'Add New Expense'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="border-primary/20"
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-primary/20 rounded-md bg-background text-foreground disabled:opacity-50"
              disabled={isSaving}
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What was this expense for?"
              className="border-primary/20"
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (฿) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
              className="border-primary/20"
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method *</Label>
            <select
              id="paymentMethod"
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
              className="w-full px-3 py-2 border border-primary/20 rounded-md bg-background text-foreground disabled:opacity-50"
              disabled={isSaving}
            >
              <option value="">Select payment method</option>
              {paymentMethods.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="receipt">Receipt Reference (Optional)</Label>
            <Input
              id="receipt"
              value={formData.receipt}
              onChange={(e) => setFormData({ ...formData, receipt: e.target.value })}
              placeholder="e.g., Receipt #, Invoice #"
              className="border-primary/20"
              disabled={isSaving}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-white" disabled={isSaving}>
              {isSaving ? 'Saving...' : (expense ? 'Update' : 'Add')} Expense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
