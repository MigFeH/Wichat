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
  useTheme,
  Menu,
  MenuItem,
  Collapse
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import {
  Home,
  SportsEsports,
  BarChart,
  Leaderboard,
  ExitToApp,
  AccountCircle,
  Menu as MenuIcon,
  ExpandLess,
  ExpandMore,
  Close
} from '@mui/icons-material';
import UIThemeSwitch from './UIThemeSwitch.jsx';

const Navbar = ({ toggleTheme }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  const isMobile = useMediaQuery(theme.breakpoints.down('md')); // md == medium == 960px
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [gamesMenuOpen, setGamesMenuOpen] = useState(false);
  const toggleGamesMenu = () => setGamesMenuOpen((prev) => !prev);

  const [gamesMenuAnchorEl, setGamesMenuAnchorEl] = useState(null);
  const isGamesMenuOpen = Boolean(gamesMenuAnchorEl);

  const handleGamesMenuOpen = (event) => {
    setGamesMenuAnchorEl(event.currentTarget);
  };

  const handleGamesMenuClose = () => {
    setGamesMenuAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const navItems = [
    { text: 'Menu', icon: <Home />, to: '/menu' },
    { 
      text: 'Games', 
      icon: <SportsEsports />, 
      subItems: [
        { text: 'Non Timed Game', to: '/game' },
        { text: 'Timed Game', to: '/timedGame' }
      ] 
    },
    { text: 'Statistics', icon: <BarChart />, to: '/stadistics' },
    { text: 'Ranking', icon: <Leaderboard />, to: '/ranking' },
    { text: 'Profile', icon: <AccountCircle />, to: '/profile' }
  ];

  const NavButtonItem = ({ item }) => {
    if (item.subItems) { // Para los desplegables (Ej: Games)
      return (
        <Box>
        <Button
          color="inherit"
          startIcon={item.icon}
          onClick={handleGamesMenuOpen}
          endIcon={isGamesMenuOpen ? <ExpandLess /> : <ExpandMore />}
          className="nav-button"
        >
          {item.text}
        </Button>

        <Menu
          anchorEl={gamesMenuAnchorEl}
          open={isGamesMenuOpen}
          onClose={handleGamesMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
          {item.subItems.map((subItem) => (
            <MenuItem
              key={subItem.to}
              onClick={() => {
                navigate(subItem.to);
                handleGamesMenuClose();
              }}
            >
              {subItem.text}
            </MenuItem>
          ))}
        </Menu>
      </Box>

      );
    }
  
    return (
      <Button
        color="inherit"
        component={Link}
        to={item.to}
        startIcon={item.icon}
        className="nav-button"
      >
        {item.text}
      </Button>
    );
  };  

  const DrawerItem = ({ item }) => {
    if (item.subItems) {
      return (
        <>
          <ListItem button onClick={toggleGamesMenu}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
            {gamesMenuOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItem>
          <Collapse in={gamesMenuOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.subItems.map((subItem) => (
                <ListItem button component={Link} to={subItem.to} sx={{ pl: 4 }} key={subItem.to}>
                  <ListItemText primary={subItem.text} />
                </ListItem>
              ))}
            </List>
          </Collapse>
        </>
      );
    }
  
    return (
      <ListItem button component={Link} to={item.to}>
        <ListItemIcon>{item.icon}</ListItemIcon>
        <ListItemText primary={item.text} />
      </ListItem>
    );
  };

  const renderThemeButtons = () => (
    <UIThemeSwitch
      sx={{ m: 1 }}
      onClick={toggleTheme}
      checked={theme.palette.mode === 'dark'}
    />
  );

  const renderNavButtons = () => (
    <Box className="nav-buttons-container">
      {navItems.map((item) => (
        <NavButtonItem key={item.text} item={item} />
      ))}
    </Box>
  );
  
  const renderDrawerContent = () => (
    <Box sx={{ width: 250 }}>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
        <IconButton onClick={() => setDrawerOpen(false)}>
          <Close />
        </IconButton>
      </Box>
      <List>
        {navItems.map((item) => (
          <DrawerItem key={item.text} item={item} />
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
        {isMobile ? ( // Navbar para movil/tablet
          <>
            <IconButton edge="start" color="inherit" onClick={() => setDrawerOpen(true)} aria-label="hamburger-menu">
              <MenuIcon />
            </IconButton>
            <Drawer
              anchor="left"
              open={drawerOpen}
              onClose={() => {}}
              ModalProps={{
                keepMounted: true,
                disableEscapeKeyDown: true,
                hideBackdrop: false,
              }}
            >
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