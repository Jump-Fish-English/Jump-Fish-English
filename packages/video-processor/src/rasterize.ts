import { generateScreenshot } from "animation-player";
import type { AnimationSource, Source, VideoDocument } from "./video-document";
import { generateVideo } from './ffmpeg';

interface Params {
  sources: Record<string, Source>,
  doc: VideoDocument;
}

export async function rasterizeDocument({ doc, sources }: Params) {
  const clip = doc.timeline[0];
  const source = sources[clip.source] as AnimationSource;
  const frameRate = 30;
  const milliseconds = 1000 / 60

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

  return await generateVideo({
    dimensions: doc.dimensions,
    images,
    frameRate,
  });
}