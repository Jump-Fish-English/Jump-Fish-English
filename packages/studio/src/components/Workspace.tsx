import type { Player } from '../hooks/usePlayer';
import type {
  AnimationSource,
  Source,
  VideoDocument,
  VideoSource,
} from '../lib/video-document';
import { ClipTimeline } from './ClipTimeline';
import { Tab, Tabs } from './Tabs';
import { rasterizeDocument } from '../lib/rasterize-document';

import styles from './Workspace.module.css';

interface Props {
  sources: Record<string, Source>;
  doc: VideoDocument;
  player: Player;
  onSourceSelect(source: Source): void;
}

export function Workspace({ onSourceSelect, sources, doc, player }: Props) {
  const { el: playerElement } = player;
  const { timeline: documentTimeline } = doc;
  return (
    <div className={styles.container}>
      <Tabs
        tabActiveClassName={styles['tab-active']}
        tabPanelClassName={styles['tab-panel']}
        tabClassName={styles.tab}
        className={styles.tabs}
      >
        <Tab
          key="videos"
          textValue="Videos"
          title={
            <div className={styles['tab-icon']}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                stroke="currentColor"
              >
                <circle cx="12" cy="12" r="11" strokeWidth="2" />
                <polygon points="10,8 16,12 10,16" fill="currentColor" />
              </svg>
              <h6>Videos</h6>
            </div>
          }
        >
          {Object.values(sources)
            .filter((source) => {
              return source.type === 'video';
            })
            .map((source) => {
              const { title: sourceTitle, thumbnailUrl } =
                source as VideoSource;
              return (
                <article
                  className={styles.source}
                  key={source.id}
                  onClick={async () => {
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
                  }}
                >
                  <div className={styles['source-image']}>
                    <img
                      className={styles['source-thumbnail']}
                      src={thumbnailUrl}
                    />
                  </div>
                  <h4 className={styles['source-title']}>{sourceTitle}</h4>
                </article>
              );
            })}
        </Tab>
        <Tab
          key="animations"
          textValue="Animations"
          title={
            <div className={styles['tab-icon']}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                stroke="currentColor"
              >
                <circle cx="12" cy="12" r="11" strokeWidth="2" />
                <polygon points="10,8 16,12 10,16" fill="currentColor" />
              </svg>
              <h6>Animations</h6>
            </div>
          }
        >
          {Object.values(sources)
            .filter((source) => {
              return source.type === 'animation';
            })
            .map((source) => {
              const {
                title: sourceTitle,
                thumbnail: {
                  url: thumbnailUrl,
                  originalDimensions: {
                    width: thumbnailWidth,
                    height: thumbnailHeight,
                  },
                },
              } = source as AnimationSource;
              return (
                <article
                  className={styles.source}
                  key={source.id}
                  onClick={async () => {
                    onSourceSelect(source);
                  }}
                >
                  <div className={styles['source-image']}>
                    <img
                      width={thumbnailWidth}
                      height={thumbnailHeight}
                      className={styles['source-thumbnail']}
                      src={thumbnailUrl}
                    />
                  </div>
                  <h4 className={styles['source-title']}>{sourceTitle}</h4>
                </article>
              );
            })}
        </Tab>
      </Tabs>
      <main className={styles.main}>
        <button
          onClick={async () => {
            const { url } = await rasterizeDocument({ doc, sources });

            const vid = document.createElement('video');
            vid.style.width = '100%';
            vid.src = url;
            document.body.insertBefore(vid, document.body.firstChild!);
            const a = document.createElement('a');
            a.href = url;
            a.innerHTML = 'download video';
            a.download = 'true';
            document.body.insertBefore(a, vid);
          }}
        >
          Generate
        </button>
        {documentTimeline.length > 0 && playerElement}
        <div className={styles.scroller}>
          <ClipTimeline
            sources={sources}
            onDeleteClip={() => {
              // const next = doc.timeline.filter((item) => {
              //   return item !== clip;
              // });
              // setDoc(
              //   produce((draft) => {
              //     draft.timeline = next;
              //   })
              // );
            }}
            doc={doc}
            player={player}
          />
        </div>
      </main>
    </div>
  );
}
