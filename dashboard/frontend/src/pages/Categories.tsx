import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Select, FormControl, InputLabel, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../services/categoryService';
import { Category } from '../types';

function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<'income'|'expense'>('income');

  const fetch = async () => {
    setLoading(true);
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch (_) {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const openNew = () => { setEdit(null); setName(''); setType('income'); setOpen(true); };
  const openEdit = (c: Category) => { setEdit(c); setName(c.name); setType(c.type as any); setOpen(true); };

  const handleSave = async () => {
    if (!name.trim()) return;
    if (edit) {
      await updateCategory(edit.id, { name: name.trim(), type });
    } else {
      await createCategory({ name: name.trim(), type });
    }
    setOpen(false);
    fetch();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this category?')) return;
    await deleteCategory(id);
    fetch();
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Categories</Typography>
        <Button variant="contained" onClick={openNew}>Add Category</Button>
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.id}</TableCell>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.type}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => openEdit(c)}><EditIcon fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => handleDelete(c.id)}><DeleteIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{edit ? 'Edit Category' : 'Add Category'}</DialogTitle>
        <DialogContent sx={{ minWidth: 360 }}>
          <TextField fullWidth label="Name" value={name} onChange={(e) => setName(e.target.value)} sx={{ mt: 1 }} />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="cat-type-label">Type</InputLabel>
            <Select labelId="cat-type-label" value={type} label="Type" onChange={(e) => setType(e.target.value as any)}>
              <MenuItem value="income">income</MenuItem>
              <MenuItem value="expense">expense</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!name.trim()}>{edit ? 'Save' : 'Add'}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default Categories;
