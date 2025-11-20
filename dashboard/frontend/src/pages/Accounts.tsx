import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, TextField, Card, CardContent, Grid, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getAccounts, createAccount, updateAccount, deleteAccount } from '../services/accountService';
import { Account } from '../types';

// expanded emoji palette (~100 items)
const EMOJI_OPTIONS = [
  '🏦','💰','📈','👥','🛟','🎄','🏖️','💍','🧾','🏥','🚗','👨‍👩‍👧',
  '🏠','🍔','🛒','💳','📱','💡','🚕','✈️','🎮','🎓','🛠️','💼',
  '🎁','🧳','🍽️','☕','🏋️','🎉','🧸','🧯','🛍️','🧾','🔑','🧾',
  '🕶️','🛏️','🧴','🍺','🍷','🍸','🍩','🍪','🍕','🍝','🍳','🥗',
  '🍎','🍌','🍓','🥑','🌮','🌯','🍔','🥪','🥘','🍜','🍣','🍤',
  '🎂','🧁','🍰','🍫','🍬','🍭','🍿','🥤','☕','🍼','🥛','🍯',
  '🚲','🚗','🏍️','🛵','🚚','🚛','⛽','🚉','✈️','🛳️','⛵','🏖️',
  '🏕️','🏠','🏡','🏢','🏦','🏥','🏫','🛒','🏛️','🧭','🧱','🔨',
  '🧰','🧲','⚙️','🔧','🪛','🔩','💼','📦','🧾','📅','🕰️','📈',
  '📉','💹','💸','💵','💶','💷','💴','🪙','🔒','🔓','🧾','📌','📍'
];

function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState<string | undefined>(undefined);

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

  const openNew = () => { setEditing(null); setName(''); setEmoji(undefined); setOpen(true); };
  const openEdit = (a: Account) => { setEditing(a); setName(a.name); setEmoji(a.emoji); setOpen(true); };

  const handleSave = async () => {
    if (!name.trim()) return;
    if (editing) {
      await updateAccount(editing.id, { name: name.trim(), emoji });
    } else {
      await createAccount({ name: name.trim(), emoji });
    }
    setOpen(false);
    fetch();
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this account?')) return;
    await deleteAccount(id);
    fetch();
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4">Accounts</Typography>
        <Button variant="contained" onClick={openNew}>Add Account</Button>
      </Box>

      <Grid container spacing={2}>
        {accounts.map((a) => (
          <Grid item xs={12} sm={6} md={4} key={a.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{a.emoji ?? '🏷️'} {a.name}</Typography>
                    <Typography variant="caption">Account #{a.id}</Typography>
                  </Box>
                  <Box>
                    <IconButton size="small" onClick={() => openEdit(a)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => handleDelete(a.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </Box>
                </Box>
                <Typography variant="body2" sx={{ mt: 1 }}>Note: update/delete endpoints may require backend support</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>{editing ? 'Edit Account' : 'Add Account'}</DialogTitle>
        <DialogContent>
          <TextField autoFocus label="Account name" fullWidth value={name} onChange={(e) => setName(e.target.value)} sx={{ mt: 1 }} />
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Choose an emoji</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 1, maxHeight: 240, overflow: 'auto', p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
              <Box
                onClick={() => setEmoji(undefined)}
                sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', borderRadius: 1, p: 0.5,
                  border: emoji === undefined ? '2px solid' : '1px solid',
                  borderColor: emoji === undefined ? 'primary.main' : 'transparent'
                }}
                title="No emoji"
              >
                <Typography variant="body2">—</Typography>
              </Box>
              {EMOJI_OPTIONS.map((em) => (
                <Box
                  key={em}
                  onClick={() => setEmoji(em)}
                  sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', fontSize: 20, borderRadius: 1, p: 0.5,
                    border: emoji === em ? '2px solid' : '1px solid',
                    borderColor: emoji === em ? 'primary.main' : 'transparent'
                  }}
                  title={em}
                >
                  <span>{em}</span>
                </Box>
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!name.trim()}>{editing ? 'Save' : 'Add'}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default Accounts;
