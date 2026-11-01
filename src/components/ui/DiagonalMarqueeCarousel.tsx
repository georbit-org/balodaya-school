'use client';

import React from 'react';
import Image from 'next/image';
import styles from './DiagonalMarqueeCarousel.module.css';

export interface CardItem {
  id: string | number;
  url: string;
  title: string;
}

export interface DiagonalMarqueeCarouselProps {
  cards?: CardItem[];
  angle?: number;
  baseSpeed?: number;
  alternateDirections?: boolean;
  className?: string;
  cardClassName?: string;
  fadeClassName?: string;
  onCardClick?: (card: CardItem) => void;
}

interface MarqueeRowProps {
  cards: CardItem[];
  speed: number;
  direction: 1 | -1;
  cardClassName?: string;
  onCardClick?: (card: CardItem) => void;
}

function Card({ card, className = '', onClick }: { card: CardItem; className?: string; onClick?: () => void }) {
  return (
    <button
      type="button"
      className={`${styles.card} ${className}`}
      onClick={onClick}
      aria-label={`Open ${card.title}`}
    >
      <Image src={card.url} alt={card.title} fill sizes="(min-width: 900px) 320px, 220px" className={styles.cardImage} />
      <span className={styles.cardShade} aria-hidden="true" />
      <span className={styles.cardTitle}>{card.title}</span>
    </button>
  );
}

function MarqueeRow({ cards, speed, direction, cardClassName, onCardClick }: MarqueeRowProps) {
  const rowClass = direction === -1 ? styles.moveLeft : styles.moveRight;
  const repeatedCards = [...cards, ...cards];

  return (
    <div className={styles.rowViewport}>
      <div className={`${styles.rowTrack} ${rowClass}`} style={{ '--speed': `${speed}s` } as React.CSSProperties}>
        {repeatedCards.map((card, index) => (
          <Card
            key={`${card.id}-${index}`}
            card={card}
            className={cardClassName}
            onClick={() => onCardClick?.(card)}
          />
        ))}
      </div>
    </div>
  );
}

export default function DiagonalMarqueeCarousel({
  cards = [],
  angle = -25,
  baseSpeed = 120,
  alternateDirections = true,
  className = '',
  cardClassName = '',
  fadeClassName = '',
  onCardClick,
}: DiagonalMarqueeCarouselProps) {
  if (cards.length === 0) return null;

  const rows = [
    { direction: -1 as const, speed: baseSpeed },
    { direction: alternateDirections ? 1 : -1 as 1 | -1, speed: Math.max(baseSpeed - 15, 30) },
    { direction: -1 as const, speed: baseSpeed + 15 },
    { direction: alternateDirections ? 1 : -1 as 1 | -1, speed: Math.max(baseSpeed - 6, 35) },
    { direction: -1 as const, speed: baseSpeed + 24 },
  ];

  return (
    <section className={`${styles.carousel} ${className}`} aria-label="Moving gallery highlights">
      <div className={`${styles.marqueeField} ${fadeClassName}`} style={{ transform: `rotate(${angle}deg)` }}>
        {rows.map((row, index) => (
          <MarqueeRow
            key={index}
            cards={cards}
            speed={row.speed}
            direction={row.direction}
            cardClassName={cardClassName}
            onCardClick={onCardClick}
          />
        ))}
      </div>
      <div className={styles.fadeTop} aria-hidden="true" />
      <div className={styles.fadeBottom} aria-hidden="true" />
    </section>
  );
}
