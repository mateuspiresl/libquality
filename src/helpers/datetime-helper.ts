export const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

export function timeToDaysString(time: number): string {
  return `${Math.round(time / ONE_DAY_IN_MS)}d`;
}
