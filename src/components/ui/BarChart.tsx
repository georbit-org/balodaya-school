import React from 'react';
import styles from './BarChart.module.css';

export interface BarChartItem {
  label: string;
  value: number;
  sublabel?: string;
  color?: string;
}

interface BarChartProps {
  data: BarChartItem[];
  height?: number;
  valueFormatter?: (val: number) => string;
  className?: string;
  title?: string;
}

export function BarChart({
  data,
  height = 160,
  valueFormatter = (v) => `${v}%`,
  className,
  title = 'Data Chart',
}: BarChartProps) {
  if (!data || data.length === 0) return null;

  const maxValue = Math.max(...data.map((d) => d.value), 100);
  const chartWidth = 500;
  const paddingBottom = 26;
  const paddingTop = 20;
  const plotHeight = height - paddingBottom - paddingTop;
  const barWidth = Math.min(36, (chartWidth / data.length) * 0.65);
  const slotWidth = chartWidth / data.length;

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <svg
        viewBox={`0 0 ${chartWidth} ${height}`}
        className={styles.chartSvg}
        role="img"
        aria-label={title}
      >
        {/* Baseline grid */}
        <line
          x1={0}
          y1={height - paddingBottom}
          x2={chartWidth}
          y2={height - paddingBottom}
          stroke="var(--line)"
          strokeWidth="1"
        />

        {data.map((item, idx) => {
          const barHeight = Math.max(4, (item.value / maxValue) * plotHeight);
          const x = idx * slotWidth + (slotWidth - barWidth) / 2;
          const y = height - paddingBottom - barHeight;

          return (
            <g key={item.label}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={3}
                className={styles.bar}
                style={item.color ? { fill: item.color } : undefined}
                tabIndex={0}
                role="graphics-symbol"
                aria-label={`${item.label}: ${valueFormatter(item.value)}`}
              >
                <title>{`${item.label}: ${valueFormatter(item.value)}`}</title>
              </rect>

              {/* Value on top of bar */}
              <text
                x={x + barWidth / 2}
                y={y - 5}
                className={styles.valueText}
              >
                {valueFormatter(item.value)}
              </text>

              {/* Label at bottom */}
              <text
                x={x + barWidth / 2}
                y={height - 8}
                className={styles.axisText}
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Screen reader table alternative */}
      <table className={styles.srTable}>
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Label</th>
            <th scope="col">Value</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <td>{d.label}</td>
              <td>{valueFormatter(d.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
