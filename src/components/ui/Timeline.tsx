import React from 'react';
import styles from './Timeline.module.css';

export interface TimelineEvent {
  id: string | number;
  title: string;
  timestamp: string;
  description?: string;
  meta?: string;
  dotColor?: string;
}

interface TimelineProps {
  events: TimelineEvent[];
  className?: string;
}

export function Timeline({ events, className }: TimelineProps) {
  if (!events || events.length === 0) return null;

  return (
    <div className={`${styles.timeline} ${className || ''}`}>
      {events.map((ev) => (
        <div key={ev.id} className={styles.item}>
          <span
            className={styles.dot}
            style={ev.dotColor ? { borderColor: ev.dotColor } : undefined}
            aria-hidden="true"
          />
          <div className={styles.titleRow}>
            <h4 className={styles.title}>{ev.title}</h4>
            <span className={styles.timestamp}>{ev.timestamp}</span>
          </div>
          {ev.description && <p className={styles.description}>{ev.description}</p>}
          {ev.meta && <span className={styles.meta}>{ev.meta}</span>}
        </div>
      ))}
    </div>
  );
}
