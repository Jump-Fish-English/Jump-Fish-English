import type { ReactElement } from "react";
import { TimeMarker } from "./TimeMarker";
import { TimeLabel } from "./TimeLabel";
import { useTimeline } from "./Timeline";

interface Props {
  stepMilliseconds: number;
  labelStepMilliseconds: number;
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

export function TimelineGrid({ labelStepMilliseconds, stepMilliseconds }: Props) {
  const { displayWindow } = useTimeline();
  const start = displayWindow.startMillisecond;
  const end = displayWindow.startMillisecond + displayWindow.durationMillisecond;
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

  console.log('rendered')

  return (
    <>
      {marks}
    </>
  )
}