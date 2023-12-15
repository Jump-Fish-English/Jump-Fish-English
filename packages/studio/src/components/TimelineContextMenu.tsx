import { MenuItem, Menu } from "./Menu";
import { TimeLabel } from "./TimeLabel";

import styles from './TimelineContextMenu.module.css';

type Actions = 'seek';

interface Props {
  milliseconds: number;
  onSeek(millisecond: number): void;
}

export function TimelineContextMenu({ onSeek, milliseconds }: Props) {
  return (
    <Menu aria-label="Video Actions" className={styles['context-menu']} onAction={(action) => {
      switch(action as Actions) {
        case 'seek': {
          onSeek(milliseconds);
          break;
        }
      }
    }}>
      <MenuItem textValue="Jump to milliseconds" key="seek">Jump to <TimeLabel milliseconds={milliseconds} /></MenuItem>
    </Menu>
  )
}