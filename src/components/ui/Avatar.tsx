import React from 'react';
import Image from 'next/image';
import styles from './Avatar.module.css';

interface AvatarProps {
  name: string;
  image?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({
  name,
  image,
  size = 'md',
  className,
}: AvatarProps) {
  const initials = getInitials(name);
  const sizePx = size === 'sm' ? 24 : size === 'md' ? 32 : size === 'lg' ? 44 : 64;

  if (image) {
    return (
      <div className={`${styles.avatar} ${styles[size]} ${className || ''}`}>
        <Image
          src={image}
          alt={name}
          width={sizePx}
          height={sizePx}
          className={styles.image}
        />
      </div>
    );
  }

  // Deterministic subtle sky wash based on name string
  const hash = hashString(name);
  const skyShades = [
    { bg: '#E0F2FE', color: '#0369A1', border: '#BAE6FD' },
    { bg: '#EFF6FD', color: '#0284C7', border: '#CFE3F7' },
    { bg: '#E3EFFB', color: '#0C233C', border: '#9EC3E6' },
    { bg: '#D8ECFD', color: '#0A2540', border: '#B3D7F8' },
  ];
  const shade = skyShades[Math.abs(hash) % skyShades.length];

  return (
    <div
      className={`${styles.avatar} ${styles[size]} ${className || ''}`}
      style={{ background: shade.bg, color: shade.color, borderColor: shade.border }}
      aria-label={name}
      title={name}
    >
      {initials}
    </div>
  );
}

function getInitials(name: string): string {
  if (!name) return 'B';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
