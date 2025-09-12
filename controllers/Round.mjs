import Round from '@models/Round.js';
import connectToMongoDB from '@components/scooting/utils/connectToMongoDB.mjs';

// Create or update (upsert)
export async function upsertRound(req, res) {
	try {
		const data = req.body;
		await connectToMongoDB();

		const round = await Round.findOneAndUpdate(
			{ id: data.id }, // assuming `id` is a unique identifier in your schema
			data,
			{ new: true, upsert: true },
		);
		res.status(200).json(round);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
}

// Get all rounds
export async function getAllRounds(req, res) {
	try {
		await connectToMongoDB();

		const rounds = await Round.find();
		res.json(rounds);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
}

// Get a single round
export async function getRoundById(req, res) {
	try {
		await connectToMongoDB();
		const round = await Round.findOne({ id: req.params.id });
		if (!round) return res.status(404).json({ error: 'Round not found' });
		res.json(round);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
}

// Delete a round
export async function deleteRound(req, res) {
	try {
		await connectToMongoDB();

		const result = await Round.deleteOne({ id: req.params.id });
		if (result.deletedCount === 0) return res.status(404).json({ error: 'Round not found' });
		res.status(200).json({ message: 'Round deleted' });
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
}
