import { useLayoutEffect, useRef } from "react";

import styles from './VideoPreview.module.css';

interface Props {
  videoUrl: string;
  milliseconds: number;
}

export function VideoPreview({ videoUrl, milliseconds }: Props) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useLayoutEffect(() => {
    const { current } = ref;
    if (current === null) {
      return;
    }

    current.currentTime = milliseconds / 1000;
  }, [milliseconds]);

  return (
    <video className={styles.preview} src={videoUrl} autoPlay={false} ref={ref} />
  )
}