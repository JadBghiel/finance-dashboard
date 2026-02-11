import React, { useEffect, useState, useMemo } from 'react';
import {
  Box, Typography, Button, Grid, Card, CardContent, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, FormControl, InputLabel, Select, IconButton, Chip, CircularProgress, InputAdornment
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getInvestments, createInvestment, updateInvestment, deleteInvestment, refreshInvestmentPrice } from '../services/investmentService';
import { getWatchlist, createWatchlistItem, updateWatchlistItem, deleteWatchlistItem } from '../services/watchlistService';
import { getAccounts, createAccount } from '../services/accountService';
import { getPortfolioSummary, refreshAllPrices, searchSymbols } from '../services/portfolioService';
import { Investment as InvestmentType, WatchlistItem, PortfolioSummary, Account } from '../types';

const TYPE_OPTIONS = ['stock','etf','crypto','bond','mutual_fund'] as const;
const TYPE_EMOJIS: Record<string, string> = {
  stock: '📊', etf: '📈', crypto: '₿', bond: '🔗', mutual_fund: '💼'
};
const COLORS = ['#4caf50', '#f44336', '#2196f3', '#ff9800', '#9c27b0'];

function SummaryCard({ title, value, trend, color }: any) {
  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>{title}</Typography>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color }}>{value}</Typography>
          {trend && trend}
        </Box>
      </CardContent>
    </Card>
  );
}

function Investments() {
  const [investments, setInvestments] = useState<InvestmentType[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [investmentAccountId, setInvestmentAccountId] = useState<number | null>(null);

  const [posOpen, setPosOpen] = useState(false);
  const [editingPos, setEditingPos] = useState<InvestmentType | null>(null);
  const [watchOpen, setWatchOpen] = useState(false);
  const [editingWatch, setEditingWatch] = useState<WatchlistItem | null>(null);

  const [posForm, setPosForm] = useState<any>({
    symbol: '', name: '', type: 'stock', quantity: 0, purchase_price: 0, purchase_date: new Date().toISOString().slice(0,10),
    current_price: null, currency: 'USD', account_id: 0, notes: ''
  });
  const [watchForm, setWatchForm] = useState<any>({ symbol: '', name: '', type: 'stock', target_price: undefined, notes: '' });

  const [symbolOptsPos, setSymbolOptsPos] = useState<{symbol:string;category?:string}[]>([]);
  const [symbolOptsWatch, setSymbolOptsWatch] = useState<{symbol:string;category?:string}[]>([]);
  const [posSymbolInput, setPosSymbolInput] = useState('');
  const [watchSymbolInput, setWatchSymbolInput] = useState('');
  const [posSymbolValid, setPosSymbolValid] = useState(false);
  const [watchSymbolValid, setWatchSymbolValid] = useState(false);
  const [posSearchLoading, setPosSearchLoading] = useState(false);
  const [watchSearchLoading, setWatchSearchLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [inv, wl, accs, summ] = await Promise.all([
        getInvestments().catch(()=>[]),
        getWatchlist().catch(()=>[]),
        getAccounts().catch(()=>[]),
        getPortfolioSummary().catch(()=>null)
      ]);
      setInvestments(inv);
      setWatchlist(wl);
      setSummary(summ);

      // find or create "Investment" account
      let accountsList: Account[] = accs;
      let invAcc = accountsList.find(a => a.name === 'Investment');
      if (!invAcc) {
        try {
          invAcc = await createAccount({ name: 'Investment', emoji: '📈' });
          accountsList.push(invAcc);
        } catch (e) {
          invAcc = accountsList[0] || null;
        }
      }
      setAccounts(accountsList);
      setInvestmentAccountId(invAcc?.id ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // periodic price refresh - runs once a day
  useEffect(() => {
    const id = setInterval(async () => {
      try { await refreshAllPrices(); } catch (_) {}
      await load();
    }, 24 * 60 * 60 * 1000); // 24 hours
    return () => clearInterval(id);
  }, []);

  // manual refresh - bypasses cache to get fresh prices
  const handleRefreshPrices = async () => {
    setRefreshing(true);
    try {
      const result = await refreshAllPrices(true); // force=true bypasses cache
      await load();
      alert(`done! updated ${result.updated} positions.`);
    } catch (e: any) {
      alert(`couldn't refresh prices: ${e.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  const openNewPosition = () => {
    setEditingPos(null);
    setPosSymbolValid(false);
    setSymbolOptsPos([]); // reset options
    setPosSymbolInput(''); // clear input value
    setPosForm({
      symbol: '', name: '', type: 'stock', quantity: 0, purchase_price: 0, purchase_date: new Date().toISOString().slice(0,10),
      current_price: null, currency: 'USD', account_id: investmentAccountId || 0, notes: ''
    });
    setPosOpen(true);
  };

  const openEditPosition = (p: InvestmentType) => {
    setEditingPos(p);
    setPosForm({...p, purchase_date: p.purchase_date?.slice(0,10)});
    setPosSymbolInput(p.symbol || '');
    setPosSymbolValid(true);
    setSymbolOptsPos([{ symbol: p.symbol }]); // seed options to reflect current value
    setPosOpen(true);
  };

  const openNewWatch = () => {
    setEditingWatch(null);
    setWatchForm({ symbol: '', name: '', type: 'stock', target_price: undefined, notes: '' });
    setWatchSymbolInput('');
    setWatchSymbolValid(false);
    setSymbolOptsWatch([]);
    setWatchOpen(true);
  };

  const openEditWatch = (w: WatchlistItem) => {
    setEditingWatch(w);
    setWatchForm({...w});
    setWatchSymbolInput(w.symbol || '');
    setWatchSymbolValid(true);
    setSymbolOptsWatch([{ symbol: w.symbol }]); // seed options
    setWatchOpen(true);
  };

  const submitPosition = async () => {
    // basic validation
    if (!posForm.symbol || !posForm.symbol.trim()) {
      alert('need a symbol');
      return;
    }
    if (!posForm.type) {
      alert('pick a type');
      return;
    }
    if (Number(posForm.quantity) <= 0) {
      alert('quantity must be > 0');
      return;
    }
    if (Number(posForm.purchase_price) < 0) {
      alert('price can\'t be negative');
      return;
    }
    if (!posSymbolValid || !isSymbolAllowed(posForm.symbol, symbolOptsPos)) {
      alert('pick a ticker from the list');
      return;
    }

    const payload = {
      symbol: posForm.symbol.toUpperCase().trim(),
      name: posForm.name || posForm.symbol.toUpperCase().trim(),
      type: posForm.type,
      quantity: Number(posForm.quantity),
      purchase_price: Number(posForm.purchase_price),
      purchase_date: new Date(posForm.purchase_date).toISOString(),
      current_price: posForm.current_price ? Number(posForm.current_price) : null,
      currency: posForm.currency || 'USD',
      account_id: investmentAccountId || 1,  // always use Investment account
      notes: posForm.notes || ''
    };

    try {
      if (editingPos) {
        const r = await updateInvestment(editingPos.id, payload);
        // trigger immediate price refresh for this symbol
        try { await refreshInvestmentPrice(r.id); } catch (_) {}
      } else {
        const r = await createInvestment(payload as any);
        // trigger immediate price refresh for this symbol
        try { await refreshInvestmentPrice(r.id); } catch (_) {}
      }
      setPosOpen(false);
      await load();
    } catch (e: any) {
      alert(`couldn't save: ${e.response?.data?.detail || e.message}`);
    }
  };

  const submitWatch = async () => {
    if (!watchSymbolValid || !isSymbolAllowed(watchForm.symbol, symbolOptsWatch)) {
      alert('pick a ticker from the list');
      return;
    }
    const payload = {
      symbol: watchForm.symbol.toUpperCase(),
      name: watchForm.name || watchForm.symbol.toUpperCase(),
      type: watchForm.type,
      target_price: watchForm.target_price ? Number(watchForm.target_price) : null,
      notes: watchForm.notes || ''
    };
    if (editingWatch) {
      await updateWatchlistItem(editingWatch.id, payload);
    } else {
      await createWatchlistItem(payload);
    }
    setWatchOpen(false);
    await load();
  };

  const handleDeletePosition = async (id: number) => {
    if (!window.confirm('delete this position?')) return;
    await deleteInvestment(id);
    await load();
  };

  const handleDeleteWatch = async (id: number) => {
    if (!window.confirm('remove from watchlist?')) return;
    await deleteWatchlistItem(id);
    await load();
  };

  // allocation fallback if summary missing
  const allocationChartData = useMemo(() => {
    if (summary && summary.allocation && Object.keys(summary.allocation).length) {
      return Object.entries(summary.allocation).map(([type, value], i) => ({
        name: type, value: Number(value), color: COLORS[i % COLORS.length]
      }));
    }
    // fallback from investments
    const map: Record<string, number> = {};
    for (const p of investments) {
      const qty = Number(p.quantity) || 0;
      const price = (p.current_price !== null && p.current_price !== undefined) ? Number(p.current_price) : Number(p.purchase_price) || 0;
      const v = qty * price;
      const key = p.type || 'unknown';
      map[key] = (map[key] || 0) + v;
    }
    return Object.entries(map).map(([type, value], i) => ({ name: type, value, color: COLORS[i % COLORS.length] }));
  }, [summary, investments]);

  // Compute whether the form is valid for enabling the Save button
  const posFormValid = useMemo(() => {
    return (
      posForm.symbol && posForm.symbol.trim() &&
      posForm.type &&
      Number(posForm.quantity) > 0 &&
      Number(posForm.purchase_price) >= 0
    );
  }, [posForm]);

  // NEW: aggregate positions per ticker for each category (stock, etf, crypto, mutual_fund)
  const perCategoryTickerData = useMemo(() => {
    type GroupKey = 'stock' | 'etf' | 'crypto' | 'mutual_fund';
    type Item = { name: string; value: number };
    const groups: Record<GroupKey, Item[]> = {
      stock: [],
      etf: [],
      crypto: [],
      mutual_fund: [],
    };
    for (const p of investments) {
      const t = (p.type as GroupKey);
      if (!(t in groups)) continue;
      const qty = Number(p.quantity) || 0;
      const price = p.current_price !== null && p.current_price !== undefined
        ? Number(p.current_price)
        : Number(p.purchase_price) || 0;
      const v = qty * price;
      const arr = groups[t];
      const idx = arr.findIndex(e => e.name === p.symbol);
      if (idx >= 0) arr[idx].value += v;
      else arr.push({ name: p.symbol, value: v });
    }
    (Object.keys(groups) as GroupKey[]).forEach(k => groups[k].sort((a, b) => b.value - a.value));
    return groups;
  }, [investments]);

  // debounce CSV-based search for Position (filter by selected type if available)
  useEffect(() => {
    const q = posSymbolInput.trim();
    if (q.length < 2) { setSymbolOptsPos([]); return; }
    setPosSearchLoading(true);
    const t = setTimeout(async () => {
      try {
        const items = await searchSymbols(q, posForm.type && posForm.type !== 'bond' ? posForm.type : undefined);
        setSymbolOptsPos(items);
      } catch { setSymbolOptsPos([]); }
      finally { setPosSearchLoading(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [posSymbolInput, posForm.type]);

  // debounce CSV-based search for Watchlist
  useEffect(() => {
    const q = watchSymbolInput.trim();
    if (q.length < 2) { setSymbolOptsWatch([]); return; }
    setWatchSearchLoading(true);
    const t = setTimeout(async () => {
      try {
        const items = await searchSymbols(q);
        setSymbolOptsWatch(items);
      } catch { setSymbolOptsWatch([]); }
      finally { setWatchSearchLoading(false); }
    }, 250);
    return () => clearTimeout(t);
  }, [watchSymbolInput]);

  const isSymbolAllowed = (sym: string, opts: {symbol:string}[]) =>
    !!sym && opts.some(o => (o.symbol || '').toUpperCase() === sym.toUpperCase());

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">📈 investments</Typography>
          <Typography variant="body2">track your stocks, etfs, crypto, etc.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={refreshing ? <CircularProgress size={18} /> : <RefreshIcon />}
            onClick={handleRefreshPrices}
            disabled={refreshing}
          >
            {refreshing ? 'Refreshing...' : 'Refresh Prices'}
          </Button>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={openNewWatch}>Add to Watchlist</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openNewPosition}>Add Position</Button>
        </Box>
      </Box>

      {loading ? <CircularProgress /> : (
        <>
          {/* Summary Cards */}
          {summary && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={2.4}>
                <SummaryCard title="Total Value" value={`$${summary.total_value.toFixed(2)}`} color="#1976d2" />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <SummaryCard title="Total Invested" value={`$${summary.total_invested.toFixed(2)}`} color="#666" />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <SummaryCard title="Cash Position" value={`$${summary.cash_position.toFixed(2)}`} color="#4caf50" />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <SummaryCard title="Total P&L" value={`$${summary.total_pnl.toFixed(2)}`} color={summary.total_pnl >= 0 ? '#4caf50' : '#f44336'} trend={summary.total_pnl >= 0 ? <TrendingUpIcon sx={{ color: '#4caf50' }} /> : <TrendingDownIcon sx={{ color: '#f44336' }} />} />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <SummaryCard title="P&L %" value={`${summary.pnl_percentage.toFixed(2)}%`} color={summary.pnl_percentage >= 0 ? '#4caf50' : '#f44336'} trend={summary.pnl_percentage >= 0 ? <TrendingUpIcon sx={{ color: '#4caf50' }} /> : <TrendingDownIcon sx={{ color: '#f44336' }} />} />
              </Grid>
            </Grid>
          )}

          {/* Charts and Lists */}
          <Grid container spacing={2}>
            {/* Allocation Chart */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Portfolio Allocation</Typography>
                  {allocationChartData.length ? (
                    <Box sx={{ height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={allocationChartData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={100} label={(e: any) => `${e.name} ($${Number(e.value).toFixed(2)})`}>
                            {allocationChartData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                          </Pie>
                          <Tooltip formatter={(v:any)=>`$${Number(v).toFixed(2)}`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : <Typography>no investments yet</Typography>}
                </CardContent>
              </Card>
            </Grid>

            {/* Per-category pies: STOCKS, ETFs, CRYPTO, MUTUAL FUNDS */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Stocks by ticker</Typography>
                  {perCategoryTickerData.stock.length ? (
                    <Box sx={{ height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={perCategoryTickerData.stock}
                            dataKey="value"
                            nameKey="name"
                            outerRadius={100}
                            label={(e: any) => `${e.name} ($${Number(e.value).toFixed(2)})`}
                          >
                            {perCategoryTickerData.stock.map((entry: { name: string; value: number }, i: number) => (
                              <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: any) => `$${Number(v).toFixed(2)}`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : <Typography variant="body2">No stocks</Typography>}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6">ETFs by ticker</Typography>
                  {perCategoryTickerData.etf.length ? (
                    <Box sx={{ height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={perCategoryTickerData.etf}
                            dataKey="value"
                            nameKey="name"
                            outerRadius={100}
                            label={(e: any) => `${e.name} ($${Number(e.value).toFixed(2)})`}
                          >
                            {perCategoryTickerData.etf.map((entry: { name: string; value: number }, i: number) => (
                              <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: any) => `$${Number(v).toFixed(2)}`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : <Typography variant="body2">No ETFs</Typography>}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Crypto by ticker</Typography>
                  {perCategoryTickerData.crypto.length ? (
                    <Box sx={{ height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={perCategoryTickerData.crypto}
                            dataKey="value"
                            nameKey="name"
                            outerRadius={100}
                            label={(e: any) => `${e.name} ($${Number(e.value).toFixed(2)})`}
                          >
                            {perCategoryTickerData.crypto.map((entry: { name: string; value: number }, i: number) => (
                              <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: any) => `$${Number(v).toFixed(2)}`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : <Typography variant="body2">No crypto</Typography>}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Mutual funds by ticker</Typography>
                  {perCategoryTickerData.mutual_fund.length ? (
                    <Box sx={{ height: 260 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={perCategoryTickerData.mutual_fund}
                            dataKey="value"
                            nameKey="name"
                            outerRadius={100}
                            label={(e: any) => `${e.name} ($${Number(e.value).toFixed(2)})`}
                          >
                            {perCategoryTickerData.mutual_fund.map((entry: { name: string; value: number }, i: number) => (
                              <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: any) => `$${Number(v).toFixed(2)}`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : <Typography variant="body2">No mutual funds</Typography>}
                </CardContent>
              </Card>
            </Grid>

            {/* Watchlist */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6"><VisibilityIcon sx={{verticalAlign:'middle', mr:1}} />Watchlist</Typography>
                  {watchlist.length ? (
                    watchlist.map(w => (
                      <Box key={w.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Box>
                          <Typography variant="subtitle2">{TYPE_EMOJIS[w.type]} {w.symbol} — {w.name}</Typography>
                          <Typography variant="caption"><Chip size="small" label={w.type} /> {w.target_price ? `target: $${Number(w.target_price).toFixed(2)}` : ''}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size="small" onClick={() => openEditWatch(w)}><EditIcon fontSize="small" /></IconButton>
                          <IconButton size="small" onClick={() => handleDeleteWatch(w.id)}><DeleteIcon fontSize="small" /></IconButton>
                        </Box>
                      </Box>
                    ))
                  ) : <Typography>nothing in watchlist yet</Typography>}
                </CardContent>
              </Card>
            </Grid>

            {/* Positions */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6">Your Positions</Typography>
                  {investments.length ? (
                    <Grid container spacing={2}>
                      {investments.map(p => {
                        // parse numeric fields (backend returns Decimal as string)
                        const qty = Number(p.quantity) || 0;
                        const purchasePrice = Number(p.purchase_price) || 0;
                        const currPrice = p.current_price !== null && p.current_price !== undefined ? Number(p.current_price) : purchasePrice;
                        const value = currPrice * qty;
                        const invested = purchasePrice * qty;
                        const pnl = value - invested;
                        const pnlPct = invested > 0 ? (pnl / invested) * 100 : 0;
                        return (
                          <Grid key={p.id} item xs={12} md={6}>
                            <Box sx={{ border: '1px solid', borderColor: 'divider', p: 2, borderRadius: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <Box>
                                  <Typography variant="subtitle1">{TYPE_EMOJIS[p.type]} {p.symbol} — {p.name}</Typography>
                                  <Typography variant="caption"><Chip size="small" label={p.type} /> {p.account?.name || 'Investment'}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <IconButton size="small" onClick={() => openEditPosition(p)}><EditIcon fontSize="small" /></IconButton>
                                  <IconButton size="small" onClick={() => handleDeletePosition(p.id)}><DeleteIcon fontSize="small" /></IconButton>
                                </Box>
                              </Box>

                              <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                                <Box>
                                  <Typography variant="caption">Quantity</Typography>
                                  <Typography variant="body2">{qty.toFixed(2)}</Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption">Avg Purchase Price</Typography>
                                  <Typography variant="body2">${purchasePrice.toFixed(2)}</Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption">Current Price</Typography>
                                  <Typography variant="body2">${currPrice.toFixed(2)}</Typography>
                                </Box>
                                <Box>
                                  <Typography variant="caption">Current Value</Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>${value.toFixed(2)}</Typography>
                                </Box>
                              </Box>

                              <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">P&L: ${pnl.toFixed(2)}</Typography>
                                <Typography variant="body2" sx={{ color: pnl >= 0 ? '#4caf50' : '#f44336', fontWeight: 'bold' }}>
                                  {pnl >= 0 ? <TrendingUpIcon sx={{ verticalAlign: 'middle', fontSize: 16 }} /> : <TrendingDownIcon sx={{ verticalAlign: 'middle', fontSize: 16 }} />} {pnlPct.toFixed(2)}%
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                        );
                      })}
                    </Grid>
                  ) : <Typography>no positions yet - add your first one!</Typography>}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {/* Position Modal */}
      <Dialog open={posOpen} onClose={() => setPosOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingPos ? 'Edit Position' : 'Add Position'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 1 }}>
            <Autocomplete
              options={symbolOptsPos}
              filterOptions={(x) => x} // rely on server/CSV matching
              getOptionLabel={(o) => o?.symbol ?? ''}
              isOptionEqualToValue={(o, v) => (o?.symbol || '').toUpperCase() === (v?.symbol || '').toUpperCase()}
              freeSolo={false}
              disableClearable
              value={symbolOptsPos.find(o => o.symbol.toUpperCase() === (posForm.symbol || '').toUpperCase()) || undefined}
              inputValue={posSymbolInput}
              onInputChange={(_e: React.SyntheticEvent, v: string) => { setPosSymbolInput(v); setPosSymbolValid(false); }}
              onChange={(_e: React.SyntheticEvent, v: {symbol:string} | null) => {
                if (v?.symbol) {
                  setPosForm({ ...posForm, symbol: v.symbol.toUpperCase(), name: posForm.name || v.symbol.toUpperCase() });
                  setPosSymbolValid(true);
                } else {
                  setPosSymbolValid(false);
                }
              }}
              noOptionsText={posSymbolInput.trim().length < 2 ? 'type 2+ chars' : 'no match'}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Symbol"
                  required
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {posSearchLoading ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    )
                  }}
                />
              )}
            />
            <TextField label="Name" value={posForm.name} onChange={(e)=>setPosForm({...posForm, name: e.target.value})} />
            <FormControl required>
              <InputLabel>Type</InputLabel>
              <Select value={posForm.type} label="Type" onChange={(e)=>setPosForm({...posForm, type: e.target.value})}>
                {TYPE_OPTIONS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField type="number" label="Quantity" required value={posForm.quantity} onChange={(e)=>setPosForm({...posForm, quantity: Number(e.target.value)})} />
            <TextField
              type="number"
              label="Purchase Price"
              required
              value={posForm.purchase_price}
              onChange={(e)=>setPosForm({...posForm, purchase_price: Number(e.target.value)})}
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
            />
            <TextField
              type="date"
              label="Purchase Date"
              value={posForm.purchase_date}
              onChange={(e)=>setPosForm({...posForm, purchase_date: e.target.value})}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="number"
              label="Current Price (optional)"
              value={posForm.current_price ?? ''}
              onChange={(e)=>setPosForm({...posForm, current_price: e.target.value ? Number(e.target.value) : null})}
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
            />
            <TextField label="Currency" value={posForm.currency} onChange={(e)=>setPosForm({...posForm, currency: e.target.value})} />
            <TextField label="Notes" value={posForm.notes ?? ''} onChange={(e)=>setPosForm({...posForm, notes: e.target.value})} multiline rows={2} sx={{gridColumn:'1 / -1'}} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPosOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitPosition} disabled={!posFormValid || !posSymbolValid}>
            {editingPos ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Watchlist Modal */}
      <Dialog open={watchOpen} onClose={() => setWatchOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingWatch ? 'Edit Watchlist Item' : 'Add to Watchlist'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 1 }}>
            <Autocomplete
              options={symbolOptsWatch}
              filterOptions={(x) => x}
              getOptionLabel={(o) => o?.symbol ?? ''}
              isOptionEqualToValue={(o, v) => (o?.symbol || '').toUpperCase() === (v?.symbol || '').toUpperCase()}
              freeSolo={false}
              disableClearable
              value={symbolOptsWatch.find(o => o.symbol.toUpperCase() === (watchForm.symbol || '').toUpperCase()) || undefined}
              inputValue={watchSymbolInput}
              onInputChange={(_e: React.SyntheticEvent, v: string) => { setWatchSymbolInput(v); setWatchSymbolValid(false); }}
              onChange={(_e: React.SyntheticEvent, v: {symbol:string} | null) => {
                if (v?.symbol) {
                  setWatchForm({ ...watchForm, symbol: v.symbol.toUpperCase(), name: watchForm.name || v.symbol.toUpperCase() });
                  setWatchSymbolValid(true);
                } else {
                  setWatchSymbolValid(false);
                }
              }}
              noOptionsText={watchSymbolInput.trim().length < 2 ? 'type 2+ chars' : 'no match'}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Symbol"
                  required
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {watchSearchLoading ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    )
                  }}
                />
              )}
            />
            <TextField label="Name" value={watchForm.name} onChange={(e)=>setWatchForm({...watchForm, name: e.target.value})} />
            <FormControl>
              <InputLabel>Type</InputLabel>
              <Select value={watchForm.type} label="Type" onChange={(e)=>setWatchForm({...watchForm, type: e.target.value})}>
                {TYPE_OPTIONS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField
              type="number"
              label="Target Price (optional)"
              value={watchForm.target_price ?? ''}
              onChange={(e)=>setWatchForm({...watchForm, target_price: e.target.value ? Number(e.target.value) : null})}
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
            />
            <TextField label="Notes" value={watchForm.notes ?? ''} onChange={(e)=>setWatchForm({...watchForm, notes: e.target.value})} multiline rows={2} sx={{gridColumn:'1 / -1'}} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWatchOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitWatch} disabled={!watchSymbolValid}>
            {editingWatch ? 'Save' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Investments;
