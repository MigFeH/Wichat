import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet';
import { getDistance } from 'geolib';
import 'leaflet/dist/leaflet.css';
import { fetchRandomCity } from './MappedCities';
/*import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';*/
import { Button } from '@mui/material';

/*delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});*/


function CityGuessMap({ onGuess, disabled }) {
  useMapEvents({
    click(e) {
      if (!disabled) {
        onGuess(e.latlng);
      }
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
    if (!city) return; // 🔐 Evita error si city aún no se ha cargado

    setGuess(latlng);

    const dist = getDistance(
        { latitude: city.lat, longitude: city.lng },
        { latitude: latlng.lat, longitude: latlng.lng }
    );
    setDistance(Math.round(dist / 1000));
  };

  return (
      <div style={{ padding: '1rem', position: 'relative' }}>
        <h1>Find the city</h1>
        {city && <h2>¿Where is {city.name}?</h2>}

        <div style={{ position: 'relative' }}>
          <MapContainer
              center={[20, 0]}
              zoom={2}
              minZoom={2}
              maxZoom={10}
              maxBounds={[[-90, -180], [90, 180]]}
              style={{ height: "600px", zIndex: 0 }}
          >
            {/* Cambiar la capa del mapa por una sin etiquetas */}
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />




            <CityGuessMap onGuess={handleGuess} disabled={guess !== null} />
            {guess && <Marker position={guess} />}
            {distance != null && (
                <>
                  <Marker position={[city.lat, city.lng]} />
                  <Polyline positions={[[guess.lat, guess.lng], [city.lat, city.lng]]} color="red" />
                </>
            )}
          </MapContainer>

          {distance != null && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(0,0,0,0.6)',
                color: 'white',
                padding: '1rem 2rem',
                fontSize: '2rem',
                fontWeight: 'bold',
                borderRadius: '1rem',
                zIndex: 1000
              }}>
                End
              </div>
          )}
        </div>

        {distance != null && (
            <div style={{ marginTop: '1rem' }}>
              <h3>¡Distance {distance} km from {city.name}!</h3>
              <Button variant="contained" onClick={loadNewCity}>New game</Button>
            </div>
        )}
      </div>
  );
}





