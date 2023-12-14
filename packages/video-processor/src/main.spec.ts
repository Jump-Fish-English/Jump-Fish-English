import { describe, it, expect, vi, type Mock } from 'vitest';
import { trim, exportFrame, writeFile } from './main';
import { instance } from './instance';

vi.stubGlobal('URL', {
  createObjectURL: vi.fn().mockReturnValue('mockedurl')
});

vi.mock('uuid', async () => {
  return {
    v4: vi.fn().mockReturnValue('mockuuid')
  }
});

vi.mock('@ffmpeg/ffmpeg', async () => {
  const mockReadFile = {
    buffer: new Uint16Array(),
  };

  const mockFfmpeg = {
    writeFile: vi.fn().mockResolvedValue(undefined),
    load: vi.fn(),
    exec: vi.fn(),
    on: vi.fn(),
    readFile: vi.fn().mockReturnValue(mockReadFile),
  }
  return {
    FFmpeg: vi.fn().mockReturnValue(mockFfmpeg)
  }
});

describe('writeFile', () => {
  it('should write file correctly', async () => {
    const ffmpeg = await instance();
    const buffer = new Uint8Array();
    const result = await writeFile({
      fileName: 'foo.mp4',
      buffer,
    });

    expect(ffmpeg.writeFile).toHaveBeenCalledWith('foo.mp4', buffer);

    expect(result).toEqual({
      fileName: 'foo.mp4',
      data: buffer,
    });
  });
});

describe('trim', () => {
  describe('Single video', () => {
    it('should clip video correctly', async () => {
      const ffmpeg = await instance();
      const readBuffer = new Uint8Array();
      (ffmpeg.readFile as Mock).mockResolvedValue(readBuffer);
      const result = await trim({
        output: {
          encodingPreset: 'veryfast',
        },
        source: {
          fileName: 'first.mp4',
          data: new Uint8Array(),
        },
        range: {
          startMilliseconds: 0,
          durationMilliseconds: 500,
        }
      });

      expect(ffmpeg.exec).toHaveBeenCalledWith(['-i', 'first.mp4', '-ss', '00:00:00', '-t', '00:00:00.500', '-preset', 'veryfast', 'mockuuid.mp4']);
      
      expect(result).toEqual({
        fileName: 'mockuuid.mp4',
        data: readBuffer,
      });
    });
  });
});

describe('exportFrame', () => {
  it('should export frame correctly', async () => {
    const ffmpeg = await instance();
    
    const result = await exportFrame({
      source: {
        fileName: 'first.mp4',
      },
      millisecond: 0,
    });

    expect(ffmpeg.exec).toHaveBeenCalledWith(['-i', 'first.mp4', '-ss', '00:00:00', '-vframes', '1', 'mockuuid.png']);
    expect(result).toBe('mockedurl');
  });
});
