import React, { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, MenuItem } from '@mui/material';

interface AddCategoryFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, type: 'income' | 'expense') => void;
}

function AddCategoryForm({ open, onClose, onSubmit }: AddCategoryFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');

  const handleSubmit = () => {
    if (name && type) {
      onSubmit(name, type);
      onClose();
      setName(''); // Reset form
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Add New Category</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Category Name"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          select
          margin="dense"
          label="Category Type"
          fullWidth
          value={type}
          onChange={(e) => setType(e.target.value as any)}
        >
          <MenuItem value="income">Income</MenuItem>
          <MenuItem value="expense">Expense</MenuItem>
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!name}>
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AddCategoryForm;