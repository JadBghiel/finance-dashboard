import React from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography
} from '@mui/material';
import { Income } from '../../types';

interface IncomeListProps {
  incomes: Income[];
}

function IncomeList({ incomes }: IncomeListProps) {
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
            <TableCell align="right">Amount</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {incomes.map((income) => (
            <TableRow key={income.id}>
              <TableCell>{new Date(income.date).toLocaleDateString()}</TableCell>
              <TableCell>{income.description}</TableCell>
              <TableCell>{income.category.name}</TableCell>
              <TableCell align="right">{`${income.amount} ${income.currency}`}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default IncomeList;