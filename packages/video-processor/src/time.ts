function millisecondsToHoursMinutesSeconds(milliseconds: number) {
  let seconds = Math.floor(milliseconds / 1000);
  let minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

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

export function millisecondsToFFMpegFormat(milliseconds: number): string {
  const {
    hours,
    minutes,
    seconds,
    milliseconds: remainingMilliseconds,
  } = millisecondsToHoursMinutesSeconds(milliseconds);

  const labels: string[] = [];

  labels.push(leadingZero(hours));
  labels.push(leadingZero(minutes));

  let secondsLabel = leadingZero(seconds);
  if (remainingMilliseconds !== 0) {
    secondsLabel = `${secondsLabel}.${formatToThreeDigits(
      Math.floor(remainingMilliseconds),
    )}`;
  }

  labels.push(secondsLabel);

  return labels.join(':');
}
