import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Button from '@mui/material/Button';
import { Routes, Route } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import Menu from './components/Menu';
import Game from './components/Game';
import Stadistics from './components/Stadistics';
import ProtectedRoute from './auth/ProtectedRoute';
import Ranking from './components/Ranking';
import Navbar from './components/Navbar';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const lightTheme = createTheme({
  palette: {
    mode: 'light',
  },
});

const App = () => {
  const [theme, setTheme] = useState(darkTheme);

  const toggleDarkTheme = () => {
    setTheme(darkTheme);
  };

  const toggleLightTheme = () => {
    setTheme(lightTheme);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Navbar />
      <main>
        <Button onClick={toggleDarkTheme}>Modo Oscuro</Button>
        <Button onClick={toggleLightTheme}>Modo Claro</Button>
        <div>Esta aplicación está usando el {theme.palette.mode} mode</div>
        <Routes>
          <Route path="/" element={<Login />} />
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
          <Route path="/ranking" element={
            <ProtectedRoute element={<Ranking />} />
          } />
        </Routes>
      </main>
    </ThemeProvider>
  );
};

export default App;
