'use client';

import { useState } from 'react';
import { useData, Invoice } from '@/lib/data-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Plus, Download, Eye, Trash2, Search } from 'lucide-react';
import PageHeader from '@/components/page-header';
import InvoiceDialog from '@/components/invoice-dialog';
import InvoiceDetailDialog from '@/components/invoice-detail-dialog';
import ConfirmationDialog from '@/components/confirmation-dialog';

export default function InvoicesPage() {
  const { invoices, orders, addInvoice, updateInvoice, deleteInvoice } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('date-desc');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);

  const filteredInvoices = invoices.filter(inv =>
    inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    switch (sortOption) {
      case 'id-asc':
        return a.id.localeCompare(b.id);
      case 'date-desc':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'dueDate-asc':
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      case 'amount-desc':
        return b.total - a.total;
      case 'status-asc':
        return a.status.localeCompare(b.status);
      default:
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

  const handleAddInvoice = async (invoice: Omit<Invoice, 'id'>) => {
    try {
      await addInvoice(invoice);
      setIsDialogOpen(false);
    } catch (error) {
      alert('Failed to create invoice');
      console.error(error);
    }
  };

  const handleUpdateInvoice = async (updates: Partial<Invoice>) => {
    if (selectedInvoice) {
      try {
        await updateInvoice(selectedInvoice.id, updates);
        setSelectedInvoice(null);
        setDetailDialogOpen(false);
      } catch (error) {
        alert('Failed to update invoice');
        console.error(error);
      }
    }
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoiceToDelete(id);
    setConfirmDialogOpen(true);
  };

  const confirmDeleteInvoice = async () => {
    if (invoiceToDelete) {
      try {
        await deleteInvoice(invoiceToDelete);
      } catch (error) {
        alert('Failed to delete invoice');
        console.error(error);
      }
      setInvoiceToDelete(null);
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
                  <td style="text-align: right;">₱${item.unitPrice.toLocaleString()}</td>
                  <td style="text-align: right;">₱${item.subtotal.toLocaleString()}</td>
                </tr>
              `).join('')}
            </table>
            <div style="text-align: right; padding-right: 50px;">
              <p><strong>Subtotal:</strong> ₱${invoice.subtotal.toLocaleString()}</p>
              <p><strong>Tax (${((invoice.tax / invoice.subtotal) * 100).toFixed(0)}%):</strong> ₱${invoice.tax.toLocaleString()}</p>
              <p class="total">TOTAL: ₱${invoice.total.toLocaleString()}</p>
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
        return { bg: '#d1fae5', text: '#065f46' }; // light green
      case 'sent':
        return { bg: '#dbeafe', text: '#0c4a6e' }; // light blue
      case 'overdue':
        return { bg: '#fee2e2', text: '#991b1b' }; // light red
      case 'draft':
        return { bg: '#f3f4f6', text: '#374151' }; // light gray
      default:
        return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Invoices Management"
        description="Create, manage, and track invoices"
        icon={<FileText className="w-8 h-8" />}
        action={
          <Button
            onClick={() => {
              setSelectedInvoice(null);
              setIsDialogOpen(true);
            }}
            className="text-white gap-2 w-fit transition-colors"
            style={{ backgroundColor: '#e68bbe' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eea1cd'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e68bbe'}
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </Button>
        }
      />

      {/* Search + Sort */}
      <div className="grid gap-4 md:grid-cols-[1fr_auto] items-end">
        <div className="relative">
          <label htmlFor="search" className="text-sm font-medium text-muted-foreground mb-2 block">
            Search Invoices
          </label>
          <Search className="absolute left-3 top-10 w-4 h-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search by invoice ID, customer, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-primary/20"
          />
        </div>
        <div>
          <label htmlFor="invoice-sort" className="text-sm font-medium text-muted-foreground mb-2 block">
            Sort by
          </label>
          <select
            id="invoice-sort"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="px-3 py-2 border border-primary/20 rounded-md bg-background text-foreground text-sm"
          >
            <option value="date-desc">Date (Newest)</option>
            <option value="dueDate-asc">Due Date (Soonest)</option>
            <option value="amount-desc">Amount (High to Low)</option>
            <option value="status-asc">Status</option>
            <option value="id-asc">Invoice #</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="overflow-x-auto w-full">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No invoices found</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or create a new invoice</p>
            </div>
          ) : (
            <table className="w-full min-w-full border-collapse">
                <thead>
                  <tr className="text-white" style={{ backgroundColor: '#e68bbe' }}>
                    <th className="text-left py-1.5 px-2 font-medium text-xs whitespace-nowrap border border-white/20">Invoice #</th>
                    <th className="text-left py-1.5 px-2 font-medium text-xs whitespace-nowrap border border-white/20">Customer</th>
                    <th className="text-left py-1.5 px-2 font-medium text-xs whitespace-nowrap border border-white/20">Date</th>
                    <th className="text-left py-1.5 px-2 font-medium text-xs whitespace-nowrap border border-white/20">Due Date</th>
                    <th className="text-right py-1.5 px-2 font-medium text-xs whitespace-nowrap border border-white/20">Amount</th>
                    <th className="text-center py-1.5 px-2 font-medium text-xs whitespace-nowrap border border-white/20">Status</th>
                    <th className="text-center py-1.5 px-2 font-medium text-xs whitespace-nowrap border border-white/20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedInvoices.map((invoice, index) => {
                    const isEvenRow = index % 2 === 0;
                    const statusColors = getStatusColor(invoice.status);

                    return (
                      <tr
                        key={invoice.id}
                        className="transition-colors"
                        style={{ backgroundColor: isEvenRow ? 'white' : '#fde4f2' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9cee7'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isEvenRow ? 'white' : '#fde4f2'}
                      >
                        <td className="py-1 px-2 text-xs font-semibold whitespace-nowrap border border-gray-200" style={{ color: '#e68bbe' }}>
                          #{String(index + 1).padStart(3, '0')}
                        </td>
                        <td className="py-1 px-2 text-xs font-medium text-foreground whitespace-nowrap border border-gray-200">
                          {invoice.customerName}
                        </td>
                        <td className="py-1 px-2 text-xs text-muted-foreground whitespace-nowrap border border-gray-200">
                          {new Date(invoice.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="py-1 px-2 text-xs text-muted-foreground whitespace-nowrap border border-gray-200">
                          {new Date(invoice.dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="py-1 px-2 text-xs text-right font-semibold text-foreground whitespace-nowrap border border-gray-200">
                          ₱{invoice.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-1 px-2 text-xs text-center whitespace-nowrap border border-gray-200">
                          <span
                            className="inline-block px-1.5 py-0.5 rounded text-xs font-medium capitalize"
                            style={{ backgroundColor: statusColors.bg, color: statusColors.text }}
                          >
                            {invoice.status}
                          </span>
                        </td>
                        <td className="py-1 px-2 text-xs text-center whitespace-nowrap border border-gray-200">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePrintInvoice(invoice)}
                              className="h-6 w-6 p-0 transition-colors"
                              style={{ color: '#e68bbe' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f4b8da'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedInvoice(invoice);
                                setDetailDialogOpen(true);
                              }}
                              className="h-6 w-6 p-0 transition-colors"
                              style={{ color: '#e68bbe' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f4b8da'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteInvoice(invoice.id)}
                              className="h-6 w-6 p-0 transition-colors text-red-600"
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
          )}
      </div>

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

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialogOpen}
        onClose={() => {
          setConfirmDialogOpen(false);
          setInvoiceToDelete(null);
        }}
        onConfirm={confirmDeleteInvoice}
        title="Delete Invoice"
        description="Are you sure you want to delete this invoice? This action cannot be undone."
        confirmText="Delete Invoice"
        variant="destructive"
      />
    </div>
  );
}
