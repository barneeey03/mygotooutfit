'use client';

import { Invoice } from '@/lib/data-context';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Printer, Trash2, X } from 'lucide-react';

interface InvoiceDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  invoiceNumber: string;
  onUpdateAll: (updates: Partial<Invoice>) => void;
  onPrint: () => void;
  onDeleteAll: () => void;
}

const STATUS_OPTIONS = ['draft', 'sent', 'paid', 'overdue'] as const;

const STATUS_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  draft:   { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' },
  sent:    { bg: '#dbeafe', text: '#1d4ed8', border: '#93c5fd' },
  paid:    { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  overdue: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
  done:    { bg: '#c7d2fe', text: '#3730a3', border: '#a5b4fc' },
};

export default function InvoiceDetailDialog({
  isOpen,
  onClose,
  invoices,
  invoiceNumber,
  onUpdateAll,
  onPrint,
  onDeleteAll,
}: InvoiceDetailDialogProps) {
  if (invoices.length === 0) return null;

  // Deduplicate by orderId so the same order never gets counted twice
  const uniqueInvoices = invoices.filter(
    (inv, idx, arr) => arr.findIndex(i => i.orderId === inv.orderId) === idx
  );

  const primary = uniqueInvoices[0];
  const allItems = uniqueInvoices.flatMap(inv => inv.items);
  const grandTotal = uniqueInvoices.reduce((sum, inv) => sum + inv.subtotal, 0);
  const currentStatus = primary.status;
  const statusStyle = STATUS_STYLES[currentStatus] ?? STATUS_STYLES.draft;

  const earliestDate = uniqueInvoices.reduce(
    (min, inv) => inv.date < min ? inv.date : min,
    primary.date
  );
  const latestDueDate = uniqueInvoices.reduce(
    (max, inv) => inv.dueDate > max ? inv.dueDate : max,
    primary.dueDate
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0 gap-0 rounded-2xl">
        <DialogTitle className="sr-only">Invoice Details - {invoiceNumber}</DialogTitle>

        {/* Brand Header */}
        <div
          className="rounded-t-2xl px-8 py-7"
          style={{ background: 'linear-gradient(135deg, #e68bbe 0%, #c9508a 100%)' }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-extrabold text-white text-lg leading-tight">mygotooutfit</p>
                <p className="text-white/70 text-xs mt-0.5 tracking-wide">BKK Pasabuy</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-4xl font-black text-white/90 tracking-widest leading-none">INVOICE</p>
              <p className="text-white/80 text-sm font-semibold mt-2 tracking-wider"># INV-{invoiceNumber}</p>
            </div>
          </div>
        </div>

        <div className="px-8 pt-7 pb-6 space-y-6">

          {/* Bill To + Invoice Meta */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#e68bbe' }}>
                Bill To
              </p>
              <p className="font-bold text-base text-foreground leading-tight">{primary.customerName}</p>
              <p className="text-sm text-muted-foreground">{primary.customerEmail}</p>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#e68bbe' }}>
                Invoice Details
              </p>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-medium">
                    {new Date(earliestDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Due Date</span>
                  <span className="font-medium">
                    {new Date(latestDueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status</span>
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize"
                    style={{
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.text,
                      borderColor: statusStyle.border,
                    }}
                  >
                    {currentStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Dashed Divider */}
          <div className="border-t-2 border-dashed" style={{ borderColor: '#f5c2e8' }} />

          {/* Items Table */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#e68bbe' }}>
              Order Items
            </p>
            <div className="rounded-xl overflow-hidden border" style={{ borderColor: '#f5c2e8' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#fdf0f8' }}>
                    <th className="text-left px-4 py-3 font-bold text-xs uppercase tracking-wide text-muted-foreground">
                      Product
                    </th>
                    <th className="text-center px-4 py-3 font-bold text-xs uppercase tracking-wide text-muted-foreground w-16">
                      Qty
                    </th>
                    <th className="text-right px-4 py-3 font-bold text-xs uppercase tracking-wide text-muted-foreground">
                      Unit Price
                    </th>
                    <th className="text-right px-4 py-3 font-bold text-xs uppercase tracking-wide text-muted-foreground">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {allItems.map((item, index) => (
                    <tr
                      key={index}
                      className="border-t"
                      style={{
                        borderColor: '#fce7f3',
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#fefbfd',
                      }}
                    >
                      <td className="px-4 py-3 font-medium text-foreground">{item.productName}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">
                        ₱{item.unitPrice.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-foreground">
                        ₱{item.subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-end">
            <div
              className="rounded-2xl px-6 py-4 flex items-center gap-10"
              style={{ background: 'linear-gradient(135deg, #fdf0f8 0%, #fce7f3 100%)', border: '1.5px solid #f5c2e8' }}
            >
              <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Total Amount
              </span>
              <span className="text-2xl font-black" style={{ color: '#c9508a' }}>
                ₱{grandTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Status Update */}
          <div className="border-t pt-5" style={{ borderColor: '#fce7f3' }}>
            <p className="text-[10px] font-black uppercase tracking-widest mb-3" style={{ color: '#e68bbe' }}>
              Update Status
            </p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(status => {
                const s = STATUS_STYLES[status];
                const isActive = currentStatus === status;
                return (
                  <button
                    key={status}
                    onClick={() => onUpdateAll({ status })}
                    className="px-4 py-1.5 rounded-full text-xs font-bold border capitalize transition-all"
                    style={{
                      backgroundColor: isActive ? s.bg : 'transparent',
                      color: isActive ? s.text : '#9ca3af',
                      borderColor: isActive ? s.border : '#e5e7eb',
                      boxShadow: isActive ? `0 0 0 2px ${s.border}` : 'none',
                    }}
                  >
                    {status}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: '#fce7f3' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeleteAll}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 gap-2 text-xs font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Invoice
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onPrint}
                className="gap-2 text-xs font-semibold border-gray-200"
              >
                <Printer className="w-3.5 h-3.5" />
                Print
              </Button>
              <Button
                size="sm"
                onClick={onClose}
                className="text-white gap-2 text-xs font-semibold"
                style={{ backgroundColor: '#e68bbe' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#c9508a')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#e68bbe')}
              >
                <X className="w-3.5 h-3.5" />
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
