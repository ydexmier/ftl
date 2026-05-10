import { useState, useEffect, Dispatch, SetStateAction } from 'react';
import { apiFetch, ApiError } from '@/src/lib/api/apiFetch';

export interface UseFetchResult<T> {
	data: T | null;
	loading: boolean;
	error: string | null;
	setData: Dispatch<SetStateAction<T | null>>;
}

export function useFetch<T>(url: string | null): UseFetchResult<T> {
	const [data, setData] = useState<T | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!url) return;
		const fetchData = async () => {
			setLoading(true);
			setError(null);
			try {
				const response = await apiFetch(url);
				setData(await response.json());
			} catch (err) {
				setData(null);
				if (err instanceof ApiError) {
					setError(err.message);
				} else {
					setError(err instanceof Error ? err.message : 'Unknown error');
				}
			} finally {
				setLoading(false);
			}
		};
		fetchData();
	}, [url]);

	return { data, loading, error, setData };
}
