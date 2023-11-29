export interface FiniteStateMachine<T> {
  state: T;
  transition(state: T): void;
}

export interface State {
  exit?(): void;
  enter?(): void;
}

interface FsmOptions {
  onTransition?(): void;
}

export function createFsm<T extends State>(initialState: T, options: FsmOptions = {}): FiniteStateMachine<T> {
  return {
    state: initialState,
    transition(next: T) {
      this.state.exit?.();
      next.enter?.();
      this.state = next;
      options.onTransition?.();
    }
  }
}