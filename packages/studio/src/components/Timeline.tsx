import { useRef, type ReactElement, useState, useLayoutEffect } from "react";

import { TimeMarker } from './TimeMarker';

import styles from './Timeline.module.css';

interface Props {
  durationMilliseconds: number;
  stepMilliseconds: number;
  currentTime: number;
  onTimeSelect: (milliseconds: number) => void;
}

function millisecondsToTranslateX(currentTimeMilliseconds: number, durationMilliseconds: number, containerWidth: number) {
  return (currentTimeMilliseconds / durationMilliseconds) * containerWidth;
}

function leftToMilliseconds(left: number, durationMilliseconds: number, containerWidth: number): number {
  const millisecondsPerPixel = durationMilliseconds/ containerWidth;
  return Math.round(left * millisecondsPerPixel);
}

export function Timeline({ durationMilliseconds, stepMilliseconds, onTimeSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
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
    for(let currentTimeMilliseconds = stepMilliseconds; currentTimeMilliseconds < durationMilliseconds; currentTimeMilliseconds += stepMilliseconds) {
      
      const transform = millisecondsToTranslateX(
        currentTimeMilliseconds,
        durationMilliseconds,
        containerWidth,
      );

      marks.push((
        <TimeMarker
          key={currentTimeMilliseconds}
          transformX={transform}
        >
          {currentTimeMilliseconds / 1000}
        </TimeMarker>
      ))
    }
  }
  return (
    <div 
      onClick={(e) => {
        if (containerWidth === undefined) {
          return;
        }
        const { left } = containerRef.current!.getBoundingClientRect();
        const relativeLeft = e.pageX - left;
        const milliseconds = leftToMilliseconds(
          relativeLeft,
          durationMilliseconds,
          containerWidth
        );
        onTimeSelect(milliseconds);
      }}
      ref={containerRef} className={styles.container}>
      {marks}
    </div>
  )
}
