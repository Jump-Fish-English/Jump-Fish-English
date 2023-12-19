import { describe, it, expect, vi } from 'vitest';
import { exportFrame, writeFile } from './ffmpeg';
import { instance } from './instance';

vi.stubGlobal('URL', {
  createObjectURL: vi.fn().mockReturnValue('mockedurl'),
});

vi.mock('uuid', async () => {
  return {
    v4: vi.fn().mockReturnValue('mockuuid'),
  };
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
  };
  return {
    FFmpeg: vi.fn().mockReturnValue(mockFfmpeg),
  };
});

describe('writeFile', () => {
  it('should write file correctly', async () => {
    const ffmpeg = await instance();
    const buffer = new Uint8Array();
    const result = await writeFile({
      fileName: 'foo.mp4',
      buffer,
      type: 'video/mp4',
    });

    expect(ffmpeg.writeFile).toHaveBeenCalledWith('foo.mp4', buffer);
    expect(result).toEqual({
      fileName: 'foo.mp4',
      data: expect.any(Blob),
      url: 'mockedurl',
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

    expect(ffmpeg.exec).toHaveBeenCalledWith([
      '-ss',
      '00:00:00',
      '-i',
      'first.mp4',
      '-vframes',
      '1',
      'mockuuid.png',
    ]);
    expect(result).toBe('mockedurl');
  });
});
