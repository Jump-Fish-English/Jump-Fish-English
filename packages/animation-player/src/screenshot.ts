import generate from 'html2canvas';
import { type AnimationContents, AnimationPlayer } from './AnimationPlayer';
import { v4 as uuidV4 } from 'uuid';

interface Params {
  contents: AnimationContents;
  milliseconds: number;
}

interface Options {
  onCanvas?(canvas: HTMLCanvasElement): void;
  appendClone?(el: AnimationPlayer): void;
}

export interface AnimationScreenshot {
  data: Blob;
  url: string;
  originalDimensions: {
    height: number;
    width: number;
  };
  originalDevicePixelRatio: number;
}

export async function generateScreenshot(
  { contents, milliseconds }: Params,
  options: Options = {},
): Promise<AnimationScreenshot> {
  const { devicePixelRatio: originalDevicePixelRatio } = window;
  const elm = new AnimationPlayer();
  const elementInstanceId = uuidV4();
  elm.style.display = 'inline-block';
  elm.style.position = 'fixed';
  elm.style.left = '-100000px';
  elm.id = elementInstanceId;
  const appendClone =
    options.appendClone === undefined
      ? (clone: HTMLElement) => {
          document.body.appendChild(clone);
        }
      : options.appendClone;

  appendClone(elm);
  if (elm.isConnected === false) {
    throw new Error('appendClone did not append the clone to the document!');
  }

  const canPlayThroughPromise = new Promise((res) => {
    elm.addEventListener('canplaythrough', res, {
      once: true,
    });
  });

  elm.load(contents);

  await canPlayThroughPromise;

  await new Promise(requestAnimationFrame);
  const rect = elm.getBoundingClientRect();

  elm.currentTime = milliseconds / 1000;
  const container = elm.container();
  if (container === undefined) {
    throw new Error('Should be a container here');
  }
  const canvasElement = await generate(elm, {
    backgroundColor: 'transparent',
    logging: false,
    onclone(doc) {
      doc.getAnimations().forEach((animation) => {
        animation.cancel();
      });
    },
  });
  options.onCanvas?.(canvasElement);

  const blob = await new Promise<Blob>((res) => {
    canvasElement.toBlob((blob) => {
      if (blob === null) {
        throw new Error('Invalid blob generated');
      }
      res(blob);
    });
  });
  elm.parentElement?.removeChild(elm);

  return {
    data: blob,
    url: URL.createObjectURL(blob),
    originalDimensions: {
      width: rect.width,
      height: rect.height,
    },
    originalDevicePixelRatio,
  };
}
