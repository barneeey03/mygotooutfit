'use client';

import { useState } from 'react';
import { useData, Product } from '@/lib/data-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package, Plus, Edit2, Trash2, Search } from 'lucide-react';
import InventoryDialog from '@/components/inventory-dialog';

export default function InventoryPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('name-asc');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortOption) {
      case 'id-asc':
        return a.id.localeCompare(b.id);
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'category-asc':
        return a.category.localeCompare(b.category);
      case 'quantity-desc':
        return b.quantity - a.quantity;
      case 'unitPrice-desc':
        return b.unitPrice - a.unitPrice;
      case 'sellingPrice-desc':
        return b.sellingPrice - a.sellingPrice;
      case 'stockValue-desc':
        return (b.quantity * b.unitPrice) - (a.quantity * a.unitPrice);
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const handleAddProduct = async (product: Omit<Product, 'id'>) => {
    try {
      await addProduct(product);
      setIsDialogOpen(false);
    } catch (error) {
      alert('Failed to add product');
      console.error(error);
    }
  };

  const handleUpdateProduct = async (product: Partial<Product>) => {
    if (editingProduct) {
      try {
        await updateProduct(editingProduct.id, product);
        setEditingProduct(null);
        setIsDialogOpen(false);
      } catch (error) {
        alert('Failed to update product');
        console.error(error);
      }
    }
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteProduct(id).catch(error => {
        alert('Failed to delete product');
        console.error(error);
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Inventory Management</h1>
          <p className="text-muted-foreground mt-2">Manage your product inventory</p>
        </div>
        <Button
          onClick={() => {
            setEditingProduct(null);
            setIsDialogOpen(true);
          }}
          className="bg-primary hover:bg-primary/90 text-white gap-2 w-fit"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      {/* Search + Sort */}
      <div className="grid gap-4 md:grid-cols-[1fr_auto] items-center">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-primary/20"
          />
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="inventory-sort" className="text-sm font-medium text-muted-foreground">
            Sort by
          </label>
          <select
            id="inventory-sort"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="px-3 py-2 border border-primary/20 rounded-md bg-background text-foreground"
          >
            <option value="name-asc">Product Name</option>
            <option value="id-asc">Product ID</option>
            <option value="category-asc">Category</option>
            <option value="quantity-desc">Quantity (High to Low)</option>
            <option value="unitPrice-desc">Unit Price (High to Low)</option>
            <option value="sellingPrice-desc">Selling Price (High to Low)</option>
            <option value="stockValue-desc">Stock Value (High to Low)</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Products ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No products found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold">Product ID</th>
                    <th className="text-left py-3 px-4 font-semibold">Product Name</th>
                    <th className="text-left py-3 px-4 font-semibold">Category</th>
                    <th className="text-left py-3 px-4 font-semibold">Supplier</th>
                    <th className="text-right py-3 px-4 font-semibold">Quantity</th>
                    <th className="text-right py-3 px-4 font-semibold">Unit Price</th>
                    <th className="text-right py-3 px-4 font-semibold">Selling Price</th>
                    <th className="text-right py-3 px-4 font-semibold">Stock Value</th>
                    <th className="text-center py-3 px-4 font-semibold">Status</th>
                    <th className="text-right py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProducts.map((product, index) => {
                    const stockValue = product.quantity * product.unitPrice;
                    const isLowStock = product.quantity <= product.reorderLevel;
                    return (
                      <tr key={product.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                        <td className="py-3 px-4 text-xs text-muted-foreground font-medium">#{String(index + 1).padStart(3, '0')}</td>
                        <td className="py-3 px-4 font-medium">{product.name}</td>
                        <td className="py-3 px-4 text-muted-foreground">{product.category}</td>
                        <td className="py-3 px-4 text-muted-foreground">{product.supplier}</td>
                        <td className="py-3 px-4 text-right font-medium">{product.quantity}</td>
                        <td className="py-3 px-4 text-right">฿{product.unitPrice.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right">฿{product.sellingPrice.toLocaleString()}</td>
                        <td className="py-3 px-4 text-right font-semibold">฿{stockValue.toLocaleString()}</td>
                        <td className="py-3 px-4 text-center">
                          {isLowStock ? (
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                              Low Stock
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingProduct(product);
                              setIsDialogOpen(true);
                            }}
                            className="text-primary hover:bg-primary/10"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <InventoryDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingProduct(null);
        }}
        onSave={editingProduct ? handleUpdateProduct : handleAddProduct}
        product={editingProduct}
      />
    </div>
  );
}
