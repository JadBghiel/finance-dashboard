import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, TextField, Card, CardContent, Grid, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { getAccounts, createAccount } from '../services/accountService';
import { Account } from '../types';

function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');

  const fetch = async () => {
    setLoading(true);
    try {
      const accs = await getAccounts();
      setAccounts(accs);
    } catch (_) {
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const handleAdd = async () => {
    if (!name.trim()) return;
    await createAccount({ name: name.trim() });
    setName('');
    setOpen(false);
    fetch();
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Accounts</Typography>
        <Button variant="contained" onClick={() => setOpen(true)}>Add Account</Button>
      </Box>

      <Grid container spacing={2}>
        {accounts.map((a) => (
          <Grid item xs={12} sm={6} md={4} key={a.id}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{a.name}</Typography>
                <Typography variant="caption">Account #{a.id}</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>Note: update/delete endpoints not available in backend</Typography> {/* EDIT: inform user */}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Add Account</DialogTitle>
        <DialogContent>
          <TextField autoFocus label="Account name" fullWidth value={name} onChange={(e) => setName(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd} disabled={!name.trim()}>Add</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default Accounts;
