'use client';

import { useState, type ChangeEvent } from 'react';
import { useData, Order } from '@/lib/data-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Plus, Eye, Trash2, Search, History, Edit } from 'lucide-react';
import PageHeader from '@/components/page-header';
import OrderDialog from '@/components/order-dialog';
import OrderDetailDialog from '@/components/order-detail-dialog';
import ConfirmationDialog from '@/components/confirmation-dialog';

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  pending:   { label: 'Pending',   bg: '#fef3c7', text: '#92400e' },
  secured:   { label: 'Secured',   bg: '#dbeafe', text: '#1e40af' },
  'to-ship': { label: 'To Ship',   bg: '#f3e8ff', text: '#6b21a8' },
  completed: { label: 'Completed', bg: '#d1fae5', text: '#065f46' },
};

export default function OrdersPage() {
  const { orders, products, invoices, addOrder, updateOrder, deleteOrder, updateInvoice } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  // ─── Sync linked invoices whenever an order changes ───────────────────────
  const syncInvoicesFromOrder = async (order: Order) => {
    const linkedInvoices = invoices.filter(inv => inv.orderId === order.id);
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
  const handleAddOrder = async (order: Omit<Order, 'id'>) => {
    try {
      await addOrder(order);
      setIsDialogOpen(false);
    } catch (error) {
      alert('Failed to create order');
      console.error(error);
    }
  };

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDialogOpen(true);
  };

  const handleUpdateOrderDialog = async (order: Order) => {
    try {
      await updateOrder(order.id, order);
      // Sync all invoices linked to this order
      await syncInvoicesFromOrder(order);
      setIsDialogOpen(false);
      setSelectedOrder(null);
    } catch (error) {
      alert('Failed to update order');
      console.error(error);
    }
  };

  const handleUpdateOrder = async (updates: Partial<Order>) => {
    if (selectedOrder) {
      try {
        await updateOrder(selectedOrder.id, updates);
        const updatedOrder = { ...selectedOrder, ...updates };
        // Sync invoices with whatever changed
        await syncInvoicesFromOrder(updatedOrder);

        if (updates.status === 'completed') {
          setDetailDialogOpen(false);
          setSelectedOrder(null);
          setActiveTab('history');
        } else {
          setSelectedOrder(updatedOrder);
        }
      } catch (error) {
        alert('Failed to update order');
        console.error(error);
      }
    }
  };

  const handleDeleteOrder = (id: string) => {
    setOrderToDelete(id);
    setConfirmDialogOpen(true);
  };

  const confirmDeleteOrder = async () => {
    if (orderToDelete) {
      try {
        await deleteOrder(orderToDelete);
      } catch (error) {
        alert('Failed to delete order');
        console.error(error);
      }
      setOrderToDelete(null);
    }
  };

  // ─── Filtering ────────────────────────────────────────────────────────────
  const filteredOrders = orders
    .filter(order =>
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some(item =>
        item.productName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .filter(order => statusFilter === 'all' || order.status === statusFilter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const activeOrders  = filteredOrders.filter(o => o.status !== 'completed');
  const historyOrders = filteredOrders.filter(o => o.status === 'completed');
  const displayedOrders = activeTab === 'active' ? activeOrders : historyOrders;

  // ─── Table render ─────────────────────────────────────────────────────────
  const renderTable = (orderList: Order[]) => {
    if (orderList.length === 0) {
      return (
        <div className="text-center py-16">
          {activeTab === 'history'
            ? <History className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            : <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />}
          <p className="text-muted-foreground font-medium">
            {activeTab === 'history' ? 'No completed orders yet' : 'No active orders found'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {activeTab === 'history'
              ? 'Completed orders will appear here'
              : 'Try adjusting your filters or create a new order'}
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto w-full">
        <table className="w-full min-w-full border-collapse">
          <thead>
            <tr className="text-white" style={{ backgroundColor: '#e68bbe' }}>
              <th className="text-left py-2 px-3 font-semibold text-xs whitespace-nowrap border border-white/20">Order #</th>
              <th className="text-left py-2 px-3 font-semibold text-xs whitespace-nowrap border border-white/20">Customer</th>
              <th className="text-left py-2 px-3 font-semibold text-xs whitespace-nowrap border border-white/20">Date</th>
              <th className="text-center py-2 px-3 font-semibold text-xs whitespace-nowrap border border-white/20">Items</th>
              <th className="text-center py-2 px-3 font-semibold text-xs whitespace-nowrap border border-white/20">Status</th>
              <th className="text-right py-2 px-3 font-semibold text-xs whitespace-nowrap border border-white/20">Total</th>
              <th className="text-left py-2 px-3 font-semibold text-xs whitespace-nowrap border border-white/20">Notes</th>
              <th className="text-center py-2 px-3 font-semibold text-xs whitespace-nowrap border border-white/20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orderList.map((order, index) => {
              const isEven = index % 2 === 0;
              const cfg = STATUS_CONFIG[order.status] ?? {
                label: order.status,
                bg: '#f3f4f6',
                text: '#374151',
              };

              return (
                <tr
                  key={order.id}
                  className="transition-colors"
                  style={{ backgroundColor: isEven ? 'white' : '#fde4f2' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f9cee7')}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = isEven ? 'white' : '#fde4f2')
                  }
                >
                  <td className="py-1.5 px-3 text-xs text-muted-foreground font-semibold whitespace-nowrap border border-gray-200">
                    #{String(index + 1).padStart(3, '0')}
                  </td>
                  <td className="py-1.5 px-3 text-xs font-medium whitespace-nowrap border border-gray-200">
                    {order.customerName}
                  </td>
                  <td className="py-1.5 px-3 text-xs text-muted-foreground whitespace-nowrap border border-gray-200">
                    {new Date(order.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="py-1.5 px-3 text-xs text-center font-semibold border border-gray-200">
                    {order.items.length}
                  </td>
                  <td className="py-1.5 px-3 text-xs text-center whitespace-nowrap border border-gray-200">
                    <span
                      className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: cfg.bg, color: cfg.text }}
                    >
                      {cfg.label}
                    </span>
                  </td>
                  <td className="py-1.5 px-3 text-xs text-right font-semibold whitespace-nowrap border border-gray-200">
                    ₱{order.total.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-1.5 px-3 text-xs text-muted-foreground truncate max-w-[160px] border border-gray-200">
                    {order.notes || '—'}
                  </td>
                  <td className="py-1.5 px-3 text-xs text-center whitespace-nowrap border border-gray-200">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setDetailDialogOpen(true);
                        }}
                        className="h-6 w-6 p-0 transition-colors"
                        style={{ color: '#e68bbe' }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = '#f4b8da')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = 'transparent')
                        }
                        title="View"
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditOrder(order)}
                        className="h-6 w-6 p-0 transition-colors"
                        style={{ color: '#e68bbe' }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = '#f4b8da')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = 'transparent')
                        }
                        title="Edit"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteOrder(order.id)}
                        className="h-6 w-6 p-0 transition-colors text-red-500"
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = '#fee2e2')
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor = 'transparent')
                        }
                        title="Delete"
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
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Orders Management"
        description="Manage customer orders and track order status"
        icon={<ShoppingCart className="w-8 h-8" />}
        action={
          <Button
            onClick={() => { setSelectedOrder(null); setIsDialogOpen(true); }}
            className="text-white gap-2 w-fit transition-colors"
            style={{ backgroundColor: '#e68bbe' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#eea1cd')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#e68bbe')}
          >
            <Plus className="w-4 h-4" />
            New Order
          </Button>
        }
      />

      {/* Search + Filter */}
      <div className="grid gap-4 md:grid-cols-[1fr_auto] items-end">
        <div className="relative">
          <label htmlFor="search" className="text-sm font-medium text-muted-foreground mb-2 block">
            Search Orders
          </label>
          <Search className="absolute left-3 top-10 w-4 h-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search by customer, product, or status..."
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
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
            <option value="pending">Pending</option>
            <option value="secured">Secured</option>
            <option value="to-ship">To Ship</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg w-fit" style={{ backgroundColor: '#fce7f3' }}>
        <button
          onClick={() => setActiveTab('active')}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-150"
          style={
            activeTab === 'active'
              ? { backgroundColor: '#e68bbe', color: 'white', boxShadow: '0 1px 4px rgba(230,139,190,0.4)' }
              : { backgroundColor: 'transparent', color: '#9d4b79' }
          }
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          Active Orders
          <span
            className="text-xs px-1.5 py-0.5 rounded-full font-bold"
            style={
              activeTab === 'active'
                ? { backgroundColor: 'rgba(255,255,255,0.25)', color: 'white' }
                : { backgroundColor: '#e68bbe22', color: '#e68bbe' }
            }
          >
            {activeOrders.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-150"
          style={
            activeTab === 'history'
              ? { backgroundColor: '#e68bbe', color: 'white', boxShadow: '0 1px 4px rgba(230,139,190,0.4)' }
              : { backgroundColor: 'transparent', color: '#9d4b79' }
          }
        >
          <History className="w-3.5 h-3.5" />
          History
          <span
            className="text-xs px-1.5 py-0.5 rounded-full font-bold"
            style={
              activeTab === 'history'
                ? { backgroundColor: 'rgba(255,255,255,0.25)', color: 'white' }
                : { backgroundColor: '#e68bbe22', color: '#e68bbe' }
            }
          >
            {historyOrders.length}
          </span>
        </button>
      </div>

      {/* Table */}
      {renderTable(displayedOrders)}

      {/* Create / Edit Order Dialog */}
      <OrderDialog
        isOpen={isDialogOpen}
        onClose={() => { setIsDialogOpen(false); setSelectedOrder(null); }}
        onSave={handleAddOrder}
        onEdit={handleUpdateOrderDialog}
        products={products}
        order={selectedOrder}
      />

      {/* Order Detail Dialog */}
      {selectedOrder && (
        <OrderDetailDialog
          isOpen={detailDialogOpen}
          onClose={() => { setDetailDialogOpen(false); setSelectedOrder(null); }}
          order={selectedOrder}
          onUpdate={handleUpdateOrder}
          onDelete={() => {
            handleDeleteOrder(selectedOrder.id);
            setDetailDialogOpen(false);
            setSelectedOrder(null);
          }}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialogOpen}
        onClose={() => { setConfirmDialogOpen(false); setOrderToDelete(null); }}
        onConfirm={confirmDeleteOrder}
        title="Delete Order"
        description="Are you sure you want to delete this order? This action cannot be undone."
        confirmText="Delete Order"
        variant="destructive"
      />
    </div>
  );
}