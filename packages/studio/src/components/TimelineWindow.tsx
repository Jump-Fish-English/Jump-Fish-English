import { useDrag } from '@use-gesture/react';
import { useTimeline } from './Timeline';

import styles from './TimelineWindow.module.css';
import { TimelineWindowHandle } from './TimelineWindowHandle';

interface Props {
  videoDurationMilliseconds: number;
  timeRange: {
    startMilliseconds: number;
    durationMilliseconds: number;
  };
  onRangeChange({
    startMilliseconds,
    durationMilliseconds,
  }: Props['timeRange']): void;
}

export function TimelineWindow({
  videoDurationMilliseconds,
  onRangeChange,
  timeRange,
}: Props) {
  const { startMilliseconds, durationMilliseconds } = timeRange;
  const { getTranslateX, pixelToDurationMilliseconds } = useTimeline();
  const startTranslateX = getTranslateX(startMilliseconds);
  const endTranslateX = getTranslateX(startMilliseconds + durationMilliseconds);
  const dragHandlers = useDrag(({ delta }) => {
    const duration = pixelToDurationMilliseconds(delta[0]);
    let next = startMilliseconds + duration;
    if (next < 0) {
      next = 0;
    }

    if (next + durationMilliseconds > videoDurationMilliseconds) {
      next = videoDurationMilliseconds - durationMilliseconds;
    }

    onRangeChange({
      startMilliseconds: next,
      durationMilliseconds,
    });
  });

  return (
    <div
      className={styles.container}
      style={{
        transform: `translateX(${startTranslateX}px)`,
        width: `${endTranslateX - startTranslateX}px`,
      }}
    >
      <div {...dragHandlers()} className={styles.draggable} />
      <TimelineWindowHandle
        onDrag={(deltaPixels) => {
          const durationDeltaMilliseconds =
            pixelToDurationMilliseconds(deltaPixels);
          onRangeChange({
            startMilliseconds: startMilliseconds + durationDeltaMilliseconds,
            durationMilliseconds:
              durationMilliseconds - durationDeltaMilliseconds,
          });
        }}
        className={styles['handle-start']}
      />
      <TimelineWindowHandle
        onDrag={(deltaPixels) => {
          const durationDeltaMilliseconds =
            pixelToDurationMilliseconds(deltaPixels);
          onRangeChange({
            startMilliseconds,
            durationMilliseconds:
              durationMilliseconds + durationDeltaMilliseconds,
          });
        }}
        className={styles['handle-end']}
      />
    </div>
  );
}
