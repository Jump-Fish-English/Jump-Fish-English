import { useRef, type ReactElement, useState, useLayoutEffect, type ReactNode } from "react";

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

function millisecondsToTranslateX(currentTimeMilliseconds: number, durationMilliseconds: number, containerWidth: number) {
  return (currentTimeMilliseconds / durationMilliseconds) * containerWidth;
}

function leftToMilliseconds(left: number, durationMilliseconds: number, containerWidth: number): number {
  const millisecondsPerPixel = durationMilliseconds/ containerWidth;
  return Math.round(left * millisecondsPerPixel);
}

export function Timeline({ onTimeMouseOut, children, onTimeMouseOver, durationMilliseconds, stepMilliseconds, onTimeSelect }: Props) {
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
          {currentTimeMilliseconds}
        </TimeMarker>
      ))
    }
  }
  return (
    <div 
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
          durationMilliseconds,
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
          durationMilliseconds,
          containerWidth
        );
        onTimeSelect(milliseconds);
      }}
      ref={containerRef} className={styles.container}>
      {marks}
      {children}
    </div>
  )
}
