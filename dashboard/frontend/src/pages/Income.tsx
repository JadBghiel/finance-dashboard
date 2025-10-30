import React, { useEffect, useState, useMemo } from 'react';
import { Typography, Button, Box, TextField, InputAdornment } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { getIncomes, createIncome, updateIncome, deleteIncome } from '../services/incomeService';
import { getCategories } from '../services/categoryService';
import * as accountService from '../services/accountService';
import { Income as IncomeType, Category, Account, IncomeCreate } from '../types';
import IncomeList from '../components/Income/IncomeList';
import AddIncomeForm from '../components/Income/AddIncomeForm';

type SortKey = 'date' | 'description' | 'category' | 'account' | 'amount' | null;

function Income() {
  const [incomes, setIncomes] = useState<IncomeType[]>([]);
  const [filtered, setFiltered] = useState<IncomeType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
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

    const numericQuery = q.replace(',', '.').match(/-?\d+(\.\d+)?/);
    const numStr = numericQuery ? numericQuery[0] : null;

    const result = list.filter((inc) => {
      const desc = (inc.description ?? '').toString().toLowerCase();
      const cat = (inc.category?.name ?? '').toString().toLowerCase();
      const acc = (inc.account?.name ?? '').toString().toLowerCase();

      const textMatch = desc.includes(q) || cat.includes(q) || acc.includes(q);

      let numMatch = false;
      if (numStr) {
        const amountStr = String(Number(inc.amount));
        numMatch = amountStr.includes(numStr);
      }

      return textMatch || numMatch;
    });

    setFiltered(result);
  };

  const handleAddIncome = async (newIncome: IncomeCreate) => {
    if (editingIncome) {
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

  const handleRequestSort = (key: Exclude<SortKey, null>) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const baseList = filtered.length ? filtered : incomes;

  const displayed = useMemo(() => {
    const list = [...baseList];
    if (!sortKey) return list;

    list.sort((a, b) => {
      let va: any;
      let vb: any;

      switch (sortKey) {
        case 'date':
          va = new Date(a.date).getTime();
          vb = new Date(b.date).getTime();
          break;
        case 'amount':
          va = Number(a.amount);
          vb = Number(b.amount);
          break;
        case 'description':
          va = (a.description ?? '').toString().toLowerCase();
          vb = (b.description ?? '').toString().toLowerCase();
          break;
        case 'category':
          va = (a.category?.name ?? '').toString().toLowerCase();
          vb = (b.category?.name ?? '').toString().toLowerCase();
          break;
        case 'account':
          va = (a.account?.name ?? '').toString().toLowerCase();
          vb = (b.account?.name ?? '').toString().toLowerCase();
          break;
        default:
          va = '';
          vb = '';
      }

      if (typeof va === 'string') {
        const cmp = va.localeCompare(vb);
        return sortDir === 'asc' ? cmp : -cmp;
      } else {
        const cmp = va < vb ? -1 : va > vb ? 1 : 0;
        return sortDir === 'asc' ? cmp : -cmp;
      }
    });

    return list;
  }, [baseList, sortKey, sortDir]);

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
        <Typography variant="h4">💸 Income Transactions</Typography>

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

      <IncomeList
        incomes={displayed}
        onEdit={handleEdit}
        onDelete={handleDelete}
        sortKey={sortKey}
        sortDir={sortDir}
        onRequestSort={handleRequestSort}
      />

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