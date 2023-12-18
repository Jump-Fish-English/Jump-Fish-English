import type { Player } from "../hooks/usePlayer";
import type { Clip, Source, VideoDocument } from "../lib/video-document";
import { ClipPreview } from "./ClipPreview";
import { Timeline } from "./Timeline";

import { Menu, MenuItem } from "./Menu";
import { TimeLabel } from "./TimeLabel";
import styles from './ClipTimeline.module.css';

interface ItemProps {
  player: Player;
  source: Source;
  clip: Clip;
  startMilliseconds: number;
  durationMilliseconds: number;
  onDeleteClip?: () => void;
}


type Actions = 'seek' | 'delete-clip';

function TimelineItem({ onDeleteClip, startMilliseconds, durationMilliseconds, clip, source, player: videoPlayer }: ItemProps) {
  return (
    <article onKeyUp={(e) => {
        if (e.key === 'Backspace') {
          onDeleteClip?.();
        }
      }} tabIndex={0} className={styles.container}>
      <Timeline
        className={styles['clip-summary']}
        contextMenu={(milliseconds) => {
          return (
            <Menu aria-label="Video Actions" className={styles['context-menu']} onAction={(action) => {
              switch(action as Actions) {
                case 'seek': {
                  videoPlayer.seek(milliseconds);
                  break;
                }
                case 'delete-clip': {
                  onDeleteClip?.();
                  break;
                }
              }
            }}>
              <MenuItem textValue="Jump to milliseconds" key="seek">Jump to <TimeLabel milliseconds={milliseconds} /></MenuItem>
              <MenuItem textValue="Jump to milliseconds" key="delete-clip">Delete Clip</MenuItem>
            </Menu>
          )
        }}
        onTimeSelect={(milliseconds) => {
          videoPlayer.seek(milliseconds);
        }}
        timeRange={{
          startMilliseconds,
          durationMilliseconds: durationMilliseconds,
        }}
        durationMilliseconds={durationMilliseconds}
      >
        <ClipPreview source={source} clip={clip} />
      </Timeline>
    </article>
  )
}

interface Props {
  player: Player;
  sources: Record<string, Source>;
  doc: VideoDocument;
  onDeleteClip: (clip: Clip) => void;
}

export function ClipTimeline({ sources, onDeleteClip, doc, player: videoPlayer }: Props) {
  let currentMilliseconds = 0;
  const timelines = doc.timeline.map((item, index) => {
    const source = sources[item.source];
    const { durationMilliseconds: sourceDurationMilliseconds } = item.win;
    const timeline = (
      <TimelineItem
        onDeleteClip={() => {
          onDeleteClip(item);
        }}
        key={item.id}
        clip={item}
        source={source}
        player={videoPlayer}
        startMilliseconds={currentMilliseconds}
        durationMilliseconds={sourceDurationMilliseconds}
      />
    );

    currentMilliseconds += sourceDurationMilliseconds;

    return timeline;
  })

  return (
    <>
      {timelines}
    </>
  )
}