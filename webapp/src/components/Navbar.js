// src/components/Navbar.js
import React from 'react';
import { AppBar, Toolbar, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        <Button color="inherit" component={Link} to="/menu">Menu</Button>
        <Button color="inherit" component={Link} to="/game">Game</Button>
        <Button color="inherit" component={Link} to="/stadistics">Statistics</Button>
        <Button color="inherit" component={Link} to="/ranking">Ranking</Button>
        <Button color="inherit" component={Link} to="/login">Logout</Button>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
