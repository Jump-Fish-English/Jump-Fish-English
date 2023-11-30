import type { ReactElement } from "react";
import { TimeMarker } from "./TimeMarker";
import { TimeLabel } from "./TimeLabel";
import type { TimeRange } from "./Timeline";

interface Props {
  stepMilliseconds: number;
  labelStepMilliseconds: number;
  timeRange: TimeRange;
}

function findRange(start: number, end: number, interval: number): number[] {
  const numbers: number[] = [];
  let i = Math.ceil(start/interval) * interval;
  numbers.push(i);
  while(i < end) {
    i += interval;
    numbers.push(i);
  }
  return numbers;
}

export function TimelineGrid({ timeRange, labelStepMilliseconds, stepMilliseconds }: Props) {
  const start = timeRange.startMilliseconds;
  const end = timeRange.startMilliseconds + timeRange.durationMilliseconds;
  const range = findRange(start, end, stepMilliseconds);

  const marks: ReactElement[] = [];

  for(let i = 0; i < range.length; i += 1) {
    marks.push((
      <TimeMarker
        key={range[i]}
        millisecond={range[i]}
      >
        {range[i] % labelStepMilliseconds === 0 && <TimeLabel milliseconds={range[i]} />}
      </TimeMarker>
    ))
  }

  return (
    <>
      {marks}
    </>
  )
}