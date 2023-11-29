import { useLayoutEffect, useState } from 'react';
import { Playhead } from './Playhead';
import { Timeline } from './Timeline';
import { Canvas } from './Canvas';
import { TimeMarker } from './TimeMarker';
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

    .subscribe {
      font-family: -apple-system;
      letter-spacing: 0.1rem;
      background: red;
      padding: 0.5rem 1rem;
      box-shadow: 0 0 10px #b1b1b1;
      color: #fff;
      position: absolute;
      border-radius: 20px;
      display: inline-flex;
      justify-content: center;
      align-items: center;
      animation: show-subscribe 350ms both;
      animation-delay: 2000ms;
      bottom: 2rem;
      right: 2rem;
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

    .subscribe-text {
      position: relative;
      align-items: center;
      justify-content: center;
      display: flex;
      animation: show-text 500ms both;
      animation-delay: 2300ms;
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
  <div 
    class="subscribe"
  >
    <div class="subscribe-text">Subscribe</div>
  </div>
  <video src=${src} autoplay />
`;

export function Main() {
  const [mouseOverMarkerTransform, setMouseOverMarkerTransform] = useState<{ translateX: number, milliseconds: number } | null>(null);
  return (
    <Canvas 
      video={video}
    >
      {({ player, play, pause, durationMilliseconds, playState, seek, currentTimeMilliseconds }) => {        
        return (
          <div className={styles.container}>
            <Playhead 
              playState={playState}
              onPauseClick={pause}
              onPlayClick={play}
              currentTimeMilliseconds={currentTimeMilliseconds} 
              durationMilliseconds={durationMilliseconds}
            />
            <div className={styles.player}>
              {player}
            </div>
            <Timeline 
              onTimeSelect={(time) => {
                seek(time);
              }}
              durationMilliseconds={durationMilliseconds}
              stepMilliseconds={100}
              onTimeMouseOut={() => {
                setMouseOverMarkerTransform(null);
              }}
              onTimeMouseOver={async ({ translateX, milliseconds }) => {
                setMouseOverMarkerTransform({ 
                  translateX,
                  milliseconds,
                });
              }}
            >
              {
                mouseOverMarkerTransform !== null && (
                  <TimeMarker 
                    childrenTop={(
                      <Canvas 
                        className={styles.preview}
                        video={video}
                      >
                        {
                          ({ seek, player }) => {
                            useLayoutEffect(() => {
                              seek(mouseOverMarkerTransform.milliseconds);
                            }, [mouseOverMarkerTransform.milliseconds]);
                            return player;
                          }
                        }
                      </Canvas>
                    )}
                    transformX={mouseOverMarkerTransform.translateX}
                  />
                )
              }
            </Timeline>
          </div>
        )
      }}
    </Canvas>
  )
}