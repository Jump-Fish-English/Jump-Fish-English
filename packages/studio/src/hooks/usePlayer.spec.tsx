import { describe, beforeAll, it, expect } from 'vitest';
import { render, renderHook } from '@testing-library/react';
import { usePlayer } from './usePlayer';
import type { Clip, Source, VideoDocument } from '@jumpfish/video-processor';

import styles from './usePlayer.module.css';

beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {
      // do nothing
    }
    unobserve() {
      // do nothing
    }
    disconnect() {
      // do nothing
    }
  };
});

describe('Two clips with the same source', () => {
  it('should only render 1 <video>', () => {
    const { result } = renderHook(() => {
      return usePlayer({
        sources: {
          'bfbbbdb3-c0e3-44a2-acdd-e23fa879f355': {
            type: 'video',
            title: 'Untitled',
            id: 'bfbbbdb3-c0e3-44a2-acdd-e23fa879f355',
            durationMilliseconds: 345667,
            thumbnailUrl:
              'blob:http://localhost:4321/d3e23cae-dcb3-41b2-b73b-6ca4ac8e0391',
            url: 'blob:http://localhost:4321/5b4b8f5a-54e2-492f-8ded-e0e7b6d57964',
          },
          '9560f831-adc2-4eae-b465-66b40529bd0d': {
            type: 'video',
            title: 'Untitled',
            id: '9560f831-adc2-4eae-b465-66b40529bd0d',
            durationMilliseconds: 69289.33333333333,
            thumbnailUrl:
              'blob:http://localhost:4321/fe84a1bb-dde6-44ed-a223-cb9cd6607480',
            url: 'blob:http://localhost:4321/f0c45ef4-d2df-4ec0-92c4-db75b35f2e81',
          },
        },
        doc: {
          frameRate: 30,
          dimensions: {
            height: 900,
            width: 1600,
          },
          timeline: [
            {
              source: 'bfbbbdb3-c0e3-44a2-acdd-e23fa879f355',
              win: {
                startMilliseconds: 0,
                durationMilliseconds: 345667,
              },
              id: 'blob:http://localhost:4321/5b4b8f5a-54e2-492f-8ded-e0e7b6d57964',
            },
            {
              source: '9560f831-adc2-4eae-b465-66b40529bd0d',
              win: {
                startMilliseconds: 0,
                durationMilliseconds: 69289.33333333333,
              },
              id: 'blob:http://localhost:4321/f0c45ef4-d2df-4ec0-92c4-db75b35f2e81',
            },
            {
              source: 'bfbbbdb3-c0e3-44a2-acdd-e23fa879f355',
              win: {
                startMilliseconds: 0,
                durationMilliseconds: 345667,
              },
              id: 'blob:http://localhost:4321/5b4b8f5a-54e2-492f-8ded-e0e7b6d57964',
            },
          ],
          durationMilliseconds: 760623.3333333333,
        },
      });
    });

    const { container } = render(result.current.el);

    expect(container.querySelectorAll('video')).toHaveLength(2);
  });
});

describe('Deleting a clip', () => {
  it('should remove the old video element', () => {
    function Component({
      doc,
      sources,
    }: {
      doc: VideoDocument;
      sources: Record<string, Source>;
    }) {
      const player = usePlayer({
        sources,
        doc,
      });

      return player.el;
    }

    const { container, rerender } = render(
      <Component
        sources={{
          '607d17f8-2974-4496-9015-a528b92eaa33': {
            type: 'video',
            title: 'video',
            id: '607d17f8-2974-4496-9015-a528b92eaa33',
            durationMilliseconds: 345667,
            thumbnailUrl:
              'blob:http://localhost:4321/2d12bbc8-2507-4b54-9b44-9dc94cf4ee3c',
            url: 'blob:http://localhost:4321/c0d30c05-4933-4c76-8370-7187ad7d951a',
          },
          'aa42e3f6-4c91-45fd-a5af-3e7fa54bd3b2': {
            type: 'video',
            title: 'video',
            id: 'aa42e3f6-4c91-45fd-a5af-3e7fa54bd3b2',
            durationMilliseconds: 69289.33333333333,
            thumbnailUrl:
              'blob:http://localhost:4321/8c97625d-ca74-4cff-bd28-b22ebee4822e',
            url: 'blob:http://localhost:4321/7ba6935d-0c6e-4ee9-b28b-42dadb60c5c1',
          },
        }}
        doc={{
          frameRate: 30,
          dimensions: {
            height: 900,
            width: 1600,
          },
          timeline: [
            {
              source: '607d17f8-2974-4496-9015-a528b92eaa33',
              win: {
                startMilliseconds: 0,
                durationMilliseconds: 345667,
              },
              id: 'blob:http://localhost:4321/c0d30c05-4933-4c76-8370-7187ad7d951a',
            },
          ],
          durationMilliseconds: 345667,
        }}
      />,
    );

    rerender(
      <Component
        sources={{
          '607d17f8-2974-4496-9015-a528b92eaa33': {
            type: 'video',
            title: 'video',
            id: '607d17f8-2974-4496-9015-a528b92eaa33',
            durationMilliseconds: 345667,
            thumbnailUrl:
              'blob:http://localhost:4321/2d12bbc8-2507-4b54-9b44-9dc94cf4ee3c',
            url: 'blob:http://localhost:4321/c0d30c05-4933-4c76-8370-7187ad7d951a',
          },
          'aa42e3f6-4c91-45fd-a5af-3e7fa54bd3b2': {
            type: 'video',
            title: 'video',
            id: 'aa42e3f6-4c91-45fd-a5af-3e7fa54bd3b2',
            durationMilliseconds: 69289.33333333333,
            thumbnailUrl:
              'blob:http://localhost:4321/8c97625d-ca74-4cff-bd28-b22ebee4822e',
            url: 'blob:http://localhost:4321/7ba6935d-0c6e-4ee9-b28b-42dadb60c5c1',
          },
        }}
        doc={{
          frameRate: 30,
          dimensions: {
            height: 900,
            width: 1600,
          },
          timeline: [],
          durationMilliseconds: 0,
        }}
      />,
    );

    expect(container.querySelectorAll('video')).toHaveLength(0);
  });

  it('should select the next clip when the first clip is removed', () => {
    function Component({
      doc,
      sources,
    }: {
      doc: VideoDocument;
      sources: Record<string, Source>;
    }) {
      const player = usePlayer({
        sources,
        doc,
      });

      return player.el;
    }

    const secondClip: Clip = {
      source: '607d17f8-2974-4496-9015-a528b92eaa33',
      win: {
        startMilliseconds: 0,
        durationMilliseconds: 345667,
      },
      id: 'second',
    };
    const { container, rerender } = render(
      <Component
        sources={{
          '607d17f8-2974-4496-9015-a528b92eaa33': {
            type: 'video',
            title: 'video',
            id: '607d17f8-2974-4496-9015-a528b92eaa33',
            durationMilliseconds: 345667,
            thumbnailUrl:
              'blob:http://localhost:4321/2d12bbc8-2507-4b54-9b44-9dc94cf4ee3c',
            url: '',
          },
          'aa42e3f6-4c91-45fd-a5af-3e7fa54bd3b2': {
            type: 'video',
            title: 'video',
            id: 'aa42e3f6-4c91-45fd-a5af-3e7fa54bd3b2',
            durationMilliseconds: 69289.33333333333,
            thumbnailUrl:
              'blob:http://localhost:4321/8c97625d-ca74-4cff-bd28-b22ebee4822e',
            url: '',
          },
        }}
        doc={{
          frameRate: 30,
          dimensions: {
            height: 900,
            width: 1600,
          },
          timeline: [
            {
              source: '607d17f8-2974-4496-9015-a528b92eaa33',
              win: {
                startMilliseconds: 0,
                durationMilliseconds: 345667,
              },
              id: 'blob:http://localhost:4321/c0d30c05-4933-4c76-8370-7187ad7d951a',
            },
            secondClip,
          ],
          durationMilliseconds: 345667,
        }}
      />,
    );

    rerender(
      <Component
        sources={{
          '607d17f8-2974-4496-9015-a528b92eaa33': {
            type: 'video',
            title: 'neat',
            id: '607d17f8-2974-4496-9015-a528b92eaa33',
            durationMilliseconds: 345667,
            thumbnailUrl:
              'blob:http://localhost:4321/2d12bbc8-2507-4b54-9b44-9dc94cf4ee3c',
            url: '',
          },
          'aa42e3f6-4c91-45fd-a5af-3e7fa54bd3b2': {
            type: 'video',
            title: 'neat',
            id: 'aa42e3f6-4c91-45fd-a5af-3e7fa54bd3b2',
            durationMilliseconds: 69289.33333333333,
            thumbnailUrl:
              'blob:http://localhost:4321/8c97625d-ca74-4cff-bd28-b22ebee4822e',
            url: '',
          },
        }}
        doc={{
          frameRate: 30,
          dimensions: {
            height: 900,
            width: 1600,
          },
          timeline: [secondClip],
          durationMilliseconds: 0,
        }}
      />,
    );

    expect(container.querySelector('video')!.className).not.toBe(styles.hidden);
  });

  it.only('should not throw when adding a new clip after deleting initial clip', () => {
    function Component({
      doc,
      sources,
    }: {
      doc: VideoDocument;
      sources: Record<string, Source>;
    }) {
      const player = usePlayer({
        sources,
        doc,
      });

      return player.el;
    }

    const secondClip: Clip = {
      source: '607d17f8-2974-4496-9015-a528b92eaa33',
      win: {
        startMilliseconds: 0,
        durationMilliseconds: 345667,
      },
      id: 'second',
    };
    const { rerender } = render(
      <Component
        sources={{
          '607d17f8-2974-4496-9015-a528b92eaa33': {
            type: 'video',
            title: 'video',
            id: '607d17f8-2974-4496-9015-a528b92eaa33',
            durationMilliseconds: 345667,
            thumbnailUrl:
              'blob:http://localhost:4321/2d12bbc8-2507-4b54-9b44-9dc94cf4ee3c',
            url: 'blob:http://localhost:4321/c0d30c05-4933-4c76-8370-7187ad7d951a',
          },
          'aa42e3f6-4c91-45fd-a5af-3e7fa54bd3b2': {
            type: 'video',
            title: 'video',
            id: 'aa42e3f6-4c91-45fd-a5af-3e7fa54bd3b2',
            durationMilliseconds: 69289.33333333333,
            thumbnailUrl:
              'blob:http://localhost:4321/8c97625d-ca74-4cff-bd28-b22ebee4822e',
            url: 'blob:http://localhost:4321/7ba6935d-0c6e-4ee9-b28b-42dadb60c5c1',
          },
        }}
        doc={{
          frameRate: 30,
          dimensions: {
            height: 900,
            width: 1600,
          },
          timeline: [
            {
              source: '607d17f8-2974-4496-9015-a528b92eaa33',
              win: {
                startMilliseconds: 0,
                durationMilliseconds: 345667,
              },
              id: 'first',
            },
          ],
          durationMilliseconds: 345667,
        }}
      />,
    );

    rerender(
      <Component
        sources={{
          '607d17f8-2974-4496-9015-a528b92eaa33': {
            type: 'video',
            title: 'video',
            id: '607d17f8-2974-4496-9015-a528b92eaa33',
            durationMilliseconds: 345667,
            thumbnailUrl:
              'blob:http://localhost:4321/2d12bbc8-2507-4b54-9b44-9dc94cf4ee3c',
            url: 'blob:http://localhost:4321/c0d30c05-4933-4c76-8370-7187ad7d951a',
          },
          'aa42e3f6-4c91-45fd-a5af-3e7fa54bd3b2': {
            type: 'video',
            title: 'video',
            id: 'aa42e3f6-4c91-45fd-a5af-3e7fa54bd3b2',
            durationMilliseconds: 69289.33333333333,
            thumbnailUrl:
              'blob:http://localhost:4321/8c97625d-ca74-4cff-bd28-b22ebee4822e',
            url: 'blob:http://localhost:4321/7ba6935d-0c6e-4ee9-b28b-42dadb60c5c1',
          },
        }}
        doc={{
          frameRate: 30,
          dimensions: {
            height: 900,
            width: 1600,
          },
          timeline: [],
          durationMilliseconds: 0,
        }}
      />,
    );

    expect(() => {
      rerender(
        <Component
          sources={{
            '607d17f8-2974-4496-9015-a528b92eaa33': {
              type: 'video',
              title: 'video',
              id: '607d17f8-2974-4496-9015-a528b92eaa33',
              durationMilliseconds: 345667,
              thumbnailUrl:
                'blob:http://localhost:4321/2d12bbc8-2507-4b54-9b44-9dc94cf4ee3c',
              url: 'blob:http://localhost:4321/c0d30c05-4933-4c76-8370-7187ad7d951a',
            },
            'aa42e3f6-4c91-45fd-a5af-3e7fa54bd3b2': {
              type: 'video',
              title: 'video',
              id: 'aa42e3f6-4c91-45fd-a5af-3e7fa54bd3b2',
              durationMilliseconds: 69289.33333333333,
              thumbnailUrl:
                'blob:http://localhost:4321/8c97625d-ca74-4cff-bd28-b22ebee4822e',
              url: 'blob:http://localhost:4321/c0d30c05-4933-4c76-8370-7187ad7d951a',
            },
          }}
          doc={{
            frameRate: 30,
            dimensions: {
              height: 900,
              width: 1600,
            },
            timeline: [secondClip],
            durationMilliseconds: 0,
          }}
        />,
      );
    }).not.toThrow();
  });
});
