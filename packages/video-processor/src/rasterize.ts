import { generateScreenshot } from 'animation-player';
import type { AnimationSource, Source, VideoDocument } from './video-document';
import { type Logger, generateVideo } from './ffmpeg';

interface Params {
  sources: Record<string, Source>;
  doc: VideoDocument;
  log?: Logger;
}

export async function rasterizeDocument({ log, doc, sources }: Params) {
  const clip = doc.timeline[0];
  const source = sources[clip.source] as AnimationSource;
  const frameRate = 30;
  const milliseconds = 1000 / 60;

  let currentTime = 0;
  const images: Array<{
    range: {
      startMilliseconds: number;
      endMilliseconds: number;
    };
    data: Blob;
  }> = [];
  while (currentTime < clip.win.durationMilliseconds) {
    let nextTime = currentTime + milliseconds;
    if (nextTime > clip.win.durationMilliseconds) {
      nextTime = clip.win.durationMilliseconds;
    }

    log?.({
      message: `Generating screenshot at time ${currentTime}`,
    });
    const { data } = await generateScreenshot({
      contents: {
        html: source.html,
        css: source.css,
      },
      milliseconds: currentTime,
    });
    const def = {
      data,
      range: {
        startMilliseconds: parseFloat(currentTime.toFixed(3)),
        endMilliseconds: parseFloat(nextTime.toFixed(3)),
      },
    };
    images.push(def);
    currentTime = nextTime;
  }

  log?.({
    message: `Generating video`,
  });
  const video = await generateVideo({
    log,
    dimensions: doc.dimensions,
    images,
    frameRate,
  });
  log?.({ message: `Video generation completed` });
  return video;
}
