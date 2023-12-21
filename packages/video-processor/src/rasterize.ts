import { generateScreenshot } from 'animation-player';
import type { AnimationSource, Clip, Source, VideoDocument, VideoSource } from './video-document';
import { type Logger, generateVideo, concatVideoSources } from './ffmpeg';
import Queue from 'queue';

interface Params {
  clip: Clip;
  source: AnimationSource;
  doc: VideoDocument;
  log?: Logger;
  events?: {
    onGeneratingCssScreenshotsStart?: () => void;
    onGeneratingCssScreenshotsEnd?: () => void;
  }
}

interface RasterizeEvents {
  onGeneratingCssScreenshotsStart?: () => void;
  onGeneratingCssScreenshotsEnd?: () => void;
}

interface GeneratedScreenshot {
  range: {
    startMilliseconds: number;
    endMilliseconds: number;
  };
  data: Blob;
}

async function rasterizeAnimationClip({ clip, source, events, doc }: Params) {
  const { frameRate, dimensions: documentDimensions } = doc;
  const milliseconds = 1000 / 60;

  const queue = new Queue({
    concurrency: 5,
    autostart: true,
  });
  let currentTime = 0;
  const images: GeneratedScreenshot[] = [];
  events?.onGeneratingCssScreenshotsStart?.();

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
      images.push(def);
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
  events?.onGeneratingCssScreenshotsEnd?.();
  
  const video = await generateVideo({
    dimensions: documentDimensions,
    images,
    frameRate,
  });
  return video;
}

interface RasterizeClipParams {
  clip: Clip;
  source: Source;
  events?: RasterizeEvents;
  doc: VideoDocument;
}


async function convertToVideoClip({ doc, events, clip, source }: RasterizeClipParams): Promise<{ clip: Clip, source: VideoSource }> {
  const { type: sourceType } = source;
  switch(sourceType) {
    case 'animation': {
      const videoFile = await rasterizeAnimationClip({
        clip,
        source,
        events,
        doc,
      });

      return {
        clip: {
          ...clip,
          id: `${clip.id}-rastered`,
        },
        source: {
          ...source,
          type: 'video',
          url: videoFile.url,
          thumbnailUrl: '',
        }
      }
    }
    case 'video': {
      return {
        clip,
        source,
      };
    }
  }
}

interface RasterizeParams {
  sources: Record<string, Source>;
  doc: VideoDocument;
  log?: Logger;
  events?: RasterizeEvents;
}

export async function rasterizeDocument({ events, doc, sources }: RasterizeParams) {
  const { timeline } = doc;

  const videoSources: VideoSource[] = [];
  for(const clip of timeline) {
    const source = sources[clip.source];
    const videoClip = await convertToVideoClip({
      doc,
      events,
      clip,
      source,
    });

    videoSources.push(videoClip.source);
  }

  
  const result = await concatVideoSources({ sources: videoSources });
  if (result === null) {
    throw new Error('Unexpected null result');
  }
  return result;
}