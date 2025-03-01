import React from 'react';
import { useNavigate } from 'react-router-dom';

const Stadistics = () => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate('/menu');
  };

  // Placeholder data, replace with actual data from the database
  const stats = {
    gamesPlayed: 10,
    correctAnswers: 50,
    wrongAnswers: 20,
    times: [120, 150, 180, 200, 220, 240, 260, 280, 300, 320]
  };

  return (
    <div>
      <h1>Estadísticas</h1>
      <p>Partidas jugadas: {stats.gamesPlayed}</p>
      <p>Preguntas acertadas: {stats.correctAnswers}</p>
      <p>Preguntas falladas: {stats.wrongAnswers}</p>
      <h2>Tiempos por partida:</h2>
      <ul>
        {stats.times.map((time, index) => (
          <li key={index}>Partida {index + 1}: {time} segundos</li>
        ))}
      </ul>
      <button onClick={handleBackClick}>Volver</button>
    </div>
  );
};

export default Stadistics;