import React, { useEffect, useState } from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper } from '@mui/material';
import RankingService from '../services/RankingService';
import axios from 'axios';

const Ranking = () => {
  const [ranking, setRanking] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const data = await axios.get("/api/stats");
        setRanking(data);
      } catch (error) {
        setError('Failed to fetch ranking data');
      }
    };

    fetchRanking();
  }, []);

  return (
    <Container component="main" maxWidth="md" sx={{ marginTop: 4 }}>
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
              <TableRow key={user.username}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{user.username}</TableCell>
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