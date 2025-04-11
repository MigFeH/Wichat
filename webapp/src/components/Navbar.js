import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Button,
  Box,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home,
  SportsEsports,
  BarChart,
  Leaderboard,
  ExitToApp,
  AccountCircle,
  Menu as MenuIcon
} from '@mui/icons-material';

const Navbar = ({ toggleDarkTheme, toggleLightTheme }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // md == medium == 960px
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const navItems = [
    { text: 'Menu', icon: <Home />, to: '/menu' },
    { text: 'Game', icon: <SportsEsports />, to: '/game' },
    { text: 'Statistics', icon: <BarChart />, to: '/stadistics' },
    { text: 'Ranking', icon: <Leaderboard />, to: '/ranking' },
    { text: 'Profile', icon: <AccountCircle />, to: '/profile' }
  ];

  const renderThemeButtons = () => (
    <>
      <Button
        onClick={toggleLightTheme}
        color="inherit"
        sx={{ fontSize: '1.5rem' }}
      >
        ☀️
      </Button>
      <Button
        onClick={toggleDarkTheme}
        color="inherit"
        sx={{ fontSize: '1.5rem' }}
      >
        🌙
      </Button>
    </>
  );

  const renderNavButtons = () => (
    <Box className="nav-buttons-container">
      {navItems.map(({ text, icon, to }) => (
        <Button
          key={text}
          color="inherit"
          component={Link}
          to={to}
          startIcon={icon}
          className="nav-button"
        >
          {text}
        </Button>
      ))}
    </Box>
  );

  const renderDrawerContent = () => ( // Navbar para móviles / tablet
    <Box className="drawer-content" aria-label="backdrop" onClick={() => setDrawerOpen(false)}>
      <List>
        {navItems.map(({ text, icon, to }) => (
          <ListItem button key={text} component={Link} to={to}>
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText primary={text} />
          </ListItem>
        ))}
        <ListItem button onClick={handleLogout}>
          <ListItemIcon><ExitToApp /></ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
        <ListItem>{renderThemeButtons()}</ListItem>
      </List>
    </Box>
  );

  return (
    <AppBar position="static" className="navbar">
      <Toolbar className="navbar-toolbar">
        {isMobile ? (
          <>
            <IconButton edge="start" color="inherit" onClick={() => setDrawerOpen(true)} aria-label="hamburger-menu">
              <MenuIcon />
            </IconButton>
            <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)} aria-label="drawer">
              {renderDrawerContent()}
            </Drawer>
          </>
        ) : ( // Navbar para escritorio
          <>
            {renderNavButtons()}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { md: 1, lg: 2 } }}> {/* md == medium == 960px || lg == large == 1280px */}
              {renderThemeButtons()}
              <Button
                color="inherit"
                onClick={handleLogout}
                startIcon={<ExitToApp />}
                className="nav-button"
              >
                Logout
              </Button>
            </Box>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;