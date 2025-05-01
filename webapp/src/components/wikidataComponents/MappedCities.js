import axios from "axios";

let cityCache = [];

export async function fetchRandomCity() {
  if (cityCache.length > 0) {
    const randomIndex = Math.floor(Math.random() * cityCache.length);
    return cityCache[randomIndex];
  }

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
    LIMIT 100
  `;

  const url = `${endpoint}?query=${encodeURIComponent(query)}`;
  const headers = { Accept: "application/sparql-results+json" };

  try {
    const res = await axios.get(url, { headers });
    const results = res.data.results.bindings;

    cityCache = results
      .filter((r) => {
        const label = r.cityLabel?.value || "";
        return label && !/^Q\d+$/.test(label);
      })
      .map((r) => ({
        name: r.cityLabel.value,
        lat: parseFloat(r.lat.value),
        lng: parseFloat(r.lon.value),
      }));

    if (cityCache.length === 0) {
      throw new Error("No se encontraron nombres válidos en la primera carga.");
    }

    const randomIndex = Math.floor(Math.random() * cityCache.length);
    return cityCache[randomIndex];
  } catch (error) {
    console.error("Error al consultar Wikidata:", error);
    throw error;
  }
}

export function __setCityCacheForTest(mockedCities) {
  cityCache = mockedCities;
}