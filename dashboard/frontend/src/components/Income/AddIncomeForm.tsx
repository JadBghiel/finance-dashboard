import React, { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, MenuItem, Box } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { Category, Account, IncomeCreate } from '../../types';
import * as categoryService from '../../services/categoryService';
import * as accountService from '../../services/accountService';

interface AddIncomeFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (income: IncomeCreate) => void;
  categories: Category[];
  accounts: Account[];
  onCategoryAdded: () => void;
  onAccountAdded: () => void;
}

const initialState: Omit<IncomeCreate, 'currency'> = {
  amount: 0,
  description: '',
  date: new Date().toISOString().split('T')[0],
  category_id: 0,
  account_id: 0,
};

function AddIncomeForm({ open, onClose, onSubmit, categories, accounts, onCategoryAdded, onAccountAdded }: AddIncomeFormProps) {
  const [formState, setFormState] = useState(initialState);
  
  // State for the inline "Add Category" form
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // --- FIX: Create separate state for the "Add Account" form ---
  const [showNewAccount, setShowNewAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');

  const handleAddNewCategory = async () => {
    if (!newCategoryName) return;
    await categoryService.createCategory({ name: newCategoryName, type: 'income' });
    onCategoryAdded();
    setShowNewCategory(false);
    setNewCategoryName('');
  };

  const handleAddNewAccount = async () => {
    if (!newAccountName) return;
    await accountService.createAccount({ name: newAccountName });
    onAccountAdded();
    setShowNewAccount(false);
    setNewAccountName('');
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

  const isFormValid = formState.amount > 0 && formState.category_id !== 0 && formState.account_id !== 0;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Add New Income</DialogTitle>
      <DialogContent>
        {/* --- Main Form Fields --- */}
        <TextField margin="normal" fullWidth name="amount" label="Amount" type="number" value={formState.amount} onChange={(e) => setFormState(p => ({...p, amount: Number(e.target.value)}))} required />
        <TextField margin="normal" fullWidth name="description" label="Description" value={formState.description} onChange={(e) => setFormState(p => ({...p, description: e.target.value}))} />
        <TextField margin="normal" fullWidth name="date" label="Date" type="date" value={formState.date} onChange={(e) => setFormState(p => ({...p, date: e.target.value}))} InputLabelProps={{ shrink: true }} />

        {/* --- Category Section --- */}
        <TextField select margin="normal" fullWidth name="category_id" label="Category" value={formState.category_id} onChange={(e) => setFormState(p => ({...p, category_id: Number(e.target.value)}))} required>
            <MenuItem value={0} disabled><em>Select a Category</em></MenuItem>
            {categories.map((cat) => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
        </TextField>
        {!showNewCategory && <Button startIcon={<AddCircleOutlineIcon />} onClick={() => setShowNewCategory(true)} sx={{ mt: 1 }}>Add New Category</Button>}
        {showNewCategory && <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, gap: 1 }}><TextField label="New Category Name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} size="small" /><Button onClick={handleAddNewCategory} variant="contained" size="small">Save</Button><Button onClick={() => setShowNewCategory(false)} size="small">Cancel</Button></Box>}

        {/* --- Account Section --- */}
        <TextField select margin="normal" fullWidth name="account_id" label="Account" value={formState.account_id} onChange={(e) => setFormState(p => ({...p, account_id: Number(e.target.value)}))} required>
            <MenuItem value={0} disabled><em>Select an Account</em></MenuItem>
            {accounts.map((acc) => <MenuItem key={acc.id} value={acc.id}>{acc.name}</MenuItem>)}
        </TextField>
        {/* --- FIX: Use the correct state variable 'showNewAccount' --- */}
        {!showNewAccount && <Button startIcon={<AddCircleOutlineIcon />} onClick={() => setShowNewAccount(true)} sx={{ mt: 1 }}>Add New Account</Button>}
        {showNewAccount && <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, gap: 1 }}><TextField label="New Account Name" value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} size="small" /><Button onClick={handleAddNewAccount} variant="contained" size="small">Save</Button><Button onClick={() => setShowNewAccount(false)} size="small">Cancel</Button></Box>}

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!isFormValid}>Add Income</Button>
      </DialogActions>
    </Dialog>
  );
}

export default AddIncomeForm;