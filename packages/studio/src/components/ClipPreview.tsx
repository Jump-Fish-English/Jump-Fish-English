import { useLayoutEffect, useState } from "react";
import type { Clip, Source, VideoDocument } from '@jumpfish/video-processor';

import styles from './ClipPreview.module.css';
import { generateScreenshot } from "animation-player";

interface Props {
  clip: Clip;
  source: Source;
  doc: VideoDocument;
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  const image = new Image();
  const loadPromise = new Promise<void>((res) => {
    image.onload = () => {
      res();
    }
  });

  image.src = src;

  await loadPromise;
  return image;
}

const previewIntervalMilliseconds = 1000;


async function buildPreview({ doc, clip, source }: Props): Promise<Array<{
  url: string;
  data: Blob;
}>> {
  const { win: clipWindow } = clip;
  const { startMilliseconds, durationMilliseconds: trimDurationMilliseconds } = clipWindow;

  const numberOfPreviews = Math.ceil(trimDurationMilliseconds / previewIntervalMilliseconds);
  const step = trimDurationMilliseconds / numberOfPreviews;
  const urls: Array<{
    url: string;
    data: Blob;
  }> = [];
  for(let milliseconds = startMilliseconds; milliseconds < trimDurationMilliseconds + startMilliseconds; milliseconds += step) {
    const canvas = new OffscreenCanvas(doc.dimensions.width, doc.dimensions.height);
    const context = canvas.getContext('2d');
    if (context === null) {
      throw new Error('undefined context?');
    }
    
    if (source.type === 'video') {
      continue;
    }

    const { url } = await generateScreenshot({
      contents: {
        html: source.html,
        css: source.css,
      },
      milliseconds,
    });

    const image = await loadImage(url);
    document.body.appendChild(image);
    context.drawImage(image, 0 ,0);
    const blob = await canvas.convertToBlob();
    urls.push({
      data: blob,
      url: URL.createObjectURL(blob)
    });
  }

  return urls;
}

export function ClipPreview({ doc, clip, source }: Props) {
  const [urls, setUrls] = useState<string[]>([]);
  useLayoutEffect(() => {
    buildPreview({
      doc,
      clip,
      source,
    }).then((result) => {
      setUrls(
        result.map(({ url }) => url)
      );
    });
  }, [doc, clip, source]);

  return (
    <>
      {
        urls.map((image) => {
          return (
            <img className={styles.preview} src={image} key={image} />
          )
        })
      }
    </>
  )
}