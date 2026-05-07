'use client';

import { useState } from 'react';
import { Order, Invoice, OrderItem } from '@/lib/data-context';
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

interface InvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (invoice: Omit<Invoice, 'id'>) => Promise<void>;
  onEdit: (invoice: Invoice) => Promise<void>;

  orders: Order[];
}

export default function InvoiceDialog({
  isOpen,
  onClose,
  onSave,
  orders,
}: InvoiceDialogProps) {
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const selectedOrder = orders.find(o => o.id === selectedOrderId);
  const total = selectedOrder?.total ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder || !customerName || !customerEmail) {
      alert('Please fill in all required fields');
      return;
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    setIsSaving(true);
    try {
      await onSave({
        orderId: selectedOrder.id,
        date: new Date().toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
        items: selectedOrder.items,
        subtotal: total,
        tax: 0,
        total,
        status: 'overdue',
        customerName,
        customerEmail,
      });

      setSelectedOrderId('');
      setCustomerName('');
      setCustomerEmail('');
    } catch (error) {
      alert('Failed to create invoice');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="order">Select Order *</Label>
            <select
              id="order"
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              className="w-full px-3 py-2 border border-primary/20 rounded-md bg-background text-foreground disabled:opacity-50"
              disabled={isSaving}
            >
              <option value="">Choose an order</option>
              {orders.map(order => (
                <option key={order.id} value={order.id}>
                  Order #{order.id.slice(0, 8)} - ₱{order.total.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Customer Name *</Label>
            <Input
              id="name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer name"
              className="border-primary/20"
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Customer Email *</Label>
            <Input
              id="email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="customer@example.com"
              className="border-primary/20"
              disabled={isSaving}
            />
          </div>

          {selectedOrder && (
            <div className="pt-4 border-t border-border">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary">₱{total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-white" disabled={isSaving}>
              {isSaving ? 'Creating...' : 'Create Invoice'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
