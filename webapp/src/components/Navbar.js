// src/components/Navbar.js
import React from 'react';
import { AppBar, Toolbar, Button, Box } from '@mui/material';
import { Link } from 'react-router-dom';
import { Home, SportsEsports, BarChart, Leaderboard, ExitToApp } from '@mui/icons-material';

const Navbar = () => {
  return (
    <AppBar position="static" sx={{ backgroundColor: '#1976d2' }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        {/* Contenedor de los botones de navegación */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button color="inherit" component={Link} to="/menu" startIcon={<Home />}>
            Menu
          </Button>
          <Button color="inherit" component={Link} to="/game" startIcon={<SportsEsports />}>
            Game
          </Button>
          <Button color="inherit" component={Link} to="/stadistics" startIcon={<BarChart />}>
            Statistics
          </Button>
          <Button color="inherit" component={Link} to="/ranking" startIcon={<Leaderboard />}>
            Ranking
          </Button>
        </Box>

        {/* Botón de Logout alineado a la derecha */}
        <Button color="inherit" component={Link} to="/login" startIcon={<ExitToApp />}>
          Logout
        </Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
