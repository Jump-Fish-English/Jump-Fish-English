import type { VideoClip, VideoSource } from "../lib/video-document";
import { VideoPreview } from "./VideoPreview";

import styles from './ClipPreview.module.css';

interface Props {
  clip: VideoClip;
  source: VideoSource;
}

export function ClipPreview({ clip, source }: Props) {
  const { trim } = clip;
  const { startMilliseconds, durationMilliseconds: trimDurationMilliseconds } = trim;

  const previews = [];
  const step = trimDurationMilliseconds / 4;
  for(let milliseconds = startMilliseconds; milliseconds < trimDurationMilliseconds + startMilliseconds; milliseconds += step) {
    previews.push((
      <VideoPreview 
        className={styles.clip} 
        key={milliseconds} 
        source={source}
        milliseconds={milliseconds}
      />
    ))
  }
  

  return (
    <>
      {previews}
    </>
  )
}