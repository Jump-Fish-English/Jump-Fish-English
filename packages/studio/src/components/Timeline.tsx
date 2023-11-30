import { useRef,useState, useLayoutEffect, type ReactNode, useContext, createContext } from "react";
import rafThrottle from 'raf-throttle';

import styles from './Timeline.module.css';

export interface TimeRange {
  startMilliseconds: number;
  durationMilliseconds: number;
}

interface Props {
  durationMilliseconds: number;
  onTimeMouseOver?(params: { milliseconds: number, translateX: number }): void;
  onTimeMouseOut?(): void;
  onTimeSelect?: (milliseconds: number) => void;
  children?: ReactNode;
  timeRange: TimeRange;
}

function millisecondsToTranslateX(millisecond: number, displayWindow: TimeRange, containerWidth: number) {
  const { startMilliseconds, durationMilliseconds } = displayWindow;
  const pixelsPerMillisecond = containerWidth / durationMilliseconds;
  return (millisecond - startMilliseconds) * pixelsPerMillisecond;
}

function leftToMilliseconds(left: number, timeRange: TimeRange, containerWidth: number): number {
  const { startMilliseconds, durationMilliseconds } = timeRange;
  const millisecondsPerPixel = durationMilliseconds / containerWidth;
  return Math.round(left * millisecondsPerPixel) + startMilliseconds;
}

const TimelineContext = createContext<{
  timeRange: TimeRange;
  containerWidth: number;
} | null>(null);


export function useTimeline() {
  const context = useContext(TimelineContext);
  if (context === null) {
    throw new Error('Null timeline context');
  }
  const { timeRange, containerWidth } = context;
  return {
    getTranslateX: (millisecond: number) => {
      return millisecondsToTranslateX(millisecond, timeRange, containerWidth)
    },
    pixelToDurationMilliseconds(pixel: number) {
      return leftToMilliseconds(pixel, timeRange, containerWidth);
    }
  }
}

export function Timeline({ onTimeMouseOut, timeRange, children, onTimeMouseOver, onTimeSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined);
  const [{ startMillisecond }, setStartMillisecond] = useState<{
    startMillisecond: number;
  }>({
    startMillisecond: 0,
  });

  useLayoutEffect(() => {
    const { current } = containerRef;
    if (current === null) {
      return;
    }

    setContainerWidth(current.getBoundingClientRect().width);
  }, [containerRef.current]);

  return (
    <TimelineContext.Provider value={{
      containerWidth: containerWidth === undefined ? 0 : containerWidth,
      timeRange,
    }}>
      <div
        onMouseLeave={() => {
          onTimeMouseOut?.();
        }}
        onMouseMove={(e) => {
          if (containerWidth === undefined) {
            return;
          }
          const { left } = containerRef.current!.getBoundingClientRect();
          const relativeLeft = e.pageX - left;
          const milliseconds = leftToMilliseconds(
            relativeLeft,
            timeRange,
            containerWidth
          );
          onTimeMouseOver?.({ milliseconds, translateX: relativeLeft });
        }}
        onClick={(e) => {
          if (containerWidth === undefined) {
            return;
          }
          const { left } = containerRef.current!.getBoundingClientRect();
          const relativeLeft = e.pageX - left;
          const milliseconds = leftToMilliseconds(
            relativeLeft,
            timeRange,
            containerWidth
          );
          onTimeSelect?.(milliseconds);
        }}
        ref={containerRef} className={styles.container}>
        {children}
      </div>
    </TimelineContext.Provider>
  )
}
