import { readFileSync, writeFileSync } from 'node:fs';
const file = process.argv[2] ?? 'output/lighthouse-final.report.json';
const report = JSON.parse(readFileSync(file, 'utf8'));
const summary = {
  scores: Object.fromEntries(
    Object.entries(report.categories).map(([key, value]) => [key, Math.round(value.score * 100)]),
  ),
  metrics: Object.fromEntries(
    [
      'first-contentful-paint',
      'largest-contentful-paint',
      'cumulative-layout-shift',
      'total-blocking-time',
      'speed-index',
    ].map((key) => [
      key,
      { value: report.audits[key].numericValue, display: report.audits[key].displayValue },
    ]),
  ),
  issues: Object.values(report.audits)
    .filter((a) => a.score !== null && a.score < 1 && a.scoreDisplayMode !== 'informative')
    .map((a) => ({ id: a.id, title: a.title, display: a.displayValue })),
};
writeFileSync(file.replace('.report.json', '.summary.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
