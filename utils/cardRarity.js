export function rare() {
    const random = Math.floor(Math.random() * 10000) + 1;

    if (random <= 6750) return 3;
    if (random <= 9150) return 4;
    return 5;
}

export function foil() {
    const random = Math.floor(Math.random() * 10000) + 1;

    if (random <= 5200) return 1;
    if (random <= 7700) return 2;
    if (random <= 9200) return 3;
    if (random <= 9700) return 4;
    if (random <= 9900) return 5;
    return 6;
}
