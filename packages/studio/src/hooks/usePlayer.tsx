import { useLayoutEffect, useRef, useState } from 'react';
import type { Clip, Source, VideoDocument } from '@jumpfish/video-processor';
import useResizeObserver from 'use-resize-observer';
import { AnimationPlayer } from '../components/AnimationPlayer';
import type { AnimationPlayer as AnimationPlayerElm } from 'animation-player';

import styles from './usePlayer.module.css';

interface Props {
  doc: VideoDocument;
  sources: Record<string, Source>;
}

function findNextClipById(id: string, doc: VideoDocument) {
  let found = false;
  return doc.timeline.find((clip) => {
    if (found === true) {
      return clip;
    }
    found = clip.id === id;
  });
}

function findClipAtMillisecond(
  millisecond: number,
  doc: VideoDocument,
): {
  clip: Clip;
  localTimeMilliseconds: number;
} {
  let currentTime = 0;
  for (const clip of doc.timeline) {
    const nextCurrentTime = currentTime + clip.win.durationMilliseconds;
    if (nextCurrentTime >= millisecond) {
      return {
        clip,
        localTimeMilliseconds: millisecond - currentTime,
      };
    }
    currentTime = nextCurrentTime;
  }

  throw new Error('Unable to find clip!');
}

export function usePlayer({ doc, sources }: Props) {
  const videoElements = useRef<
    Record<string, HTMLVideoElement | AnimationPlayerElm>
  >({});
  const {
    durationMilliseconds,
    dimensions: { width: videoWidth, height: videoHeight },
  } = doc;
  const containerRef = useRef<HTMLDivElement>(null);
  const { width: containerWidth } = useResizeObserver({
    ref: containerRef,
  });
  const [currentClipId, setCurrentClipId] = useState<string | null>(null);

  const reducedClips = doc.timeline.reduce(
    (acc, clip) => {
      acc[clip.id] = clip;
      return acc;
    },
    {} as Record<string, Clip>,
  );

  useLayoutEffect(() => {
    if (currentClipId === null) {
      return;
    }
    const currentVideoElement = videoElements.current[currentClipId];
    if (currentVideoElement === undefined) {
      return;
    }

    const onEnded = () => {
      const nextClip = findNextClipById(currentClipId, doc);
      if (nextClip === undefined) {
        // reached end of video
        return;
      }

      const { id: nextClipId } = nextClip;
      const nextVideoEl = videoElements.current[nextClipId];
      nextVideoEl.currentTime = 0;
      setCurrentClipId(nextClipId);
      nextVideoEl.play();
    };

    currentVideoElement.addEventListener('ended', onEnded);

    return () => {
      currentVideoElement.removeEventListener('ended', onEnded);
    };
  }, [currentClipId, doc]);

  if (doc.timeline.length > 0) {
    if (currentClipId === null) {
      const { clip } = findClipAtMillisecond(0, doc);
      setCurrentClipId(clip.id);
    } else if (
      currentClipId !== null &&
      doc.timeline.find((clip) => clip.id === currentClipId) === undefined
    ) {
      const next = doc.timeline[0];
      setCurrentClipId(next.id);
      const vidEl = videoElements.current[next.id];
      vidEl.currentTime = 0;
    }
  } else {
    if (currentClipId !== null) {
      setCurrentClipId(null);
    }
  }

  const scale =
    containerWidth === undefined ? 0 : containerWidth / doc.dimensions.width;
  const container = (
    <div aria-label="player" className={styles.container} ref={containerRef}>
      <div
        style={{
          width: `${doc.dimensions.width * scale}px`,
          height: `${doc.dimensions.height * scale}px`,
        }}
      >
        <div
          className={styles.wrapper}
          style={{
            transform: `scale(${scale})`,
            width: `${videoWidth}px`,
            height: `${videoHeight}px`,
          }}
        >
          {Object.values(reducedClips).map((clip) => {
            const { id: clipId, source: sourceId } = clip;
            const source = sources[sourceId];
            const classNames: string[] = [];
            const activeVideoElement = currentClipId === clipId;
            if (activeVideoElement !== true) {
              classNames.push(styles.hidden);
            } else {
              classNames.push(styles.video);
            }

            if (source.type === 'video') {
              return (
                <video
                  ref={(el) => {
                    if (el === null) {
                      return;
                    }
                    videoElements.current[clipId] = el;
                  }}
                  className={classNames.join(' ')}
                  key={clipId}
                  src={source.url}
                  controls
                />
              );
            }

            return (
              <AnimationPlayer
                key={clipId}
                ref={(el) => {
                  if (el === null) {
                    return;
                  }
                  videoElements.current[clipId] = el;
                }}
                contents={{
                  html: source.html,
                  css: source.css,
                }}
              />
            );
          })}
        </div>
      </div>
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
      const { clip, localTimeMilliseconds } = findClipAtMillisecond(
        millisecond,
        doc,
      );
      const vidElm = videoElements.current[clip.id];
      vidElm.currentTime = localTimeMilliseconds / 1000;
      vidElm.requestVideoFrameCallback(() => {
        if (clip.id !== currentClipId) {
          setCurrentClipId(clip.id);
        }
      });
    },
  };
}

export type Player = ReturnType<typeof usePlayer>;
