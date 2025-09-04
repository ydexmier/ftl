import fetchData from './fetchData.mjs';

export default async function fetchTournement(id) {
	const url = `https://api.ravensburgerplay.com/api/v2/events/${id}/`;
	const data = await fetchData(url);
	return data;
}
