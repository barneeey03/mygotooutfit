'use client';

import { useState, useEffect } from 'react';
import { Product, useData } from '@/lib/data-context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

interface InventoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: any) => Promise<void>;
  product?: Product | null;
}

export default function InventoryDialog({
  isOpen,
  onClose,
  onSave,
  product,
}: InventoryDialogProps) {
  const { brands, categories, addBrand, addCategory } = useData();
  const [formData, setFormData] = useState({
    brandName: '',
    category: '',
    quantity: 0,
    unitPrice: 0,
    sellingPrice: 0,
    reorderLevel: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [newBrand, setNewBrand] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [showBrandInput, setShowBrandInput] = useState(false);
  const [showCategoryInput, setShowCategoryInput] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        brandName: product.brandName,
        category: product.category,
        quantity: product.quantity,
        unitPrice: product.unitPrice,
        sellingPrice: product.sellingPrice,
        reorderLevel: product.reorderLevel,
      });
    } else {
      setFormData({
        brandName: '',
        category: '',
        quantity: 0,
        unitPrice: 0,
        sellingPrice: 0,
        reorderLevel: 0,
      });
    }
    setNewBrand('');
    setNewCategory('');
    setShowBrandInput(false);
    setShowCategoryInput(false);
  }, [product, isOpen]);

  const handleAddBrand = async () => {
    if (newBrand.trim()) {
      try {
        await addBrand({ name: newBrand.trim() });
        setFormData({ ...formData, brandName: newBrand.trim() });
        setNewBrand('');
        setShowBrandInput(false);
      } catch (error) {
        alert('Failed to add brand');
        console.error(error);
      }
    }
  };

  const handleAddCategory = async () => {
    if (newCategory.trim()) {
      try {
        await addCategory({ name: newCategory.trim() });
        setFormData({ ...formData, category: newCategory.trim() });
        setNewCategory('');
        setShowCategoryInput(false);
      } catch (error) {
        alert('Failed to add category');
        console.error(error);
      }
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brandName || !formData.category || formData.sellingPrice <= 0) {
      alert('Please fill in all required fields');
      return;
    }
    
    setIsSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      alert('Failed to save product');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Brand Name */}
          <div className="space-y-2">
            <Label htmlFor="brandName">Brand Name *</Label>
            <div className="flex gap-2">
              <select
                value={formData.brandName}
                onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                className="flex-1 px-3 py-2 border border-primary/20 rounded-md bg-background text-foreground disabled:opacity-50 text-sm"
                disabled={isSaving}
              >
                <option value="">Select or add brand</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.name}>{brand.name}</option>
                ))}
              </select>
              <Button
                type="button"
                size="sm"
                onClick={() => setShowBrandInput(!showBrandInput)}
                className="px-2"
                style={{ backgroundColor: '#e68bbe' }}
                disabled={isSaving}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {showBrandInput && (
              <div className="flex gap-2">
                <Input
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  placeholder="New brand name"
                  className="border-primary/20"
                  disabled={isSaving}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddBrand}
                  disabled={!newBrand.trim() || isSaving}
                  style={{ backgroundColor: '#e68bbe' }}
                >
                  Add
                </Button>
              </div>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <div className="flex gap-2">
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="flex-1 px-3 py-2 border border-primary/20 rounded-md bg-background text-foreground disabled:opacity-50 text-sm"
                disabled={isSaving}
              >
                <option value="">Select or add category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              <Button
                type="button"
                size="sm"
                onClick={() => setShowCategoryInput(!showCategoryInput)}
                className="px-2"
                style={{ backgroundColor: '#e68bbe' }}
                disabled={isSaving}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {showCategoryInput && (
              <div className="flex gap-2">
                <Input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="New category name"
                  className="border-primary/20"
                  disabled={isSaving}
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddCategory}
                  disabled={!newCategory.trim() || isSaving}
                  style={{ backgroundColor: '#e68bbe' }}
                >
                  Add
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                className="border-primary/20"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price (₱)</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                className="border-primary/20"
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sellingPrice">Selling Price (₱)</Label>
              <Input
                id="sellingPrice"
                type="number"
                step="0.01"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                className="border-primary/20"
                disabled={isSaving}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorderLevel">Reorder Level</Label>
              <Input
                id="reorderLevel"
                type="number"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: parseInt(e.target.value) || 0 })}
                placeholder="Alert when stock falls below this"
                className="border-primary/20"
                disabled={isSaving}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" className="text-white transition-colors" style={{ backgroundColor: '#e68bbe' }} disabled={isSaving} onMouseEnter={(e) => !isSaving && (e.currentTarget.style.backgroundColor = '#eea1cd')} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e68bbe'}>
              {isSaving ? 'Saving...' : (product ? 'Update' : 'Add')} Product
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}