import React from 'react';
import { Box, Toolbar } from '@mui/material';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import Topbar from './components/Topbar/Topbar';
import Dashboard from './pages/Dashboard';
import Income from './pages/Income';
import Expense from './pages/Expense';
import Accounts from './pages/Accounts';
import Categories from './pages/Categories';
import Investments from './pages/Investments';

function App() {
	return (
		<Box sx={{ display: "flex" }}>
			<Sidebar />
			<Topbar />
			<Box component="main" sx={{ flexGrow: 1, p: 3 }}>
				<Toolbar />
				<Routes>
					<Route path="/" element={<Dashboard />} />
					<Route path="/income" element={<Income />} />
					<Route path="/expense" element={<Expense />} />
					<Route path="/accounts" element={<Accounts />} />
					<Route path="/categories" element={<Categories />} />
					<Route path="/investments" element={<Investments />} />
				</Routes>
			</Box>
		</Box>
	);
}

export default App;