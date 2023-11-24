import type { Playable } from './playable';
import { init as initPlayer } from './playable';
import html2Canvas from 'html2canvas';

interface RasterizeOptions {
  canvasElement: HTMLElement;
  framesPerSecond: number;
}

export async function rasterize(playable: { duration: number, currentTime: number }, { canvasElement, framesPerSecond }: RasterizeOptions) {
  const timeBetweenFrames = 1000 / framesPerSecond;
  for(let i = 0; i <= playable.duration; i += timeBetweenFrames) {
    html2Canvas(canvasElement, {
      onclone(doc) {
        const localAnimations = doc.getAnimations();
        localAnimations.forEach((animm) => {
          animm.pause();
          animm.currentTime = 0;
        });
      }
    }).then((raster) => {
      document.getElementById('frames')!.appendChild(raster);
    });
  }
}