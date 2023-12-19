import { describe, expect, it, beforeAll } from 'vitest';
import { rasterizeDocument } from './rasterize-document';
import type { VideoFile } from '@jumpfish/video-processor';
import { AnimationPlayer } from 'animation-player';


async function renderVideFile({ url }: VideoFile) {
  const vid = document.createElement('video');

  const durationPromise = new Promise<void>((res) => {
    vid.addEventListener('durationchange', () => res(), {
      once: true,
    });
  });

  vid.src = url;

  await durationPromise;

  return vid;
}


beforeAll(() => {
  customElements.define('x-animation-player', AnimationPlayer);
});

describe.skip('rasterizeDocument', () => {
  describe('single CSS clip', () => {
    it('should rasterize with correct duration', async () => {
      const result = await rasterizeDocument({
        sources: {
          css: {
            durationMilliseconds: 1000,
            thumbnail: {
              url: 'thumbnail',
              data: new Blob(),
              originalDevicePixelRatio: 1,
              originalDimensions: {
                width: 10,
                height: 10,
              }
            },
            id: 'css',
            type: 'animation',
            title: 'Untitled',
            html: `
              <div class="ball"><div>
            `,
            css: `
              .ball {
                height: 10px;
                width: 10px;
                animation: move-ball 1s;
              }

              @keyframes move-ball {
                0% {
                  opacity: 0;
                }

                100% {
                  opacity: 1;
                }
              }
            `
          }
        },
        doc: {
          dimensions: {
            height: 90,
            width: 160,
          },
          durationMilliseconds: 1000,
          timeline: [{
            source: 'css',
            id: 'clip',
            win: {
              startMilliseconds: 0,
              durationMilliseconds: 1000,
            }
          }]
        }
      });

      const vid = await renderVideFile(result);
      expect(vid.duration).toBe(5);
      
    });
  }, {
    timeout: 120000
  });
});