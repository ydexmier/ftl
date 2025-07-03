// services/fetchTournement.js
import fetch from 'node-fetch';

export default async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error('❌ Erreur fetchData :', err.message);
    return null;
  }
}
