import { AnimationPlayerState, emptyState } from "./fsm";

interface AnimationContents {
  css: string;
  html: string;
}


export class AnimationPlayer extends HTMLElement {
  shadowRoot: ShadowRoot;
  #state: AnimationPlayerState;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.#state = emptyState({
      shadowRoot: this.shadowRoot,
      element: this,
      enterState: (nextState) => {
        this.#state.exit?.();
        this.#state = nextState;
        nextState.enter?.();
      }
    });
  }

  get duration() {
    return this.#state.durationMilliseconds / 1000;
  }

  get currentTime() {
    return this.#state.currentTimeMilliseconds / 1000;
  }

  set currentTime(seconds: number) {
    this.#state.seek?.(seconds);
  }

  play() {
    this.#state.play?.();
  }

  pause() {
    this.#state.pause?.();
  }

  load(contents: AnimationContents) {
    this.#state.load?.(contents);
  }
  
}