export interface Playable {
  play(): void;
  pause(): void;
  delay: number;
  currentTime: number;
  duration: number;
  playState: AnimationPlayState;
  onFinished(cb: () => void): void;
  onPlayStateChange(cb: () => void): void;
  onTimeChange(cb: (milliseconds: number) => void): void;
}

interface PlayableEvents {
  onPlayStateChange?: () => void;
  onTimeChange?: (milliseconds: number) => void;
}

function mediaPlayable(value: HTMLVideoElement): Playable {
  let onPlayStateChange: (() => void) | undefined;

  return {
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
      }
      return 'running';
    },
    get currentTime() {
      const { currentTime } = value;
      if (currentTime === null) {
        return 0;
      }
      return currentTime as number;
    },
    set currentTime(milliseconds: number) {
      value.currentTime = milliseconds;
    },
    get duration() {
      return value.duration;
    },
    onPlayStateChange(cb) {
      onPlayStateChange = cb;
    },
    onTimeChange(cb) {
      value.addEventListener('timeupdate', (evt) => {
        cb(value.currentTime);
      })
    },
    onFinished(cb) {
      value.addEventListener('ended', () => {
        onPlayStateChange?.();
        cb();
      });
    },
    play() {
      value.play();
      onPlayStateChange?.();
    },
    pause() {
      value.pause();
      onPlayStateChange?.();
    }
  }
}


interface PlayState {
  playState: AnimationPlayState;
  pause(): void;
  play(): void;
  enter(): void;
  exit(): void;
  seek(milliseconds: number): void;
}

interface PlayStateMachine {
  state: PlayState;
  transition(state: PlayState): void;
}

function animationPlayStateFinished(fsm: PlayStateMachine, value: Animation, events: PlayableEvents): PlayState {
  return {
    get playState() {
      return value.playState;
    },
    seek(milliseconds: number) {
      value.currentTime = milliseconds;
      fsm.transition(
        animationPlayStatePause(fsm, value, events)
      )
    },
    enter() {},
    exit() {},
    pause() {},
    play() {
      fsm.transition(
        animationPlayStatePlay(fsm, value, events)
      )
    }
  }
}


function animationPlayStatePause(fsm: PlayStateMachine, value: Animation, events: PlayableEvents): PlayState {
  return {
    get playState() {
      return value.playState;
    },
    seek(milliseconds: number) {
      value.currentTime = milliseconds;
    },
    enter() {
      value.pause();
    },
    exit() {},
    pause() {},
    play() {
      fsm.transition(
        animationPlayStatePlay(fsm, value, events),
      );
    }
  }
}

function animationPlayStatePlay(fsm: PlayStateMachine, value: Animation, events: PlayableEvents): PlayState {
  const { onTimeChange } = events;
  function onFinish() {
    fsm.transition(
      animationPlayStateFinished(fsm, value, events)
    )
  }
  let timeRaf: number | undefined;

  return {
    get playState() {
      return value.playState;
    },
    enter() {
      value.play();
      value.addEventListener('finish', onFinish);
      if (onTimeChange === undefined) {
        return;
      }
      const trackTime = () => {
        timeRaf = requestAnimationFrame(() => {
          onTimeChange(value.currentTime as number);
          trackTime();
        });
      }
      
      trackTime();
    },
    exit() {
      value.removeEventListener('finish', onFinish);
      if (timeRaf) {
        cancelAnimationFrame(timeRaf);
      }

      if (onTimeChange === undefined) {
        return;
      }
      onTimeChange(value.currentTime as number);
    },
    pause() {
      fsm.transition(
        animationPlayStatePause(fsm, value, events)
      )
    },
    seek(milliseconds: number) {
      value.currentTime = milliseconds;
      fsm.transition(
        animationPlayStatePause(fsm, value, events)
      )
    },
    play() {

    }
  }
}

function animationPlayable(value: Animation): Playable {
  let onTimeChange: ((milliseconds: number) => void) | undefined;
  let onPlayStateChange: (() => void) | undefined;
  let timeRaf: number | undefined;

  const fsm: PlayStateMachine = {
    transition(entering) {
      this.state.exit();
      entering.enter();
      this.state = entering;
      onPlayStateChange?.();
    },
    state: {
      playState: value.playState,
      pause() {},
      enter() {

      },
      seek(milliseconds) {
        value.currentTime = milliseconds;
      },
      exit() {},
      play() {
        fsm.transition(
          animationPlayStatePlay(fsm, value, { onTimeChange, onPlayStateChange })
        );
      }
    }
  };

  return {
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
      return fsm.state.playState;
    },
    get currentTime() {
      const { currentTime } = value;
      if (currentTime === null) {
        return 0;
      }
      return currentTime as number;
    },
    set currentTime(milliseconds: number) {
      fsm.state.seek(milliseconds);
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
    },
    onPlayStateChange(cb) {
      onPlayStateChange = cb;
    },
    onTimeChange(cb) {
      onTimeChange = cb;
    },
    onFinished(cb) {
      if (timeRaf !== undefined) {
        cancelAnimationFrame(timeRaf);
      }

      value.addEventListener('finish', () => {
        onPlayStateChange?.();
        cb();
      });
    },
    play() {
      fsm.state.play();
    },
    pause() {
      fsm.state.pause();
    }
  }
}

function playable(value: Animation | HTMLVideoElement): Playable {
  if ('tagName' in value) {
    return mediaPlayable(value);
  }
  return animationPlayable(value);
}

export function init(values: (Animation | HTMLVideoElement)[], {
  onPlayStateChange,
  onTimeChange
}: PlayableEvents = {}) {
  const playables: Playable[] = [];
  
  values.forEach((animation) => {
    animation.pause();
    animation.currentTime = 0;
    playables.push(
      playable(animation)
    );
  });

  const longestPlayable = playables.reduce((acc, playable) => {
    if (playable.delay + playable.duration > acc.duration + acc.delay) {
      return playable;
    }
    return acc;
  }, playables[0]);
  const { duration, delay } = longestPlayable;
  if (onTimeChange) {
    longestPlayable.onTimeChange(onTimeChange);
  }

  longestPlayable.onPlayStateChange(() => {
    onPlayStateChange?.();
  });

  return {
    get playState() {
      return longestPlayable.playState;
    },
    get currentTime() {
      return longestPlayable.currentTime;
    },
    play() {
      const currentTime = longestPlayable.currentTime;
      const filtered = playables.filter((playable) => {
        return playable.delay + playable.duration > currentTime;
      });

      // don't play animations that are already finished before the current time.
      filtered.forEach((playable) => {
        playable.play();
      });
    },
    restart() {
      playables.forEach((playable) => {
        playable.currentTime = 0;
        playable.play();
      });
    },
    pause() {
      playables.forEach((playable) => {
        playable.pause();
      });
    },
    set currentTime(milliseconds: number) {
      playables.forEach((playable) => {
        playable.currentTime = milliseconds
      });
    },
    get duration() {
      return duration + delay;
    }
  }
}