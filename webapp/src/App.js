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
      <ProtectedRoute path="/menu" component={Menu} /> {/* Ruta protegida */}
      <ProtectedRoute path="/game" component={Game} /> {/* Ruta protegida */}
      <ProtectedRoute path="/stadistics" component={Stadistics} /> {/* Ruta protegida */}
    </Routes>
  );
};

export default App;
