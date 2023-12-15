import type { VideoClip, VideoSource } from "../lib/video-document";
import { VideoPreview } from "./VideoPreview";

import styles from './ClipPreview.module.css';

interface Props {
  clip: VideoClip;
}

export function ClipPreview({ clip }: Props) {
  const { url: clipUrl, trim } = clip;
  const { startMilliseconds, durationMilliseconds: trimDurationMilliseconds } = trim;

  const previews = [];
  const step = trimDurationMilliseconds / 4;
  for(let milliseconds = startMilliseconds; milliseconds <= trimDurationMilliseconds + startMilliseconds; milliseconds += step) {
    previews.push((
      <VideoPreview 
        className={styles.clip} 
        key={milliseconds} 
        videoUrl={clipUrl} 
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