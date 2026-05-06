'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  reorderLevel: number;
  supplier: string;
}

export interface Order {
  id: string;
  date: string;
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
  addProduct: (product: Product) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, order: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;
  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEY = 'inventory_data';

const defaultProducts: Product[] = [
  { id: '1', name: 'Summer Dress - Pink', category: 'Dresses', quantity: 25, unitPrice: 850, reorderLevel: 10, supplier: 'Bangkok Textiles' },
  { id: '2', name: 'Casual Shirt - White', category: 'Tops', quantity: 40, unitPrice: 450, reorderLevel: 15, supplier: 'Metro Fashion' },
  { id: '3', name: 'Skinny Jeans - Blue', category: 'Bottoms', quantity: 18, unitPrice: 650, reorderLevel: 8, supplier: 'Denim Co' },
  { id: '4', name: 'Blazer - Black', category: 'Outerwear', quantity: 12, unitPrice: 1200, reorderLevel: 5, supplier: 'Elite Wear' },
  { id: '5', name: 'Scarf - Floral', category: 'Accessories', quantity: 35, unitPrice: 200, reorderLevel: 20, supplier: 'Thai Crafts' },
];

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load data from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setProducts(data.products || defaultProducts);
        setOrders(data.orders || []);
        setInvoices(data.invoices || []);
        setExpenses(data.expenses || []);
      } catch {
        // Use defaults on parse error
      }
    }
    setIsLoaded(true);
  }, []);

  // Save data to localStorage
  const saveData = (newProducts: Product[], newOrders: Order[], newInvoices: Invoice[], newExpenses: Expense[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      products: newProducts,
      orders: newOrders,
      invoices: newInvoices,
      expenses: newExpenses,
    }));
  };

  const addProduct = (product: Product) => {
    const newProducts = [...products, product];
    setProducts(newProducts);
    saveData(newProducts, orders, invoices, expenses);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const newProducts = products.map(p => p.id === id ? { ...p, ...updates } : p);
    setProducts(newProducts);
    saveData(newProducts, orders, invoices, expenses);
  };

  const deleteProduct = (id: string) => {
    const newProducts = products.filter(p => p.id !== id);
    setProducts(newProducts);
    saveData(newProducts, orders, invoices, expenses);
  };

  const addOrder = (order: Order) => {
    const newOrders = [...orders, order];
    setOrders(newOrders);
    saveData(products, newOrders, invoices, expenses);
  };

  const updateOrder = (id: string, updates: Partial<Order>) => {
    const newOrders = orders.map(o => o.id === id ? { ...o, ...updates } : o);
    setOrders(newOrders);
    saveData(products, newOrders, invoices, expenses);
  };

  const deleteOrder = (id: string) => {
    const newOrders = orders.filter(o => o.id !== id);
    setOrders(newOrders);
    saveData(products, newOrders, invoices, expenses);
  };

  const addInvoice = (invoice: Invoice) => {
    const newInvoices = [...invoices, invoice];
    setInvoices(newInvoices);
    saveData(products, orders, newInvoices, expenses);
  };

  const updateInvoice = (id: string, updates: Partial<Invoice>) => {
    const newInvoices = invoices.map(i => i.id === id ? { ...i, ...updates } : i);
    setInvoices(newInvoices);
    saveData(products, orders, newInvoices, expenses);
  };

  const deleteInvoice = (id: string) => {
    const newInvoices = invoices.filter(i => i.id !== id);
    setInvoices(newInvoices);
    saveData(products, orders, newInvoices, expenses);
  };

  const addExpense = (expense: Expense) => {
    const newExpenses = [...expenses, expense];
    setExpenses(newExpenses);
    saveData(products, orders, invoices, newExpenses);
  };

  const updateExpense = (id: string, updates: Partial<Expense>) => {
    const newExpenses = expenses.map(e => e.id === id ? { ...e, ...updates } : e);
    setExpenses(newExpenses);
    saveData(products, orders, invoices, newExpenses);
  };

  const deleteExpense = (id: string) => {
    const newExpenses = expenses.filter(e => e.id !== id);
    setExpenses(newExpenses);
    saveData(products, orders, invoices, newExpenses);
  };

  if (!isLoaded) return null;

  return (
    <DataContext.Provider value={{
      products,
      orders,
      invoices,
      expenses,
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
    }}>
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
