import React, { useEffect, useState } from 'react';
import { Typography, Button, Box, Paper, List, ListItem, ListItemText, IconButton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import * as categoryService from '../services/categoryService';
import { Category } from '../types';
import AddCategoryForm from '../components/Category/AddCategoryForm';

function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isFormOpen, setFormOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch all categories for management
    const allCategories = await categoryService.getCategories();
    setCategories(allCategories);
  };

  const handleAddCategory = async (name: string, type: 'income' | 'expense') => {
    await categoryService.createCategory({ name, type });
    fetchData(); // Refresh list
  };

  const handleDelete = async (id: number) => {
    await categoryService.deleteCategory(id);
    fetchData(); // Refresh list
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Manage Categories</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setFormOpen(true)}>
          Add Category
        </Button>
      </Box>
      
      <Paper>
        <List>
          {categories.map((cat) => (
            <ListItem key={cat.id} secondaryAction={
              <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(cat.id)}>
                <DeleteIcon />
              </IconButton>
            }>
              <ListItemText primary={cat.name} secondary={cat.type} />
            </ListItem>
          ))}
        </List>
      </Paper>

      <AddCategoryForm
        open={isFormOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleAddCategory}
      />
    </>
  );
}

export default Categories;