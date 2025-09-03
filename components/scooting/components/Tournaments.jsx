import React, { useEffect, useState } from "react";
import Link from "@mui/material/Link";
import Typography from '@mui/material/Typography';

const Tournaments = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTournaments = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/tournaments");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setTournaments(data);
      } catch (err) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchTournaments();
  }, []);

  if (loading) return <div>Loading tournaments...</div>;
  if (error) return <div>Error: {error}</div>;
  return (
    <div>
      <h2>Liste des tournois</h2>
      <ul>
        {tournaments.map((tournament) => (
          <li key={tournament.id}>
                <Link underline='none' href={`/tournaments/${tournament.id}`}><Typography>{tournament.name} - {tournament.start_datetime}</Typography></Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Tournaments;
