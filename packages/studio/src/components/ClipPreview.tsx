import type { Clip, Source } from "../lib/video-document";
import { VideoPreview } from "./VideoPreview";

import styles from './ClipPreview.module.css';

interface Props {
  clip: Clip;
  source: Source;
}

export function ClipPreview({ clip, source }: Props) {
  const { win: clipWindow } = clip;
  const { startMilliseconds, durationMilliseconds: trimDurationMilliseconds } = clipWindow;

  const previews = [];
  const step = trimDurationMilliseconds / 4;
  for(let milliseconds = startMilliseconds; milliseconds < trimDurationMilliseconds + startMilliseconds; milliseconds += step) {
    if (source.type === 'video') {
      previews.push((
        <VideoPreview 
          className={styles.clip} 
          key={milliseconds} 
          source={source}
          milliseconds={milliseconds}
        />
      ));
      continue;
    }
  }
  

  return (
    <>
      {previews}
    </>
  )
}