import React, { useMemo } from 'react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Box, Grid, Typography, Card, CardContent } from '@mui/material';
import { getColorForKey } from '../../constants/colors';

/**
 * charts implementation VIZ
 * for now:
 *  - incomes, expenses: arrays from API (with category.account info)
 *  - timeframe: 'day', 'week', 'month', 'quarter', 'year'
 *  - accountFilter: account id or 'all'
 */
export default function Charts({ incomes, expenses, timeframe, accountFilter, getColorForKey: _getColor }: any) {
  // helpers
  const filterByAccount = (list: any[]) => {
    if (accountFilter === 'all') return list;
    return list.filter((t) => Number(t.account_id) === Number(accountFilter));
  };

  const monthSlice = (list: any[]) => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    return list.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === y && d.getMonth() === m;
    });
  };

  const categorySums = (list: any[]) => {
    const map: Record<string, number> = {};
    for (const t of list) {
      const key = `${t.category_id}:${t.category?.name ?? 'Unknown'}`;
      const v = Number(t.amount);
      map[key] = (map[key] || 0) + v;
    }
    return Object.entries(map).map(([k, v]) => {
      const [id, name] = k.split(':');
      return { id, name, value: v };
    });
  };

  const incomesFiltered = useMemo(() => filterByAccount(incomes || []), [incomes, accountFilter]);
  const expensesFiltered = useMemo(() => filterByAccount(expenses || []), [expenses, accountFilter]);

  const incomesThisMonth = useMemo(() => monthSlice(incomesFiltered), [incomesFiltered]);
  const expensesThisMonth = useMemo(() => monthSlice(expensesFiltered), [expensesFiltered]);

  const incomeByCategory = useMemo(() => categorySums(incomesThisMonth), [incomesThisMonth]);
  const expenseByCategory = useMemo(() => categorySums(expensesThisMonth), [expensesThisMonth]);

  const totalEarned = incomeByCategory.reduce((s, it) => s + it.value, 0);
  const totalSpent = expenseByCategory.reduce((s, it) => s + it.value, 0);

  // timeframe aggregation for trends/wealth, buckets per timeframe label ig
  const buildTimeBuckets = (list: any[]) => {
    const now = new Date();
    const buckets: Record<string, number> = {};

    const add = (d: Date) => {
      const key = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
      buckets[key] = 0;
      return key;
    };

    if (timeframe === 'day') {
      // last 24h by date (USE DATE ONKY)
      for (let i = 0; i < 7; i++) { // show last 7 days for small chart
        const d = new Date(); d.setDate(now.getDate() - (6 - i));
        add(d);
      }
    } else if (timeframe === 'week') {
      // last 8 weeks
      for (let i = 0; i < 8; i++) {
        const d = new Date(); d.setDate(now.getDate() - (7 * (7 - i)));
        add(d);
      }
    } else if (timeframe === 'month') {
      // last 12 months
      for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
        add(d);
      }
    } else if (timeframe === 'quarter') {
      // last 4 quarters (4 months each for simplicity, using month start)
      for (let i = 0; i < 4; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - (3 * (3 - i)), 1);
        add(d);
      }
    } else { // year
      for (let i = 0; i < 12; i++) {
        const d = new Date(now.getFullYear() - (11 - i), 0, 1);
        add(d);
      }
    }

    // accumulate values
    for (const t of list) {
      const d = new Date(t.date);
      // find nearest bucket: for month/year use month key, else date
      let key = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
      if (!(key in buckets)) {
        // fallback: find closest bucket by comparing time
        const keys = Object.keys(buckets);
        let closest = keys[0];
        let minDiff = Math.abs(new Date(keys[0]).getTime() - d.getTime());
        for (const k of keys) {
          const kd = new Date(k);
          const diff = Math.abs(kd.getTime() - d.getTime());
          if (diff < minDiff) { minDiff = diff; closest = k; }
        }
        key = closest;
      }
      buckets[key] = (buckets[key] || 0) + Number(t.amount);
    }

    return Object.entries(buckets).map(([k, v]) => ({ label: k, value: v }));
  };

  const incomeTrend = useMemo(() => buildTimeBuckets(incomesFiltered), [incomesFiltered, timeframe]);
  const expenseTrend = useMemo(() => buildTimeBuckets(expensesFiltered), [expensesFiltered, timeframe]);

  // wealth progression: net per timeframe bucket (income - expense)
  const allTx = useMemo(() => {
    const arr = [...(incomesFiltered || []).map((i:any) => ({ ...i, _t: 'inc' })), ...(expensesFiltered || []).map((e:any) => ({ ...e, _t: 'exp' }))];
    return arr;
  }, [incomesFiltered, expensesFiltered]);

  const wealthBuckets = useMemo(() => {
    const inc = buildTimeBuckets(incomesFiltered);
    const exp = buildTimeBuckets(expensesFiltered);
    const map: Record<string, any> = {};
    for (const it of inc) map[it.label] = (map[it.label] || 0) + it.value;
    for (const it of exp) map[it.label] = (map[it.label] || 0) - it.value;
    return Object.entries(map).map(([k, v]) => ({ label: k, value: v }));
  }, [incomesFiltered, expensesFiltered, timeframe]);

  const colorFor = (keyPrefix: string, id: string) => {
    return _getColor ? _getColor(`${keyPrefix}:${id}`) : getColorForKey(`${keyPrefix}:${id}`);
  };

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">EARNED</Typography>
              <Typography variant="subtitle2">You earned {totalEarned.toFixed(2)} — here’s how:</Typography>
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={incomeByCategory} dataKey="value" nameKey="name" outerRadius={90} label>
                      {incomeByCategory.map((entry, idx) => (
                        <Cell key={entry.id} fill={colorFor('cat', entry.id)} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">SPENT</Typography>
              <Typography variant="subtitle2">You spent {totalSpent.toFixed(2)} — here’s how:</Typography>
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expenseByCategory} dataKey="value" nameKey="name" outerRadius={90} label>
                      {expenseByCategory.map((entry, idx) => (
                        <Cell key={entry.id} fill={colorFor('cat', entry.id)} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6">Wealth progression</Typography>
              <Typography variant="subtitle2">Net value over selected timeframe</Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={wealthBuckets}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#1976d2" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6">Income trend</Typography>
              <Box sx={{ height: 140 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={incomeTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#4caf50" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>

              <Typography variant="h6" sx={{ mt: 2 }}>Expense trend</Typography>
              <Box sx={{ height: 140 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expenseTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#f44336" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

      </Grid>
    </Box>
  );
}