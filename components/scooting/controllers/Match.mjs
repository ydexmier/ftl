import { find, findOne, findOneAndUpdate, deleteOne } from '../models/Match.mjs';

// Create or update (upsert)
export async function upsertMatch(req, res) {
  try {
    const data = req.body;
    const match = await findOneAndUpdate(
      { id: data.id }, // assuming `id` is a unique identifier in your schema
      data,
      { new: true, upsert: true }
    );
    res.status(200).json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Get all matches
export async function getAllMatches(req, res) {
  try {
    const matches = await find();
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Get a single match
export async function getMatchById(req, res) {
  try {
    const match = await findOne({ id: req.params.id });
    if (!match) return res.status(404).json({ error: 'Match not found' });
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Delete a match
export async function deleteMatch(req, res) {
  try {
    const result = await deleteOne({ id: req.params.id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Match not found' });
    res.status(200).json({ message: 'Match deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
