import { millisecondsToFFMpegFormat } from './time';
import { v4 as uuidv4 } from 'uuid';
import { type FFmpeg } from '@ffmpeg/ffmpeg';
import { type VideoSource, type ImageSequence } from './video-document';

type EncodingPresets =
  | 'ultrafast'
  | 'superfast'
  | 'veryfast'
  | 'faster'
  | 'fast'
  | 'medium'
  | 'slow'
  | 'slower'
  | 'veryslow';

export interface MillisecondRange {
  startMilliseconds: number;
  durationMilliseconds: number;
}

interface OutputOptions {
  encodingPreset: EncodingPresets;
}

interface VideoFile {
  fileName: string;
  data: Blob;
  url: string;
}

async function exec({
  ffmpeg,
  command,
}: {
  ffmpeg: FFmpeg;
  command: string[];
}) {
  return ffmpeg.exec(command);
}

async function readFile({
  fileName,
  type,
  ffmpeg,
}: {
  type: 'video/mp4' | 'image/png';
  fileName: string;
  ffmpeg: FFmpeg;
}): Promise<VideoFile> {
  const contents = await ffmpeg.readFile(fileName);
  if (typeof contents === 'string') {
    throw new Error('String returned from readFile');
  }
  const blob = new Blob([contents.buffer], { type });
  return {
    fileName,
    data: blob,
    url: URL.createObjectURL(blob),
  };
}

interface WriteFileParams {
  type: 'video/mp4' | 'image/png';
  fileName: string;
  buffer: Uint8Array;
  ffmpeg: FFmpeg;
}

export async function writeFile({
  fileName,
  buffer,
  type,
  ffmpeg,
}: WriteFileParams): Promise<VideoFile> {
  await ffmpeg.writeFile(fileName, buffer);
  return await readFile({ ffmpeg, fileName, type });
}

export async function exportFrame({
  millisecond,
  source: { fileName },
  ffmpeg,
}: {
  ffmpeg: FFmpeg;
  source: Pick<VideoFile, 'fileName'>;
  millisecond: number;
}) {
  const outputFileName = `${uuidv4()}.png`;
  const command = [
    '-ss',
    millisecondsToFFMpegFormat(millisecond),
    '-i',
    fileName,
    '-vframes',
    '1',
  ];
  await ffmpeg.exec([...command, outputFileName]);

  const data = await ffmpeg.readFile(outputFileName);
  if (typeof data === 'string') {
    throw new Error('String returned from readFile');
  }
  return URL.createObjectURL(new Blob([data.buffer], { type: 'image/png' }));
}

interface ConcatParams {
  output: OutputOptions;
  files: Array<{
    file: VideoFile;
  }>;
  ffmpeg: FFmpeg;
}

async function concatVideoFiles({
  output: { encodingPreset },
  files,
  ffmpeg,
}: ConcatParams): Promise<VideoFile> {
  const inFile: string[] = [];
  for (const file of files) {
    const { file: data } = file;
    await writeFile({
      ffmpeg,
      fileName: data.fileName,
      buffer: new Uint8Array(await data.data.arrayBuffer()),
      type: 'video/mp4',
    });
    inFile.push(`file '${data.fileName}'`);
  }

  const contents = inFile.join('\n');
  const contentsFileName = `${uuidv4()}.txt`;
  const outputFileName = `${uuidv4()}.mp4`;
  const encoder = new TextEncoder();

  await writeFile({
    ffmpeg,
    fileName: contentsFileName,
    buffer: encoder.encode(contents),
    type: 'video/mp4',
  });

  await ffmpeg.exec([
    '-f',
    'concat',
    '-i',
    contentsFileName,
    '-async',
    '1',
    '-c',
    'copy',
    '-fflags',
    '+genpts',
    '-preset',
    encodingPreset,
    outputFileName,
  ]);

  return await readFile({
    ffmpeg,
    fileName: outputFileName,
    type: 'video/mp4',
  });
}

interface GenerationParams {
  ffmpeg: FFmpeg;
  dimensions: {
    width: number;
    height: number;
  };
  images: ImageSequence;
  frameRate: number;
  baseVideo: VideoSource;
}

interface OverlayImageSequenceParams {
  imageSequence: ImageSequence;
  ffmpeg: FFmpeg;
  base: VideoSource;
  position: {
    x: number;
    y: number;
  };
}

export async function overlayImageSequence({
  ffmpeg,
  position,
  base,
  imageSequence,
}: OverlayImageSequenceParams) {
  const { x, y } = position;
  const filters = imageSequence.map(({ range }, index) => {
    return `[${index + 1}]overlay=enable='between(t,${
      range.startMilliseconds / 1000
    },${range.endMilliseconds / 1000})':x=${x}:y=${y}`;
  });

  const filterStr = `[0]${filters.join('[out];[out]')}`;

  const inputs: string[] = [];
  for (const image of imageSequence) {
    const imageFileName = `${uuidv4()}.png`;
    await writeFile({
      ffmpeg,
      fileName: imageFileName,
      type: 'image/png',
      buffer: await fetch(image.url).then(
        async (resp) => new Uint8Array(await resp.arrayBuffer()),
      ),
    });
    inputs.push('-i', imageFileName);
  }

  const basefileName = `${uuidv4()}.mp4`;
  const outputFileName = `${uuidv4()}.mp4`;
  await writeFile({
    ffmpeg,
    fileName: basefileName,
    type: 'video/mp4',
    buffer: await fetch(base.url).then(async (resp) => {
      return new Uint8Array(await resp.arrayBuffer());
    }),
  });

  await ffmpeg.exec([
    '-i',
    basefileName,
    ...inputs,
    '-filter_complex',
    filterStr,
    outputFileName,
  ]);

  return await readFile({
    ffmpeg,
    type: 'video/mp4',
    fileName: outputFileName,
  });
}

async function createEmptyVideo({
  durationMilliseconds,
  frameRate,
  ffmpeg,
  dimensions,
}: {
  durationMilliseconds: number;
  frameRate: number;
  dimensions: { height: number; width: number };
  ffmpeg: FFmpeg;
}) {
  const blankVideoFileName = `blank-${uuidv4()}.mp4`;

  // create empty video
  await exec({
    ffmpeg,
    command: [
      '-f',
      'lavfi',
      '-i',
      `color=c=white:s=${dimensions.width}x${dimensions.height}`,
      '-t',
      `${durationMilliseconds / 1000}`,
      '-s',
      `${dimensions.width}x${dimensions.height}`,
      '-c:v',
      'libx264',
      '-vf',
      `format=yuv420p, fps=${frameRate}`,
      blankVideoFileName,
    ],
  });

  return await readFile({
    fileName: blankVideoFileName,
    type: 'video/mp4',
    ffmpeg,
  });
}

async function generateChunk({
  dimensions,
  images,
  ffmpeg,
  baseVideo,
}: GenerationParams) {
  const namespace = uuidv4();

  await ffmpeg.createDir(namespace);

  const rangeDefinitions: ImageSequence = [];
  for (const { url, range } of images) {
    const data = await fetch(url).then((resp) => resp.arrayBuffer());
    const fileName = `${uuidv4()}.png`;
    const unscaledFileName = `unscaled-${fileName}`;
    const path = `${namespace}/${fileName}`;
    const unscalledPath = `${namespace}/${unscaledFileName}`;
    await writeFile({
      ffmpeg,
      fileName: unscalledPath,
      buffer: new Uint8Array(data),
      type: 'image/png',
    });

    await ffmpeg.exec([
      '-i',
      unscalledPath,
      '-vf',
      `scale=${dimensions.width}:${dimensions.height}`,
      path,
    ]);

    const img = await readFile({
      ffmpeg,
      fileName: path,
      type: 'image/png',
    });

    await ffmpeg.deleteFile(unscalledPath);

    rangeDefinitions.push({
      range,
      url: img.url,
    });
  }

  return overlayImageSequence({
    ffmpeg,
    position: {
      x: 0,
      y: 0,
    },
    base: baseVideo,
    imageSequence: rangeDefinitions,
  });
}

function chunkArray<T>(arr: T[], chunkSize: number): T[][] {
  const myArray: T[][] = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    myArray.push(arr.slice(i, i + chunkSize));
  }
  return myArray;
}

interface ImageSequenceVideoParams {
  dimensions: {
    width: number;
    height: number;
  };
  images: ImageSequence;
  frameRate: number;
  requestFfmpeg: <T>(cb: (ffmpeg: FFmpeg) => Promise<T>) => Promise<T>;
}

export async function generateImageSequenceVideo({
  dimensions,
  images,
  frameRate,
  requestFfmpeg,
}: ImageSequenceVideoParams): Promise<VideoSource> {
  const chunks = chunkArray(images, 50);
  const results: Array<{
    file: VideoFile;
  }> = [];

  for (const chunk of chunks) {
    const start = chunk[0].range.startMilliseconds;
    const end = chunk[chunk.length - 1].range.endMilliseconds;
    const durationMilliseconds = end - start;
    if (chunk.length > 1) {
      const imageSequence: ImageSequence = chunk.map((item) => {
        return {
          url: item.url,
          range: {
            startMilliseconds: item.range.startMilliseconds - start,
            endMilliseconds: item.range.endMilliseconds - start,
          },
        };
      });
      const baseVideo = await requestFfmpeg(async (ffmpeg: FFmpeg) => {
        return createEmptyVideo({
          frameRate,
          dimensions,
          ffmpeg,
          durationMilliseconds,
        });
      });
      const result = await requestFfmpeg(async (ffmpeg: FFmpeg) => {
        return await generateChunk({
          baseVideo: {
            id: baseVideo.url,
            title: 'Untitled',
            durationMilliseconds,
            url: baseVideo.url,
            type: 'video',
            thumbnailUrl: '',
          },
          ffmpeg,
          images: imageSequence,
          dimensions,
          frameRate,
        });
      });
      results.push({
        file: result,
      });
    }
  }

  const file = await requestFfmpeg(async (ffmpeg) => {
    return await concatVideoFiles({
      ffmpeg,
      output: {
        encodingPreset: 'medium',
      },
      files: results,
    });
  });

  const vid = document.createElement('video');
  const durationMillisecondsPromise = new Promise<number>((res) => {
    vid.addEventListener('durationchange', () => res(vid.duration * 1000), {
      once: true,
    });
  });
  vid.src = file.url;

  return {
    type: 'video',
    id: uuidv4(),
    title: 'Untitled',
    durationMilliseconds: await durationMillisecondsPromise,
    url: file.url,
    thumbnailUrl: '',
  };
}

interface ConcatVideoSourcesParams {
  sources: VideoSource[];
  ffmpeg: FFmpeg;
}

async function writeVideoSource(ffmpeg: FFmpeg, source: VideoSource) {
  const fileName = `${uuidv4()}.mp4`;
  const blob = await fetch(source.url).then((resp) => resp.blob());

  return await writeFile({
    ffmpeg,
    fileName,
    buffer: new Uint8Array(await blob.arrayBuffer()),
    type: 'video/mp4',
  });
}

export async function concatVideoSources({
  ffmpeg,
  sources,
}: ConcatVideoSourcesParams): Promise<VideoSource | null> {
  let videoFile: VideoFile | null = null;
  for (const source of sources) {
    const file = await writeVideoSource(ffmpeg, source);
    if (videoFile === null) {
      videoFile = file;
      continue;
    }

    videoFile = await concatVideoFiles({
      ffmpeg,
      output: {
        encodingPreset: 'ultrafast',
      },
      files: [
        {
          file: videoFile,
        },
        {
          file,
        },
      ],
    });
  }

  if (videoFile === null) {
    throw new Error('Unexpected null video file');
  }

  const vid = document.createElement('video');
  const durationMillisecondsPromise = new Promise<number>((res) => {
    vid.addEventListener('durationchange', () => res(vid.duration * 1000), {
      once: true,
    });
  });
  vid.src = videoFile.url;

  return {
    type: 'video',
    id: uuidv4(),
    title: 'Untitled',
    url: videoFile.url,
    thumbnailUrl: '',
    durationMilliseconds: await durationMillisecondsPromise,
  };
}
