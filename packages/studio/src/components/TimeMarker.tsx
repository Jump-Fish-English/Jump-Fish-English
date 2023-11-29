import type { ReactNode } from 'react';
import styles from './TimeMarker.module.css';

interface Props {
  transformX: number;
  children?: ReactNode;
  childrenTop?: ReactNode;
  className?: string;
}

export function TimeMarker({ transformX, childrenTop, children }: Props) {
  return (
    <div
      className={styles.mark} 
      style={{ 
        transform: `translateX(${transformX}px)`
      }} 
    >
      {childrenTop !== undefined && (
        <span className={styles.childrenTop}>
          {childrenTop}
        </span>
      )}
      { children !== undefined && (
        <span className={styles.children}>
          {children}
        </span>
      )}
    </div>
  );
}