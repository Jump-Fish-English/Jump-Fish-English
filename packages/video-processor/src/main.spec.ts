import { describe, it, expect, vi, type Mock } from 'vitest';
import { instance } from './instance';

vi.stubGlobal('URL', {
  createObjectURL: vi.fn().mockReturnValue('mockedurl')
});

vi.mock('@ffmpeg/ffmpeg', async () => {
  const mockFfmpeg = {
    writeFile: vi.fn().mockResolvedValue(undefined),
    load: vi.fn(),
    exec: vi.fn(),
    readFile: vi.fn(),
  }
  return {
    FFmpeg: vi.fn().mockReturnValue(mockFfmpeg)
  }
});

import { generate } from './main';

describe('generate', () => {
  describe('Single video', () => {
    it('should be ok', async () => {
      const buffer = new Uint8Array();
      const ffmpeg = await instance();
      const mockReadFile = {
        buffer: new Uint16Array(),
      };
      (ffmpeg.readFile as Mock).mockReturnValue(mockReadFile);
      const url = await generate({
        output: {
          encodingPreset: 'veryfast',
        },
        timeline: {
          media: [{
            type: 'video',
            buffer,
            name: 'first.mp4',
          }]
        }
      });
      expect(ffmpeg.writeFile).toHaveBeenCalledWith('first.mp4', buffer);
      expect(ffmpeg.exec).toHaveBeenCalledWith(['-i', 'first.mp4', '-preset', 'veryfast', 'output.mp4']);
      expect(ffmpeg.readFile).toHaveBeenCalledWith('output.mp4');
      expect(url).toBe('mockedurl');
    });
  });
})