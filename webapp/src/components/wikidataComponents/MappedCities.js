import axios from "axios";

export async function fetchRandomCity() {
  const endpoint = "https://query.wikidata.org/sparql";
  const query = `
    SELECT ?cityLabel ?lat ?lon WHERE {
      ?city wdt:P31/wdt:P279* wd:Q515.
      ?city p:P625 ?coordinate.
      ?coordinate psv:P625 ?value.
      ?value wikibase:geoLatitude ?lat.
      ?value wikibase:geoLongitude ?lon.
      SERVICE wikibase:label { bd:serviceParam wikibase:language "es". }
    }
    LIMIT 100
  `;

  const url = `${endpoint}?query=${encodeURIComponent(query)}`;
  const headers = { Accept: "application/sparql-results+json" };

  try {
    const res = await axios.get(url, { headers });
    const results = res.data.results.bindings;

    if (results.length === 0) throw new Error("No se encontraron ciudades.");

    const random = results[Math.floor(Math.random() * results.length)];

    return {
      name: random.cityLabel.value,
      lat: parseFloat(random.lat.value),
      lng: parseFloat(random.lon.value),
    };
  } catch (error) {
    console.error("Error al consultar Wikidata:", error);
    throw error;
  }
}
