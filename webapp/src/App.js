import React from 'react';
import { Routes, Route } from 'react-router-dom';  

import Home from './components/Menu';
import Register from './components/Register';
import Login from './components/Login';
import Menu from './components/Menu';

const App = () => {
  return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/menu" element={<Menu />} />
      </Routes>
  );
};

export default App;
