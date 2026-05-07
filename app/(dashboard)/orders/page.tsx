'use client';

import { useState, type ChangeEvent } from 'react';
import { useData, Order } from '@/lib/data-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Plus, Eye, Trash2, Search } from 'lucide-react';
import PageHeader from '@/components/page-header';
import OrderDialog from '@/components/order-dialog';
import OrderDetailDialog from '@/components/order-detail-dialog';
import ConfirmationDialog from '@/components/confirmation-dialog';

export default function OrdersPage() {
  const { orders, products, addOrder, updateOrder, deleteOrder } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  const handleAddOrder = async (order: Omit<Order, 'id'>) => {
    try {
      await addOrder(order);
      setIsDialogOpen(false);
    } catch (error) {
      alert('Failed to create order');
      console.error(error);
    }
  };

  const handleUpdateOrder = async (updates: Partial<Order>) => {
    if (selectedOrder) {
      try {
        await updateOrder(selectedOrder.id, updates);
        setSelectedOrder(null);
        setDetailDialogOpen(false);
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

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('date-desc');

  const filteredOrders = orders.filter(order =>
    order.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    switch (sortOption) {
      case 'date-asc':
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      case 'date-desc':
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'total-desc':
        return b.total - a.total;
      case 'items-desc':
        return b.items.length - a.items.length;
      case 'status-asc':
        return a.status.localeCompare(b.status);
      default:
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return { bg: '#d1fae5', text: '#065f46' }; // light green
      case 'pending':
        return { bg: '#fef3c7', text: '#92400e' }; // light yellow
      case 'cancelled':
        return { bg: '#fee2e2', text: '#991b1b' }; // light red
      default:
        return { bg: '#f3f4f6', text: '#374151' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Orders Management"
        description="Manage customer orders and track order status"
        icon={<ShoppingCart className="w-8 h-8" />}
        action={
          <Button
            onClick={() => {
              setSelectedOrder(null);
              setIsDialogOpen(true);
            }}
            className="text-white gap-2 w-fit transition-colors"
            style={{ backgroundColor: '#e68bbe' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eea1cd'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e68bbe'}
          >
            <Plus className="w-4 h-4" />
            New Order
          </Button>
        }
      />

      {/* Search + Sort */}
      <div className="grid gap-4 md:grid-cols-[1fr_auto] items-end">
        <div className="relative">
          <label htmlFor="search" className="text-sm font-medium text-muted-foreground mb-2 block">
            Search Orders
          </label>
          <Search className="absolute left-3 top-10 w-4 h-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search by customer, order ID, or status..."
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="pl-10 border-primary/20"
          />
        </div>
        <div>
          <label htmlFor="order-sort" className="text-sm font-medium text-muted-foreground mb-2 block">
            Sort by
          </label>
          <select
            id="order-sort"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="px-3 py-2 border border-primary/20 rounded-md bg-background text-foreground text-sm"
          >
            <option value="date-desc">Date (Newest)</option>
            <option value="date-asc">Date (Oldest)</option>
            <option value="total-desc">Total (High to Low)</option>
            <option value="items-desc">Items (High to Low)</option>
            <option value="status-asc">Status</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto w-full">
          {sortedOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No orders found</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or create a new order</p>
            </div>
          ) : (
            <table className="w-full min-w-full border-collapse">
                <thead>
                  <tr className="text-white" style={{ backgroundColor: '#e68bbe' }}>
                    <th className="text-left py-1.5 px-2 font-medium text-xs whitespace-nowrap border border-white/20">Order #</th>
                    <th className="text-left py-1.5 px-2 font-medium text-xs whitespace-nowrap border border-white/20">Customer</th>
                    <th className="text-left py-1.5 px-2 font-medium text-xs whitespace-nowrap border border-white/20">Date</th>
                    <th className="text-center py-1.5 px-2 font-medium text-xs whitespace-nowrap border border-white/20">Items</th>
                    <th className="text-center py-1.5 px-2 font-medium text-xs whitespace-nowrap border border-white/20">Status</th>
                    <th className="text-right py-1.5 px-2 font-medium text-xs whitespace-nowrap border border-white/20">Total</th>
                    <th className="text-left py-1.5 px-2 font-medium text-xs whitespace-nowrap border border-white/20">Notes</th>
                    <th className="text-center py-1.5 px-2 font-medium text-xs whitespace-nowrap border border-white/20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedOrders.map((order, index) => {
                    const isEvenRow = index % 2 === 0;
                    const statusColors = getStatusColor(order.status);

                    return (
                      <tr
                        key={order.id}
                        className="transition-colors"
                        style={{ backgroundColor: isEvenRow ? 'white' : '#fde4f2' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9cee7'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isEvenRow ? 'white' : '#fde4f2'}
                      >
                        <td className="py-1 px-2 text-xs text-muted-foreground font-semibold whitespace-nowrap border border-gray-200">
                          #{String(index + 1).padStart(3, '0')}
                        </td>
                        <td className="py-1 px-2 text-xs font-medium text-foreground whitespace-nowrap border border-gray-200">
                          {order.customerName}
                        </td>
                        <td className="py-1 px-2 text-xs text-muted-foreground whitespace-nowrap border border-gray-200">
                          {new Date(order.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="py-1 px-2 text-xs text-center font-semibold text-foreground whitespace-nowrap border border-gray-200">
                          {order.items.length}
                        </td>
                        <td className="py-1 px-2 text-xs text-center whitespace-nowrap border border-gray-200">
                          <span
                            className="inline-block px-1.5 py-0.5 rounded text-xs font-medium capitalize"
                            style={{ backgroundColor: statusColors.bg, color: statusColors.text }}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="py-1 px-2 text-xs text-right font-semibold text-foreground whitespace-nowrap border border-gray-200">
                          ₱{order.total.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-1 px-2 text-xs text-muted-foreground truncate max-w-xs whitespace-nowrap border border-gray-200">
                          {order.notes || '-'}
                        </td>
                        <td className="py-1 px-2 text-xs text-center whitespace-nowrap border border-gray-200">
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
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f4b8da'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteOrder(order.id)}
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

      {/* Create Order Dialog */}
      <OrderDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleAddOrder}
        products={products}
      />

      {/* Order Detail Dialog */}
      {selectedOrder && (
        <OrderDetailDialog
          isOpen={detailDialogOpen}
          onClose={() => {
            setDetailDialogOpen(false);
            setSelectedOrder(null);
          }}
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
        onClose={() => {
          setConfirmDialogOpen(false);
          setOrderToDelete(null);
        }}
        onConfirm={confirmDeleteOrder}
        title="Delete Order"
        description="Are you sure you want to delete this order? This action cannot be undone."
        confirmText="Delete Order"
        variant="destructive"
      />
    </div>
  );
}
