export function mergeDeep<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
	for (const key in source) {
		const sourceVal = source[key];
		const targetVal = target[key];
		if (
			sourceVal &&
			typeof sourceVal === 'object' &&
			!Array.isArray(sourceVal) &&
			key in target &&
			targetVal &&
			typeof targetVal === 'object'
		) {
			mergeDeep(targetVal as Record<string, unknown>, sourceVal as Record<string, unknown>);
		} else {
			target[key] = sourceVal as T[typeof key];
		}
	}
	return target;
}

export function mergeArrayById<T extends { id: number }>(target: T[] = [], source: T[] = []): T[] {
	for (const sourceItem of source) {
		const existing = target.find((item) => item.id === sourceItem.id);
		if (existing) {
			mergeDeep(existing as Record<string, unknown>, sourceItem as Record<string, unknown>);
		} else {
			target.push(sourceItem);
		}
	}
	return target;
}
