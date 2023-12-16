import { useEffect, useState } from 'react';
import { produce } from 'immer';
import { v4 as uuidV4 } from 'uuid';
import { exportFrame, writeFile as writeVideoFile } from '@jumpfish/video-processor';
import { insertClip, type VideoClip, type VideoDocument, type VideoSource } from '../lib/video-document';
import { Tabs, Tab } from './Tabs';

import styles from './Main.module.css';


// videos
import src from '../../../../videos/output.mp4';
import other from '../../../../videos/estudiantes-de-ingles-nivel-a1-resumen-de-la-semana-10-de-futbol-americano/out.mp4';
import { usePlayer } from '../hooks/usePlayer';
import { ClipTimeline } from './ClipTimeline';

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



async function loadSource(arrayBuffer: ArrayBuffer): Promise<VideoSource> {
  const id = uuidV4();
  const videoFile = await writeVideoFile({
    fileName: `${id}.mp4`,
    buffer: new Uint8Array(arrayBuffer),
    type: 'video/mp4',
  });
  const url = URL.createObjectURL(videoFile.data);
  
  const durationMilliseconds = await new Promise<number>((res) => {
    const videoElm = document.createElement('video');
    videoElm.preload = 'metadata';
    videoElm.src = url;
    videoElm.addEventListener('durationchange', () => {
      res(videoElm.duration * 1000);
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
    id,
    durationMilliseconds,
    thumbnailUrl,
    videoFile,
    url,
  };
}

export function Main() {
  const [doc, setDoc] = useState<VideoDocument>({
    sources: {},
    timeline: [],
    durationMilliseconds: 0,
  });

  const player = usePlayer({
    className: styles.video,
    doc
  });
  const { el: playerElement } = player;

  useEffect(() => {
    // other
    const  first = fetch(src)
      .then((resp) => resp.arrayBuffer())
      .then((buffer) => {
        return loadSource(buffer);
      });

    const second = fetch(other)
      .then((resp) => resp.arrayBuffer())
      .then((buffer) => {
        return loadSource(buffer);
      });

    Promise.all([
      first,
      second,
    ]).then((sources) => {
      setDoc(
        produce((draft) => {
          sources.forEach((source) => {
            draft.sources[source.id] = source;
          });
        })
      )
    })
    
  }, []);

  if (doc === undefined) {
    return null;
  }

  return (
    <div className={styles.container}>
      <Tabs tabActiveClassName={styles['tab-active']} tabPanelClassName={styles['tab-panel']} tabClassName={styles.tab} className={styles.tabs}>
        <Tab key="clips" textValue="Clips" title={(
          <div className={styles['tab-icon']}>
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="11" strokeWidth="2"/>
              <polygon points="10,8 16,12 10,16" fill="currentColor"/>
            </svg>
            <h6>Clips</h6>
          </div>
        )}>
          {
            Object.values(doc.sources).map((source) => {
              return (
                <article className={styles.source} key={source.id} onClick={async () => {
                  const clip: VideoClip = {
                    type: 'video',
                    source: source.id,
                    trim: {
                      startMilliseconds: 0,
                      durationMilliseconds: source.durationMilliseconds,
                    },
                    url: source.url,
                  }
                  
                  const nextDoc = insertClip({
                    doc, 
                    insertMillisecond: doc.durationMilliseconds,
                    clip,
                  });

                  setDoc(nextDoc);

                }}>
                  <h4 className={styles['source-title']}>
                    {source.videoFile.fileName}
                  </h4>
                  <img className={styles['source-thumbnail']} src={source.thumbnailUrl} />
                </article>
              )
            })
          }
        </Tab>
        <Tab key="ok" textValue="Clips" title="Overlays">
          Other
        </Tab>
      </Tabs>
      <main className={styles.main}>
        {playerElement}
        <div className={styles.scroller}>
          <ClipTimeline 
            onDeleteClip={(clip) => {
              const next = doc.timeline.filter((item) => {
                return item !== clip;
              });
              setDoc(
                produce((draft) => {
                  draft.timeline = next;
                })
              );
            }}
            doc={doc} player={player} />
        </div>
      </main>
    </div>
  )
}