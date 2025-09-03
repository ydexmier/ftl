import connectToMongoDB from '../../../../../../components/scooting/utils/connectToMongoDB.mjs';
import Round from '../../../../../../components/scooting/models/Round.js';

export default async function handler(req, res) {
  await connectToMongoDB();

  if (req.method === 'GET') {
    try {
      const data = req.query;

      const round = await Round.findOne({ id: Number(data.roundId) });
        if (!round) {  
          return res.status(404).json({ error: 'Round not found' });
        }
        const match = round.results.find(m => m.id === Number(data.matchId));
        if (!match) {
          return res.status(404).json({ error: 'Match not found' });
        } 
      return res.status(200).json(match);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const data = req.body;
      const round = await Round.findOneAndUpdate(
        { id: Number(data.roundId) },
        data,
        { new: true, upsert: true }
      );
      return res.status(200).json(round);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Méthode non autorisée' });
}
