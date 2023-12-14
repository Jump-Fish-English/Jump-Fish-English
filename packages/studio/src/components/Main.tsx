import { useEffect, useLayoutEffect, useState } from 'react';
import { Playhead } from './Playhead';
import { Timeline } from './Timeline';
import { Preview } from './Preview';
import { TimeMarker } from './TimeMarker';
import { TimelineGrid } from './TimelineGrid';
import { TimelineWindow } from './TimelineWindow';
import { produce } from 'immer';
import { v4 as uuidV4 } from 'uuid';
import { trim as trimVideo, exportFrame, type VideoFile, type MillisecondRange, writeFile as writeVideoFile } from '@jumpfish/video-processor';
import styles from './Main.module.css';
import src from '../../../../videos/output.mp4';

const video = `
  <style>
    video {
      max-width: 100%;
      max-height: 100%;
      display: block;
      margin: 0 auto;
    }

    .parent {
      animation: hide-subscribe 350ms both;
      animation-delay: 346s;
      position: absolute;
      bottom: 2rem;
      right: 2rem;
    }

    .subscribe {
      font-family: -apple-system;
      letter-spacing: 0.1rem;
      background: red;
      padding: 0.5rem 1rem;
      box-shadow: 0 0 10px #b1b1b1;
      color: #fff;
      
      border-radius: 20px;
      display: inline-flex;
      justify-content: center;
      align-items: center;
      animation: show-subscribe 350ms both;
      animation-delay: 342s;
      
    }

    @keyframes show-subscribe {
      0% {
        opacity: 0;
        transform: scaleX(0);
      }

      100% {
        opacity: 1;
        transform: scaleX(1);
      }
    }

    @keyframes hide-subscribe {
      0% {
        opacity: 1;
        transform: scaleX(1);
      }

      100% {
        opacity: 0;
        transform: scaleX(0);
      }
    }

    .subscribe-text {
      position: relative;
      align-items: center;
      justify-content: center;
      display: flex;
      animation: show-text 500ms both;
      animation-delay: 342300ms;
      margin-right: 18px;
    }

    .subscribe-text:after {
      content: " ";
      display: block;
      position: absolute;
      left: 100%;
      top: 50%;
      margin-top: 5px;
      margin-left: 0.3rem;
      border: 8px solid transparent;
      border-top-color: #fff;
      transform: translateY(-50%);
    }

    @keyframes show-text {
      0% {
        opacity: 0;
      }

      100% {
        opacity: 1;
      }
    }
  </style>
  <div class="parent">
    <div 
      class="subscribe"
    >
      <div class="subscribe-text">Subscribe</div>
    </div>
  </div>
`;

interface VideoSource {
  type: 'video',
  id: string;
  durationMilliseconds: number;
  thumbnailUrl: string;
  videoFile: VideoFile;
}


interface VideoClip {
  type: 'video',
  trim?: MillisecondRange;
  source: string;
  filename: string;
  durationMilliseconds: number;
  url: string;
}


interface VideoDocument {
  sources: Record<string, VideoSource>;
  timeline: VideoClip[];
}


async function loadSource(arrayBuffer: ArrayBuffer): Promise<VideoSource> {
  const videoFile = await writeVideoFile({
    fileName: `${uuidV4()}.mp4`,
    buffer: new Uint8Array(arrayBuffer),
  });

  const durationMilliseconds = await new Promise<number>((res) => {
    const videoElm = document.createElement('video');
    videoElm.preload = 'metadata';
    videoElm.src = src;
    videoElm.addEventListener('durationchange', () => {
      res(videoElm.duration);
    }, {
      once: true,
    });
  });

  const thumbnailUrl = await exportFrame({
    millisecond: 0,
    source: videoFile,
  });

  return {
    type: 'video',
    id: 'ididid',
    durationMilliseconds,
    thumbnailUrl,
    videoFile,
  };
}

export function Main() {
  const [doc, setDoc] = useState<VideoDocument>({
    sources: {},
    timeline: [],
  });

  useEffect(() => {
    fetch(src)
      .then((resp) => resp.arrayBuffer())
      .then((buffer) => {
        return loadSource(buffer);
      })
      .then((source) => {
        setDoc(
          produce((draft) => {
            draft.sources[source.id] = source;
          })
        )
      })
    
  }, []);

  if (doc === undefined) {
    return null;
  }

  return (
    <div className={styles.container}>
      <section className={styles.sources}>
        {
          Object.values(doc.sources).map((source) => {
            return (
              <article className={styles.source} key={source.id}>
                <h4 className={styles['source-title']}>
                  {source.videoFile.fileName}
                </h4>
                <img className={styles['source-thumbnail']} src={source.thumbnailUrl} />
              </article>
            )
          })
        }
      </section>
    </div>
  )
}