import { test, expect } from '@playwright/test';
import { rasterizeDocument } from './rasterize';
import { VideoFile } from './ffmpeg';

declare global {
  interface Window { 
    rasterizeDocument: typeof rasterizeDocument
   }
}

test.describe('rasterizeDocument', () => {
  test.describe(
    'single CSS clip',
    () => {
      test('should rasterize with correct duration', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(async () => {
          const result = await window.rasterizeDocument({
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
                  },
                },
                id: 'css',
                type: 'animation',
                title: 'Untitled',
                html: `
                <div class="ball"><div>
              `,
                css: `
                .ball {
                  height: 900px;
                  width: 1600px;
                  background: red;
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
              `,
              },
            },
            doc: {
              dimensions: {
                height: 900,
                width: 1600,
              },
              durationMilliseconds: 1000,
              timeline: [
                {
                  source: 'css',
                  id: 'clip',
                  win: {
                    startMilliseconds: 0,
                    durationMilliseconds: 1000,
                  },
                },
              ],
            },
          });

          async function renderVideFile({ url }: VideoFile) {
            const vid = document.createElement('video');
            vid.title = 'output-video';
            const durationPromise = new Promise<void>((res) => {
              vid.addEventListener('durationchange', () => res(), {
                once: true,
              });
            });

            vid.src = url;
            document.body.appendChild(vid);

            await durationPromise;
          }

          await renderVideFile(result);
        });

        const outputVideo = page.getByTitle('output-video');
        await expect(outputVideo).toHaveCount(1);
        const duration = await outputVideo.evaluate(
          (el: HTMLVideoElement) => el.duration,
        );
        expect(duration).toBeCloseTo(1, 2);
      });
    },
  );

  test.describe('Snapshots', () => {
    test('basic counting video', async ({ page }) => {
      await page.goto('/');
      await page.evaluate(async () => {
        const result = await window.rasterizeDocument({
          sources: {
            css: {
              durationMilliseconds: 5000,
              thumbnail: {
                url: 'thumbnail',
                data: new Blob(),
                originalDevicePixelRatio: 1,
                originalDimensions: {
                  width: 10,
                  height: 10,
                },
              },
              id: 'css',
              type: 'animation',
              title: 'Untitled',
              css: `
                .container {
                  font-size: 128px;
                  width: 400px;
                  height: 300px;
                  position: relative;
                  color: #000;
                }

                .number {
                  position: absolute;
                  left: 50%;
                  top: 50%;
                  transform: translate(-50%, -50%);
                }

                .one {
                  background: #fff;
                  animation: fade-in 1s both;
                }

                .two {
                  background: #fff;
                  animation: fade-in 1s both;
                  animation-delay: 1s;
                }

                .three {
                  background: #fff;
                  animation: fade-in 1s both;
                  animation-delay: 2s;
                }

                .four {
                  background: #fff;
                  animation: fade-in 1s both;
                  animation-delay: 3s;
                }

                .five {
                  background: #fff;
                  animation: fade-in 1s both;
                  animation-delay: 4s;
                }

                @keyframes fade-in {
                  0% {
                    opacity: 0;
                  }

                  100% {
                    opacity: 1;
                  }
                }
              `,
              html: `
                <div class="container">
                  <div class="number one">1</div>
                  <div class="number two">2</div>
                  <div class="number three">3</div>
                  <div class="number four">4</div>
                  <div class="number five">5</div>
                </div>
              `,
            },
          },
          doc: {
            dimensions: {
              width: 400,
              height: 300,
            },
            durationMilliseconds: 5000,
            timeline: [
              {
                source: 'css',
                id: 'clip',
                win: {
                  startMilliseconds: 0,
                  durationMilliseconds: 5000,
                },
              },
            ],
          },
        });

        async function renderVideFile({ url }: VideoFile) {
          const vid = document.createElement('video');
          vid.title = 'output-video';
          vid.id = 'vid';
          const durationPromise = new Promise<void>((res) => {
            vid.addEventListener('durationchange', () => res(), {
              once: true,
            });
          });

          vid.src = url;
          document.body.appendChild(vid);

          await durationPromise;
        }

        await renderVideFile(result);
      });

      const outputVideo = page.getByTitle('output-video');
      await expect(outputVideo).toHaveCount(1);
      await page.evaluate(async () => {
        const vid = document.getElementById('vid') as HTMLVideoElement;
        vid.currentTime = 1;
      });

      await expect(outputVideo).toHaveScreenshot({
        
      });

      await page.evaluate(async () => {
        const vid = document.getElementById('vid') as HTMLVideoElement;
        vid.currentTime = 2;
      });

      await expect(outputVideo).toHaveScreenshot();

      await page.evaluate(async () => {
        const vid = document.getElementById('vid') as HTMLVideoElement;
        vid.currentTime = 3;
      });

      await expect(outputVideo).toHaveScreenshot();

      await page.evaluate(async () => {
        const vid = document.getElementById('vid') as HTMLVideoElement;
        vid.currentTime = 4;
      });

      await expect(outputVideo).toHaveScreenshot();

      await page.evaluate(async () => {
        const vid = document.getElementById('vid') as HTMLVideoElement;
        vid.currentTime = 5;
      });

      await expect(outputVideo).toHaveScreenshot();
    });
  });
});