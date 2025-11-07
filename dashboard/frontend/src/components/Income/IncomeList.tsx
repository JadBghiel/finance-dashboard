import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, IconButton, Box
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { Income } from '../../types';

type SortKey = 'date' | 'description' | 'category' | 'account' | 'amount' | null;

interface IncomeListProps {
  incomes: Income[];
  onEdit?: (income: Income) => void;
  onDelete?: (id: number) => void;
  sortKey?: SortKey;
  sortDir?: 'asc' | 'desc';
  onRequestSort?: (key: Exclude<SortKey, null>) => void;
}

const currencySymbols: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
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

function IncomeList({ incomes, onEdit, onDelete, sortKey, sortDir, onRequestSort }: IncomeListProps) {
  if (incomes.length === 0) {
    return <Typography>No income transactions recorded yet</Typography>;
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
          {incomes.map((income) => {
            const symbol = currencySymbols[income.currency] ?? '';
            return (
              <TableRow key={income.id}>
                <TableCell>{new Date(income.date).toLocaleDateString()}</TableCell>
                <TableCell>{income.description}</TableCell>
                <TableCell>{income.category.name}</TableCell>
                <TableCell>{income.account.name}</TableCell>
                <TableCell align="right">{`${symbol} ${Number(income.amount).toFixed(2)} ${income.currency}`}</TableCell>
                <TableCell align="right">
                  <Box>
                    <IconButton size="small" aria-label="edit" onClick={() => onEdit && onEdit(income)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" aria-label="delete" onClick={() => {
                      if (!onDelete) return;
                      if (window.confirm('Delete this income?')) {
                        onDelete(income.id);
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

export default IncomeList;