import type { Clip, Source, VideoClip, VideoSource } from "../lib/video-document";
import { VideoPreview } from "./VideoPreview";

import styles from './ClipPreview.module.css';
import { AnimationThumbnail } from "./AnimationThumbnail";

interface Props {
  clip: Clip;
  source: Source;
}

export function ClipPreview({ clip, source }: Props) {
  const { trim } = clip;
  const { startMilliseconds, durationMilliseconds: trimDurationMilliseconds } = trim;

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

    previews.push(
      <AnimationThumbnail 
        className={styles.clip} 
        contents={{
          html: source.html,
          css: source.css,
        }} millisecond={600} />
    )
  }
  

  return (
    <>
      {previews}
    </>
  )
}