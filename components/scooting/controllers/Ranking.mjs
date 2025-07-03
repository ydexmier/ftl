import { find, findOne, findOneAndUpdate, deleteOne } from '../models/Ranking.mjs';

// Create or update (upsert)
export async function upsertRanking(req, res) {
  try {
    const data = req.body;
    // Ici on suppose que tu utilises `id` comme identifiant unique (à adapter si besoin)
    const ranking = await findOneAndUpdate(
      { id: data.id },
      data,
      { new: true, upsert: true }
    );
    res.status(200).json(ranking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Get all rankings
export async function getAllRankings(req, res) {
  try {
    const rankings = await find();
    res.json(rankings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Get a single ranking by id
export async function getRankingById(req, res) {
  try {
    const ranking = await findOne({ id: req.params.id });
    if (!ranking) return res.status(404).json({ error: 'Ranking not found' });
    res.json(ranking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Delete a ranking by id
export async function deleteRanking(req, res) {
  try {
    const result = await deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Ranking not found' });
    res.status(200).json({ message: 'Ranking deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
