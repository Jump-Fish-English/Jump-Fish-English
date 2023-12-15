import { useLayoutEffect, useRef } from "react";

import styles from './VideoPreview.module.css';

interface Props {
  className?: string;
  videoUrl: string;
  milliseconds: number;
}

export function VideoPreview({ className, videoUrl, milliseconds }: Props) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useLayoutEffect(() => {
    const { current } = ref;
    if (current === null) {
      return;
    }

    const { readyState } = current;
    current.load();
    if (readyState !== 4) {
      current.addEventListener('durationchange', () => {
        current.currentTime = milliseconds / 1000;
      }, {
        once: true,
      });
      return;
    }
    
    current.currentTime = milliseconds / 1000;
  }, [milliseconds]);

  return (
    <video className={[styles.preview, className].filter((item) => item !== undefined).join(' ')} src={videoUrl} autoPlay={false} ref={ref} />
  )
}