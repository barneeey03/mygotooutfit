'use client';

import { Order } from '@/lib/data-context';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Package, User, FileText, Trash2 } from 'lucide-react';

interface OrderDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onUpdate: (updates: Partial<Order>) => void;
  onDelete: () => void;
}

const ORDER_STATUSES = ['pending', 'secured', 'to-ship', 'completed'] as const;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; ring: string }> = {
  pending:   { label: 'Pending',   color: '#92400e', bg: '#fef3c7', ring: '#fde68a' },
  secured:   { label: 'Secured',   color: '#1e40af', bg: '#dbeafe', ring: '#bfdbfe' },
  'to-ship': { label: 'To Ship',   color: '#6b21a8', bg: '#f3e8ff', ring: '#e9d5ff' },
  completed: { label: 'Completed', color: '#065f46', bg: '#d1fae5', ring: '#a7f3d0' },
};

export default function OrderDetailDialog({
  isOpen,
  onClose,
  order,
  onUpdate,
  onDelete,
}: OrderDetailDialogProps) {
  const currentIndex = ORDER_STATUSES.indexOf(order.status as typeof ORDER_STATUSES[number]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogTitle className="sr-only">
          Order Details #{order.id.slice(-6).toUpperCase()}
        </DialogTitle>

        {/* Header banner */}
        <div
          className="px-6 py-5 rounded-t-lg"
          style={{ background: 'linear-gradient(135deg, #e68bbe 0%, #f4a8d4 100%)' }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/75 text-xs font-semibold uppercase tracking-widest">Order</p>
              <h2 className="text-white text-2xl font-bold mt-0.5 tracking-tight">
                #{order.id.slice(-6).toUpperCase()}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-white/75 text-xs font-semibold uppercase tracking-widest">Date</p>
              <p className="text-white font-semibold text-sm mt-0.5">
                {new Date(order.date).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 pt-5 pb-2 space-y-6">

          {/* Customer + Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-3 p-4 rounded-xl border border-border/50 bg-muted/20">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#fce7f3' }}>
                <User className="w-4 h-4" style={{ color: '#e68bbe' }} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground font-medium">Customer</p>
                <p className="font-semibold text-sm mt-0.5 truncate">{order.customerName}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {order.customerEmail || 'No email provided'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl border border-border/50 bg-muted/20">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#fce7f3' }}>
                <Package className="w-4 h-4" style={{ color: '#e68bbe' }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Summary</p>
                <p className="font-semibold text-sm mt-0.5">
                  {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                </p>
                <p className="text-xs font-bold mt-0.5" style={{ color: '#e68bbe' }}>
                  ₱{order.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Status stepper */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
              Order Progress
            </p>
            <div className="flex items-start">
              {ORDER_STATUSES.map((status, i) => {
                const isCompleted = i < currentIndex;
                const isCurrent = i === currentIndex;
                const cfg = STATUS_CONFIG[status];

                return (
                  <div key={status} className="flex items-start flex-1 last:flex-none">
                    <button
                      onClick={() => onUpdate({ status })}
                      type="button"
                      className="flex flex-col items-center gap-1.5 cursor-pointer group"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 border-2"
                        style={{
                          backgroundColor: isCompleted || isCurrent ? cfg.bg : 'transparent',
                          borderColor: isCompleted || isCurrent ? cfg.color : '#d1d5db',
                          color: isCompleted || isCurrent ? cfg.color : '#9ca3af',
                          transform: isCurrent ? 'scale(1.18)' : 'scale(1)',
                          boxShadow: isCurrent ? `0 0 0 4px ${cfg.ring}` : 'none',
                        }}
                      >
                        {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
                      </div>
                      <span
                        className="text-xs font-semibold whitespace-nowrap"
                        style={{ color: isCompleted || isCurrent ? cfg.color : '#9ca3af' }}
                      >
                        {cfg.label}
                      </span>
                    </button>
                    {i < ORDER_STATUSES.length - 1 && (
                      <div
                        className="flex-1 h-0.5 mt-5 mx-1 rounded-full transition-all duration-300"
                        style={{ backgroundColor: i < currentIndex ? '#e68bbe' : '#e5e7eb' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Order items table */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
              Items Ordered
            </p>
            <div className="rounded-xl overflow-hidden border border-border/50">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #e68bbe 0%, #f4a8d4 100%)' }}>
                    <th className="text-left p-3 font-semibold text-white text-xs">#</th>
                    <th className="text-left p-3 font-semibold text-white text-xs">Product</th>
                    <th className="text-center p-3 font-semibold text-white text-xs">Qty</th>
                    <th className="text-right p-3 font-semibold text-white text-xs">Unit Price</th>
                    <th className="text-right p-3 font-semibold text-white text-xs">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => (
                    <tr
                      key={index}
                      className="border-b border-border/30 last:border-b-0"
                      style={{ backgroundColor: index % 2 === 0 ? 'white' : '#fdf2f8' }}
                    >
                      <td className="p-3 text-xs text-muted-foreground">{index + 1}</td>
                      <td className="p-3 font-medium text-xs">{item.productName}</td>
                      <td className="p-3 text-center text-xs">{item.quantity}</td>
                      <td className="p-3 text-right text-xs">
                        ₱{item.unitPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-right font-semibold text-xs">
                        ₱{item.subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                Notes
              </p>
              <div className="flex gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
                <FileText className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{order.notes}</p>
              </div>
            </div>
          )}

          {/* Total strip */}
          <div
            className="flex justify-between items-center px-5 py-4 rounded-xl"
            style={{ background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)' }}
          >
            <div>
              <p className="text-xs text-muted-foreground font-medium">Order Total</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {order.items.reduce((s, i) => s + i.quantity, 0)} units across {order.items.length} item{order.items.length !== 1 ? 's' : ''}
              </p>
            </div>
            <span className="text-3xl font-bold" style={{ color: '#e68bbe' }}>
              ₱{order.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-border/50 mt-2">
          <Button
            variant="ghost"
            onClick={onDelete}
            className="text-destructive hover:bg-destructive/10 gap-2 text-sm"
          >
            <Trash2 className="w-4 h-4" />
            Delete Order
          </Button>
          <Button variant="outline" onClick={onClose} className="text-sm">
            Close
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
