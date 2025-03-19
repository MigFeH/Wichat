import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper } from '@mui/material';
import axios from 'axios';

const apiEndpoint = process.env.REACT_APP_API_ENDPOINT || 'http://localhost:8001';

const Stadistics = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${apiEndpoint}/api/stats`);
        if (response.data && Array.isArray(response.data)) {
          setStats(response.data);
        } else {
          setError('Invalid data format');
        }
      } catch (error) {
        setError('Failed to fetch statistics');
      }
    };

    fetchStats();
  }, []);

  const handleBackClick = () => {
    navigate('/menu');
  };

  return (
    <Container component="main" maxWidth="md" sx={{ marginTop: 4 }}>
      <Typography component="h1" variant="h5" sx={{ marginBottom: 2 }}>
        Statistics
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
              <TableCell>Username</TableCell>
              <TableCell>Score</TableCell>
              <TableCell>Correct Answers</TableCell>
              <TableCell>Incorrect Answers</TableCell>
              <TableCell>Total Rounds</TableCell>
              <TableCell>Accuracy</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stats.map((stat) => (
              <TableRow key={stat._id}>
                <TableCell>{stat.username}</TableCell>
                <TableCell>{stat.score}</TableCell>
                <TableCell>{stat.correctAnswers}</TableCell>
                <TableCell>{stat.incorrectAnswers}</TableCell>
                <TableCell>{stat.totalRounds}</TableCell>
                <TableCell>{stat.accuracy}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      <button onClick={handleBackClick}>Volver</button>
    </Container>
  );
};

export default Stadistics;