import { instance } from './instance';
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
  data: Uint8Array;
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
  const data = await ffmpeg.readFile(outputFileName);
  if (typeof data === 'string') {
    throw new Error('String returned from readFile');
  }

  return {
    fileName: outputFileName,
    data,
  };
}

export async function writeFile({ fileName, buffer }: { fileName: string, buffer: Uint8Array }): Promise<VideoFile> {
  const ffmpeg = await instance();
  await ffmpeg.writeFile(fileName, buffer);
  return {
    fileName,
    data: buffer,
  };
}

export async function exportFrame({ millisecond, source: { fileName } }: { source: Pick<VideoFile, 'fileName'>, millisecond: number }) {
  const ffmpeg = await instance();
  const outputFileName = `${uuidv4()}.png`;
  const command = ['-i', fileName, '-ss', millisecondsToFFMpegFormat(millisecond), '-vframes', '1'];
  await ffmpeg.exec([...command, outputFileName]);
  const data = await ffmpeg.readFile(outputFileName);
  if (typeof data === 'string') {
    throw new Error('String returned from readFile');
  }

  return URL.createObjectURL(new Blob([data.buffer], {type: 'image/png'}));
}