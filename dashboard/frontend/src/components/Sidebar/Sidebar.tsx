import React from 'react';
import { Link } from 'react-router-dom';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBoxIcon from '@mui/icons-material/AccountBox'; // EDIT: added icon for Accounts
import CategoryIcon from '@mui/icons-material/Category'; // EDIT: added icon for Categories

const drawerWidth = 240;

const menuItems = [
  { text: '📊 Dashboard', icon: <DashboardIcon />, path: '/' },
  { text: '💸 Income', icon: <TrendingUpIcon />, path: '/income' },
  { text: '🧾 Expense', icon: <TrendingDownIcon />, path: '/expense' },
  { text: '🏧 Accounts', icon: <AccountBoxIcon />, path: '/accounts' },
  { text: '🏷️ Categories', icon: <CategoryIcon />, path: '/categories' },
];

function Sidebar() {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton component={Link} to={item.path}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}

export default Sidebar;