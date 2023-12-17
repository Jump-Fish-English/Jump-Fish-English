import type { Player } from "../hooks/usePlayer";
import type { Source, VideoDocument } from "../lib/video-document";
import { ClipTimeline } from "./ClipTimeline";
import { Tab, Tabs } from "./Tabs";

import styles from './Workspace.module.css';

interface Props {
  sources: Record<string, Source>;
  doc: VideoDocument;
  player: Player;
}

export function Workspace({ sources, doc, player }: Props) {
  const { el: playerElement } = player;
  return (
    <div className={styles.container}>
      <Tabs tabActiveClassName={styles['tab-active']} tabPanelClassName={styles['tab-panel']} tabClassName={styles.tab} className={styles.tabs}>
        <Tab key="videos" textValue="Videos" title={(
          <div className={styles['tab-icon']}>
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="11" strokeWidth="2"/>
              <polygon points="10,8 16,12 10,16" fill="currentColor"/>
            </svg>
            <h6>Videos</h6>
          </div>
        )}>
          {
            Object.values(sources).filter((source) => {
              return source.type === 'video';
            }).map((source) => {
              const { title: sourceTitle, thumbnailUrl } = source;
              return (
                <article className={styles.source} key={source.id} onClick={async () => {
                  // const clip: VideoClip = {
                  //   type: 'video',
                  //   id: uuidV4(),
                  //   source: source.id,
                  //   trim: {
                  //     startMilliseconds: 0,
                  //     durationMilliseconds: source.durationMilliseconds,
                  //   },
                  //   url: source.url,
                  // }
                  
                  // const nextDoc = insertClip({
                  //   doc, 
                  //   insertMillisecond: doc.durationMilliseconds,
                  //   clip,
                  // });

                  // setDoc(nextDoc);

                }}>
                  <h4 className={styles['source-title']}>
                    {sourceTitle}
                  </h4>
                  <img className={styles['source-thumbnail']} src={thumbnailUrl} />
                </article>
              )
            })
          }
        </Tab>
        <Tab key="animations" textValue="Animations" title={(
          <div className={styles['tab-icon']}>
            <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor">
              <circle cx="12" cy="12" r="11" strokeWidth="2"/>
              <polygon points="10,8 16,12 10,16" fill="currentColor"/>
            </svg>
            <h6>Animations</h6>
          </div>
        )}>
          {
            Object.values(sources).filter((source) => {
              return source.type === 'animation';
            }).map((source) => {
              const { title: sourceTitle, thumbnailUrl } = source;
              return (
                <article className={styles.source} key={source.id} onClick={async () => {
                  // const clip: VideoClip = {
                  //   type: 'video',
                  //   id: uuidV4(),
                  //   source: source.id,
                  //   trim: {
                  //     startMilliseconds: 0,
                  //     durationMilliseconds: source.durationMilliseconds,
                  //   },
                  //   url: source.url,
                  // }
                  
                  // const nextDoc = insertClip({
                  //   doc, 
                  //   insertMillisecond: doc.durationMilliseconds,
                  //   clip,
                  // });

                  // setDoc(nextDoc);

                }}>
                  <h4 className={styles['source-title']}>
                    {sourceTitle}
                  </h4>
                  <img className={styles['source-thumbnail']} src={thumbnailUrl} />
                </article>
              )
            })
          }
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
              // setDoc(
              //   produce((draft) => {
              //     draft.timeline = next;
              //   })
              // );
            }}
            doc={doc} player={player} />
        </div>
      </main>
    </div>
  )
}