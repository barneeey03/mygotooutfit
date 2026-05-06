'use client';

import { useState } from 'react';
import { useData, Invoice } from '@/lib/data-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Plus, Download, Eye, Trash2, Search } from 'lucide-react';
import InvoiceDialog from '@/components/invoice-dialog';
import InvoiceDetailDialog from '@/components/invoice-detail-dialog';

export default function InvoicesPage() {
  const { invoices, orders, addInvoice, updateInvoice, deleteInvoice } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const filteredInvoices = invoices.filter(inv =>
    inv.id.includes(searchTerm) ||
    inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.status.includes(searchTerm)
  );

  const handleAddInvoice = (invoice: Omit<Invoice, 'id'>) => {
    const newInvoice: Invoice = {
      ...invoice,
      id: Date.now().toString(),
    };
    addInvoice(newInvoice);
    setIsDialogOpen(false);
  };

  const handleUpdateInvoice = (updates: Partial<Invoice>) => {
    if (selectedInvoice) {
      updateInvoice(selectedInvoice.id, updates);
      setSelectedInvoice(null);
      setDetailDialogOpen(false);
    }
  };

  const handleDeleteInvoice = (id: string) => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      deleteInvoice(id);
    }
  };

  const handlePrintInvoice = (invoice: Invoice) => {
    const printWindow = window.open('', '', 'height=800,width=1000');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice ${invoice.id}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #f946d0; padding-bottom: 20px; }
              .header h1 { margin: 0; color: #f946d0; }
              .info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
              .info div { font-size: 14px; }
              .info label { font-weight: bold; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th { background-color: #f5c2e8; padding: 10px; text-align: left; }
              td { padding: 10px; border-bottom: 1px solid #ddd; }
              .total { text-align: right; font-size: 18px; font-weight: bold; color: #f946d0; }
              .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>INVOICE</h1>
              <p>mygotooutfit - BKK Pasabuy</p>
            </div>
            <div class="info">
              <div>
                <label>Invoice No.:</label> ${invoice.id}<br>
                <label>Date:</label> ${new Date(invoice.date).toLocaleDateString()}<br>
                <label>Due Date:</label> ${new Date(invoice.dueDate).toLocaleDateString()}
              </div>
              <div>
                <label>Customer:</label> ${invoice.customerName}<br>
                <label>Email:</label> ${invoice.customerEmail}
              </div>
            </div>
            <table>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Amount</th>
              </tr>
              ${invoice.items.map(item => `
                <tr>
                  <td>${item.productName}</td>
                  <td style="text-align: right;">${item.quantity}</td>
                  <td style="text-align: right;">฿${item.unitPrice.toLocaleString()}</td>
                  <td style="text-align: right;">฿${item.subtotal.toLocaleString()}</td>
                </tr>
              `).join('')}
            </table>
            <div style="text-align: right; padding-right: 50px;">
              <p><strong>Subtotal:</strong> ฿${invoice.subtotal.toLocaleString()}</p>
              <p><strong>Tax (${((invoice.tax / invoice.subtotal) * 100).toFixed(0)}%):</strong> ฿${invoice.tax.toLocaleString()}</p>
              <p class="total">TOTAL: ฿${invoice.total.toLocaleString()}</p>
            </div>
            <div class="footer">
              <p>Thank you for your business!</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-primary/10 text-primary';
      case 'sent':
        return 'bg-accent/10 text-accent';
      case 'overdue':
        return 'bg-destructive/10 text-destructive';
      case 'draft':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Invoices Management</h1>
          <p className="text-muted-foreground mt-2">Create and manage invoices</p>
        </div>
        <Button
          onClick={() => {
            setSelectedInvoice(null);
            setIsDialogOpen(true);
          }}
          className="bg-primary hover:bg-primary/90 text-white gap-2 w-fit"
        >
          <Plus className="w-4 h-4" />
          New Invoice
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search invoices..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 border-primary/20"
        />
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-secondary" />
            Invoices ({filteredInvoices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No invoices found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold">Invoice #</th>
                    <th className="text-left py-3 px-4 font-semibold">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold">Date</th>
                    <th className="text-left py-3 px-4 font-semibold">Due Date</th>
                    <th className="text-right py-3 px-4 font-semibold">Amount</th>
                    <th className="text-center py-3 px-4 font-semibold">Status</th>
                    <th className="text-right py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4 font-medium text-primary">#{invoice.id.slice(0, 6)}</td>
                      <td className="py-3 px-4">{invoice.customerName}</td>
                      <td className="py-3 px-4 text-muted-foreground">{new Date(invoice.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-muted-foreground">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right font-semibold">฿{invoice.total.toLocaleString()}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePrintInvoice(invoice)}
                          className="text-secondary hover:bg-secondary/10"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setDetailDialogOpen(true);
                          }}
                          className="text-primary hover:bg-primary/10"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteInvoice(invoice.id)}
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

      {/* Create Invoice Dialog */}
      <InvoiceDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleAddInvoice}
        orders={orders}
      />

      {/* Invoice Detail Dialog */}
      {selectedInvoice && (
        <InvoiceDetailDialog
          isOpen={detailDialogOpen}
          onClose={() => {
            setDetailDialogOpen(false);
            setSelectedInvoice(null);
          }}
          invoice={selectedInvoice}
          onUpdate={handleUpdateInvoice}
          onPrint={() => handlePrintInvoice(selectedInvoice)}
          onDelete={() => {
            handleDeleteInvoice(selectedInvoice.id);
            setDetailDialogOpen(false);
            setSelectedInvoice(null);
          }}
        />
      )}
    </div>
  );
}
