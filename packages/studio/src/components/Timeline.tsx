import { useRef,useState, useLayoutEffect, type ReactNode, useContext, createContext, useCallback } from "react";
import { useDrag, type Vector2 } from '@use-gesture/react';
import rafThrottle from 'raf-throttle';

import styles from './Timeline.module.css';

interface Props {
  durationMilliseconds: number;
  onTimeMouseOver(params: { milliseconds: number, translateX: number }): void;
  onTimeMouseOut(): void;
  onTimeSelect: (milliseconds: number) => void;
  children?: ReactNode;
  windowDurationMilliseconds: number;
}

function millisecondsToTranslateX(millisecond: number, displayWindow: DisplayWindow, containerWidth: number) {
  const { startMillisecond, durationMillisecond } = displayWindow;
  const pixelsPerMillisecond = containerWidth / durationMillisecond;
  return (millisecond - startMillisecond) * pixelsPerMillisecond;
}

function leftToMilliseconds(left: number, displayWindow: {
  startMillisecond: number;
  durationMillisecond: number;
}, containerWidth: number): number {
  const { startMillisecond, durationMillisecond } = displayWindow;
  const millisecondsPerPixel = durationMillisecond / containerWidth;
  return Math.round(left * millisecondsPerPixel) + startMillisecond;
}

const TimelineContext = createContext<{
  displayWindow: DisplayWindow;
  containerWidth: number;
} | null>(null);

interface DisplayWindow {
  startMillisecond: number;
  durationMillisecond: number;
}


export function useTimeline() {
  const context = useContext(TimelineContext);
  if (context === null) {
    throw new Error('Null timeline context');
  }
  const { displayWindow, containerWidth } = context;
  return {
    displayWindow,
    getTranslateX: (millisecond: number) => {
      return millisecondsToTranslateX(millisecond, displayWindow, containerWidth)
    }
  }
}

function curryPreviousArguments<T>(cb: (data: T[]) => void) {
  let lastArguments: T[] = [];
  const throttled = rafThrottle(() => {
    cb(lastArguments);
    lastArguments = [];
  });

  return (arg: T) => {
    lastArguments.push(arg);
    throttled();
  }
}

export function Timeline({ onTimeMouseOut, windowDurationMilliseconds, children, onTimeMouseOver, onTimeSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined);
  const [{ startMillisecond }, setStartMillisecond] = useState<{
    startMillisecond: number;
  }>({
    startMillisecond: 0,
  });
  const displayWindow: DisplayWindow = {
    startMillisecond,
    durationMillisecond: windowDurationMilliseconds,
  }

  const bind = useDrag(
    curryPreviousArguments<{ delta: Vector2 }>((data) => {
      const distanceX = data.reduce((seed, { delta }) => {
        return seed + delta[0];
      }, 0);

      const millisecondsPerPixel = windowDurationMilliseconds / (containerWidth as number);
      let nextStart = displayWindow.startMillisecond - (distanceX * millisecondsPerPixel);
      if (nextStart < 0) {
        nextStart = 0;
      }

      if (startMillisecond === nextStart) {
        return;
      }
      setStartMillisecond({
        startMillisecond: nextStart,
      });
    })
  )

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
      displayWindow,
    }}>
      <div 
        {...bind()}
        onMouseLeave={() => {
          onTimeMouseOut();
        }}
        onMouseMove={(e) => {
          if (containerWidth === undefined) {
            return;
          }
          const { left } = containerRef.current!.getBoundingClientRect();
          const relativeLeft = e.pageX - left;
          const milliseconds = leftToMilliseconds(
            relativeLeft,
            displayWindow,
            containerWidth
          );
          onTimeMouseOver({ milliseconds, translateX: relativeLeft });
        }}
        onClick={(e) => {
          if (containerWidth === undefined) {
            return;
          }
          const { left } = containerRef.current!.getBoundingClientRect();
          const relativeLeft = e.pageX - left;
          const milliseconds = leftToMilliseconds(
            relativeLeft,
            displayWindow,
            containerWidth
          );
          onTimeSelect(milliseconds);
        }}
        ref={containerRef} className={styles.container}>
        {children}
      </div>
    </TimelineContext.Provider>
  )
}
