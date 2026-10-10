import React from 'react';
import styles from './DonutChart.module.css';

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  centerValue?: string;
  centerSub?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function DonutChart({
  segments,
  centerValue,
  centerSub,
  size = 140,
  strokeWidth = 14,
  className,
}: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className={`${styles.wrapper} ${className || ''}`}>
      <div className={styles.chartBox} style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className={styles.svg}
          role="img"
          aria-label={centerSub || 'Donut chart'}
        >
          {/* Base track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="var(--surface-2)"
            strokeWidth={strokeWidth}
          />

          {total > 0 &&
            segments.map((seg) => {
              const percent = seg.value / total;
              const dashLength = percent * circumference;
              const strokeDasharray = `${dashLength} ${circumference - dashLength}`;
              const strokeDashoffset = -accumulatedPercent * circumference;
              accumulatedPercent += percent;

              return (
                <circle
                  key={seg.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={seg.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dasharray 0.5s var(--ease)' }}
                >
                  <title>{`${seg.label}: ${seg.value} (${Math.round(percent * 100)}%)`}</title>
                </circle>
              );
            })}
        </svg>

        {(centerValue || centerSub) && (
          <div className={styles.centerLabel}>
            {centerValue && <span className={styles.centerValue}>{centerValue}</span>}
            {centerSub && <span className={styles.centerSub}>{centerSub}</span>}
          </div>
        )}
      </div>

      <ul className={styles.legendList}>
        {segments.map((seg) => {
          const percent = total > 0 ? Math.round((seg.value / total) * 100) : 0;
          return (
            <li key={seg.label} className={styles.legendItem}>
              <div className={styles.legendLabelGroup}>
                <span className={styles.legendDot} style={{ background: seg.color }} />
                <span>{seg.label}</span>
              </div>
              <span className={styles.legendVal}>
                {percent}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
