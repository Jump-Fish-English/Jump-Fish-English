import { useLayoutEffect, useRef } from "react";
import type { VideoClip } from "../lib/video-document";
import type { MillisecondRange } from "@jumpfish/video-processor";

export interface ClipPlayer {
  seek(millisecond: number): void;
  play(): void;
}

interface Props {
  clip: VideoClip;
  className?: string;
  onPlayerReady(player: ClipPlayer): void;
  trim?: MillisecondRange;
}

export function ClipPlayer({ trim, onPlayerReady, className, clip }: Props) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const { url: src } = clip;

  useLayoutEffect(() => {
    const { current } = ref;
    if (current === null) {
      return;
    }

    if (trim !== undefined) {
      const { startMilliseconds } = trim;
      if (current.currentTime * 1000 < startMilliseconds) {
        current.currentTime = startMilliseconds / 1000;
      }
    }

    current.addEventListener('timeupdate', (e) => {
      if (trim !== undefined && current.currentTime * 1000 > trim.startMilliseconds + trim.durationMilliseconds - 50) {
        current.pause();
        current.currentTime = (trim.startMilliseconds + trim.durationMilliseconds) / 1000;
      }
    });

    onPlayerReady({
      play() {
        current.play();
      },
      seek(millisecond) {
        let next = millisecond;
        if (trim !== undefined) {
          next = trim.startMilliseconds + millisecond;
          next = Math.min(next, trim.startMilliseconds + trim.durationMilliseconds)
        }

        current.currentTime = next / 1000;
        
      }
    });
  }, []);

  return (
    <video controls ref={ref} className={className} src={src} autoPlay={false} />
  )
}