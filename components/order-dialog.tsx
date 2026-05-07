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

type ItemState = Omit<OrderItem, 'subtotal'> & {
  selectedBrand: string;
  selectedCategory: string;
};

export default function OrderDialog({
  isOpen,
  onClose,
  onSave,
  products,
}: OrderDialogProps) {
  const [items, setItems] = useState<ItemState[]>([]);
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

  const uniqueBrands = [...new Set(products.map(p => p.brandName))].sort();

  const addItem = () => {
    setItems([...items, {
      productId: '',
      productName: '',
      quantity: 1,
      unitPrice: 0,
      selectedBrand: '',
      selectedCategory: '',
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    const item = newItems[index];

    if (field === 'selectedBrand') {
      newItems[index] = {
        ...item,
        selectedBrand: value,
        selectedCategory: '',
        productId: '',
        productName: '',
        unitPrice: 0,
      };
    } else if (field === 'selectedCategory') {
      newItems[index] = {
        ...item,
        selectedCategory: value,
        productId: '',
        productName: '',
        unitPrice: 0,
      };
      const matches = products.filter(
        p => p.brandName === item.selectedBrand && p.category === value
      );
      if (matches.length === 1) {
        newItems[index] = {
          ...newItems[index],
          productId: matches[0].id,
          productName: `${matches[0].brandName} - ${matches[0].category}`,
          unitPrice: matches[0].sellingPrice,
        };
      }
    } else if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index] = {
          ...item,
          productId: product.id,
          productName: `${product.brandName} - ${product.category}`,
          unitPrice: product.sellingPrice,
        };
      }
    } else {
      newItems[index] = { ...item, [field]: value };
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
    if (items.some(item => !item.productId)) {
      alert('Please select a product for all items');
      return;
    }

    const orderItems: OrderItem[] = items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
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
              items.map((item, index) => {
                const brandCategories = [...new Set(
                  products
                    .filter(p => p.brandName === item.selectedBrand)
                    .map(p => p.category)
                )].sort();

                const matchingProducts = products.filter(
                  p => p.brandName === item.selectedBrand && p.category === item.selectedCategory
                );

                const selectedProduct = products.find(p => p.id === item.productId);

                return (
                  <div key={index} className="border border-primary/10 rounded-lg p-3 space-y-2 bg-muted/20">
                    {/* Brand + Category row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Brand</p>
                        <select
                          value={item.selectedBrand}
                          onChange={(e) => updateItem(index, 'selectedBrand', e.target.value)}
                          className="w-full px-3 py-2 border border-primary/20 rounded-md bg-background text-foreground text-sm"
                          disabled={isSaving}
                        >
                          <option value="">Select brand</option>
                          {uniqueBrands.map(brand => (
                            <option key={brand} value={brand}>{brand}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Category</p>
                        <select
                          value={item.selectedCategory}
                          onChange={(e) => updateItem(index, 'selectedCategory', e.target.value)}
                          className="w-full px-3 py-2 border border-primary/20 rounded-md bg-background text-foreground text-sm disabled:opacity-50"
                          disabled={!item.selectedBrand || isSaving}
                        >
                          <option value="">Select category</option>
                          {brandCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Stock select — only when multiple products share the same brand+category */}
                    {item.selectedBrand && item.selectedCategory && matchingProducts.length > 1 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Select Stock</p>
                        <select
                          value={item.productId}
                          onChange={(e) => updateItem(index, 'productId', e.target.value)}
                          className="w-full px-3 py-2 border border-primary/20 rounded-md bg-background text-foreground text-sm"
                          disabled={isSaving}
                        >
                          <option value="">Select stock entry</option>
                          {matchingProducts.map(p => (
                            <option key={p.id} value={p.id}>
                              Stock: {p.quantity} | ₱{p.sellingPrice.toLocaleString()}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Stock availability badge */}
                    {selectedProduct && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className={
                          selectedProduct.quantity <= selectedProduct.reorderLevel
                            ? 'text-destructive font-medium'
                            : 'text-green-600 font-medium'
                        }>
                          Available stock: {selectedProduct.quantity}
                        </span>
                        {selectedProduct.quantity <= selectedProduct.reorderLevel && (
                          <span className="text-destructive">(Low Stock)</span>
                        )}
                      </div>
                    )}

                    {/* Qty + Price + Subtotal + Delete */}
                    <div className="flex gap-2 items-end">
                      <div className="w-24 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Qty</p>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          placeholder="Qty"
                          className="border-primary/20 text-sm"
                          disabled={isSaving || !item.productId}
                        />
                      </div>
                      <div className="w-28 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Unit Price</p>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          placeholder="Price"
                          className="border-primary/20 text-sm"
                          readOnly
                          disabled
                        />
                      </div>
                      <div className="flex-1 text-right space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">Subtotal</p>
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
                        disabled={isSaving}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
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
