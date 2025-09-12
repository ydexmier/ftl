import { useState, useEffect } from "react";

export function useFetch(url) {
  const [data, setData] = useState(null);      // données fetchées
  const [loading, setLoading] = useState(true); // état de chargement
  const [error, setError] = useState(null);     // erreurs éventuelles

  useEffect(() => {
    if (!url) return; // si pas d'URL → on ne fetch pas
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(url);
        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.error);
        }
        setData(json);
      } catch (err) {
        setData(null);
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]); // se relance si l'URL change

  return { data, loading, error, setData };
}
