import connectToMongoDB from '../../../components/scooting/utils/connectToMongoDB.mjs';
import Tournament from '../../../components/scooting/models/Tournament.js';

export default async function handler(req, res) {
  await connectToMongoDB();

  if (req.method === 'GET') {
    try {
      const tournaments = await Tournament.find();
      return res.status(200).json(tournaments);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const data = req.body;
      const tournament = await Tournament.findOneAndUpdate(
        { id: data.id },
        data,
        { new: true, upsert: true }
      );
      return res.status(200).json(tournament);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
}
