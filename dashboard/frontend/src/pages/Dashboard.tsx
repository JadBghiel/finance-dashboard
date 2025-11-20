import React, { useEffect, useState, useMemo } from 'react';
import {
  Typography, Box, FormControl, InputLabel, Select, MenuItem, Button,
  Grid, Card, CardContent, CircularProgress
} from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { getBaseCurrency, updateBaseCurrency } from '../services/settingsService';
import { getAccounts, getAccountBalance } from '../services/accountService';
import { getIncomes } from '../services/incomeService';
import { getExpenses } from '../services/expenseService';
import Charts from '../components/Dashboard/Charts';
import { getColorForKey } from '../constants/colors';

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

// emojis per account name
const ACCOUNT_EMOJI: Record<string, string> = {
  Main: '🏦',
  Savings: '💰',
  'High Yield Savings Accounts': '📈',
  Joint: '👥',
  'Emergency Fund': '🛟',
  'Christmas Club': '🎄',
  'Vacation Club': '🏖️',
  'Wedding Fund': '💍',
  Pension: '🧾',
  'Health Savings': '🏥',
  'New Car': '🚗',
  Parents: '👨‍👩‍👧',
};

function truncate(str: string | null | undefined, n = 50) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n - 1) + '…' : str;
}

function Dashboard() {
  const [baseCurrency, setBaseCurrency] = useState<string>('USD');
  const [pending, setPending] = useState(false);

  const [accounts, setAccounts] = useState<any[]>([]);
  const [balances, setBalances] = useState<Record<number, any>>({});
  const [loadingBalances, setLoadingBalances] = useState(false);

  const [incomes, setIncomes] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);

  const [timeframe, setTimeframe] = useState<'day'|'week'|'month'|'quarter'|'year'>('month');
  const [accountFilter, setAccountFilter] = useState<number| 'all' >('all');

  useEffect(() => {
    (async () => {
      try {
        const current = await getBaseCurrency();
        setBaseCurrency(current);
      } catch (e) {}
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

  useEffect(() => {
    fetchTransactions();
  }, [timeframe, accountFilter]);

  const fetchTransactions = async () => {
    setLoadingTx(true);
    try {
      const [incs, exps] = await Promise.all([getIncomes(), getExpenses()]);
      setIncomes(incs);
      setExpenses(exps);
    } catch (e) {
      setIncomes([]);
      setExpenses([]);
    } finally {
      setLoadingTx(false);
    }
  };

  const save = async () => {
    setPending(true);
    try {
      await updateBaseCurrency(baseCurrency);
      const accs = await getAccounts();
      setAccounts(accs);
    } finally {
      setPending(false);
    }
  };

  const totalBalance = useMemo(() => {
    let sum = 0;
    for (const a of accounts) {
      const b = balances[a.id];
      if (b && b.total_converted !== null) sum += Number(b.total_converted);
    }
    return sum;
  }, [accounts, balances]);

  const recentTxForAccount = (accountId: number, limit = 5) => {
    const inc = (incomes || []).filter((t:any) => Number(t.account_id) === Number(accountId)).map((t:any) => ({...t, type: 'income'}));
    const exp = (expenses || []).filter((t:any) => Number(t.account_id) === Number(accountId)).map((t:any) => ({...t, type: 'expense'}));
    const merged = [...inc, ...exp].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return merged.slice(0, limit);
  };

  return (
    <>
      {/* header: title left, controls right */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h4">Dashboard</Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel id="timeframe-label">Timeframe</InputLabel>
            <Select labelId="timeframe-label" value={timeframe} label="Timeframe" onChange={(e) => setTimeframe(e.target.value as any)}>
              <MenuItem value="day">Day</MenuItem>
              <MenuItem value="week">Week</MenuItem>
              <MenuItem value="month">Month</MenuItem>
              <MenuItem value="quarter">Quarter</MenuItem>
              <MenuItem value="year">Year</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="account-filter-label">Filter account</InputLabel>
            <Select labelId="account-filter-label" value={accountFilter} label="Filter account" onChange={(e) => setAccountFilter(e.target.value as any)}>
              <MenuItem value="all">All accounts</MenuItem>
              {accounts.map((a) => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="base-currency-label">Base currency</InputLabel>
            <Select
              labelId="base-currency-label"
              value={baseCurrency}
              label="Base currency"
              onChange={(e) => setBaseCurrency(String(e.target.value))}
            >
              {currencyOptions.map((c) => <MenuItem key={c.code} value={c.code}>{c.code}</MenuItem>)}
            </Select>
          </FormControl>

          <Button variant="contained" onClick={save} disabled={pending}>Save</Button>
        </Box>
      </Box>

      {/* charts area */}
      {loadingTx ? <CircularProgress /> : (
        <Charts
          incomes={incomes}
          expenses={expenses}
          timeframe={timeframe}
          accountFilter={accountFilter}
          getColorForKey={getColorForKey}
        />
      )}

      {/* total balance */}
      <Box sx={{ mt: 3, mb: 2 }}>
        <Card>
          <CardContent>
            <Typography variant="h6">TOTAL BALANCE</Typography>
            <Typography variant="h4" sx={{ mt: 1 }}>{accounts.length ? `${baseCurrency} ${totalBalance.toFixed(2)}` : 'Loading...'}</Typography>
            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>Sum of all accounts (converted to base currency where available)</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* net liquidation value */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <AccountBalanceWalletIcon fontSize="large" />
        <Typography variant="h6">Net liquidation value (cash)</Typography>
      </Box>

      {loadingBalances ? <CircularProgress /> : (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {accounts.map((a) => {
            const b = balances[a.id];
            const emoji = ACCOUNT_EMOJI[a.name] ?? '🏷️';
            return (
              <Grid item key={a.id} xs={12} md={6} lg={4}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', fontSize: '1.05rem' }}>{emoji} {a.name}</Typography>
                        <Typography variant="caption">Account #{a.id}</Typography>
                      </Box>
                      <Box>
                        {b ? (
                          b.total_converted !== null ? (
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{`${Number(b.total_converted).toFixed(2)} ${b.base_currency}`}</Typography>
                          ) : (
                            <Typography variant="body2">Conversion unavailable</Typography>
                          )
                        ) : (
                          <Typography variant="body2">No data</Typography>
                        )}
                      </Box>
                    </Box>

                    <Box sx={{ mt: 2 }}>
                      <Box>
                        <Typography variant="subtitle2">Recent transactions</Typography>
                        {recentTxForAccount(a.id, 5).length ? (
                          recentTxForAccount(a.id, 5).map((t:any) => (
                            <Box key={`${t.type}-${t.id}`} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                              <Typography variant="body2">{truncate(t.description, 45)}</Typography>
                              <Typography variant="body2">{`${Number(t.amount).toFixed(2)} ${t.currency}`}</Typography>
                            </Box>
                          ))
                        ) : (
                          <Typography variant="body2">No recent transactions</Typography>
                        )}
                      </Box>
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