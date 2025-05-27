// scripts/mergeCards.js
import fs from 'fs';
import path from 'path';

const setsDir = path.join(process.cwd(), 'public', 'json', 'sets');
const outputFile = path.join(
    process.cwd(),
    'public',
    'json',
    'sets',
    'allCards.json'
);

const allCards = [];

fs.readdirSync(setsDir).forEach((file) => {
    if (file.endsWith('.json')) {
        const content = fs.readFileSync(path.join(setsDir, file), 'utf-8');
        try {
            const data = JSON.parse(content);
            if (Array.isArray(data)) {
                allCards.push(...data);
            }
        } catch (err) {
            console.warn(`Erreur dans ${file}:`, err);
        }
    }
});

fs.writeFileSync(outputFile, JSON.stringify(allCards, null, 2));
console.log(`✅ Fichier fusionné : ${outputFile}`);
