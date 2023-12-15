import { useLayoutEffect, useState } from "react";
import { exportFrame } from '@jumpfish/video-processor';
import type { VideoSource } from "../lib/video-document";

import styles from './VideoPreview.module.css';

interface Props {
  className?: string;
  source: VideoSource;
  milliseconds: number;
}

async function loadFrame({ source, milliseconds }: Props) {
  const url = await exportFrame({
    millisecond: milliseconds,
    source: { fileName: source.videoFile.fileName }
  });
  
  return url;
}

export function VideoPreview({ className: classNameProp, source, milliseconds }: Props) {
  const [src, setSrc] = useState<string | undefined>(undefined);

  useLayoutEffect(() => {
    loadFrame({
      source,
      milliseconds,
    })
    .then(setSrc);
  }, [milliseconds, source.videoFile.fileName]);

  const className = [styles.preview, classNameProp].filter((item) => item !== undefined).join(' ');

  if (src === undefined) {
    return (
      <div className={styles.loading}></div>
    )
  }


  return (
    <img className={className} src={src}  />
  )
}