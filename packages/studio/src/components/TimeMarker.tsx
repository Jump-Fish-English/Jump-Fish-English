import type { ReactNode } from 'react';
import styles from './TimeMarker.module.css';

interface Props {
  transformX: number;
  children?: ReactNode;
  className?: string;
}

export function TimeMarker({ className, transformX, children }: Props) {
  return (
    <div
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
    </div>
  );
}