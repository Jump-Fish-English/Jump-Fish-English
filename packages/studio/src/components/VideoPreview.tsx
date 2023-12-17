import { useLayoutEffect, useState } from "react";
import { exportFrame } from '@jumpfish/video-processor';
import type { VideoSource } from "../lib/video-document";

import styles from './VideoPreview.module.css';

interface Props {
  className?: string;
  source: VideoSource;
  milliseconds: number;
}

const cache: Record<string, string> = {};

async function loadFrame({ source, milliseconds }: Props) {
  const key = `${source.url}-${milliseconds}`;
  const cacheCheck = cache[key];
  if (cacheCheck !== undefined) {
    return cacheCheck;
  }
  const url = await exportFrame({
    millisecond: milliseconds,
    source: { fileName: source.videoFile.fileName }
  });

  cache[key] = url;
  
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