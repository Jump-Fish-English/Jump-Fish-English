import type { ReactNode } from 'react';
import { useTimeline } from './Timeline';
import styles from './TimeMarker.module.css';

interface Props {
  millisecond: number;
  children?: ReactNode;
  childrenTop?: ReactNode;
  className?: string;
}

export function TimeMarker({ millisecond, childrenTop, children }: Props) {
  const { getTranslateX } = useTimeline();
  const transformX = getTranslateX(millisecond);
  return (
    <div
      className={styles.mark}
      style={{
        transform: `translateX(${transformX}px)`,
      }}
    >
      {childrenTop !== undefined && (
        <span className={styles.childrenTop}>{childrenTop}</span>
      )}
      {children !== undefined && (
        <span className={styles.children}>{children}</span>
      )}
    </div>
  );
}
