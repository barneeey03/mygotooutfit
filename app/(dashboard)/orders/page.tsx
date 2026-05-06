'use client';

import { useState } from 'react';
import { useData, Order } from '@/lib/data-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Plus, Eye, Trash2 } from 'lucide-react';
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

      {/* Orders Grid */}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingCart className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">No orders yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map(order => {
            const itemCount = order.items.length;
            return (
              <Card key={order.id} className="border-primary/20 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">Order #{order.id.slice(0, 8)}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(order.date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Items</p>
                    <p className="text-lg font-semibold">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold text-primary">฿{order.total.toLocaleString()}</p>
                  </div>
                  {order.notes && (
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm text-foreground">{order.notes}</p>
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedOrder(order);
                        setDetailDialogOpen(true);
                      }}
                      className="flex-1 text-primary hover:bg-primary/10"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Details
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteOrder(order.id)}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

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
