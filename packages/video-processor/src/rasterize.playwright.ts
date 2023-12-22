import { test, expect, Locator, Page, ElementHandle } from '@playwright/test';
import { animationClipToImageSequence, concatVideoClips, imageSequenceToVideo} from './rasterize';
import { VideoSource } from './video-document';

declare global {
  interface Window { 
    concatVideoClips: typeof concatVideoClips;
    animationClipToImageSequence: typeof animationClipToImageSequence;
    imageSequenceToVideo: typeof imageSequenceToVideo;
   }
}

interface AssertVideoParams {
  videoLocator: Locator;
  page: Page;
  durationSeconds: number;
  snapshot: {
    timestamps: Array<{
      seconds: number;
    }>
  }
}

async function assertVideo({ durationSeconds, videoLocator, page, snapshot: { timestamps } }: AssertVideoParams) {
  await expect(videoLocator).toHaveCount(1);
  const duration = await videoLocator.evaluate(
    (el: HTMLVideoElement) => el.duration,
  );
  expect(duration).toBeCloseTo(durationSeconds, 1);

  const videoHandle = await videoLocator.elementHandle() as ElementHandle<HTMLVideoElement>;
  
  for(const timestamp of timestamps) {
    await page.evaluate(async ({ video, timestamp: { seconds } }) => {

      const timeUpdatePromise = new Promise<void>((res) => {
        video.addEventListener('timeupdate', () => {
          res();
        }, { once: true });
      });
      video.currentTime = seconds;
      await timeUpdatePromise;
    }, {
      video: videoHandle,
      timestamp
    });

    await expect(videoLocator).toHaveScreenshot();
  }
}

test.describe('Snapshots', () => {
  test('basic counting video', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(async () => {
      const imageSequence = await window.animationClipToImageSequence({
        source: {
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
        clip: {
          source: 'css',
          id: 'clip',
          win: {
            startMilliseconds: 0,
            durationMilliseconds: 5000,
          },
        },
      });

      const result = await window.imageSequenceToVideo({
        sequence: imageSequence,
        doc: {
          frameRate: 30,
          dimensions: {
            width: 400,
            height: 300,
          }
        }
      })

      async function renderVideFile({ url }: VideoSource) {
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

    await assertVideo({
      durationSeconds: 5,
      videoLocator: page.getByTitle('output-video'),
      page,
      snapshot: {
        timestamps: [{
          seconds: 1
        }, {
          seconds: 2
        }, {
          seconds: 3
        }, {
          seconds: 4
        }, {
          seconds: 5
        }]
      }
    });
  });

  test('simple video', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(async () => {
      const result = await window.concatVideoClips({
        sources: {
          video: {
            type: 'video',
            title: 'Untitled',
            durationMilliseconds: 5000,
            url: '/video/simple-counter.mp4',
            id: 'video',
            thumbnailUrl: 'thumbnailUrl',
          }
        },
        clips: [
          {
            source: 'video',
            id: 'clip',
            win: {
              startMilliseconds: 0,
              durationMilliseconds: 5000,
            },
          },
        ],
      });

      async function renderVideFile({ url }: VideoSource) {
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
    

    await assertVideo({
      videoLocator: page.getByTitle('output-video'),
      durationSeconds: 5,
      page,
      snapshot: {
        timestamps: [{
          seconds: 0
        }, {
          seconds: 1
        }, {
          seconds: 2
        }, {
          seconds: 3
        }, {
          seconds: 4
        }, {
          seconds: 5
        }]
      }
    });
  });

  test('two videos', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(async () => {
      const result = await window.concatVideoClips({
        sources: {
          video: {
            type: 'video',
            title: 'Untitled',
            durationMilliseconds: 5000,
            url: '/video/simple-counter.mp4',
            id: 'video',
            thumbnailUrl: 'thumbnailUrl',
          }
        },
        clips: [
          {
            source: 'video',
            id: 'clip',
            win: {
              startMilliseconds: 0,
              durationMilliseconds: 5000,
            },
          },
          {
            source: 'video',
            id: 'clip',
            win: {
              startMilliseconds: 0,
              durationMilliseconds: 5000,
            },
          },
        ],
      });

      async function renderVideFile({ url }: VideoSource) {
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
    

    await assertVideo({
      videoLocator: page.getByTitle('output-video'),
      durationSeconds: 10,
      page,
      snapshot: {
        timestamps: [{
          seconds: 0
        }, {
          seconds: 1
        }, {
          seconds: 2
        }, {
          seconds: 3
        }, {
          seconds: 4
        }, {
          seconds: 5
        }, {
          seconds: 6
        }, {
          seconds: 7
        }, {
          seconds: 8
        }, {
          seconds: 9
        }, {
          seconds: 10
        }]
      }
    });
  })
});