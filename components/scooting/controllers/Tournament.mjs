import Tournament from '../models/Tournament.js';
import connectToMongoDB from '../utils/connectToMongoDB.mjs';

// Create or update (upsert)
export async function upsertTournament(req, res) {
  try {
    const data = req.body;
    await connectToMongoDB();
    const tournament = await Tournament.findOneAndUpdate(
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
    await connectToMongoDB();
    const tournaments = await Tournament.find();
    res.json(tournaments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Get single event
export async function getTournamentById(req, res) {
  try {
    await connectToMongoDB();
    const tournament = await Tournament.findOne({ id: req.params.id });
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
    res.json(tournament);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Delete Tournament
export async function deleteTournament(req, res) {
  try {
    await connectToMongoDB();
    const result = await Tournament.deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Tournament not found' });
    res.status(200).json({ message: 'Tournament deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
