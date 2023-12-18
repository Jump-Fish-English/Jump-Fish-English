import { describe, expect, it } from 'vitest';
import { millisecondsToFFMpegFormat } from './time';

describe('millisecondsToFFMpegFormat', () => {
  it('should convert 500 milliseconds correctly', () => {
    expect(millisecondsToFFMpegFormat(500)).toBe('00:00:00.500');
  });

  it('should convert 0 milliseconds correctly', () => {
    expect(millisecondsToFFMpegFormat(0)).toBe('00:00:00');
  });

  it('should convert 10 minutes 34 secondscorrectly', () => {
    expect(millisecondsToFFMpegFormat(634000)).toBe('00:10:34');
  });

  it('should convert 1 hour 34 minutes 12 seconds 14 milliseconds correctly', () => {
    expect(millisecondsToFFMpegFormat(3.6e6 + 2.04e6 + 12000 + 14)).toBe(
      '01:34:12.014',
    );
  });
});
