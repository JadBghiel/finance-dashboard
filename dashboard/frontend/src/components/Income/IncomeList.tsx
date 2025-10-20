import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, IconButton, Box
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Income } from '../../types';

interface IncomeListProps {
  incomes: Income[];
  onEdit?: (income: Income) => void;
  onDelete?: (id: number) => void;
}

function IncomeList({ incomes, onEdit, onDelete }: IncomeListProps) {
  if (incomes.length === 0) {
    return <Typography>No income transactions recorded yet.</Typography>;
  }

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Date</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Account</TableCell>
            <TableCell align="right">Amount</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {incomes.map((income) => (
            <TableRow key={income.id}>
              <TableCell>{new Date(income.date).toLocaleDateString()}</TableCell>
              <TableCell>{income.description}</TableCell>
              <TableCell>{income.category.name}</TableCell>
              <TableCell>{income.account.name}</TableCell>
              <TableCell align="right">{`${income.amount} ${income.currency}`}</TableCell>
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
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default IncomeList;