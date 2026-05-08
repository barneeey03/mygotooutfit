'use client';

import { useState } from 'react';
import { useData, Invoice } from '@/lib/data-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FileText, Plus, Download, Eye, Trash2, Search, Check } from 'lucide-react';
import PageHeader from '@/components/page-header';
import InvoiceDialog from '@/components/invoice-dialog';
import InvoiceDetailDialog from '@/components/invoice-detail-dialog';
import ConfirmationDialog from '@/components/confirmation-dialog';

interface CustomerGroup {
  customerName: string;
  invoices: Invoice[];
}

export default function InvoicesPage() {
  const { invoices, orders, addInvoice, updateInvoice, deleteInvoice } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<CustomerGroup | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<CustomerGroup | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  const filteredInvoices = invoices
    .filter(inv => {
      const matchesSearch =
        inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.status.toLowerCase().includes(searchTerm.toLowerCase());
      const isInHistory = inv.status === 'paid';
      if (activeTab === 'active' && !isInHistory) return matchesSearch;
      if (activeTab === 'history' && isInHistory) return matchesSearch;
      return false;
    })
    .filter(inv => statusFilter === 'all' || inv.status === statusFilter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const sortedInvoices = filteredInvoices;

  const groupInvoicesByCustomer = (): CustomerGroup[] => {
    const grouped = new Map<string, Invoice[]>();
    sortedInvoices.forEach(invoice => {
      if (!grouped.has(invoice.customerName)) grouped.set(invoice.customerName, []);
      grouped.get(invoice.customerName)!.push(invoice);
    });
    return Array.from(grouped.entries()).map(([customerName, grpInvoices]) => ({
      customerName,
      invoices: grpInvoices,
    }));
  };

  // ─── Sync invoice from its linked order ───────────────────────────────────
  const syncInvoicesFromOrder = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const linkedInvoices = invoices.filter(inv => inv.orderId === orderId);
    if (linkedInvoices.length === 0) return;

    const updatedItems = order.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.quantity * item.unitPrice,
    }));
    const updatedSubtotal = updatedItems.reduce((sum, i) => sum + i.subtotal, 0);

    await Promise.all(
      linkedInvoices.map(inv =>
        updateInvoice(inv.id, {
          items: updatedItems,
          subtotal: updatedSubtotal,
          customerName: order.customerName,
          customerEmail: order.customerEmail ?? inv.customerEmail,
        })
      )
    );
  };

  // ─── Handlers ─────────────────────────────────────────────────────────────
  const handleAddInvoice = async (invoice: Omit<Invoice, 'id'>) => {
    try {
      await addInvoice(invoice);
      setIsDialogOpen(false);
    } catch (error) {
      alert('Failed to create invoice');
      console.error(error);
    }
  };

  const handleEditInvoice = async (invoice: Invoice) => {
    setSelectedGroup({ customerName: invoice.customerName, invoices: [invoice] });
    setIsDialogOpen(true);
  };

  const handleUpdateGroup = async (updates: Partial<Invoice>) => {
    if (selectedGroup) {
      try {
        await Promise.all(selectedGroup.invoices.map(inv => updateInvoice(inv.id, updates)));

        // If any invoice in this group is linked to an order, sync from that order too
        const orderIds = [
          ...new Set(selectedGroup.invoices.map(inv => inv.orderId).filter(Boolean)),
        ] as string[];
        await Promise.all(orderIds.map(syncInvoicesFromOrder));

        setSelectedGroup(null);
        setDetailDialogOpen(false);
      } catch (error) {
        alert('Failed to update invoice');
        console.error(error);
      }
    }
  };

  const handleMarkGroupAsDone = async (group: CustomerGroup) => {
    try {
      await Promise.all(group.invoices.map(inv => updateInvoice(inv.id, { status: 'paid' })));
    } catch (error) {
      alert('Failed to mark invoice as done');
      console.error(error);
    }
  };

  const handleDeleteGroupPrompt = (group: CustomerGroup) => {
    setGroupToDelete(group);
    setConfirmDialogOpen(true);
  };

  const confirmDeleteGroup = async () => {
    if (groupToDelete) {
      try {
        await Promise.all(groupToDelete.invoices.map(inv => deleteInvoice(inv.id)));
      } catch (error) {
        alert('Failed to delete invoice');
        console.error(error);
      }
      setGroupToDelete(null);
    }
  };

  const handlePrintGroup = (group: CustomerGroup) => {
    const uniqueInvoices = group.invoices.filter(
      (inv, idx, arr) => arr.findIndex(i => i.orderId === inv.orderId) === idx
    );
    const allItems = uniqueInvoices.flatMap(inv => inv.items);
    const grandTotal = uniqueInvoices.reduce((sum, inv) => sum + inv.subtotal, 0);
    const primary = uniqueInvoices[0];
    const printWindow = window.open('', '', 'height=800,width=1000');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Invoice - ${group.customerName}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e68bbe; padding-bottom: 20px; }
              .header h1 { margin: 0; color: #e68bbe; }
              .info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
              .info div { font-size: 14px; }
              .info label { font-weight: bold; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th { background-color: #fdf0f8; padding: 10px; text-align: left; font-size: 12px; text-transform: uppercase; }
              td { padding: 10px; border-bottom: 1px solid #fce7f3; }
              .total-box { text-align: right; padding: 16px; background: #fdf0f8; border-radius: 8px; }
              .total-label { font-size: 12px; text-transform: uppercase; color: #666; }
              .total-amount { font-size: 22px; font-weight: 900; color: #c9508a; margin-top: 4px; }
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
                <label>Customer:</label> ${primary.customerName}<br>
                <label>Email:</label> ${primary.customerEmail}
              </div>
              <div>
                <label>Date:</label> ${new Date(primary.date).toLocaleDateString()}<br>
                <label>Due Date:</label> ${new Date(primary.dueDate).toLocaleDateString()}
              </div>
            </div>
            <table>
              <tr>
                <th>Product</th>
                <th style="text-align:center;">Qty</th>
                <th style="text-align:right;">Unit Price</th>
                <th style="text-align:right;">Amount</th>
              </tr>
              ${allItems.map(item => `
                <tr>
                  <td>${item.productName}</td>
                  <td style="text-align:center;">${item.quantity}</td>
                  <td style="text-align:right;">₱${item.unitPrice.toLocaleString()}</td>
                  <td style="text-align:right;">₱${item.subtotal.toLocaleString()}</td>
                </tr>
              `).join('')}
            </table>
            <div class="total-box">
              <div class="total-label">Total Amount</div>
              <div class="total-amount">₱${grandTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</div>
            </div>
            <div class="footer"><p>Thank you for your business!</p></div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':          return { bg: '#d1fae5', text: '#065f46' };
      case 'down-payment':  return { bg: '#fef3c7', text: '#92400e' };
      case 'overdue':       return { bg: '#fee2e2', text: '#991b1b' };
      default:              return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      paid: 'Paid',
      'down-payment': 'Down Payment',
      overdue: 'Overdue',
    };
    return labels[status] ?? status;
  };

  const groups = groupInvoicesByCustomer();

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Invoices Management"
        description="Create, manage, and track invoices"
        icon={<FileText className="w-8 h-8" />}
        action={
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="text-white gap-2 w-fit transition-colors"
            style={{ backgroundColor: '#e68bbe' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#eea1cd')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#e68bbe')}
          >
            <Plus className="w-4 h-4" />
            New Invoice
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {(['active', 'history'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium transition-colors capitalize ${
              activeTab === tab
                ? 'border-b-2 text-pink-600'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            style={activeTab === tab ? { borderBottomColor: '#e68bbe' } : {}}
          >
            {tab === 'active' ? 'Active Invoices' : 'History (Done)'}
          </button>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="grid gap-4 md:grid-cols-[1fr_auto] items-end">
        <div className="relative">
          <label htmlFor="search" className="text-sm font-medium text-muted-foreground mb-2 block">
            Search Invoices
          </label>
          <Search className="absolute left-3 top-10 w-4 h-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search by customer or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-primary/20"
          />
        </div>
        <div>
          <label htmlFor="status-filter" className="text-sm font-medium text-muted-foreground mb-2 block">
            Status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-primary/20 rounded-md bg-background text-foreground text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="overdue">Overdue</option>
            <option value="down-payment">Down Payment</option>
            <option value="paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="overflow-x-auto w-full max-h-[520px] overflow-y-auto">
        {groups.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No invoices found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try adjusting your filters or create a new invoice
            </p>
          </div>
        ) : (
          <table className="w-full min-w-full border-collapse">
            <thead>
              <tr className="text-white" style={{ backgroundColor: '#e68bbe' }}>
                <th className="text-left py-1.5 px-2 font-medium text-xs whitespace-nowrap border border-white/20">Customer</th>
                <th className="text-left py-1.5 px-2 font-medium text-xs whitespace-nowrap border border-white/20">Invoice #</th>
                <th className="text-left py-1.5 px-2 font-medium text-xs whitespace-nowrap border border-white/20">Date</th>
                <th className="text-left py-1.5 px-2 font-medium text-xs whitespace-nowrap border border-white/20">Due Date</th>
                <th className="text-right py-1.5 px-2 font-medium text-xs whitespace-nowrap border border-white/20">Amount</th>
                <th className="text-center py-1.5 px-2 font-medium text-xs whitespace-nowrap border border-white/20">Status</th>
                <th className="text-center py-1.5 px-2 font-medium text-xs whitespace-nowrap border border-white/20">Actions</th>
              </tr>
            </thead>
            {groups.map((group, groupIndex) => {
              const uniqueInvoices = group.invoices.filter(
                (inv, idx, arr) => arr.findIndex(i => i.orderId === inv.orderId) === idx
              );
              const primary = uniqueInvoices[0];
              const groupTotal = uniqueInvoices.reduce((sum, inv) => sum + inv.subtotal, 0);
              const earliestDate = uniqueInvoices.reduce(
                (min, inv) => inv.date < min ? inv.date : min,
                primary.date
              );
              const latestDueDate = uniqueInvoices.reduce(
                (max, inv) => inv.dueDate > max ? inv.dueDate : max,
                primary.dueDate
              );
              const invoiceNumber = String(groupIndex + 1).padStart(3, '0');
              const statusColors = getStatusColor(primary.status);

              return (
                <tbody key={group.customerName}>
                  <tr
                    className="transition-colors"
                    style={{ backgroundColor: '#fde4f2' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9cee7')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#fde4f2')}
                  >
                    <td className="py-1 px-2 text-xs font-medium text-foreground whitespace-nowrap border border-gray-200">
                      {group.customerName}
                    </td>
                    <td className="py-1 px-2 text-xs font-semibold whitespace-nowrap border border-gray-200" style={{ color: '#e68bbe' }}>
                      #{invoiceNumber}
                    </td>
                    <td className="py-1 px-2 text-xs text-muted-foreground whitespace-nowrap border border-gray-200">
                      {new Date(earliestDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-1 px-2 text-xs text-muted-foreground whitespace-nowrap border border-gray-200">
                      {new Date(latestDueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-1 px-2 text-xs text-right font-semibold text-foreground whitespace-nowrap border border-gray-200">
                      ₱{groupTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-1 px-2 text-xs text-center whitespace-nowrap border border-gray-200">
                      <span
                        className="inline-block px-1.5 py-0.5 rounded text-xs font-medium capitalize"
                        style={{ backgroundColor: statusColors.bg, color: statusColors.text }}
                      >
                        {getStatusLabel(primary.status)}
                      </span>
                    </td>
                    <td className="py-1 px-2 text-xs text-center whitespace-nowrap border border-gray-200">
                      <div className="flex items-center justify-center gap-1">
                        {activeTab === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkGroupAsDone(group)}
                            className="h-6 w-6 p-0 transition-colors"
                            style={{ color: '#22c55e' }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#dcfce7')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                            title="Mark as Done"
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePrintGroup(group)}
                          className="h-6 w-6 p-0 transition-colors"
                          style={{ color: '#e68bbe' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f4b8da')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          title="Print"
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedGroup(group);
                            setDetailDialogOpen(true);
                          }}
                          className="h-6 w-6 p-0 transition-colors"
                          style={{ color: '#e68bbe' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f4b8da')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          title="View"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteGroupPrompt(group)}
                          className="h-6 w-6 p-0 transition-colors text-red-600"
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fee2e2')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              );
            })}
          </table>
        )}
      </div>

      {/* Create Invoice Dialog */}
      <InvoiceDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleAddInvoice}
        onEdit={handleAddInvoice}
        orders={orders}
      />

      {/* Invoice Detail Dialog */}
      {selectedGroup && (
        <InvoiceDetailDialog
          isOpen={detailDialogOpen}
          onClose={() => {
            setDetailDialogOpen(false);
            setSelectedGroup(null);
          }}
          invoices={selectedGroup.invoices}
          invoiceNumber={String(
            groups.findIndex(g => g.customerName === selectedGroup.customerName) + 1
          ).padStart(3, '0')}
          onUpdateAll={handleUpdateGroup}
          onPrint={() => handlePrintGroup(selectedGroup)}
          onDeleteAll={() => {
            setDetailDialogOpen(false);
            handleDeleteGroupPrompt(selectedGroup);
            setSelectedGroup(null);
          }}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialogOpen}
        onClose={() => {
          setConfirmDialogOpen(false);
          setGroupToDelete(null);
        }}
        onConfirm={confirmDeleteGroup}
        title="Delete Invoice"
        description="Are you sure you want to delete this invoice? This action cannot be undone."
        confirmText="Delete Invoice"
        variant="destructive"
      />
    </div>
  );
}