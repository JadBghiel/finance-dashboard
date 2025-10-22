import React, { useEffect, useState } from 'react';
import { Typography, Box, FormControl, InputLabel, Select, MenuItem, Button, Grid, Card, CardContent, CircularProgress } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { getBaseCurrency, updateBaseCurrency } from '../services/settingsService';
import { getAccounts, getAccountBalance } from '../services/accountService';

const currencyOptions = [
  { code: 'EUR', label: 'Euro' },
  { code: 'USD', label: 'US Dollar' },
  { code: 'GBP', label: 'British Pound' },
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

  const [accounts, setAccounts] = useState<any[]>([]);
  const [balances, setBalances] = useState<Record<number, any>>({});
  const [loadingBalances, setLoadingBalances] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const current = await getBaseCurrency();
        setBaseCurrency(current);
      } catch (e) {
        // ignore if backend not available
      }
    })();

    (async () => {
      try {
        const accs = await getAccounts();
        setAccounts(accs);
      } catch (e) {
        setAccounts([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (accounts.length === 0) return;
    (async () => {
      setLoadingBalances(true);
      const map: Record<number, any> = {};
      for (const a of accounts) {
        try {
          const b = await getAccountBalance(a.id);
          map[a.id] = b;
        } catch (e) {
          map[a.id] = null;
        }
      }
      setBalances(map);
      setLoadingBalances(false);
    })();
  }, [accounts]);

  const save = async () => {
    setPending(true);
    try {
      await updateBaseCurrency(baseCurrency);
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <Typography variant="h4" sx={{ mb: 2 }}>Dashboard</Typography>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3 }}>
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

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <AccountBalanceWalletIcon fontSize="large" />
        <Typography variant="h6">Net liquidation value (cash)</Typography>
      </Box>

      {loadingBalances ? <CircularProgress /> : (
        <Grid container spacing={2}>
          {accounts.map((a) => {
            const b = balances[a.id];
            return (
              <Grid item key={a.id} xs={12} md={6} lg={4}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle1">{a.name}</Typography>
                        <Typography variant="caption">Account #{a.id}</Typography>
                      </Box>
                      <Box>
                        {b ? (
                          b.total_converted !== null ? (
                            <Typography variant="h6">{`${b.base_currency} ${Number(b.total_converted).toFixed(2)}`}</Typography>
                          ) : (
                            <Typography variant="body2">Conversion unavailable</Typography>
                          )
                        ) : (
                          <Typography variant="body2">No data</Typography>
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2">Breakdown</Typography>
                      {b && b.breakdown && b.breakdown.length ? (
                        b.breakdown.map((it: any) => (
                          <Box key={it.currency} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                            <Typography variant="body2">{it.currency}</Typography>
                            <Typography variant="body2">
                              {it.amount !== null ? `${it.amount} ${it.currency}` : '-'}
                              {it.converted_amount !== null ? ` → ${b.base_currency} ${Number(it.converted_amount).toFixed(2)}` : ''}
                            </Typography>
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2">No transactions</Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </>
  );
}

export default Dashboard;