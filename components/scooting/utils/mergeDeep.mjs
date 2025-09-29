// Fonction merge récursive pour ne pas écraser les sous-objets
export default function mergeDeep(target, source) {
	for (const key in source) {
		if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && key in target) {
			mergeDeep(target[key], source[key]);
		} else {
			target[key] = source[key];
		}
	}
}

export function mergeArrayById(targetResults = [], sourceResults = []) {
	for (const sourceItem of sourceResults) {
		const existing = targetResults.find((item) => item.id === sourceItem.id);

		if (existing) {
			mergeDeep(existing, sourceItem); // update en place
		} else {
			targetResults.push(sourceItem); // ajout
		}
	}
	return targetResults;
}
