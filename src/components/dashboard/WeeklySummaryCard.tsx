// ... inside WeeklySummaryCard component
// ... inside calculatePercentageChange function
const calculatePercentageChange = (current: number, previous: number) => {
  if (previous === 0) return current > 0 ? '∞' : '0';
  return Math.round(((current - previous) / previous) * 100);
};
// ... rest of file