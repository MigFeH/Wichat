import React, { useState } from 'react';
import { Container, CssBaseline, Typography, Link } from '@mui/material';

import Register from './Register';
import Login from './Login';

function Home() {
  const [showLogin, setShowLogin] = useState(true);

  const handleToggleView = () => {
    setShowLogin(!showLogin);
  };

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <img src="/map-gif.gif" alt="Logo" />

      {showLogin ? <Login /> : <Register />}
      <Typography component="div" align="center" sx={{ marginTop: 2 }}>
        {showLogin ? (
          <Link name="gotoregister" component="button" variant="body2" onClick={handleToggleView}>
            Don't have an account? Register here.
          </Link>
        ) : (
          <Link component="button" variant="body2" onClick={handleToggleView}>
            Already have an account? Login here.
          </Link>
        )}
      </Typography>
    </Container>
  );
}

export default Home;