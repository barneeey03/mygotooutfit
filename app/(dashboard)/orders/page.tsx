'use client';

import { useState, type ChangeEvent } from 'react';
import { useData, Order } from '@/lib/data-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Plus, Eye, Trash2, Search } from 'lucide-react';
import OrderDialog from '@/components/order-dialog';
import OrderDetailDialog from '@/components/order-detail-dialog';

export default function OrdersPage() {
  const { orders, products, addOrder, updateOrder, deleteOrder } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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
    if (confirm('Are you sure you want to delete this order?')) {
      deleteOrder(id).catch(error => {
        alert('Failed to delete order');
        console.error(error);
      });
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('date-desc');

  const filteredOrders = orders.filter(order =>
    order.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        return 'bg-primary/10 text-primary';
      case 'pending':
        return 'bg-accent/10 text-accent';
      case 'cancelled':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orders Management</h1>
          <p className="text-muted-foreground mt-2">Manage customer orders</p>
        </div>
        <Button
          onClick={() => {
            setSelectedOrder(null);
            setIsDialogOpen(true);
          }}
          className="bg-primary hover:bg-primary/90 text-white gap-2 w-fit"
        >
          <Plus className="w-4 h-4" />
          New Order
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto] items-center">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="pl-10 border-primary/20"
          />
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="order-sort" className="text-sm font-medium text-muted-foreground">
            Sort by
          </label>
          <select
            id="order-sort"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="px-3 py-2 border border-primary/20 rounded-md bg-background text-foreground"
          >
            <option value="date-desc">Date (Newest)</option>
            <option value="date-asc">Date (Oldest)</option>
            <option value="total-desc">Total (High to Low)</option>
            <option value="items-desc">Items (High to Low)</option>
            <option value="status-asc">Status</option>
          </select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Orders ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedOrders.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/10">
                    <th className="text-left py-3 px-4 font-semibold">Order #</th>
                    <th className="text-left py-3 px-4 font-semibold">Customer</th>
                    <th className="text-left py-3 px-4 font-semibold">Date</th>
                    <th className="text-left py-3 px-4 font-semibold">Items</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-right py-3 px-4 font-semibold">Total</th>
                    <th className="text-left py-3 px-4 font-semibold">Notes</th>
                    <th className="text-right py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedOrders.map((order, index) => (
                    <tr key={order.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4 text-xs text-muted-foreground font-medium">#{String(index + 1).padStart(3, '0')}</td>
                      <td className="py-3 px-4 font-medium">{order.customerName}</td>
                      <td className="py-3 px-4 text-muted-foreground">{new Date(order.date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 font-medium">{order.items.length}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">₱{order.total.toLocaleString()}</td>
                      <td className="py-3 px-4 text-muted-foreground truncate max-w-[200px]">{order.notes || '-'}</td>
                      <td className="py-3 px-4 text-right flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedOrder(order);
                            setDetailDialogOpen(true);
                          }}
                          className="text-primary hover:bg-primary/10"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteOrder(order.id)}
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
    </div>
  );
}
