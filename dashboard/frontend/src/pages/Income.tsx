import React, { useEffect, useState } from 'react';
import { Typography, Button, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { getIncomes, createIncome } from '../services/incomeService';
import { getCategories } from '../services/categoryService';
import * as accountService from '../services/accountService'; // --- ADD ---
import { Income as IncomeType, Category, Account, IncomeCreate } from '../types'; // --- UPDATE ---
import IncomeList from '../components/Income/IncomeList';
import AddIncomeForm from '../components/Income/AddIncomeForm';

function Income() {
  const [incomes, setIncomes] = useState<IncomeType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]); // --- ADD ---
  const [isFormOpen, setFormOpen] = useState(false);

  useEffect(() => {
    // Fetch all data on initial load
    fetchData();
  }, []);

  const fetchIncomeData = async () => {
    const incomesData = await getIncomes();
    setIncomes(incomesData);
  };

  const fetchCategoryData = async () => {
    const categoriesData = await getCategories('income');
    setCategories(categoriesData);
  };

  // --- ADD THIS FUNCTION ---
  const fetchAccountData = async () => {
    const accountsData = await accountService.getAccounts();
    setAccounts(accountsData);
  };

  const fetchData = () => {
    fetchIncomeData();
    fetchCategoryData();
    fetchAccountData(); // --- ADD THIS CALL ---

  };

  const handleAddIncome = async (newIncome: IncomeCreate) => {
    await createIncome(newIncome);
    fetchIncomeData(); // After adding income, only refetch incomes
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Income Transactions</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setFormOpen(true)}
        >
          Add Income
        </Button>
      </Box>
      
      <IncomeList incomes={incomes} />

      <AddIncomeForm
        open={isFormOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleAddIncome}
        categories={categories}
        accounts={accounts} // --- ADD ---
        onCategoryAdded={fetchCategoryData} // Pass the callback function here
        onAccountAdded={fetchAccountData} // --- ADD ---
      />
    </>
  );
}

export default Income;