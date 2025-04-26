import axios from "axios";

let cityCache = []; // Lista de ciudades cargadas desde Wikidata

// Usage of Math.random() is safe here because it's not used for any security-sensitive purpose.
// It only randomizes city selection for gameplay UX.
function getRandom() {
  if (window.crypto && window.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return array[0] / (0xFFFFFFFF + 1);
  } else {
    // Fallback no seguro
    return Math.random();
  }
}



export async function fetchRandomCity() {
  // Si ya hay ciudades en caché, elige una al azar
  if (cityCache.length > 0) {
    const randomIndex = Math.floor(getRandom() * cityCache.length);
    return cityCache[randomIndex];
  }

  // Consulta inicial a Wikidata
  const endpoint = "https://query.wikidata.org/sparql";
  const query = `
    SELECT ?city ?cityLabel ?lat ?lon WHERE {
      ?city wdt:P31/wdt:P279* wd:Q515.
      ?city p:P625 ?coordinate.
      ?coordinate psv:P625 ?value.
      ?value wikibase:geoLatitude ?lat.
      ?value wikibase:geoLongitude ?lon.
      SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
    }
    ORDER BY RAND()
    LIMIT 100
  `;

  const url = `${endpoint}?query=${encodeURIComponent(query)}`;
  const headers = { Accept: "application/sparql-results+json" };

  try {
    const res = await axios.get(url, { headers });
    const results = res.data.results.bindings;

    // Filtrar y transformar resultados válidos
    cityCache = results
        .filter((r) => {
          const label = r.cityLabel?.value || "";
          return label && !/^Q\d+$/.test(label); // Descarta códigos como "Q1234"
        })
        .map((r) => ({
          name: r.cityLabel.value,
          lat: parseFloat(r.lat.value),
          lng: parseFloat(r.lon.value),
        }));

    if (cityCache.length === 0) {
      throw new Error("No se encontraron nombres válidos.");
    }

    // Elegir ciudad aleatoria de la caché
    const randomIndex = Math.floor(getRandom() * cityCache.length);
    return cityCache[randomIndex];
  } catch (error) {
    console.error("Error al consultar Wikidata:", error);
    throw error;
  }
}

// Solo para testing
export function __setCityCacheForTest(mockedCities) {
  cityCache = mockedCities;
}




