import React, { useEffect, useState } from 'react';
import { Typography, Button, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { getIncomes, createIncome } from '../services/incomeService';
import { getCategories } from '../services/categoryService';
import * as accountService from '../services/accountService';
import { Income as IncomeType, Category, Account, IncomeCreate } from '../types';
import IncomeList from '../components/Income/IncomeList';
import AddIncomeForm from '../components/Income/AddIncomeForm';

function Income() {
  const [incomes, setIncomes] = useState<IncomeType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isFormOpen, setFormOpen] = useState(false);

  useEffect(() => {
    // fetch all data on initial load
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

  const fetchAccountData = async () => {
    const accountsData = await accountService.getAccounts();
    setAccounts(accountsData);
  };

  const fetchData = () => {
    fetchIncomeData();
    fetchCategoryData();
    fetchAccountData();

  };

  const handleAddIncome = async (newIncome: IncomeCreate) => {
    await createIncome(newIncome);
    fetchIncomeData();
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
        accounts={accounts}
        onCategoryAdded={fetchCategoryData}
        onAccountAdded={fetchAccountData}
      />
    </>
  );
}

export default Income;