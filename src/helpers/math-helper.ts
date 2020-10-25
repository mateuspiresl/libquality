export function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sum = values.reduce((result, value) => result + value, 0);
  return sum / values.length;
}

export function standardDeviation(
  values: number[],
  optionalAvg?: number,
): number {
  const avg = optionalAvg || average(values);
  const squareDiffs = values.map((value) => {
    const diff = value - avg;
    return diff * diff;
  });
  const avgSquareDiff = average(squareDiffs);
  return Math.sqrt(avgSquareDiff);
}
