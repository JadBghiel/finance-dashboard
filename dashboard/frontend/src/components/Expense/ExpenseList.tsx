import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, IconButton, Box
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { Expense } from '../../types';

type SortKey = 'date' | 'description' | 'category' | 'account' | 'amount' | null;

interface ExpenseListProps {
  expenses: Expense[];
  onEdit?: (expense: Expense) => void;
  onDelete?: (id: number) => void;
  sortKey?: SortKey;
  sortDir?: 'asc' | 'desc';
  onRequestSort?: (key: Exclude<SortKey, null>) => void;
}

const currencySymbols: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  JPY: '¥',
  CAD: 'CA$',
  MAD: 'MAD',
  AED: 'AED',
  AUD: 'A$',
  CHF: 'CHF',
  CNY: '¥',
};

function SortHeader({
  label,
  column,
  sortKey,
  sortDir,
  onRequestSort,
}: {
  label: string;
  column: Exclude<SortKey, null>;
  sortKey?: SortKey;
  sortDir?: 'asc' | 'desc';
  onRequestSort?: (key: Exclude<SortKey, null>) => void;
}) {
  const active = sortKey === column;
  const Icon = active && sortDir === 'asc' ? ArrowUpwardIcon : active && sortDir === 'desc' ? ArrowDownwardIcon : ArrowUpwardIcon;
  const opacity = active ? 1 : 0.25;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <Box component="span">{label}</Box>
      <IconButton
        size="small"
        onClick={() => onRequestSort && onRequestSort(column)}
        sx={{ p: 0.5 }}
        aria-label={`sort-${column}`}
      >
        <Icon fontSize="small" sx={{ opacity }} />
      </IconButton>
    </Box>
  );
}

function ExpenseList({ expenses, onEdit, onDelete, sortKey, sortDir, onRequestSort }: ExpenseListProps) {
  if (expenses.length === 0) {
    return <Typography>No expense transactions recorded yet</Typography>;
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell><SortHeader label="Date" column="date" sortKey={sortKey} sortDir={sortDir} onRequestSort={onRequestSort} /></TableCell>
            <TableCell><SortHeader label="Description" column="description" sortKey={sortKey} sortDir={sortDir} onRequestSort={onRequestSort} /></TableCell>
            <TableCell><SortHeader label="Category" column="category" sortKey={sortKey} sortDir={sortDir} onRequestSort={onRequestSort} /></TableCell>
            <TableCell><SortHeader label="Account" column="account" sortKey={sortKey} sortDir={sortDir} onRequestSort={onRequestSort} /></TableCell>
            <TableCell align="right"><SortHeader label="Amount" column="amount" sortKey={sortKey} sortDir={sortDir} onRequestSort={onRequestSort} /></TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {expenses.map((expense) => {
            const symbol = currencySymbols[expense.currency] ?? '';
            return (
              <TableRow key={expense.id}>
                <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                <TableCell>{expense.description}</TableCell>
                <TableCell>{expense.category.name}</TableCell>
                <TableCell>{expense.account.name}</TableCell>
                <TableCell align="right">{`${symbol} ${Number(expense.amount).toFixed(2)} ${expense.currency}`}</TableCell>
                <TableCell align="right">
                  <Box>
                    <IconButton size="small" aria-label="edit" onClick={() => onEdit && onEdit(expense)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" aria-label="delete" onClick={() => {
                      if (!onDelete) return;
                      if (window.confirm('Delete this expense?')) {
                        onDelete(expense.id);
                      }
                    }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default ExpenseList;