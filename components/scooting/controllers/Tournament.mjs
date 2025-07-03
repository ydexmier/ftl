import { findOneAndUpdate, find, findOne, deleteOne } from '../models/Tournament.mjs';

// Create or update (upsert)
export async function upsertTournament(req, res) {
  try {
    const data = req.body;
    const tournament = await findOneAndUpdate(
      { id: data.id },
      data,
      { new: true, upsert: true }
    );
    res.status(200).json(tournament);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Get all events
export async function getAllTournaments(req, res) {
  try {
    const tournaments = await find();
    res.json(tournaments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Get single event
export async function getTournamentById(req, res) {
  try {
    const tournament = await findOne({ id: req.params.id });
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
    res.json(tournament);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Delete Tournament
export async function deleteTournament(req, res) {
  try {
    const result = await deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Tournament not found' });
    res.status(200).json({ message: 'Tournament deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
