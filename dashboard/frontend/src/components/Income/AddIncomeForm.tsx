import React, { useState, useEffect } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, MenuItem, Box, Select, FormControl, InputLabel, Typography } from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { Category, Account, Income as IncomeType, IncomeCreate } from '../../types';
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
  initialIncome?: IncomeType | null;
}

const currencyOptions = [
  { code: 'EUR', label: 'Euro', symbol: '€' },
  { code: 'USD', label: 'US Dollar', symbol: '$' },
  { code: 'JPY', label: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', label: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'MAD', label: 'Moroccan Dirham', symbol: 'MAD' },
  { code: 'AED', label: 'Emirati Dirham', symbol: 'AED' },
  { code: 'AUD', label: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', label: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', label: 'Chinese Renminbi', symbol: '¥' },
];

const initialState: IncomeCreate = {
  amount: 0,
  currency: 'USD',
  description: '',
  date: new Date().toISOString().split('T')[0],
  category_id: 0,
  account_id: 0,
};

function AddIncomeForm({
  open,
  onClose,
  onSubmit,
  categories,
  accounts,
  onCategoryAdded,
  onAccountAdded,
  initialIncome = null,
}: AddIncomeFormProps) {
  const [formState, setFormState] = useState<IncomeCreate>(initialState);
  
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const [showNewAccount, setShowNewAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');

  // populate form when editing
  useEffect(() => {
    if (initialIncome) {
      setFormState({
        amount: Number(initialIncome.amount),
        currency: initialIncome.currency ?? 'USD',
        description: initialIncome.description ?? '',
        date: new Date(initialIncome.date).toISOString().split('T')[0],
        category_id: initialIncome.category_id,
        account_id: initialIncome.account_id,
      });
    } else {
      setFormState(initialState);
    }
  }, [initialIncome, open]);

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
    };
    onSubmit(newIncome);
    onClose();
    setFormState(initialState);
  };

  const isFormValid = formState.amount > 0 && formState.category_id !== 0 && formState.account_id !== 0 && !!formState.currency;

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{initialIncome ? 'Edit Income' : 'Add New Income'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            margin="normal"
            name="amount"
            label="Amount"
            type="number"
            value={formState.amount}
            onChange={(e) => setFormState(p => ({...p, amount: Number(e.target.value)}))}
            required
            sx={{ flex: 1 }}
          />
          <FormControl margin="normal" size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="currency-select-label">Currency</InputLabel>
            <Select
              labelId="currency-select-label"
              value={formState.currency}
              label="Currency"
              onChange={(e) => setFormState(p => ({...p, currency: String(e.target.value)}))}
            >
              {currencyOptions.map((c) => (
                <MenuItem key={c.code} value={c.code}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ minWidth: 28 }}>{c.symbol}</Typography>
                    <span>{c.code} — {c.label}</span>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <TextField margin="normal" fullWidth name="description" label="Description" value={formState.description} onChange={(e) => setFormState(p => ({...p, description: e.target.value}))} />
        <TextField margin="normal" fullWidth name="date" label="Date" type="date" value={formState.date} onChange={(e) => setFormState(p => ({...p, date: e.target.value}))} InputLabelProps={{ shrink: true }} />

        <TextField select margin="normal" fullWidth name="category_id" label="Category" value={formState.category_id} onChange={(e) => setFormState(p => ({...p, category_id: Number(e.target.value)}))} required>
            <MenuItem value={0} disabled><em>Select a Category</em></MenuItem>
            {categories.map((cat) => <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>)}
        </TextField>
        {!showNewCategory && <Button startIcon={<AddCircleOutlineIcon />} onClick={() => setShowNewCategory(true)} sx={{ mt: 1 }}>Add New Category</Button>}
        {showNewCategory && <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, gap: 1 }}><TextField label="New Category Name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} size="small" /><Button onClick={handleAddNewCategory} variant="contained" size="small">Save</Button><Button onClick={() => setShowNewCategory(false)} size="small">Cancel</Button></Box>}

        <TextField select margin="normal" fullWidth name="account_id" label="Account" value={formState.account_id} onChange={(e) => setFormState(p => ({...p, account_id: Number(e.target.value)}))} required>
            <MenuItem value={0} disabled><em>Select an Account</em></MenuItem>
            {accounts.map((acc) => <MenuItem key={acc.id} value={acc.id}>{acc.name}</MenuItem>)}
        </TextField>
        {!showNewAccount && <Button startIcon={<AddCircleOutlineIcon />} onClick={() => setShowNewAccount(true)} sx={{ mt: 1 }}>Add New Account</Button>}
        {showNewAccount && <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, gap: 1 }}><TextField label="New Account Name" value={newAccountName} onChange={(e) => setNewAccountName(e.target.value)} size="small" /><Button onClick={handleAddNewAccount} variant="contained" size="small">Save</Button><Button onClick={() => setShowNewAccount(false)} size="small">Cancel</Button></Box>}

      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!isFormValid}>{initialIncome ? 'Save Changes' : 'Add Income'}</Button>
      </DialogActions>
    </Dialog>
  );
}

export default AddIncomeForm;