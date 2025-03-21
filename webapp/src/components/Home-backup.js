import React, { useState } from 'react';
import { Container, Typography, Link } from '@mui/material';

import Register from './Register';
import Login from './Login';

import './Home.css';

function Home() {
  const [showLogin, setShowLogin] = useState(true);

  const handleToggleView = () => {
    setShowLogin(!showLogin);
  };

  return (
    <Container component="main" maxWidth="xs" sx={{minHeight: "100vh", width: "100%", padding: 0 }}>


    <img src="/Logotipo_Wechat_mini.png" alt="Logo" class="logo" />
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

    <div className="wave-container">
      <svg className="wave" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
        <path fill="#0099ff" fillOpacity="1" d="M0,160L34.3,160C68.6,160,137,160,206,181.3C274.3,203,343,245,411,234.7C480,224,549,160,617,165.3C685.7,171,754,245,823,245.3C891.4,245,960,171,1029,133.3C1097.1,96,1166,96,1234,90.7C1302.9,85,1371,75,1406,69.3L1440,64L1440,320L1405.7,320C1371.4,320,1303,320,1234,320C1165.7,320,1097,320,1029,320C960,320,891,320,823,320C754.3,320,686,320,617,320C548.6,320,480,320,411,320C342.9,320,274,320,206,320C137.1,320,69,320,34,320L0,320Z"></path>
      </svg>
    </div>


  </Container>

  );
}

export default Home;