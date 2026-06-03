export interface CorrelationResult {
  metricA: string;
  metricB: string;
  coefficient: number; // Pearson r value (-1 to 1)
  description: string;
}

/**
 * Calculates the Pearson product-moment correlation coefficient.
 */
export function calculatePearson(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0 || n !== y.length) return 0;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);

  const meanX = sumX / n;
  const meanY = sumY / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    num += diffX * diffY;
    denX += diffX * diffX;
    denY += diffY * diffY;
  }

  if (denX === 0 || denY === 0) return 0;
  return num / Math.sqrt(denX * denY);
}

/**
 * Evaluates comparative averages based on boolean state filters.
 * Ideal for measuring impact of Workouts or Junk Food inputs.
 */
export function calculateBinaryImpact(
  data: any[],
  booleanField: string,
  targetField: string
): { yesMean: number; noMean: number; percentChange: number } {
  const yesGroup = data.filter((d) => d[booleanField] === true || d[booleanField] === "Yes" || d[booleanField] === 1);
  const noGroup = data.filter((d) => d[booleanField] === false || d[booleanField] === "No" || d[booleanField] === 0 || d[booleanField] === null);

  const getAverage = (arr: any[], field: string) => {
    if (arr.length === 0) return 0;
    const sum = arr.reduce((acc, curr) => acc + (parseFloat(curr[field]) || 0), 0);
    return sum / arr.length;
  };

  const yesMean = getAverage(yesGroup, targetField);
  const noMean = getAverage(noGroup, targetField);

  if (noMean === 0) return { yesMean, noMean, percentChange: 0 };
  const percentChange = ((yesMean - noMean) / noMean) * 100;

  return { yesMean, noMean, percentChange: Math.round(percentChange * 10) / 10 };
}
