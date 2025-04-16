// src/components/CityGuessGame.jsx
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { getDistance } from 'geolib';
import { fetchRandomCity } from './MappedCities';

function CityGuessMap({ onGuess }) {
  useMapEvents({
    click(e) {
      onGuess(e.latlng);
    }
  });
  return null;
}

export default function CityGuessGame() {
  const [city, setCity] = useState(null);
  const [guess, setGuess] = useState(null);
  const [distance, setDistance] = useState(null);

  const loadNewCity = async () => {
    const newCity = await fetchRandomCity();
    setCity(newCity);
    setGuess(null);
    setDistance(null);
  };

  useEffect(() => {
    loadNewCity();
  }, []);

  const handleGuess = (latlng) => {
    setGuess(latlng);
    const dist = getDistance(
      { latitude: city.lat, longitude: city.lng },
      { latitude: latlng.lat, longitude: latlng.lng }
    );
    setDistance(Math.round(dist / 1000));
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Encuentra la ciudad</h1>
      {city && <h2>¿Dónde está {city.name}?</h2>}

      <MapContainer center={[20, 0]} zoom={2} style={{ height: "600px" }}>
        <TileLayer
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          attribution='© OpenStreetMap'
        />
        <CityGuessMap onGuess={handleGuess} />
        {guess && <Marker position={guess} />}
        {distance != null && <Marker position={[city.lat, city.lng]} />}
      </MapContainer>

      {distance != null && (
        <div>
          <h3>¡Estás a {distance} km de {city.name}!</h3>
          <button onClick={loadNewCity}>Nueva partida</button>
        </div>
      )}
    </div>
  );
}
