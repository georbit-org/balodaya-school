import React from 'react';
import Link from 'next/link';

export interface LedgerItem {
  index: string;
  title: string;
  description?: string;
  meta?: string;
  href?: string;
}

interface LedgerProps {
  items: LedgerItem[];
}

export default function Ledger({ items }: LedgerProps) {
  return (
    <ol style={{ listStyle: 'none', padding: 0, margin: 0, borderBottom: '1px solid var(--rule)' }}>
      {items.map((item) => {
        const content = (
          <div className="ledger-row">
            <span 
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--step--1)',
                color: 'var(--ink-3)',
              }}
              className="ledger-index"
            >
              {item.index}
            </span>

            <div>
              <div 
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--step-1)',
                  color: 'var(--ink)',
                  marginBottom: item.description ? 'var(--s-1)' : 0
                }}
              >
                {item.title}
              </div>
              {item.description && (
                <p style={{ fontSize: 'var(--step-0)', color: 'var(--ink-2)', margin: 0 }}>
                  {item.description}
                </p>
              )}
            </div>

            {item.meta && (
              <span 
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 'var(--step--1)',
                  color: 'var(--ink-3)',
                  whiteSpace: 'nowrap'
                }}
              >
                {item.meta}
              </span>
            )}
          </div>
        );

        return (
          <li key={item.index}>
            {item.href ? (
              <Link href={item.href} style={{ textDecoration: 'none', display: 'block' }}>
                {content}
              </Link>
            ) : (
              content
            )}
          </li>
        );
      })}
    </ol>
  );
}
