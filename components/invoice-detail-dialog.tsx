'use client';

import { Invoice } from '@/lib/data-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface InvoiceDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice;
  onUpdate: (updates: Partial<Invoice>) => void;
  onPrint: () => void;
  onDelete: () => void;
}

export default function InvoiceDetailDialog({
  isOpen,
  onClose,
  invoice,
  onUpdate,
  onPrint,
  onDelete,
}: InvoiceDetailDialogProps) {
  const handleStatusChange = (status: Invoice['status']) => {
    onUpdate({ status });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice Details #{invoice.id.slice(0, 8)}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Invoice Date</Label>
              <p className="font-medium">{new Date(invoice.date).toLocaleDateString()}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Due Date</Label>
              <p className="font-medium">{new Date(invoice.dueDate).toLocaleDateString()}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Customer</Label>
              <p className="font-medium">{invoice.customerName}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Email</Label>
              <p className="font-medium text-sm">{invoice.customerEmail}</p>
            </div>
          </div>

          {/* Status */}
          <div>
            <Label className="text-sm font-semibold block mb-3">Status</Label>
            <div className="flex gap-2">
              {(['draft', 'sent', 'paid', 'overdue'] as const).map(status => (
                <Button
                  key={status}
                  variant={invoice.status === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusChange(status)}
                  className={invoice.status === status ? 'bg-primary text-white' : ''}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Items Table */}
          <div>
            <Label className="text-sm font-semibold block mb-3">Items</Label>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="text-left p-3 font-medium">Product</th>
                    <th className="text-right p-3 font-medium">Qty</th>
                    <th className="text-right p-3 font-medium">Unit Price</th>
                    <th className="text-right p-3 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
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

          {/* Totals */}
          <div className="pt-4 border-t border-border space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
                <span className="font-medium">₱{invoice.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax:</span>
                <span className="font-medium">₱{invoice.tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                <span>Total:</span>
                <span className="text-primary">₱{invoice.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="destructive" onClick={onDelete}>
            Delete
          </Button>
          <Button variant="outline" onClick={onPrint}>
            Print
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
