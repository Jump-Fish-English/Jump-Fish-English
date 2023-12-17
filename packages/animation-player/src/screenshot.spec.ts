import { describe, expect, it, beforeAll, afterEach } from 'vitest';
import { generateScreenshot } from './screenshot';
import { AnimationPlayer } from './AnimationPlayer';
import { waitFor } from '@testing-library/dom';


async function waitForCanPlayThrough(elm: HTMLElement) {
  return new Promise((res) => {
    elm.addEventListener('canplaythrough', res, {
      once: true,
    })
  })
}

beforeAll(() => {
  customElements.define('x-foo', AnimationPlayer);
});

afterEach(() => {
  document.body.innerHTML = '';
});


describe('screenshot', () => {
  it('screenshot dimensions should match element width', async () => {
    const elm = document.createElement('x-foo') as AnimationPlayer;
    document.body.appendChild(elm);
    const contents = {
      css: `
        #ball {
          width: 100px;
          height: 45px;
          animation: show-ball 400ms;
        }

        @keyframes show-ball {
          0% {
            opacity: 0;
          }

          100% {
            opacity: 1;
          }
        }
      `,
      html: `
        <div id="ball"></div>
      `
    }

    const canPlayThroughPromise = new Promise((res) => {
      elm.addEventListener('canplaythrough', res, { once: true });
    });

    elm.load(contents);

    await canPlayThroughPromise;

    const url = await generateScreenshot(elm);

    const img = document.createElement('img');
    img.src = url;
    await waitFor(() => {
      expect(img.width).toBe(100);
      expect(img.height).toBe(45);
    });
  });
});