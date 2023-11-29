import { initMedia, type Media } from './media';
import { createFsm, type State as FsmState, type FiniteStateMachine } from './fsm';

type PlayerStateMachine = FiniteStateMachine<PlayerState>;
export type PlayerStates = AnimationPlayState | 'seeking';

type PlayerMedia = Animation | HTMLVideoElement;

interface PlayerState extends FsmState {
  playState: PlayerStates;
  seek(milliseconds: number): void;
  load(values: PlayerMedia[]): void;
  play(): void;
  pause(): void;
  duration: number | null;
}

interface MediaState {
  media: Media[];
  duration: number;
  longestMedia: Media;
  onTimeUpdate: (milliseconds: number) => void;
}

function loadMedia(fsm: PlayerStateMachine, values: PlayerMedia[], onTimeUpdate: MediaState['onTimeUpdate']) {
  if (values.length === 0) {
    return;
  }

  const media: Media[] = [];
  values.forEach((animation) => {
    animation.pause();
    animation.currentTime = 0;
    media.push(
      initMedia(animation)
    );
  });

  const longestPlayable = media.reduce((acc, playable) => {
    if (playable.delay + playable.duration > acc.duration + acc.delay) {
      return playable;
    }
    return acc;
  }, media[0]);
  const { duration, delay } = longestPlayable;

  fsm.transition(statePaused(fsm, { longestMedia: longestPlayable, media, duration: duration + delay, onTimeUpdate }))
}

function seekMedia(milliseconds: number, values: Media[]) {
  values.forEach((value) => {
    value.seek(milliseconds);
  });
}

function statePlay(fsm: PlayerStateMachine, { media, duration , onTimeUpdate, longestMedia }: MediaState): PlayerState {
  let rafLoop: number | undefined;
  let unsubscribeOnFinish: () => void = () => {};

  function update() {
    
    rafLoop = requestAnimationFrame(() => {
      onTimeUpdate(longestMedia.currentTime);
      update();
    });
  }

  return {
    playState: 'running',
    exit() {
      unsubscribeOnFinish();
      onTimeUpdate(longestMedia.currentTime);
      if (rafLoop === undefined) {
        return;
      }
      cancelAnimationFrame(rafLoop);
    },
    enter() {
      longestMedia.onFinished(() => {
        fsm.transition(
          statePaused(fsm, { media, duration, onTimeUpdate, longestMedia }),
        );
      });
      update();
      media.forEach((item) => {
        item.play();
      });
    },
    pause() {
      fsm.transition(
        statePaused(fsm, { media, duration, onTimeUpdate, longestMedia }),
      );
    },
    play() {},
    seek(milliseconds) {
      seekMedia(milliseconds, media);
    },
    load() {},
    duration,
  }
}

function statePaused(fsm: PlayerStateMachine, { media, duration, onTimeUpdate, longestMedia }: MediaState): PlayerState {
  return {
    playState: 'paused',
    enter() {
      media.forEach((item) => {
        item.pause();
      });
    },
    pause() {},
    play() {
      fsm.transition(
        statePlay(fsm, { media, duration, onTimeUpdate, longestMedia }),
      );
    },
    seek(milliseconds) {
      seekMedia(milliseconds, media);
      onTimeUpdate(milliseconds);
    },
    load() {},
    duration,
  }
}

export type Player = PlayerState;

interface Params {
  onPlayStateChange?(state: PlayerStates): void;
  onTimeUpdate?(milliseconds: number): void;
}

export function createPlayer({ onPlayStateChange, onTimeUpdate }: Params = {}): Player {
  const fsm = createFsm<PlayerState>({
    playState: 'idle',
    seek() {},
    play() {},
    pause() {},
    load(values) {
      loadMedia(fsm, values, onTimeUpdate === undefined ? () => void 0 : onTimeUpdate);
    },
    duration: null,
  }, {
    onTransition() {
      onPlayStateChange?.(fsm.state.playState);
    }
  });

  return {
    get playState() {
      return fsm.state.playState;
    },
    play() {
      return fsm.state.play();
    },
    pause() {
      return fsm.state.pause();
    },
    seek(milliseconds: number) {
      return fsm.state.seek(milliseconds);
    },
    load(values) {
      return fsm.state.load(values);
    },
    get duration() {
      return fsm.state.duration;
    }
  }
}