import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Register from './components/Register';
import Login from './components/Login';
import Menu from './components/Menu';
import Game from './components/Game';
import Stadistics from './components/Stadistics';
import ProtectedRoute from './auth/ProtectedRoute';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/home" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/menu" element={
        <ProtectedRoute element={<Menu />} />
      } />
      <Route path="/game" element={
        <ProtectedRoute element={<Game />} />
      } />
      <Route path="/stadistics" element={
        <ProtectedRoute element={<Stadistics />} />
      } />
    </Routes>
  );
};

export default App;
