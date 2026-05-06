'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';

export interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  supplier: string;
}

export interface Order {
  id: string;
  date: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  notes: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Invoice {
  id: string;
  orderId: string;
  date: string;
  dueDate: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  customerName: string;
  customerEmail: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  receipt: string;
}

interface DataContextType {
  products: Product[];
  orders: Order[];
  invoices: Invoice[];
  expenses: Expense[];
  isLoading: boolean;
  addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addOrder: (order: Omit<Order, 'id'>) => Promise<void>;
  updateOrder: (id: string, order: Partial<Order>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, 'id'>) => Promise<void>;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Listen to products
  useEffect(() => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData: Product[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Record<string, any>;
        productsData.push({
          id: doc.id,
          ...data,
          sellingPrice: data.sellingPrice ?? 0,
        } as Product);
      });
      setProducts(productsData);
      setIsLoading(false);
    }, (error) => {
      console.error('Error fetching products:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Listen to orders
  useEffect(() => {
    if (!user?.id) return;

    const q = query(collection(db, 'orders'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData: Order[] = [];
      snapshot.forEach((doc) => {
        ordersData.push({
          id: doc.id,
          ...doc.data(),
        } as Order);
      });
      setOrders(ordersData);
    }, (error) => {
      console.error('Error fetching orders:', error);
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Listen to invoices
  useEffect(() => {
    if (!user?.id) return;

    const q = query(collection(db, 'invoices'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invoicesData: Invoice[] = [];
      snapshot.forEach((doc) => {
        invoicesData.push({
          id: doc.id,
          ...doc.data(),
        } as Invoice);
      });
      setInvoices(invoicesData);
    }, (error) => {
      console.error('Error fetching invoices:', error);
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Listen to expenses
  useEffect(() => {
    if (!user?.id) return;

    const q = query(collection(db, 'expenses'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expensesData: Expense[] = [];
      snapshot.forEach((doc) => {
        expensesData.push({
          id: doc.id,
          ...doc.data(),
        } as Expense);
      });
      setExpenses(expensesData);
    }, (error) => {
      console.error('Error fetching expenses:', error);
    });

    return () => unsubscribe();
  }, [user?.id]);

  const addProduct = async (product: Omit<Product, 'id'>) => {
    await addDoc(collection(db, 'products'), product);
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    await updateDoc(doc(db, 'products', id), updates);
  };

  const deleteProduct = async (id: string) => {
    await deleteDoc(doc(db, 'products', id));
  };

  const addOrder = async (order: Omit<Order, 'id'>) => {
    // Check stock availability before creating order
    for (const item of order.items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        throw new Error(`Product ${item.productName} not found`);
      }
      if (product.quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.quantity}, Requested: ${item.quantity}`);
      }
    }

    // Deduct stock immediately when order is created
    const updates = order.items.map(item => {
      const product = products.find(p => p.id === item.productId)!;
      return updateProduct(item.productId, { quantity: product.quantity - item.quantity });
    });
    await Promise.all(updates);

    await addDoc(collection(db, 'orders'), order);
  };

  const updateOrder = async (id: string, updates: Partial<Order>) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    // Handle status changes
    if (updates.status && updates.status !== order.status) {
      if (updates.status === 'completed' && order.status !== 'completed') {
        // Order is being completed - create invoice automatically
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        await addInvoice({
          orderId: order.id,
          date: new Date().toISOString().split('T')[0],
          dueDate: dueDate.toISOString().split('T')[0],
          items: order.items,
          subtotal: order.total,
          tax: Math.round(order.total * 0.07), // 7% tax
          total: Math.round(order.total * 1.07),
          status: 'draft',
          customerName: order.customerName,
          customerEmail: '', // Could be added later
        });
      } else if (updates.status === 'cancelled' && order.status !== 'cancelled') {
        // Order is being cancelled - restore stock
        const stockUpdates = order.items.map(item => {
          const product = products.find(p => p.id === item.productId);
          if (product) {
            return updateProduct(item.productId, { quantity: product.quantity + item.quantity });
          }
          return Promise.resolve();
        });
        await Promise.all(stockUpdates);
      }
    }

    await updateDoc(doc(db, 'orders', id), updates);
  };

  const deleteOrder = async (id: string) => {
    await deleteDoc(doc(db, 'orders', id));
  };

  const addInvoice = async (invoice: Omit<Invoice, 'id'>) => {
    await addDoc(collection(db, 'invoices'), invoice);
  };

  const updateInvoice = async (id: string, updates: Partial<Invoice>) => {
    await updateDoc(doc(db, 'invoices', id), updates);
  };

  const deleteInvoice = async (id: string) => {
    await deleteDoc(doc(db, 'invoices', id));
  };

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    await addDoc(collection(db, 'expenses'), expense);
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    await updateDoc(doc(db, 'expenses', id), updates);
  };

  const deleteExpense = async (id: string) => {
    await deleteDoc(doc(db, 'expenses', id));
  };

  return (
    <DataContext.Provider
      value={{
        products,
        orders,
        invoices,
        expenses,
        isLoading,
        addProduct,
        updateProduct,
        deleteProduct,
        addOrder,
        updateOrder,
        deleteOrder,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        addExpense,
        updateExpense,
        deleteExpense,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
