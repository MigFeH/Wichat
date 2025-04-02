import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper, Button } from '@mui/material';
import axios from 'axios';

const apiEndpoint = 'http://localhost:8001';

const Ranking = () => {
  const navigate = useNavigate();
  const [ranking, setRanking] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const response = await axios.get(`${apiEndpoint}/ranking`, {});

        if (response.data && Array.isArray(response.data)) {
          setRanking(response.data);
        } else {
          setError('Invalid data format');
        }
      } catch (error) {
        setError('Failed to fetch ranking data');
      }
    };
  
    fetchRanking();
  }, []);

  const handleBackClick = () => {
    navigate('/menu');
  };
    
  return (
    <Container component="main" maxWidth="md" sx={{ marginTop: 4 }}>
      <Button 
        variant="contained" 
        onClick={handleBackClick}
        sx={{ marginBottom: 2 }}
      >
        Back to Menu
      </Button>
      <Typography component="h1" variant="h5" sx={{ marginBottom: 2 }}>
        Ranking
      </Typography>
      {error && (
        <Typography component="p" variant="body1" sx={{ color: 'red', marginBottom: 2 }}>
          {error}
        </Typography>
      )}
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Position</TableCell>
              <TableCell>Username</TableCell>
              <TableCell>Score</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ranking.map((user, index) => (
              <TableRow key={user._id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{user._id}</TableCell>
                <TableCell>{user.score}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
};

export default Ranking;