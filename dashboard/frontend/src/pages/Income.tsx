import React, { useEffect, useState } from 'react';
import { Typography, Button, Box, TextField, InputAdornment } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { getIncomes, createIncome, updateIncome, deleteIncome } from '../services/incomeService';
import { getCategories } from '../services/categoryService';
import * as accountService from '../services/accountService';
import { Income as IncomeType, Category, Account, IncomeCreate } from '../types';
import IncomeList from '../components/Income/IncomeList';
import AddIncomeForm from '../components/Income/AddIncomeForm';

function Income() {
  const [incomes, setIncomes] = useState<IncomeType[]>([]);
  const [filtered, setFiltered] = useState<IncomeType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // fetch all data on initial load
    fetchData();
  }, []);

  useEffect(() => {
    // debounce search to avoid filtering on every keystroke
    const t = setTimeout(() => {
      applyFilter(searchQuery, incomes);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, incomes]);

  const fetchIncomeData = async () => {
    const incomesData = await getIncomes();
    setIncomes(incomesData);
    applyFilter(searchQuery, incomesData);
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

  const applyFilter = (query: string, list: IncomeType[]) => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setFiltered(list);
      return;
    }

    // try parsing a numeric portion for amount matching
    const numericQuery = q.replace(',', '.').match(/-?\d+(\.\d+)?/);
    const numStr = numericQuery ? numericQuery[0] : null;

    const result = list.filter((inc) => {
      // text matching on description, category.name, account.name
      const desc = (inc.description ?? '').toString().toLowerCase();
      const cat = (inc.category?.name ?? '').toString().toLowerCase();
      const acc = (inc.account?.name ?? '').toString().toLowerCase();

      const textMatch = desc.includes(q) || cat.includes(q) || acc.includes(q);

      // numeric matching on amount: partial or exact
      let numMatch = false;
      if (numStr) {
        const amountStr = String(Number(inc.amount)); // normalize
        numMatch = amountStr.includes(numStr);
      }

      return textMatch || numMatch;
    });

    setFiltered(result);
  };

  const handleAddIncome = async (newIncome: IncomeCreate) => {
    if (editingIncome) {
      // editing existing income
      await updateIncome(editingIncome.id, newIncome);
      setEditingIncome(null);
    } else {
      await createIncome(newIncome);
    }
    fetchIncomeData();
  };

  const handleEdit = (income: IncomeType) => {
    setEditingIncome(income);
    setFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    await deleteIncome(id);
    fetchIncomeData();
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingIncome(null);
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
        <Typography variant="h4">Income Transactions</Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TextField
            size="small"
            placeholder="Search description, category, account or amount"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ width: 360 }}
          />

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => { setEditingIncome(null); setFormOpen(true); }}
          >
            Add Income
          </Button>
        </Box>
      </Box>

      <IncomeList incomes={filtered.length ? filtered : incomes} onEdit={handleEdit} onDelete={handleDelete} />

      <AddIncomeForm
        open={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleAddIncome}
        categories={categories}
        accounts={accounts}
        onCategoryAdded={fetchCategoryData}
        onAccountAdded={fetchAccountData}
        initialIncome={editingIncome}
      />
    </>
  );
}

export default Income;