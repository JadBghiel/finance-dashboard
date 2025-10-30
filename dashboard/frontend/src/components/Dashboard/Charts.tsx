import React, { useMemo } from 'react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { Box, Grid, Typography, Card, CardContent } from '@mui/material';
import { getColorForKey } from '../../constants/colors';

/**
 * charts implementation VIZ
 * props: incomes, expenses, timeframe, accountFilter
 * improved bucket generation so charts update dynamically when timeframe/accountFilter change
 */
export default function Charts({ incomes, expenses, timeframe, accountFilter, getColorForKey: _getColor }: any) {
  const filterByAccount = (list: any[]) => {
    if (accountFilter === 'all') return list;
    return list.filter((t) => Number(t.account_id) === Number(accountFilter));
  };

  const filterByMonth = (list: any[]) => {
    const now = new Date();
    return list.filter((t) => {
      const d = new Date(t.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
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

  const incomesThisMonth = useMemo(() => filterByMonth(incomesFiltered), [incomesFiltered]);
  const expensesThisMonth = useMemo(() => filterByMonth(expensesFiltered), [expensesFiltered]);

  const incomeByCategory = useMemo(() => categorySums(incomesThisMonth), [incomesThisMonth]);
  const expenseByCategory = useMemo(() => categorySums(expensesThisMonth), [expensesThisMonth]);

  const totalEarned = incomeByCategory.reduce((s, it) => s + it.value, 0);
  const totalSpent = expenseByCategory.reduce((s, it) => s + it.value, 0);

  // build time buckets correctly based on timeframe
  const buildTimeBuckets = (list: any[]) => {
    const now = new Date();
    const buckets: string[] = [];
    const addLabel = (label: string) => { if (!buckets.includes(label)) buckets.push(label); };

    if (timeframe === 'day') {
      // last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(now.getDate() - i);
        addLabel(d.toISOString().slice(0,10)); // YYYY-MM-DD
      }
    } else if (timeframe === 'week') {
      // last 8 ISO weeks (label as YYYY-Www)
      const msPerWeek = 7 * 24 * 3600 * 1000;
      for (let i = 7; i >= 0; i--) {
        const d = new Date(now.getTime() - i * msPerWeek);
        const week = getWeekLabel(d);
        addLabel(week);
      }
    } else if (timeframe === 'month') {
      // last 12 months label YYYY-MM
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        addLabel(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
      }
    } else if (timeframe === 'quarter') {
      // last 4 months (quarter as month-window)
      for (let i = 3; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        addLabel(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
      }
    } else { // year
      // last 5 years label YYYY
      for (let i = 4; i >= 0; i--) {
        const d = new Date(now.getFullYear() - i, 0, 1);
        addLabel(String(d.getFullYear()));
      }
    }

    // initialize map
    const map: Record<string, number> = {};
    buckets.forEach((k) => map[k] = 0);

    // helper to find bucket for a date
    const findBucket = (d: Date) => {
      if (timeframe === 'day') return d.toISOString().slice(0,10);
      if (timeframe === 'week') return getWeekLabel(d);
      if (timeframe === 'month' || timeframe === 'quarter') return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      return String(d.getFullYear());
    };

    for (const t of list) {
      const d = new Date(t.date);
      const key = findBucket(d);
      if (key in map) map[key] += Number(t.amount);
      else {
        // find nearest bucket (fallback)
        let nearest = buckets[0];
        let minDiff = Math.abs(new Date(buckets[0]).getTime() - d.getTime());
        for (const k of buckets) {
          const kd = new Date(k);
          const diff = Math.abs(kd.getTime() - d.getTime());
          if (diff < minDiff) { minDiff = diff; nearest = k; }
        }
        map[nearest] += Number(t.amount);
      }
    }

    return Object.entries(map).map(([k,v]) => ({ label: k, value: v }));
  };

  const incomeTrend = useMemo(() => buildTimeBuckets(incomesFiltered), [incomesFiltered, timeframe, accountFilter]);
  const expenseTrend = useMemo(() => buildTimeBuckets(expensesFiltered), [expensesFiltered, timeframe, accountFilter]);

  // wealth progression: income - expense per bucket
  const wealthBuckets = useMemo(() => {
    const inc = buildTimeBuckets(incomesFiltered);
    const exp = buildTimeBuckets(expensesFiltered);
    const map: Record<string, number> = {};
    inc.forEach(it => map[it.label] = (map[it.label] || 0) + it.value);
    exp.forEach(it => map[it.label] = (map[it.label] || 0) - it.value);
    return Object.entries(map).map(([k,v]) => ({ label: k, value: v }));
  }, [incomesFiltered, expensesFiltered, timeframe, accountFilter]);

  const colorFor = (keyPrefix: string, id: string) => {
    return _getColor ? _getColor(`${keyPrefix}:${id}`) : getColorForKey(`${keyPrefix}:${id}`);
  };

  return (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6">💸 EARNED</Typography>
              <Typography variant="subtitle2">You earned {totalEarned.toFixed(2)} — here’s how:</Typography>
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={incomeByCategory} dataKey="value" nameKey="name" outerRadius={90} label>
                      {incomeByCategory.map((entry) => (
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
              <Typography variant="h6">🧾 SPENT</Typography>
              <Typography variant="subtitle2">You spent {totalSpent.toFixed(2)} — here’s how:</Typography>
              <Box sx={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expenseByCategory} dataKey="value" nameKey="name" outerRadius={90} label>
                      {expenseByCategory.map((entry) => (
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

// helper to produce ISO week label YYYY-Www
function getWeekLabel(d: Date) {
  // compute ISO week number
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2,'0')}`;
}