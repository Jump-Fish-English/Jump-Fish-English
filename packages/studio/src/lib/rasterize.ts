import type { Playable } from './media';
import { init as initPlayer } from './media';
import html2Canvas from 'html2canvas';

interface RasterizeOptions {
  canvasElement: HTMLElement;
  framesPerSecond: number;
}

export async function rasterize(playable: { duration: number, currentTime: number }, { canvasElement, framesPerSecond }: RasterizeOptions) {
  const timeBetweenFrames = 1000 / framesPerSecond;
  for(let i = 0; i <= playable.duration; i += timeBetweenFrames) {
    playable.currentTime = i;
    const raster = await html2Canvas(canvasElement, {
      logging: false,
      onclone(doc, el) {
        const localAnimations = doc.getAnimations();
        const player = initPlayer(localAnimations);
        player.currentTime = i;
      }
    });
    document.getElementById('frames')!.appendChild(raster);
  }
}