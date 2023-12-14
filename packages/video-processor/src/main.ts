import { instance } from './instance';

type EncodingPresets = 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow';

interface VideoMedia {
  type: 'video',
  name: string;
  buffer: Uint8Array;
}

interface VideoTimeline {
  media: VideoMedia[];
}

interface Params {
  output: {
    encodingPreset: EncodingPresets;
  },
  timeline: VideoTimeline;
}

export async function generate({ output: { encodingPreset }, timeline }: Params) {
  const ffmpeg = await instance()
  const { media } = timeline;

  const commands: string[][] = [];
  for(const item of media) {
    switch (item.type) {
      case 'video': {
        const { buffer, name: fileName } = item;
        await ffmpeg.writeFile(fileName, buffer);
        commands.push([
          '-i',
          fileName,
        ])
      }
    }
  }

  const command = commands.reduce((acc, current) => {
    return [
      ...acc,
      ...current,
    ];
  }, [] as string[]);

  await ffmpeg.exec([...command, '-preset', encodingPreset, 'output.mp4']);
  const data = await ffmpeg.readFile('output.mp4');
  if (typeof data === 'string') {
    throw new Error('String returned from readFile');
  }
  return URL.createObjectURL(new Blob([data.buffer], {type: 'video/mp4'}));
}