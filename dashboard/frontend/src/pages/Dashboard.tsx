import React, { useEffect, useState } from 'react';
import { Typography, Box, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';
import { getBaseCurrency, updateBaseCurrency } from '../services/settingsService';

const currencyOptions = [
  { code: 'EUR', label: 'Euro' },
  { code: 'USD', label: 'US Dollar' },
  { code: 'JPY', label: 'Japanese Yen' },
  { code: 'CAD', label: 'Canadian Dollar' },
  { code: 'MAD', label: 'Moroccan Dirham' },
  { code: 'AED', label: 'Emirati Dirham' },
  { code: 'AUD', label: 'Australian Dollar' },
  { code: 'CHF', label: 'Swiss Franc' },
  { code: 'CNY', label: 'Chinese Renminbi' },
];

function Dashboard() {
  const [baseCurrency, setBaseCurrency] = useState<string>('USD');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const current = await getBaseCurrency();
        setBaseCurrency(current);
      } catch (e) {
        // ignore if backend not available
      }
    })();
  }, []);

  const save = async () => {
    setPending(true);
    try {
      await updateBaseCurrency(baseCurrency);
      // maybe show feedback later
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <Typography variant="h4" sx={{ mb: 2 }}>Dashboard</Typography>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="base-currency-label">Base currency</InputLabel>
          <Select
            labelId="base-currency-label"
            value={baseCurrency}
            label="Base currency"
            onChange={(e) => setBaseCurrency(String(e.target.value))}
          >
            {currencyOptions.map((c) => <MenuItem key={c.code} value={c.code}>{c.code} — {c.label}</MenuItem>)}
          </Select>
        </FormControl>
        <Button variant="contained" onClick={save} disabled={pending}>Save base currency</Button>
      </Box>
    </>
  );
}

export default Dashboard;