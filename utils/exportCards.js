export const exportCards = (cards) => {
    return cards
        .map((card) => {
            const versionText = card.version ? ` - ${card.version}` : '';
            return `${card.quantity} ${card.name}${versionText}`;
        })
        .join('\n');
};

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export const exportCardsCSV = (cards) => {
    // Générer l'en-tête CSV
    const headers = ['Set Number', 'Card Number', 'Variant', 'Count'];
    const csvRows = [headers.join(',')];

    // Parcourir les objets pour générer les lignes CSV
    cards.forEach((item) => {
        const row = [
            item.set.code,
            item.collector_number,
            item.variant || 'normal',
            item.quantity,
        ];
        csvRows.push(row.join(','));
    });

    // Joindre les lignes avec des retours à la ligne
    const csvContent = csvRows.join('\n');
    downloadCSV(csvContent, 'cartes.csv');
};
