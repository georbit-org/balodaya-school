import React from 'react';
import styles from './Heatmap.module.css';

export type DayStatus = 'present' | 'absent' | 'late' | 'holiday' | 'unmarked';

export interface HeatmapDay {
  dayNumber: number;
  dateStr: string; // YYYY-MM-DD
  status: DayStatus;
  note?: string;
}

interface HeatmapProps {
  days: HeatmapDay[];
  startWeekday?: number; // 0=Sun, 1=Mon, etc. (Default: 0 for Sun)
  className?: string;
  monthName?: string;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function Heatmap({
  days,
  startWeekday = 0,
  className,
  monthName,
}: HeatmapProps) {
  // Pad blank cells before the first day
  const leadingBlanks = Array.from({ length: startWeekday }).map((_, idx) => (
    <div key={`blank-${idx}`} className={`${styles.cell} ${styles.empty}`} aria-hidden="true" />
  ));

  return (
    <div className={`${styles.container} ${className || ''}`} aria-label={monthName ? `Attendance heatmap for ${monthName}` : 'Attendance heatmap'}>
      <div className={styles.headerRow}>
        {WEEKDAYS.map((wd) => (
          <span key={wd}>{wd}</span>
        ))}
      </div>

      <div className={styles.grid}>
        {leadingBlanks}
        {days.map((day) => {
          const statusClass =
            day.status === 'present'
              ? styles.present
              : day.status === 'absent'
              ? styles.absent
              : day.status === 'late'
              ? styles.late
              : day.status === 'holiday'
              ? styles.holiday
              : '';

          return (
            <div
              key={day.dateStr}
              className={`${styles.cell} ${statusClass}`}
              title={`${day.dateStr}: ${day.status}${day.note ? ` (${day.note})` : ''}`}
              tabIndex={0}
              role="gridcell"
              aria-label={`${day.dateStr}: ${day.status}`}
            >
              {day.dayNumber}
            </div>
          );
        })}
      </div>

      <div className={styles.legend}>
        <div className={styles.legendItem}>
          <span className={`${styles.legendBox} ${styles.present}`} />
          <span>Present</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendBox} ${styles.absent}`} />
          <span>Absent</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendBox} ${styles.late}`} />
          <span>Late</span>
        </div>
        <div className={styles.legendItem}>
          <span className={`${styles.legendBox} ${styles.holiday}`} />
          <span>Saturday / Holiday</span>
        </div>
      </div>
    </div>
  );
}
