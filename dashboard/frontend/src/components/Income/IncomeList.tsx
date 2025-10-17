import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Income } from '../../types';

interface IncomeListProps {
  incomes: Income[];
  onEdit: (income: Income) => void;
  onDelete: (id: number) => void;
}

function IncomeList({ incomes, onEdit, onDelete }: IncomeListProps) {
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
            <TableCell align="center">Actions</TableCell>
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
              <TableCell align="center">
                <IconButton onClick={() => onEdit(income)} size="small">
                  <EditIcon />
                </IconButton>
                <IconButton onClick={() => onDelete(income.id)} size="small">
                  <DeleteIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default IncomeList;