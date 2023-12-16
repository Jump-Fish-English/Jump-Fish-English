import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { VideoClip, VideoDocument } from "../lib/video-document";

import styles from './usePlayer.module.css';

interface Props {
  className?: string;
  doc: VideoDocument;
}

function findNextClipByUrl(url: string, doc: VideoDocument) {
  let found = false;
  return doc.timeline.find((clip) => {
    if (found === true) {
      return clip;
    }
    found = clip.url === url;
  });
}

function findClipAtMillisecond(millisecond: number, doc: VideoDocument): {
  clip: VideoClip;
  localTimeMilliseconds: number;
} {
  let currentTime = 0;
  for(const clip of doc.timeline) {
    const nextCurrentTime = currentTime + clip.trim.durationMilliseconds;
    if (nextCurrentTime >= millisecond) {
      return {
        clip,
        localTimeMilliseconds: millisecond - currentTime,
      }
    }
    currentTime = nextCurrentTime;
  }

  throw new Error('Unable to find clip!');
 }

export function usePlayer({ className, doc }: Props) {
  const videoElements = useRef<Record<string, HTMLVideoElement>>({});
  const { durationMilliseconds } = doc;
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentClipId, setCurrentClipId] = useState<string | null>(null);

  const reducedClips = doc.timeline.reduce((acc, clip) => {
    acc[clip.url] = clip;
    return acc;
  }, {} as Record<string, VideoClip>);

  useLayoutEffect(() => {
    if (currentClipId === null) {
      return;
    }
    const currentVideoElement = videoElements.current[currentClipId];
    if (currentVideoElement === undefined) {
      return;
    }
    
    const onEnded = () => {
      const nextClip = findNextClipByUrl(currentClipId, doc);
      if (nextClip === undefined) {
        // reached end of video
        return;
      }

      const { url: nextClipUrl } = nextClip;
      const nextVideoEl = videoElements.current[nextClipUrl];
      nextVideoEl.currentTime = 0;
      setCurrentClipId(nextClipUrl);
      nextVideoEl.play();
    }

    currentVideoElement.addEventListener('ended', onEnded);

    return () => {
      currentVideoElement.removeEventListener('ended', onEnded);
    }
  }, [currentClipId, doc]);

  if (doc.timeline.length > 0) {
    if (currentClipId === null) {
      const { clip } = findClipAtMillisecond(0, doc);
      setCurrentClipId(clip.url);
    } else if (currentClipId !== null && doc.timeline.find((clip) => clip.url === currentClipId) === undefined) {
      const next = doc.timeline[0];
      setCurrentClipId(next.url);
      const vidEl = videoElements.current[next.url];
      vidEl.currentTime = 0;
    }
  } else  {
    if(currentClipId !== null) {
      setCurrentClipId(null);
    }
  }
  
  const container = (
    <div ref={containerRef}>
      {
        Object.values(reducedClips).map((clip) => {
          const { url } = clip;
          const classNames: string[] = [];
          const activeVideoElement = currentClipId === url;
          if (activeVideoElement !== true) {
            classNames.push(styles.hidden);
          }

          if (className !== undefined) {
            classNames.push(className);
          }
          
          return (
            <video 
              ref={(el) => {
                if (el === null) {
                  return;
                }
                videoElements.current[url] = el;
              }} 
              className={classNames.join(' ')} 
              key={url} 
              src={url} 
              controls 
            />
          );
        })
      }
    </div>
  );

  return {
    el: container,
    durationMilliseconds,
    play() {
      if (currentClipId === null) {
        return;
      }
      const vidElm = videoElements.current[currentClipId];
      vidElm.play();
    },
    seek(millisecond: number) {
      const { clip, localTimeMilliseconds } = findClipAtMillisecond(millisecond, doc);
      
      const vidElm = videoElements.current[clip.url];
      vidElm.currentTime = localTimeMilliseconds / 1000;
      vidElm.requestVideoFrameCallback(() => {
        if (clip.url !== currentClipId) {
          setCurrentClipId(clip.url);
        }
      });
      
    }
  }
}

export type Player = ReturnType<typeof usePlayer>;