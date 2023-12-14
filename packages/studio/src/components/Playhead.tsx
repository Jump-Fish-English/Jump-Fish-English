import type { PlayerStates } from '../lib/player';
import { TimeLabel } from './TimeLabel';
import styles from './Playhead.module.css';

interface Props {
  currentTimeMilliseconds: number;
  durationMilliseconds: number;
  playState: PlayerStates;
  onPlayClick: () => void;
  onPauseClick: () => void;
}

export function Playhead({ onPauseClick, onPlayClick, playState, currentTimeMilliseconds, durationMilliseconds }: Props) {
  const button = playState === 'running' ? (
    <button onClick={onPauseClick}>
      Pause
    </button>
  ) : (
    <button onClick={onPlayClick}>
      Play
    </button>
  )
  
  return (
    <div className={styles.container}>
      {button}
      <TimeLabel milliseconds={currentTimeMilliseconds} /> / <TimeLabel milliseconds={durationMilliseconds} />
    </div>
  )
}