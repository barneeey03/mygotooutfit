'use client';

import { Order } from '@/lib/data-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface OrderDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onUpdate: (updates: Partial<Order>) => void;
  onDelete: () => void;
}

export default function OrderDetailDialog({
  isOpen,
  onClose,
  order,
  onUpdate,
  onDelete,
}: OrderDetailDialogProps) {
  const handleStatusChange = (status: Order['status']) => {
    onUpdate({ status });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Order Details #{order.id.slice(0, 8)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Order Date</Label>
              <p className="font-medium">{new Date(order.date).toLocaleDateString()}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Customer Name</Label>
              <p className="font-medium">{order.customerName}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Customer Email</Label>
              <p className="font-medium">{order.customerEmail || 'Not provided'}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <div className="flex gap-2 mt-1">
                {(['pending', 'completed', 'cancelled'] as const).map(status => (
                  <Button
                    key={status}
                    variant={order.status === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleStatusChange(status)}
                    className={order.status === status ? 'bg-primary text-white' : ''}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <Label className="text-sm font-semibold block mb-3">Order Items</Label>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left p-3 font-medium">Product</th>
                    <th className="text-right p-3 font-medium">Quantity</th>
                    <th className="text-right p-3 font-medium">Unit Price</th>
                    <th className="text-right p-3 font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr key={index} className="border-b border-border last:border-b-0">
                      <td className="p-3">{item.productName}</td>
                      <td className="text-right p-3">{item.quantity}</td>
                      <td className="text-right p-3">₱{item.unitPrice.toLocaleString()}</td>
                      <td className="text-right p-3 font-semibold">₱{item.subtotal.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div>
              <Label className="text-sm font-semibold block mb-2">Notes</Label>
              <p className="text-sm text-foreground bg-secondary/30 p-3 rounded-lg">{order.notes}</p>
            </div>
          )}

          {/* Total */}
          <div className="pt-4 border-t border-border">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Order Total</span>
              <span className="text-2xl font-bold text-primary">₱{order.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="destructive" onClick={onDelete}>
            Delete Order
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
