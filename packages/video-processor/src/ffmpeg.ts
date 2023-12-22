import { destroy, instance } from './instance';
import { millisecondsToFFMpegFormat } from './time';
import { v4 as uuidv4 } from 'uuid';
import { type FFmpeg } from '@ffmpeg/ffmpeg';
import { VideoSource, ImageSequence } from './video-document';

type Events =
  | {
      name: 'base-video-generated';
      video: VideoFile;
    }
  | {
      name: 'on-ffmpeg-exec';
      arguments: string[];
      command: string;
    }
  | {
      name?: never;
      message: string;
    };

export type Logger = (params: Events) => void;

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
  log,
}: {
  ffmpeg: FFmpeg;
  command: string[];
  log?: Logger;
}) {
  if (log !== undefined) {
    log({
      name: 'on-ffmpeg-exec',
      arguments: command,
      command: `ffmpeg ${command.join(' ')}`,
    });
  }

  return ffmpeg.exec(command);
}

async function readFile({
  fileName,
  type,
}: {
  type: 'video/mp4' | 'image/png';
  fileName: string;
}): Promise<VideoFile> {
  const ffmpeg = await instance();
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
}

export async function writeFile({
  fileName,
  buffer,
  type,
}: WriteFileParams): Promise<VideoFile> {
  const ffmpeg = await instance();
  await ffmpeg.writeFile(fileName, buffer);
  return await readFile({ fileName, type });
}

export async function exportFrame({
  millisecond,
  source: { fileName },
}: {
  source: Pick<VideoFile, 'fileName'>;
  millisecond: number;
}) {
  const ffmpeg = await instance();
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
  log?: Logger;
  output: OutputOptions;
  files: Array<{
    file: VideoFile;
  }>;
}

async function concatVideoFiles({
  log,
  output: { encodingPreset },
  files,
}: ConcatParams): Promise<VideoFile> {
  const ffmpeg = await instance();
  const inFile: string[] = [];
  for (const file of files) {
    const { file: data } = file;
    await writeFile({
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
    fileName: contentsFileName,
    buffer: encoder.encode(contents),
    type: 'video/mp4',
  });

  log?.({ message: `Generating video` });
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

  const result = await readFile({
    fileName: outputFileName,
    type: 'video/mp4',
  });
  await destroy();
  return result;
}

interface GenerationParams {
  log?: Logger;
  dimensions: {
    width: number;
    height: number;
  };
  images: Array<{
    range: {
      startMilliseconds: number;
      endMilliseconds: number;
    };
    url: string;
  }>;
  durationMilliseconds: number;
  frameRate: number;
}

interface OverlayImageSequenceParams {
  imageSequence: ImageSequence;
  base: VideoSource;
  position: {
    x: number;
    y: number;
  }
}

export async function overlayImageSequence({ position, base, imageSequence }: OverlayImageSequenceParams) {
  const { x, y } = position;
  const ffmpeg = await instance();
  const filters = imageSequence.map(({ range }, index) => {
    return `[${index + 1}]overlay=enable='between(t,${
      range.startMilliseconds / 1000
    },${range.endMilliseconds / 1000})':x=${x}:y=${y}`;
  });

  const filterStr = `[0]${filters.join('[out];[out]')}`;

  const inputs: string[] = [];
  for(const image of imageSequence) {
    const imageFileName = `${uuidv4()}.png`;
    await writeFile({
      fileName: imageFileName,
      type: 'image/png',
      buffer: await fetch(image.url).then(async (resp) => new Uint8Array(await resp.arrayBuffer()))
    });
    inputs.push('-i', imageFileName);
  }


  const basefileName = `${uuidv4()}.mp4`;
  const outputFileName = `${uuidv4()}.mp4`;
  await writeFile({
    fileName: basefileName,
    type: 'video/mp4',
    buffer: await fetch(base.url).then(async (resp) => {
      return new Uint8Array(await resp.arrayBuffer());
    })
  })

  await ffmpeg.exec([
    '-i',
    basefileName,
    ...inputs,
    '-filter_complex',
    filterStr,
    outputFileName,
  ]);

  return await readFile({
    type: 'video/mp4',
    fileName: outputFileName,
  });
}

async function generateChunk({
  log,
  durationMilliseconds,
  dimensions,
  images,
  frameRate,
}: GenerationParams) {
  const ffmpeg = await instance();
  const namespace = uuidv4();

  await ffmpeg.createDir(namespace);

  const rangeDefinitions: Array<{
    range: {
      startMilliseconds: number;
      endMilliseconds: number;
    };
    path: string;
  }> = [];
  for (const { url, range } of images) {
    const data = await fetch(url).then((resp) => resp.arrayBuffer());
    const fileName = `${uuidv4()}.png`;
    const unscaledFileName = `unscaled-${fileName}`;
    const path = `${namespace}/${fileName}`;
    const unscalledPath = `${namespace}/${unscaledFileName}`;
    await writeFile({
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

    await ffmpeg.deleteFile(unscalledPath);

    rangeDefinitions.push({
      range,
      path,
    });
  }

  const uuid = uuidv4();
  const blankVideoFileName = `blank-${uuidv4()}.mp4`;
  const chunkedRangeDefinitions = chunkArray(rangeDefinitions, 20).map(
    (chunk, index) => {
      const outputFileName = `${uuid}-${index}.mp4`;
      return {
        outputFileName,
        previousOutputFileName:
          index === 0 ? blankVideoFileName : `${uuid}-${index - 1}.mp4`,
        chunk,
      };
    },
  );

  // create empty video
  await exec({
    log,
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

  if (log !== undefined) {
    log({
      name: 'base-video-generated',
      video: await readFile({
        fileName: blankVideoFileName,
        type: 'video/mp4',
      }),
    });
  }

  for (const {
    chunk,
    outputFileName,
    previousOutputFileName,
  } of chunkedRangeDefinitions) {
    const filters = chunk.map(({ range }, index) => {
      return `[${index + 1}]overlay=enable='between(t,${
        range.startMilliseconds / 1000
      },${range.endMilliseconds / 1000})':x=0:y=0`;
    });

    const filterStr = `[0]${filters.join('[out];[out]')}`;

    const inputs = chunk
      .map(({ path }) => {
        return ['-i', path];
      })
      .reduce((acc, item) => {
        return [...acc, ...item];
      }, []);

    // overlay images
    await ffmpeg.exec([
      '-i',
      previousOutputFileName,
      ...inputs,
      '-filter_complex',
      filterStr,
      outputFileName,
    ]);

    for (const item of chunk) {
      await ffmpeg.deleteFile(item.path);
    }

    await ffmpeg.deleteFile(previousOutputFileName);
  }

  const lastFile =
    chunkedRangeDefinitions[chunkedRangeDefinitions.length - 1].outputFileName;
  const file = await readFile({
    fileName: lastFile,
    type: 'video/mp4',
  });

  await ffmpeg.deleteFile(lastFile);
  await destroy();

  return file;
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
  },
  images: ImageSequence;
  frameRate: number;
}

export async function generateImageSequenceVideo({
  dimensions,
  images,
  frameRate,
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
      const result = await generateChunk({
        durationMilliseconds,
        images: chunk.map((item) => {
          return {
            url: item.url,
            range: {
              startMilliseconds: item.range.startMilliseconds - start,
              endMilliseconds: item.range.endMilliseconds - start,
            },
          };
        }),
        dimensions,
        frameRate,
      });
      results.push({
        file: result,
      });
    }
  }

  const file = await concatVideoFiles({
    output: {
      encodingPreset: 'medium',
    },
    files: results,
  });

  const vid = document.createElement('video');
  const durationMillisecondsPromise = new Promise<number>((res) => {
    vid.addEventListener('durationchange', () => res(vid.duration * 1000), { once: true });
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
}

async function writeVideoSource(source: VideoSource) {
  const fileName = `${uuidv4()}.mp4`;
  const blob = await fetch(source.url).then((resp) => resp.blob());
  
  return await writeFile({
    fileName,
    buffer: new Uint8Array(await blob.arrayBuffer()),
    type: 'video/mp4',
  });
}

export async function concatVideoSources({ sources }: ConcatVideoSourcesParams): Promise<VideoSource | null> {
  let videoFile: VideoFile | null = null;
  for(const source of sources) {
    const file = await writeVideoSource(source);
    if (videoFile === null) {
      videoFile = file;
      continue;
    }

    videoFile = await concatVideoFiles({
      output: {
        encodingPreset: 'ultrafast',
      },
      files: [{
        file: videoFile,
      }, {
        file,
      }]
    })
  }

  if (videoFile === null) {
    throw new Error('Unexpected null video file');
  }

  const vid = document.createElement('video');
  const durationMillisecondsPromise = new Promise<number>((res) => {
    vid.addEventListener('durationchange', () => res(vid.duration * 1000), { once: true });
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