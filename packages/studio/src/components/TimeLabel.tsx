interface Props {
  milliseconds: number;
}

function millisecondsToHoursMinutesSeconds(milliseconds: number) {
  let seconds = Math.floor(milliseconds / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);

  // To get the remaining minutes and seconds
  minutes = minutes % 60;
  seconds = seconds % 60;
  const remainingMilliseconds = milliseconds % 1000;

  return { hours, minutes, seconds, milliseconds: remainingMilliseconds };
}

function leadingZero(value: number): string {
  if (value < 10) {
    return `0${value}`;
  }

  return `${value}`;
}

function formatToThreeDigits(number: number, digits: number = 3) {
  return String(number).padStart(digits, '0');
}


export function TimeLabel({ milliseconds }: Props) {
  const { hours, minutes, seconds, milliseconds: remainingMilliseconds } = millisecondsToHoursMinutesSeconds(milliseconds);

  const labels: string[] = [];

  if (hours !== 0) {
    labels.push(leadingZero(hours));
  }

  labels.push(leadingZero(minutes));
  labels.push(
    `${leadingZero(seconds)}.${formatToThreeDigits(Math.floor(remainingMilliseconds))}`
  );
  
  return (
    <span>
      {labels.join(':')}
    </span>
  )
}