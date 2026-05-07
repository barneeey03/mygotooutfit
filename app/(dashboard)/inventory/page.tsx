'use client';

import { useState } from 'react';
import { useData, Product } from '@/lib/data-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package, Plus, Edit2, Trash2, Search } from 'lucide-react';
import PageHeader from '@/components/page-header';
import InventoryDialog from '@/components/inventory-dialog';
import ConfirmationDialog from '@/components/confirmation-dialog';

const CATEGORIES = ['Dresses', 'Tops', 'Bottoms', 'Outerwear', 'Accessories', 'Shoes', 'Other'];
const STATUSES = ['In Stock', 'Low Stock', 'Out of Stock'];

export default function InventoryPage() {
  const { products, addProduct, updateProduct, deleteProduct } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const getProductStatus = (product: Product) => {
    if (product.quantity === 0) return 'Out of Stock';
    if (product.quantity <= product.reorderLevel) return 'Low Stock';
    return 'In Stock';
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !filterCategory || p.category === filterCategory;
    const matchesStatus = !filterStatus || getProductStatus(p) === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
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
    setProductToDelete(id);
    setConfirmDialogOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (productToDelete) {
      try {
        await deleteProduct(productToDelete);
      } catch (error) {
        alert('Failed to delete product');
        console.error(error);
      }
      setProductToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Inventory Management"
        description="Manage your product inventory"
        icon={<Package className="w-8 h-8" />}
        action={
          <Button
            onClick={() => {
              setEditingProduct(null);
              setIsDialogOpen(true);
            }}
            className="text-white gap-2 w-fit transition-colors"
            style={{ backgroundColor: '#e68bbe' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eea1cd'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e68bbe'}
          >
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        }
      />

      {/* Search + Filter + Sort */}
      <div className="grid gap-4 md:grid-cols-4 items-end">
        <div className="md:col-span-2 relative">
          <label htmlFor="search" className="text-sm font-medium text-muted-foreground mb-2 block">
            Search Products
          </label>
          <Search className="absolute left-3 top-10 w-4 h-4 text-muted-foreground" />
          <Input
            id="search"
            placeholder="Search by name, ID, category, supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 border-primary/20"
          />
        </div>
        <div>
          <label htmlFor="category-filter" className="text-sm font-medium text-muted-foreground mb-2 block">
            Category
          </label>
          <select
            id="category-filter"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3 py-2 border border-primary/20 rounded-md bg-background text-foreground text-sm"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status-filter" className="text-sm font-medium text-muted-foreground mb-2 block">
            Status
          </label>
          <select
            id="status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-primary/20 rounded-md bg-background text-foreground text-sm"
          >
            <option value="">All Status</option>
            {STATUSES.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
      </div>

      {/* Inventory Table */}
      <div className="overflow-x-auto w-full">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">No products found</p>
              <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <table className="w-full min-w-full border-collapse">
                <thead>
                  <tr className="text-white" style={{ backgroundColor: '#e68bbe' }}>
                    <th className="text-left py-1.5 px-2 font-medium text-xs whitespace-nowrap border border-white/20">Product ID</th>
                    <th className="text-left py-1.5 px-2 font-medium text-xs whitespace-nowrap border border-white/20">Product Name</th>
                    <th className="text-left py-1.5 px-2 font-medium text-xs whitespace-nowrap border border-white/20">Category</th>
                    <th className="text-left py-1.5 px-2 font-medium text-xs whitespace-nowrap border border-white/20">Supplier</th>
                    <th className="text-right py-1.5 px-2 font-medium text-xs whitespace-nowrap border border-white/20">Quantity</th>
                    <th className="text-right py-1.5 px-2 font-medium text-xs whitespace-nowrap border border-white/20">Unit Price</th>
                    <th className="text-right py-1.5 px-2 font-medium text-xs whitespace-nowrap border border-white/20">Selling Price</th>
                    <th className="text-right py-1.5 px-2 font-medium text-xs whitespace-nowrap border border-white/20">Stock Value</th>
                    <th className="text-center py-1.5 px-2 font-medium text-xs whitespace-nowrap border border-white/20">Status</th>
                    <th className="text-center py-1.5 px-2 font-medium text-xs whitespace-nowrap border border-white/20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product, index) => {
                    const stockValue = product.quantity * product.unitPrice;
                    const status = getProductStatus(product);
                    const isEvenRow = index % 2 === 0;

                    return (
                      <tr
                        key={product.id}
                        className="transition-colors"
                        style={{ backgroundColor: isEvenRow ? 'white' : '#fde4f2' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9cee7'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = isEvenRow ? 'white' : '#fde4f2'}
                      >
                        <td className="py-1 px-2 text-xs text-muted-foreground font-semibold whitespace-nowrap border border-gray-200">
                          #{String(index + 1).padStart(3, '0')}
                        </td>
                        <td className="py-1 px-2 text-xs font-medium text-foreground whitespace-nowrap border border-gray-200">
                          {product.name}
                        </td>
                        <td className="py-1 px-2 text-xs text-muted-foreground whitespace-nowrap border border-gray-200">
                          {product.category}
                        </td>
                        <td className="py-1 px-2 text-xs text-muted-foreground whitespace-nowrap border border-gray-200">
                          {product.supplier}
                        </td>
                        <td className="py-1 px-2 text-xs text-right font-semibold text-foreground whitespace-nowrap border border-gray-200">
                          {product.quantity}
                        </td>
                        <td className="py-1 px-2 text-xs text-right text-foreground whitespace-nowrap border border-gray-200">
                          ₱{product.unitPrice.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-1 px-2 text-xs text-right text-foreground whitespace-nowrap border border-gray-200">
                          ₱{product.sellingPrice.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-1 px-2 text-xs text-right font-semibold text-foreground whitespace-nowrap border border-gray-200">
                          ₱{stockValue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-1 px-2 text-xs text-center whitespace-nowrap border border-gray-200">
                          <span
                            className="inline-block px-1.5 py-0.5 rounded text-xs font-medium"
                            style={{
                              backgroundColor: status === 'In Stock' ? '#d1fae5' : status === 'Low Stock' ? '#fef3c7' : '#fee2e2',
                              color: status === 'In Stock' ? '#065f46' : status === 'Low Stock' ? '#92400e' : '#991b1b'
                            }}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="py-1 px-2 text-xs text-center whitespace-nowrap border border-gray-200">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingProduct(product);
                                setIsDialogOpen(true);
                              }}
                              className="h-6 w-6 p-0 transition-colors"
                              style={{ color: '#e68bbe' }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f4b8da'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
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

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialogOpen}
        onClose={() => {
          setConfirmDialogOpen(false);
          setProductToDelete(null);
        }}
        onConfirm={confirmDeleteProduct}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone and may affect existing orders."
        confirmText="Delete Product"
        variant="destructive"
      />
    </div>
  );
}
