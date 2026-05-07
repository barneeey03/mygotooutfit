'use client';

import { useState, useEffect } from 'react';
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

interface ExpenseTypeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (type: { name: string }) => Promise<void>;
}

export default function ExpenseTypeDialog({
  isOpen,
  onClose,
  onSave,
}: ExpenseTypeDialogProps) {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setName('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter an expense type');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({ name: name.trim() });
      setName('');
      onClose();
    } catch (error) {
      alert('Failed to save expense type');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Expense Type</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expenseTypeName">Type Name *</Label>
            <Input
              id="expenseTypeName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Flight Expenses"
              className="border-primary/20"
              disabled={isSaving}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-white" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Add Type'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
