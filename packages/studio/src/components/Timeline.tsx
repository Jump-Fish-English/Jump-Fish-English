import { useRef, type ReactElement, useState, useLayoutEffect, type ReactNode, useContext, createContext } from "react";
import { useDrag } from '@use-gesture/react';
import { TimeMarker } from './TimeMarker';

import styles from './Timeline.module.css';

interface Props {
  durationMilliseconds: number;
  stepMilliseconds: number;
  onTimeMouseOver(params: { milliseconds: number, translateX: number }): void;
  onTimeMouseOut(): void;
  onTimeSelect: (milliseconds: number) => void;
  children?: ReactNode;
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

function findRange(start: number, end: number, interval: number): number[] {
  const numbers: number[] = [];
  let i = Math.ceil(start/interval)*interval;
  numbers.push(i);
  while(i < end) {
    i += interval;
    numbers.push(i);
  }
  return numbers;
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
    getTranslateX: (millisecond: number) => {
      return millisecondsToTranslateX(millisecond, displayWindow, containerWidth)
    }
  }
}

export function Timeline({ onTimeMouseOut, children, onTimeMouseOver, stepMilliseconds, onTimeSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayWindow, setDisplayWindow] = useState<{
    startMillisecond: number;
    durationMillisecond: number;
  }>({
    startMillisecond: 0,
    durationMillisecond: 1000
  });
  const bind = useDrag(({ delta }) => {
    let nextStart = displayWindow.startMillisecond - delta[0];
    if (nextStart < 0) {
      nextStart = 0;
    }
    setDisplayWindow({
      startMillisecond: nextStart,
      durationMillisecond: displayWindow.durationMillisecond,
    });
  });
  const [containerWidth, setContainerWidth] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const { current } = containerRef;
    if (current === null) {
      return;
    }

    setContainerWidth(current.getBoundingClientRect().width);
  }, [containerRef.current]);


  const marks: ReactElement[] = [];

  if (containerWidth !== undefined) {
    const start = displayWindow.startMillisecond;
    const end = displayWindow.startMillisecond + displayWindow.durationMillisecond;
    const range = findRange(start, end, stepMilliseconds);

    for(let i = 0; i < range.length; i += 1) {
      marks.push((
        <TimeMarker
          key={range[i]}
          millisecond={range[i]}
        >
          {range[i]}
        </TimeMarker>
      ))
    }
  }
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
        {marks}
        {children}
      </div>
    </TimelineContext.Provider>
  )
}
