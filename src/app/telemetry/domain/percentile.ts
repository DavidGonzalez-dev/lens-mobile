export function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    return 0;
  }

  const sortValues = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p * sortValues.length) / 100);

  return sortValues[rank - 1];
}
