import { resolve } from 'path';
import {
  describe,
  beforeAll,
  it,
  afterEach,
  beforeEach,
  expect as vitestExpect,
  afterAll,
} from 'vitest';
import { ViteDevServer, createServer } from 'vite';
import {
  chromium,
  type Browser,
  type BrowserContext,
  type Page,
  expect,
} from '@playwright/test';
import type { VideoFile } from './ffmpeg';
import { rasterizeDocument } from './rasterize';

let page: Page;
let browser: Browser;
let context: BrowserContext;
let server: ViteDevServer;

beforeAll(async () => {
  server = await createServer({
    logLevel: 'silent',
    root: resolve(__dirname, '../'),
    server: {
      port: 1234,
    },
    optimizeDeps: {
      exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
    },
  });

  await server.listen();
  server.printUrls();
});

afterAll(async () => {
  await server.close();
});

beforeEach(async () => {
  browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });
  context = await browser.newContext({});
  page = await browser.newPage({});
  await page.goto('http://localhost:1234');
  await page.waitForFunction(() => {
    return (
      'rasterizeDocument' in window &&
      window.customElements.get('x-animation-player') !== undefined
    );
  });
});

afterEach(async () => {
  await context.close();
  await browser.close();
});

async function pageEval(cb: Parameters<(typeof page)['evaluate']>[0]) {
  try {
    await page.evaluate(cb);
  } catch (e: unknown) {
    vitestExpect.fail(JSON.stringify(e, null, 2));
  }
}

describe('rasterizeDocument', () => {
  describe(
    'single CSS clip',
    () => {
      it('should rasterize with correct duration', async () => {
        await pageEval(async () => {
          const result = await (
            window as unknown as { rasterizeDocument: typeof rasterizeDocument }
          ).rasterizeDocument({
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
    {
      timeout: 120000,
    },
  );
});
