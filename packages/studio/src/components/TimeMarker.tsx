import type { ReactNode } from 'react';
import styles from './TimeMarker.module.css';

interface Props {
  transformX: number;
  children?: ReactNode;
}

export function TimeMarker({ transformX, children }: Props) {
  return (
    <span
      className={styles.mark} 
      style={{ 
        transform: `translateX(${transformX}px)`
      }} 
    >
      { children !== undefined && (
        <span className={styles.children}>
          {children}
        </span>
      )}
    </span>
  );
}