export function rare(): number {
  const random = Math.floor(Math.random() * 10000) + 1;

  if (random <= 6745) return 3;
  if (random <= 9167) return 4;
  return 5;
}

export function foil(): number {
  const random = Math.floor(Math.random() * 10000) + 1;

  if (random <= 5000) return 1;
  if (random <= 7657) return 2;
  if (random <= 9037) return 3;
  if (random <= 9766) return 4;
  if (random <= 9844) return 5;
  return 6;
}
