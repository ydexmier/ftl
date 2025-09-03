import { useState, useEffect } from "react";

export function useFetch(url) {
  const [data, setData] = useState(null);      // données fetchées
  const [loading, setLoading] = useState(true); // état de chargement
  const [error, setError] = useState(null);     // erreurs éventuelles

  useEffect(() => {
    if (!url) return; // si pas d'URL → on ne fetch pas
console.log("Fetching data from URL:", url);
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(url);
        console.log("Response received:", response);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        setData(json);
        console.log("Data fetched:", json);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]); // se relance si l'URL change

  return { data, loading, error };
}
