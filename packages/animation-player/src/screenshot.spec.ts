import { describe, it, expect, beforeAll, afterEach} from 'vitest';
import { generateScreenshot } from './screenshot';
import { AnimationPlayer } from './AnimationPlayer';

beforeAll(() => {
  customElements.define('x-foo', AnimationPlayer);
});

afterEach(() => {

  [
    ...document.querySelectorAll('x-foo')
  ].forEach((el) => {
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  })
});

describe('image dimensions', () => {
  it('should return the original element dimensions correctly', async () => {
    const { originalDimensions } = await generateScreenshot({
      contents: {
        css: `
          .ball {
            height: 103px;
            width: 123px;
            animation: show 1s;
          }

          @keyframes show {
            0% {
              opacity: 1;
            }

            100% {
              opacity: 1
            }
          }
        `,
        html: `
          <div class="ball"></div>
        `
      },
      milliseconds: 1000
    });

    expect(originalDimensions).toEqual({
      width: 123,
      height: 103,
    });
  });

  it('should return correct dpi', async () => {
    window.devicePixelRatio = 2;
    const { originalDevicePixelRatio } = await generateScreenshot({
      contents: {
        css: `
          .ball {
            height: 103px;
            width: 123px;
            animation: show 1s;
          }

          @keyframes show {
            0% {
              opacity: 1;
            }

            100% {
              opacity: 1
            }
          }
        `,
        html: `
          <div class="ball"></div>
        `
      },
      milliseconds: 1000
    });

    expect(originalDevicePixelRatio).toEqual(2);
  });

  it('should remove created element',  async () => {
    await generateScreenshot({
      contents: {
        css: `
          .ball {
            height: 103px;
            width: 123px;
            animation: show 1s;
          }

          @keyframes show {
            0% {
              opacity: 1;
            }

            100% {
              opacity: 1
            }
          }
        `,
        html: `
          <div class="ball"></div>
        `
      },
      milliseconds: 1000
    });

    expect(
      document.getElementsByTagName('x-foo')
    ).toHaveLength(0);
  });
});

describe('Screenshot tests', () => {

});