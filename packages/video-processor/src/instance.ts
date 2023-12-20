import { FFmpeg } from '@ffmpeg/ffmpeg';

const BASE_URL = 'https://unpkg.com/@ffmpeg/core@0.12.4/dist/esm';
const CORE_URL = `${BASE_URL}/ffmpeg-core.js`;
const WASM_URL = `${BASE_URL}/ffmpeg-core.wasm`;

let ffmpeg: FFmpeg | undefined = undefined;

export async function instance() {
  if (ffmpeg === undefined) {
    ffmpeg = new FFmpeg();

    await ffmpeg.load({
      coreURL: CORE_URL,
      wasmURL: WASM_URL,
    });
  }

  return ffmpeg;
}

export async function destroy() {
  // if (ffmpeg === undefined) {
  //   return;
  // }

  // ffmpeg.terminate();
  // ffmpeg = undefined;
}
