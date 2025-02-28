import React from 'react';
import { Routes, Route } from 'react-router-dom';  
import { Box } from '@mui/material'; 

import Home from './components/Menu';
import Register from './components/Register';
import Login from './components/Login';
import Menu from './components/Menu';

const App = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/menu" element={<Menu />} />
      </Routes>
    </Box>
  );
};

export default App;
