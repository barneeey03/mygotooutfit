'use client';

import { useState, useEffect } from 'react';
import { Product, OrderItem } from '@/lib/data-context';
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
import { Trash2, Plus } from 'lucide-react';

interface OrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: any) => Promise<void>;
  products: Product[];
}

export default function OrderDialog({
  isOpen,
  onClose,
  onSave,
  products,
}: OrderDialogProps) {
  const [items, setItems] = useState<Omit<OrderItem, 'subtotal'>[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setItems([]);
      setCustomerName('');
      setCustomerEmail('');
      setNotes('');
    }
  }, [isOpen]);

  const addItem = () => {
    setItems([...items, { productId: '', productName: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index] = {
          ...newItems[index],
          productId: product.id,
          productName: product.name,
          unitPrice: product.unitPrice,
        };
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      alert('Please add at least one item to the order');
      return;
    }
    if (!customerName.trim()) {
      alert('Please enter customer name');
      return;
    }

    const orderItems: OrderItem[] = items.map(item => ({
      ...item,
      subtotal: item.quantity * item.unitPrice,
    }));

    setIsSaving(true);
    try {
      await onSave({
        date: new Date().toISOString().split('T')[0],
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        items: orderItems,
        total: calculateTotal(),
        status: 'pending' as const,
        notes,
      });
      setItems([]);
      setCustomerName('');
      setCustomerEmail('');
      setNotes('');
    } catch (error) {
      alert('Failed to create order');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Name */}
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name *</Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
              className="border-primary/20"
              disabled={isSaving}
            />
          </div>

          {/* Customer Email */}
          <div className="space-y-2">
            <Label htmlFor="customerEmail">Customer Email</Label>
            <Input
              id="customerEmail"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="customer@example.com"
              className="border-primary/20"
              disabled={isSaving}
            />
          </div>

          {/* Order Items */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Order Items</Label>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Add items to your order</p>
            ) : (
              items.map((item, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1 space-y-2">
                    <select
                      value={item.productId}
                      onChange={(e) => updateItem(index, 'productId', e.target.value)}
                      className="w-full px-3 py-2 border border-primary/20 rounded-md bg-background text-foreground text-sm"
                    >
                      <option value="">Select product</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-20">
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                      placeholder="Qty"
                      className="border-primary/20 text-sm"
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      placeholder="Price"
                      className="border-primary/20 text-sm"
                      disabled
                    />
                  </div>
                  <div className="w-20 text-right">
                    <p className="text-sm font-semibold">
                      ₱{(item.quantity * item.unitPrice).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
            <Button
              type="button"
              variant="outline"
              onClick={addItem}
              className="w-full gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </Button>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Order Notes (Optional)</Label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions or notes..."
              className="w-full px-3 py-2 border border-primary/20 rounded-md bg-background text-foreground text-sm min-h-20 resize-none"
            />
          </div>

          {/* Total */}
          <div className="pt-4 border-t border-border">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Order Total</span>
              <span className="text-2xl font-bold text-primary">₱{calculateTotal().toLocaleString()}</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-white" disabled={isSaving}>
              {isSaving ? 'Creating...' : 'Create Order'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
