import React, { useState } from 'react';
import {
  Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField,
  MenuItem, Box, Typography, IconButton
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { Category, IncomeCreate } from '../../types';
import * as categoryService from '../../services/categoryService';

interface AddIncomeFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (income: IncomeCreate) => void;
  categories: Category[];
  onCategoryAdded: () => void; // Callback to refresh categories
}

const initialState: Omit<IncomeCreate, 'currency'> = {
  amount: 0,
  description: '',
  date: new Date().toISOString().split('T')[0],
  category_id: 0,
};

function AddIncomeForm({ open, onClose, onSubmit, categories, onCategoryAdded }: AddIncomeFormProps) {
  const [formState, setFormState] = useState(initialState);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleAddNewCategory = async () => {
    if (!newCategoryName) return;
    await categoryService.createCategory({ name: newCategoryName, type: 'income' });
    onCategoryAdded(); // Tell the parent page to refetch categories
    setShowNewCategory(false);
    setNewCategoryName('');
  };

  const handleSubmit = () => {
    const newIncome: IncomeCreate = {
      ...formState,
      amount: Number(formState.amount),
      date: new Date(formState.date).toISOString(),
      currency: 'USD',
    };
    onSubmit(newIncome);
    onClose();
    setFormState(initialState);
  };

  const isFormValid = formState.amount > 0 && formState.category_id !== 0;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add New Income</DialogTitle>
      <DialogContent>
        {/* --- Main Income Form --- */}
        <TextField margin="normal" fullWidth name="amount" label="Amount" type="number" value={formState.amount} onChange={(e) => setFormState(p => ({...p, amount: Number(e.target.value)}))} required />
        <TextField margin="normal" fullWidth name="description" label="Description" value={formState.description} onChange={(e) => setFormState(p => ({...p, description: e.target.value}))} />
        <TextField margin="normal" fullWidth name="date" label="Date" type="date" value={formState.date} onChange={(e) => setFormState(p => ({...p, date: e.target.value}))} InputLabelProps={{ shrink: true }} />
        
        {/* --- Category Selector --- */}
        <TextField select margin="normal" fullWidth name="category_id" label="Category" value={formState.category_id} onChange={(e) => setFormState(p => ({...p, category_id: Number(e.target.value)}))} required error={formState.category_id === 0}>
          <MenuItem value={0} disabled><em>Select a Category</em></MenuItem>
          {categories.map((cat) => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
        </TextField>

        {/* --- Inline "Add New Category" Form --- */}
        {!showNewCategory && (
          <Button startIcon={<AddCircleOutlineIcon />} onClick={() => setShowNewCategory(true)} sx={{ mt: 1 }}>
            Add New Category
          </Button>
        )}
        {showNewCategory && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, gap: 1 }}>
            <TextField label="New Category Name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} size="small" />
            <Button onClick={handleAddNewCategory} variant="contained" size="small">Save</Button>
            <Button onClick={() => setShowNewCategory(false)} size="small">Cancel</Button>
          </Box>
        )}

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!isFormValid}>Add Income</Button>
      </DialogActions>
    </Dialog>
  );
}

export default AddIncomeForm;