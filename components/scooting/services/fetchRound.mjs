import fetchData from './fetchData.mjs';


export async function fetchRound(id, page = 1, pageSize = 100) {
  const url = `https://api.ravensburgerplay.com/api/v2/tournament-rounds/${id}/matches/paginated/?page=${page}&page_size=${pageSize}&avoid_cache=true`;
  const data = await fetchData(url)
  return data;
}