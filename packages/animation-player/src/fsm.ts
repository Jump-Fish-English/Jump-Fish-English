interface AnimationContents {
  css: string;
  html: string;
}

type AnimationState = {
  shadowRoot: ShadowRoot;
  element: HTMLElement;
  enterState(state: AnimationPlayerState): void;
}

type AnimationStateReady = {
  longestAnimation: Animation;
  animations: Animation[];
  durationMilliseconds: number;
  currentTimeMilliseconds: number;
} & AnimationState;

type AnimationStateEmpty = AnimationState


function coerceEffectTiming(timing: string | number | CSSNumericValue | null) {
  if (typeof timing === 'number') {
    return timing;
  }

  if (timing === null) {
    return 0;
  }
  
  if (typeof timing === 'string') {
    return parseFloat(timing);
  }

  return parseFloat(timing.toString());
}


function getDuration(animations: Animation[]): {
  duration: number;
  longestAnimation?: Animation;
} {
  return animations.reduce((acc, animation) => {
    const { effect } = animation;
    if (effect === null) {
      return acc;
    }

    const { duration: effectDuration, delay = 0 } = effect.getTiming();
    
    if (effectDuration === undefined) {
      return acc;
    }
    
    const milliseconds = coerceEffectTiming(effectDuration) + delay;

    if (milliseconds > acc.duration) {
      return {
        duration: milliseconds,
        longestAnimation: animation,
      };
    }
    return acc;
  }, {
    duration: 0,
  });
}

export interface AnimationPlayerState {
  state: 'empty' | 'paused' | 'playing' | 'loading' | 'seeking';
  enter?(): void;
  exit?(): void;
  load?(content: AnimationContents): void;
  play?(): void;
  pause?(): void;
  seek?(milliseconds: number): void;
  currentTimeMilliseconds: number;
  durationMilliseconds: number;
}

function playState(animationState: AnimationStateReady): AnimationPlayerState {
  const { element, longestAnimation, currentTimeMilliseconds, enterState, durationMilliseconds, animations } = animationState;

  let raf: number | undefined;
  let nextCurrentTimeMilliseconds: number = currentTimeMilliseconds;
  function onFinished() {
    const customEvent = new CustomEvent('ended');
    element.dispatchEvent(customEvent);
    enterState(
      pausedState({
        ...animationState,
        currentTimeMilliseconds: coerceEffectTiming(longestAnimation.currentTime),
      })
    );
  }

  function timeUpdateLoop() {
    raf = requestAnimationFrame(() => {
      nextCurrentTimeMilliseconds = coerceEffectTiming(longestAnimation?.currentTime || 0);
      const customEvent = new CustomEvent('timeupdate');
      element.dispatchEvent(customEvent);
      timeUpdateLoop();
    });
    
  }

  return {
    state: 'playing',
    durationMilliseconds,
    get currentTimeMilliseconds() {
      return nextCurrentTimeMilliseconds;
    },
    enter() {
      longestAnimation.addEventListener('finish', onFinished);

      animations.forEach((animation) => {
        animation.play();
      });

      raf = requestAnimationFrame(timeUpdateLoop);
    },
    exit() {
      if (raf !== undefined) {
        cancelAnimationFrame(raf);
      }
      longestAnimation.removeEventListener('finish', onFinished);
    },
    seek(seconds) {
      enterState(
        seekingState(seconds * 1000, animationState)
      );
    },
    pause() {
      enterState(
        pausedState(animationState)
      )
    },
  }
}

function seekingState(milliseconds: number, animationState: AnimationStateReady): AnimationPlayerState {
  const { enterState, durationMilliseconds, animations, element, longestAnimation } = animationState;
  
  return {
    state: 'seeking',
    durationMilliseconds,
    get currentTimeMilliseconds() {
      return coerceEffectTiming(longestAnimation.currentTime);
    },
    exit() {
      element.dispatchEvent(
        new CustomEvent('seeked')
      );
    },
    enter() {
      const { playState: animationPlayState } = longestAnimation;
      element.dispatchEvent(
        new CustomEvent('seeking')
      );

      animations.forEach((animation) => {
        animation.currentTime = milliseconds;
      });
      

      if (animationPlayState === 'paused') {
        enterState(
          pausedState({
            ...animationState,
            currentTimeMilliseconds: coerceEffectTiming(longestAnimation.currentTime),
          })
        );
        return;
      }
      
      enterState(
        playState({
          ...animationState,
          currentTimeMilliseconds: coerceEffectTiming(longestAnimation.currentTime),
        })
      );
      
    }
  }
}

function pausedState(animationState: AnimationStateReady): AnimationPlayerState {
  const { durationMilliseconds, animations, currentTimeMilliseconds, enterState, element } = animationState;

  return {
    state: 'paused',
    durationMilliseconds,
    currentTimeMilliseconds,
    enter() {
      element.dispatchEvent(
        new CustomEvent('pause')
      );

      animations.forEach((animation) => {
        animation.pause();
      });
    },
    seek(seconds) {
      enterState(
        seekingState(seconds * 1000, animationState)
      );
    },
    play() {
      enterState(
        playState(animationState),
      );
    },
  }
}

function loadingState({ css, html }: AnimationContents, animationState: AnimationStateEmpty): AnimationPlayerState {
  const { shadowRoot, enterState, element } = animationState;
  let durationMilliseconds = 0;
  
  return {
    state: 'loading',
    currentTimeMilliseconds: 0,
    get durationMilliseconds() {
      return durationMilliseconds;
    },
    exit() {
      element.dispatchEvent(
        new CustomEvent('canplaythrough')
      );

      element.dispatchEvent(
        new CustomEvent('durationchange')
      );
    },
    async enter() {
      if (element.isConnected === false) {
        console.log('Attempting to load animations for an element that is not connected to DOM. This will not work as expected');
      }
      const event = new CustomEvent('loadstart');
      element.dispatchEvent(event);

      shadowRoot.innerHTML = `
        <style>
          ${css}
        </style>
        ${html}
      `;
      const animations = shadowRoot.getAnimations();
      const { duration, longestAnimation } = getDuration(animations);
  
      if (longestAnimation === undefined) {
        enterState(
          emptyState(animationState)
        );
        return;
      }
      
      durationMilliseconds = duration;
      
      try {
        await longestAnimation.ready;
        enterState(
          pausedState({
            ...animationState,
            currentTimeMilliseconds: 0,
            durationMilliseconds: duration,
            animations,
            longestAnimation,
          })
        )
      } catch {}
    }
  }
}

export function emptyState(animationState: AnimationStateEmpty): AnimationPlayerState {
  const { enterState } = animationState;
  return {
    state: 'empty',
    durationMilliseconds: 0,
    currentTimeMilliseconds: 0,
    load(content) {
      enterState(
        loadingState(content, animationState)
      )
    },
  }
}
