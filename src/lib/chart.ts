/**
 * ASCII Chart Utilities
 * Simple ASCII chart rendering for terminal display
 */

/**
 * Render a horizontal progress bar
 */
export function renderProgressBar(percentage: number, width: number = 20): string {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * Data point for ASCII chart
 */
export interface ChartDataPoint {
  label: string;
  value: number;
}

/**
 * Render an ASCII bar chart
 */
export function renderAsciiChart(data: ChartDataPoint[], width: number = 40): string {
  if (data.length === 0) {
    return 'No data to display';
  }

  const maxValue = Math.max(...data.map(d => d.value));
  if (maxValue === 0) {
    return 'No data to display';
  }

  const lines: string[] = [];

  data.forEach(point => {
    const percentage = (point.value / maxValue) * 100;
    const bar = renderProgressBar(percentage, width);
    const formattedValue = formatNumber(point.value);
    lines.push(`${point.label.padEnd(15)} ${percentage.toFixed(0).padStart(3)}%  ${bar}  ${formattedValue}`);
  });

  return lines.join('\n');
}

/**
 * Render a simple line chart using ASCII characters
 */
export function renderLineChart(
  data: { label: string; value: number }[],
  height: number = 10
): string {
  if (data.length === 0) {
    return 'No data to display';
  }

  const values = data.map(d => d.value);
  const maxValue = Math.max(...values);
  const minValue = Math.min(...values);
  const range = maxValue - minValue || 1;

  // Create the chart grid
  const lines: string[] = [];

  // Y-axis labels and chart
  for (let y = height; y >= 0; y--) {
    const threshold = minValue + (range * y) / height;
    const yLabel = formatAxisValue(threshold).padStart(8);

    let line = '';
    for (let x = 0; x < data.length; x++) {
      const value = values[x];
      if (value === undefined) continue;
      const normalizedValue = ((value - minValue) / range) * height;

      if (Math.abs(normalizedValue - y) < 0.5) {
        line += '▄';
      } else if (normalizedValue > y) {
        line += '█';
      } else {
        line += ' ';
      }
    }

    lines.push(`${yLabel} │${line}`);
  }

  // X-axis
  lines.push('         └' + '─'.repeat(data.length));

  // X-axis labels (show first, middle, last)
  if (data.length > 0) {
    const labelLine = '          ';
    const indices = [0, Math.floor(data.length / 2), data.length - 1];
    const labels = indices.map(i => data[i]?.label.substring(0, 10) || '');
    lines.push(labelLine + labels[0]);
  }

  return lines.join('\n');
}

/**
 * Format a number for display with appropriate units
 */
export function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)}B`;
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toLocaleString();
}

/**
 * Format axis value for chart display
 */
function formatAxisValue(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toFixed(0);
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(current: number, previous: number): string {
  if (previous === 0) {
    return current > 0 ? '+∞%' : '0%';
  }

  const change = ((current - previous) / previous) * 100;
  const sign = change > 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

/**
 * Format a date string to a short format (e.g., "2024-W02" or "Jan 15")
 */
export function formatDateShort(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  } catch {
    return dateStr.substring(0, 10);
  }
}
