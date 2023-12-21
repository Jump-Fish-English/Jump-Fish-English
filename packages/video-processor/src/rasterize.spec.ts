import { describe, it, expect, vi, beforeAll } from 'vitest';
import { rasterizeDocument } from './rasterize';
import { AnimationPlayer } from 'animation-player';
      

vi.stubGlobal('URL', {
  createObjectURL: vi.fn().mockReturnValue('mockedurl'),
});

vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
  blob: vi.fn().mockResolvedValue(new Blob())
}));

vi.mock('uuid', async () => {
  return {
    v4: vi.fn().mockReturnValue('mockuuid'),
  };
});

vi.mock('@ffmpeg/ffmpeg', async () => {
  const mockReadFile = {
    buffer: new Uint16Array(),
  };

  const mockFfmpeg = {
    writeFile: vi.fn().mockResolvedValue(undefined),
    load: vi.fn(),
    exec: vi.fn(),
    on: vi.fn(),
    createDir: vi.fn(),
    deleteFile: vi.fn(),
    terminate: vi.fn(),
    readFile: vi.fn().mockReturnValue(mockReadFile),
  };
  return {
    FFmpeg: vi.fn().mockReturnValue(mockFfmpeg),
  };
});

vi.mock('animation-player', async () => {
  const actual = await vi.importActual("animation-player");
  return {
    ...actual,
    generateScreenshot: vi.fn().mockResolvedValue({
      url: 'url',
      data: new Blob(),
    })
  }
});

beforeAll(() => {
  customElements.define('jf-animation-player', AnimationPlayer);
  Blob.prototype.arrayBuffer = async function () {
    return new ArrayBuffer(0);
  }
});

describe('rasterizeDocument', () => {
  it('should call onGeneratingCssScreenshotsStart', async () => {
    const spy = vi.fn();
    await rasterizeDocument({
      events: {
        onGeneratingCssScreenshotsStart: spy,
      },
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
          css: ``,
        },
      },
      doc: {
        frameRate: 30,
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

    expect(spy).toHaveBeenCalled();
  });

  it('should call onGeneratingCssScreenshotsEnd', async () => {
    const spy = vi.fn();
    await rasterizeDocument({
      events: {
        onGeneratingCssScreenshotsEnd: spy,
      },
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
          css: ``,
        },
      },
      doc: {
        frameRate: 30,
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

    expect(spy).toHaveBeenCalled();
  });
});