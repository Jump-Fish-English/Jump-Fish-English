import { generateScreenshot } from 'animation-player';
import { v4 as uuidv4 } from 'uuid';
import type {
  AnimationSource,
  Clip,
  ImageSequence,
  VideoDocument,
  VideoSource,
} from './video-document';
import {
  generateImageSequenceVideo,
  concatVideoSources,
  overlayImageSequence as ffmpegOverayImageSequence,
} from './ffmpeg';
import { instance } from './instance';
import Queue from 'queue';

interface Params {
  clip: Clip;
  source: AnimationSource;
}

export async function animationClipToImageSequence({ clip, source }: Params) {
  const milliseconds = 1000 / 60;

  const queue = new Queue({
    concurrency: 5,
    autostart: true,
  });
  let currentTime = 0;
  const sequence: ImageSequence = [];

  function queueGenerateScreenshot(
    queue: Queue,
    currentTime: number,
    nextTime: number,
  ) {
    queue.push(async () => {
      const { url } = await generateScreenshot({
        contents: {
          html: source.html,
          css: source.css,
        },
        milliseconds: currentTime,
      });
      const def = {
        url,
        range: {
          startMilliseconds: parseFloat(currentTime.toFixed(3)),
          endMilliseconds: parseFloat(nextTime.toFixed(3)),
        },
      };
      sequence.push(def);
    });
  }

  while (currentTime < clip.win.durationMilliseconds) {
    let nextTime = currentTime + milliseconds;
    if (nextTime > clip.win.durationMilliseconds) {
      nextTime = clip.win.durationMilliseconds;
    }

    queueGenerateScreenshot(queue, currentTime, nextTime);

    currentTime = nextTime;
  }
  await new Promise((res) => {
    queue.addEventListener('end', res, { once: true });
  });

  return sequence;
}

export async function imageSequenceToVideo({
  sequence,
  doc,
}: {
  doc: Pick<VideoDocument, 'frameRate' | 'dimensions'>;
  sequence: ImageSequence;
}) {
  const { dimensions: documentDimensions, frameRate } = doc;
  return await generateImageSequenceVideo({
    dimensions: documentDimensions,
    images: sequence,
    frameRate,
    requestFfmpeg: instance,
  });
}

export async function concatVideoClips({
  clips,
  sources,
}: {
  clips: Clip[];
  sources: Record<string, VideoSource>;
}) {
  const videoSources: VideoSource[] = [];
  for (const clip of clips) {
    videoSources.push(sources[clip.source]);
  }

  return await instance(async (ffmpeg) => {
    const result = await concatVideoSources({ ffmpeg, sources: videoSources });
    if (result === null) {
      throw new Error('Unexpected null result');
    }
    return result;
  });
}

interface OverlayImageSequenceParams {
  base: VideoSource;
  sequence: ImageSequence;
  offsetMilliseconds: number;
  position: {
    x: number;
    y: number;
  };
}

export async function overlayImageSequence({
  position,
  base,
  sequence,
  offsetMilliseconds,
}: OverlayImageSequenceParams): Promise<VideoSource> {
  const result = await instance(async (ffmpeg) => {
    return await ffmpegOverayImageSequence({
      ffmpeg,
      position,
      base,
      imageSequence: sequence.map((item) => {
        const {
          range: { startMilliseconds, endMilliseconds },
        } = item;
        return {
          ...item,
          range: {
            startMilliseconds: startMilliseconds + offsetMilliseconds,
            endMilliseconds: endMilliseconds + offsetMilliseconds,
          },
        };
      }),
    });
  });

  return {
    ...base,
    id: uuidv4(),
    title: 'Untitled',
    url: result.url,
  };
}
