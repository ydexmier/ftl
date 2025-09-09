export function diffInSeconds(date1, date2) {
  return Math.floor(Math.abs(date2.getTime() - date1.getTime()) / 1000);
}