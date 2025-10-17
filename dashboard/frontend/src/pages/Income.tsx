import React, { useEffect, useState } from 'react';
import { Typography, Button, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import * as incomeService from '../services/incomeService';
import * as categoryService from '../services/categoryService';
import * as accountService from '../services/accountService';
import { Income as IncomeType, Category, Account, IncomeCreate, IncomeUpdate } from '../types';
import IncomeList from '../components/Income/IncomeList';
import AddIncomeForm from '../components/Income/AddIncomeForm';

function Income() {
  const [incomes, setIncomes] = useState<IncomeType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  
  // --- State for Edit/Create Flow ---
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeType | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchIncomeData = async () => { /* ... same as before ... */ };
  const fetchCategoryData = async () => { /* ... same as before ... */ };
  const fetchAccountData = async () => { /* ... same as before ... */ };
  const fetchData = () => {
    fetchIncomeData();
    fetchCategoryData();
    fetchAccountData();
  };

  // --- HANDLER FUNCTIONS ---

  const handleOpenCreateForm = () => {
    setEditingIncome(null); // Ensure we are not in edit mode
    setFormOpen(true);
  };

  const handleOpenEditForm = (income: IncomeType) => {
    setEditingIncome(income); // Set the income to edit
    setFormOpen(true);
  };

  const handleDeleteIncome = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
      await incomeService.deleteIncome(id);
      fetchIncomeData(); // Refresh the list
    }
  };

  const handleFormSubmit = async (incomeData: IncomeCreate | IncomeUpdate) => {
    if (editingIncome) {
      // We are in edit mode
      await incomeService.updateIncome(editingIncome.id, incomeData as IncomeUpdate);
    } else {
      // We are in create mode
      await incomeService.createIncome(incomeData as IncomeCreate);
    }
    fetchIncomeData(); // Refresh the list
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Income Transactions</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateForm}>
          Add Income
        </Button>
      </Box>
      
      <IncomeList 
        incomes={incomes}
        onEdit={handleOpenEditForm}
        onDelete={handleDeleteIncome}
      />

      <AddIncomeForm
        open={isFormOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingIncome}
        categories={categories}
        accounts={accounts}
        onCategoryAdded={fetchCategoryData}
        onAccountAdded={fetchAccountData}
      />
    </>
  );
}

export default Income;