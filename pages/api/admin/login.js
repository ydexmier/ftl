export default function handler(req, res) {
  if (req.method === 'POST') {
    const { username, password } = req.body;

    // Identifiants fixes pour les admins
    const ADMIN_USER = process.env.ADMIN_USER;
    const ADMIN_PASS = process.env.ADMIN_PASS;

    if (username === ADMIN_USER && password === ADMIN_PASS) {
      res.status(200).json({ success: true });
    } else {
      res.status(401).json({ error: 'Identifiants invalides' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Méthode ${req.method} non autorisée`);
  }
}
