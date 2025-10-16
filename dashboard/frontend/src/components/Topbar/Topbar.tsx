import React from 'react';
import { AppBar, Toolbar, Typography } from '@mui/material';

const drawerWidth = 240;

function Topbar() {
  return (
    <AppBar
      position="fixed"
      sx={{ width: `calc(100% - ${drawerWidth}px)`, ml: `${drawerWidth}px` }}
    >
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Personal Finance Dashboard
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

export default Topbar;