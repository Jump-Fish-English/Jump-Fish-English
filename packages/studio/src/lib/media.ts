export interface Media {
  seek(milliseconds: number): void;
  pause(): void;
  play(): void;
  delay: number;
  currentTime: number;
  duration: number;
  onFinished(cb: () => void): () => void;
  playState: AnimationPlayState;
}

function animationMedia(value: Animation): Media {
  return {
    onFinished(cb) {
      value.addEventListener('finish', cb);

      return () => {
        value.removeEventListener('finish', cb);
      }
    },
    get currentTime() {
      const { currentTime } = value;
      if (currentTime === null) {
        return 0;
      }
      return currentTime as number;
    },
    get delay() {
      const computedTiming = value.effect?.getComputedTiming();
      if (computedTiming === undefined) {
        return 0;
      }
      const { delay } = computedTiming;
      if (delay === undefined) {
        return 0;
      }
      return delay;
    },
    get playState() {
      return value.playState;
    },
    seek(milliseconds: number) {
      value.currentTime = milliseconds;
      value.commitStyles();
    },
    play() {
      value.play();
    },
    pause() {
      value.pause();
    },
    get duration() {
      const computedTiming = value.effect?.getComputedTiming();
      if (computedTiming === undefined) {
        return 0;
      }
      const { duration } = computedTiming;
      if (typeof duration !== 'number') {
        return 0;
      }
      return duration;
    }
  }
}

export function initMedia(value: Animation): Media {
  return animationMedia(value);
}
