import { destroy, instance } from './instance';
import { millisecondsToFFMpegFormat } from './time';
import { v4 as uuidv4 } from 'uuid';

type EncodingPresets = 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow';

export interface MillisecondRange {
  startMilliseconds: number;
  durationMilliseconds: number;
}

interface OutputOptions {
  encodingPreset: EncodingPresets;
}

export interface VideoFile {
  fileName: string;
  data: Blob;
  url: string;
}

interface ClipParams { 
  output: OutputOptions,
  source: VideoFile;
  range: MillisecondRange,
  progress?: () => void;
}

export async function trim({ output: { encodingPreset }, source: { fileName }, range: { startMilliseconds, durationMilliseconds } }: ClipParams): Promise<VideoFile> {
  const ffmpeg = await instance();
  const outputFileName = `${uuidv4()}.mp4`;
  const command = ['-i', fileName, '-ss', millisecondsToFFMpegFormat(startMilliseconds), '-t', millisecondsToFFMpegFormat(durationMilliseconds)];
  await ffmpeg.exec([...command, '-preset', encodingPreset, outputFileName]);
  return await readFile({ fileName: outputFileName, type: 'video/mp4' });
}

async function readFile({ fileName, type }: { type: 'video/mp4' | 'image/png', fileName: string }): Promise<VideoFile>  {
  const ffmpeg = await instance();
  const contents = await ffmpeg.readFile(fileName);
  if (typeof contents === 'string') {
    throw new Error('String returned from readFile');
  }
  const blob = new Blob([contents.buffer], { type });
  return {
    fileName,
    data: blob,
    url: URL.createObjectURL(blob)
  };
}

export async function writeFile({ fileName, buffer, type }: { type: 'video/mp4' | 'image/png', fileName: string, buffer: Uint8Array }): Promise<VideoFile> {
  const ffmpeg = await instance();
  await ffmpeg.writeFile(fileName, buffer);
  return await readFile({ fileName, type });
}

export async function exportFrame({ millisecond, source: { fileName } }: { source: Pick<VideoFile, 'fileName'>, millisecond: number }) {
  const ffmpeg = await instance();
  const outputFileName = `${uuidv4()}.png`;
  const command = ['-ss', millisecondsToFFMpegFormat(millisecond), '-i', fileName, '-vframes', '1'];
  await ffmpeg.exec([...command, outputFileName]);
  
  const data = await ffmpeg.readFile(outputFileName);
  if (typeof data === 'string') {
    throw new Error('String returned from readFile');
  }
  return URL.createObjectURL(new Blob([data.buffer], {type: 'image/png'}));
}

interface ConcatParams {
  output: OutputOptions,
  files: Array<{
    file: VideoFile;
    inpointMilliseconds: number;
    outpointMilliseconds: number;
  }>
}

export async function concatVideoFiles({ output: { encodingPreset }, files }: ConcatParams): Promise<VideoFile> {
  const ffmpeg = await instance();
  const inFile: string[] = [];

  for(const file of files) {
    const { file: data, outpointMilliseconds, inpointMilliseconds } = file;
    console.log('writing', data.fileName)
    await writeFile({
      fileName: data.fileName,
      buffer: new Uint8Array(await data.data.arrayBuffer()),
      type: 'video/mp4',
    });
    inFile.push(`file '${data.fileName}'`);
    const formattedInpoint = millisecondsToFFMpegFormat(inpointMilliseconds);
    inFile.push(`inpoint ${formattedInpoint}`);
    const formattedOutpoint = millisecondsToFFMpegFormat(outpointMilliseconds);
    inFile.push(`outpoint ${formattedOutpoint}`);
  }

  const contents = inFile.join('\n');
  const contentsFileName = `${uuidv4()}.txt`;
  const outputFileName = `${uuidv4()}.mp4`;
  const encoder = new TextEncoder();
  console.log(inFile)
  ffmpeg.on('log', console.log.bind(console));
  await writeFile({
    fileName: contentsFileName,
    buffer: encoder.encode(contents),
    type: 'video/mp4'
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
    outputFileName
  ]);

  const result = await readFile({ fileName: outputFileName, type: 'video/mp4' });
  await destroy();
  return result;
}

interface GenerationParams {
  dimensions: {
    width: number;
    height: number;
  },
  images: Array<{
    range: {
      startMilliseconds: number;
      endMilliseconds: number;
    },
    data: Blob;
  }>,
  durationMilliseconds: number;
  frameRate: number;
}

async function generateChunk({ durationMilliseconds, dimensions, images, frameRate }: GenerationParams) {
  const ffmpeg = await instance();
  const namespace = uuidv4();

  await ffmpeg.createDir(namespace);

  const rangeDefinitions: Array<{
    range: {
      startMilliseconds: number;
      endMilliseconds: number;
    },
    path: string,
  }> = [];
  for(const { data, range } of images) {
    const fileName = `${uuidv4()}.png`;
    const unscaledFileName = `unscaled-${fileName}`;
    const path = `${namespace}/${fileName}`;
    const unscalledPath = `${namespace}/${unscaledFileName}`;
    await writeFile({
      fileName: unscalledPath,
      buffer: new Uint8Array(await data.arrayBuffer()),
      type: 'image/png'
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
  const chunkedRangeDefinitions = chunkArray(rangeDefinitions, 20).map((chunk, index) => {
    const outputFileName = `${uuid}-${index}.mp4`;
    return {
      outputFileName,
      previousOutputFileName: index === 0 ? blankVideoFileName : `${uuid}-${index - 1}.mp4`,
      chunk,
    }
  });
  
  // create empty video
  await ffmpeg.exec([
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
    blankVideoFileName
  ]);

  for(const { chunk, outputFileName, previousOutputFileName } of chunkedRangeDefinitions) {
    const filters = chunk.map(({ range }, index) => {
      return `[${index + 1}]overlay=enable='between(t,${range.startMilliseconds / 1000},${range.endMilliseconds / 1000})':x=0:y=0`;
    });
  
    const filterStr = `[0]${filters.join('[out];[out]')}`
  
    const inputs = chunk.map(({ path }) => {
      return ['-i', path];
    }).reduce((acc, item) => {
      return [
        ...acc,
        ...item,
      ];
    }, []);
    
    // overlay images
    await ffmpeg.exec([
      '-i',
      previousOutputFileName,
      ...inputs,
      '-filter_complex',
      filterStr,
      outputFileName
    ]);

    for(const item of chunk) {
      await ffmpeg.deleteFile(item.path);
    }

    await ffmpeg.deleteFile(previousOutputFileName);
  }

  const lastFile = chunkedRangeDefinitions[chunkedRangeDefinitions.length - 1].outputFileName;
  const file = await readFile({
    fileName: lastFile,
    type: 'video/mp4'
  });

  await ffmpeg.deleteFile(lastFile);
  await destroy();

  return file;
}

function chunkArray<T>(arr: T[], chunkSize: number): T[][] {
  const myArray: T[][] = [];
  for(var i = 0; i < arr.length; i += chunkSize) {
    myArray.push(arr.slice(i, i+chunkSize));
  }
  return myArray;
}


export async function generateVideo({ dimensions, images, frameRate }: Omit<GenerationParams, 'durationMilliseconds'>): Promise<VideoFile> {
  const chunks = chunkArray(images, 50);
  const results: Array<{
    file: VideoFile;
    inpointMilliseconds: ConcatParams['files'][number]['inpointMilliseconds'],
    outpointMilliseconds: ConcatParams['files'][number]['outpointMilliseconds'],
  }> = [];
  
  for(const chunk of chunks) {
    const start = chunk[0].range.startMilliseconds;
    const end = chunk[chunk.length - 1].range.endMilliseconds;
    const durationMilliseconds = end - start;
    if (chunk.length > 1) {
      const result = await generateChunk({
        durationMilliseconds,
        images: chunk.map((item) => {
          return {
            data: item.data,
            range: {
              startMilliseconds: item.range.startMilliseconds - start,
              endMilliseconds: item.range.endMilliseconds - start,
            }
          }
        }),
        dimensions,
        frameRate,
      });
      results.push({
        file: result,
        inpointMilliseconds: 0,
        outpointMilliseconds: durationMilliseconds,
      });
    }
    
  }

  return await concatVideoFiles({
    output: {
      encodingPreset: 'medium'
    },
    files: results,
  });
}