import { describe, it, expect, vi } from 'vitest';
import 'vitest-dom/extend-expect';
import { Workspace } from './Workspace';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';

describe('Tabs', () => {
  it('should render correct tabs', () => {
    render(
      <Workspace
        onSourceSelect={vi.fn()}
        sources={{}}
        doc={{
          frameRate: 30,
          dimensions: {
            height: 900,
            width: 1600,
          },
          timeline: [],
          durationMilliseconds: 0,
        }}
        player={{
          el: <div>Player</div>,
          play: vi.fn(),
          seek: vi.fn(),
          durationMilliseconds: 0,
        }}
      />,
    );
    expect(screen.getByRole('tab', { name: 'Videos' })).toBeInTheDocument();

    expect(screen.getByRole('tab', { name: 'Animations' })).toBeInTheDocument();
  });
});

describe('Sources', () => {
  it('should render correct videos', () => {
    render(
      <Workspace
        onSourceSelect={vi.fn()}
        sources={{
          video: {
            type: 'video',
            id: 'video',
            title: 'Video clip',
            durationMilliseconds: 100,
            url: 'blob://url',
            thumbnailUrl: 'video-thumbnail',
          },
          animation: {
            title: 'Animation clip',
            id: 'animation',
            durationMilliseconds: 100,
            type: 'animation',
            html: '<div>hi</div>',
            css: '',
            thumbnail: {
              url: 'animation-thumbnail',
              originalDevicePixelRatio: 1,
              originalDimensions: {
                width: 100,
                height: 100,
              },
              data: new Blob(),
            },
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
        player={{
          el: <div>Player</div>,
          play: vi.fn(),
          seek: vi.fn(),
          durationMilliseconds: 0,
        }}
      />,
    );

    expect(
      within(screen.getByLabelText('Videos')).getByText('Video clip'),
    ).toBeInTheDocument();

    expect(
      within(screen.getByLabelText('Videos')).queryByText('Animation clip'),
    ).not.toBeInTheDocument();
  });

  it('should render correct animations', () => {
    render(
      <Workspace
        onSourceSelect={vi.fn()}
        sources={{
          video: {
            type: 'video',
            id: 'video',
            title: 'Video clip',
            durationMilliseconds: 100,
            url: 'blob://url',
            thumbnailUrl: 'video-thumbnail',
          },
          animation: {
            title: 'Animation clip',
            id: 'animation',
            durationMilliseconds: 100,
            type: 'animation',
            html: '<div>hi</div>',
            css: '',
            thumbnail: {
              url: 'animation-thumbnail',
              originalDevicePixelRatio: 1,
              originalDimensions: {
                width: 100,
                height: 100,
              },
              data: new Blob(),
            },
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
        player={{
          el: <div>Player</div>,
          play: vi.fn(),
          seek: vi.fn(),
          durationMilliseconds: 0,
        }}
      />,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Animations' }));

    expect(
      screen.getByRole('tab', { selected: true, name: 'Animations' }),
    ).toBeInTheDocument();

    const animationsTab = within(
      screen.getByRole('tabpanel', { name: 'Animations' }),
    );

    expect(animationsTab.getByText('Animation clip')).toBeInTheDocument();
    expect(animationsTab.getByRole('img')).toHaveAttribute(
      'src',
      'animation-thumbnail',
    );
  });

  it('should render animation image with correct dimensions', () => {
    render(
      <Workspace
        onSourceSelect={vi.fn()}
        sources={{
          video: {
            type: 'video',
            id: 'video',
            title: 'Video clip',
            durationMilliseconds: 100,
            url: 'blob://url',
            thumbnailUrl: 'video-thumbnail',
          },
          animation: {
            title: 'Animation clip',
            id: 'animation',
            durationMilliseconds: 100,
            type: 'animation',
            html: '<div>hi</div>',
            css: '',
            thumbnail: {
              url: 'animation-thumbnail',
              originalDevicePixelRatio: 1,
              originalDimensions: {
                width: 100,
                height: 100,
              },
              data: new Blob(),
            },
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
        player={{
          el: <div>Player</div>,
          play: vi.fn(),
          seek: vi.fn(),
          durationMilliseconds: 0,
        }}
      />,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Animations' }));

    const animationsTab = within(
      screen.getByRole('tabpanel', { name: 'Animations' }),
    );

    expect(animationsTab.getByRole('img')).toHaveAttribute('width', '100');
    expect(animationsTab.getByRole('img')).toHaveAttribute('height', '100');
  });

  it('should fire onSourceSelect when user selects a Source', async () => {
    const spy = vi.fn();
    render(
      <Workspace
        onSourceSelect={spy}
        sources={{
          video: {
            type: 'video',
            id: 'video',
            title: 'Video clip',
            durationMilliseconds: 100,
            url: 'blob://url',
            thumbnailUrl: 'video-thumbnail',
          },
          animation: {
            title: 'Animation clip',
            id: 'animation',
            durationMilliseconds: 100,
            type: 'animation',
            html: '<div>hi</div>',
            css: '',
            thumbnail: {
              url: 'animation-thumbnail',
              originalDevicePixelRatio: 1,
              originalDimensions: {
                width: 100,
                height: 100,
              },
              data: new Blob(),
            },
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
        player={{
          el: <div>Player</div>,
          play: vi.fn(),
          seek: vi.fn(),
          durationMilliseconds: 0,
        }}
      />,
    );

    fireEvent.click(screen.getByRole('tab', { name: 'Animations' }));

    fireEvent.click(screen.getByText('Animation clip'));

    await waitFor(() => {
      expect(spy).toHaveBeenCalledWith({
        title: 'Animation clip',
        id: 'animation',
        durationMilliseconds: 100,
        type: 'animation',
        html: '<div>hi</div>',
        css: '',
        thumbnail: {
          url: 'animation-thumbnail',
          originalDevicePixelRatio: 1,
          originalDimensions: {
            width: 100,
            height: 100,
          },
          data: new Blob(),
        },
      });
    });
  });
});
