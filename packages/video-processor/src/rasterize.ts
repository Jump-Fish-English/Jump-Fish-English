import { generateScreenshot } from 'animation-player';
import type { AnimationSource, Clip, ImageSequence, VideoDocument, VideoSource } from './video-document';
import { type Logger, generateImageSequenceVideo, concatVideoSources } from './ffmpeg';
import Queue from 'queue';

interface Params {
  clip: Clip;
  source: AnimationSource;
  log?: Logger;
}

export async function animationClipToImageSequence({ clip, source }: Params) {
  const milliseconds = 1000 / 60;

  const queue = new Queue({
    concurrency: 5,
    autostart: true,
  });
  let currentTime = 0;
  const sequence: ImageSequence = [];

  function queueGenerateScreenshot(queue: Queue, currentTime: number, nextTime: number) {
    queue.push(async () => {
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
    queue.addEventListener('end', res, { once: true});
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
  });
}

export async function concatVideoClips({ clips, sources }: { clips: Clip[], sources: Record<string, VideoSource> }) {
  const videoSources: VideoSource[] = [];
  for(const clip of clips) {
    videoSources.push(
      sources[clip.source]
    );
  }

  
  const result = await concatVideoSources({ sources: videoSources });
  if (result === null) {
    throw new Error('Unexpected null result');
  }
  return result;
}