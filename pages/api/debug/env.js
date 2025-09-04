export default function handler(req, res) {
	res.json({
		WEBSITE_ACCESS_LOGIN: process.env.WEBSITE_ACCESS_LOGIN,
		WEBSITE_ACCESS_PASSWORD: process.env.WEBSITE_ACCESS_PASSWORD,
		NODE_ENV: process.env.NODE_ENV,
		MONGO_URI: process.env.MONGO_URI,
		ADMIN_USER: process.env.ADMIN_USER,
		ADMIN_PASS: process.env.ADMIN_PASS,
	});
}
