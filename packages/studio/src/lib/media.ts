export type MediaTypes = Animation | HTMLVideoElement;

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

function videoMedia(value: HTMLVideoElement): Media {
  return {
    onFinished(cb) {
      value.addEventListener('ended', cb);

      return () => {
        value.removeEventListener('ended', cb);
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
      return 0;
    },
    get playState() {
      switch(true) {
        case value.paused: {
          return 'paused';
        }
        case value.ended: {
          return 'finished';
        }
        case value.readyState === 0: {
          return 'idle';
        }
      }

      return 'running';
    },
    seek(milliseconds: number) {
      value.currentTime = milliseconds;
    },
    play() {
      value.play();
    },
    pause() {
      value.pause();
    },
    get duration() {
      return value.duration;
    }
  }
}


export function initMedia(value: MediaTypes): Media {
  if ('tagName' in value) {
    return videoMedia(value);
  }
  return animationMedia(value);
}
