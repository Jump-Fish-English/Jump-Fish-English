import { describe, it, expect, vi } from 'vitest';
import 'vitest-dom/extend-expect';
import { Workspace } from './Workspace';
import { fireEvent, render, screen, within } from '@testing-library/react';

describe('Tabs', () => {
  it('should render correct tabs', () => {
    render(
      <Workspace
        sources={{

        }}
        doc={{
          timeline: [],
          durationMilliseconds: 0,
        }}
        player={{
          el: (
            <div>Player</div>
          ),
          play: vi.fn(),
          seek: vi.fn(),
          durationMilliseconds: 0,
        }}
      />
    );
    expect(
      screen.getByRole('tab', { name: 'Videos' })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('tab', { name: 'Animations' })
    ).toBeInTheDocument();
  });
});

describe('Sources', () => {
  it('should render correct videos', () => {
    render(
      <Workspace
        sources={{
          video: {
            type: 'video',
            id: 'video',
            title: 'Video clip',
            durationMilliseconds: 100,
            videoFile: {
              fileName: 'hello.mp4',
              data: new Blob(),
              url: 'blob://url'
            },
            thumbnailUrl: 'video-thumbnail',
          },
          animation: {
            title: 'Animation clip',
            id: 'animation',
            durationMilliseconds: 100,
            type: 'animation',
            html: '<div>hi</div>',
            css: '',
            thumbnailUrl: 'animation-thumbnail',
          }
        }}
        doc={{
          timeline: [],
          durationMilliseconds: 0,
        }}
        player={{
          el: (
            <div>Player</div>
          ),
          play: vi.fn(),
          seek: vi.fn(),
          durationMilliseconds: 0,
        }}
      />
    );
    
    expect(
      within(
        screen.getByLabelText('Videos')
      ).getByText('Video clip')
    ).toBeInTheDocument();

    expect(
      within(
        screen.getByLabelText('Videos')
      ).queryByText('Animation clip')
    ).not.toBeInTheDocument();
  });

  it('should render correct animations', () => {
    render(
      <Workspace
        sources={{
          video: {
            type: 'video',
            id: 'video',
            title: 'Video clip',
            durationMilliseconds: 100,
            videoFile: {
              fileName: 'hello.mp4',
              data: new Blob(),
              url: 'blob://url'
            },
            thumbnailUrl: 'video-thumbnail',
          },
          animation: {
            title: 'Animation clip',
            id: 'animation',
            durationMilliseconds: 100,
            type: 'animation',
            html: '<div>hi</div>',
            css: '',
            thumbnailUrl: 'animation-thumbnail',
          }
        }}
        doc={{
          timeline: [],
          durationMilliseconds: 0,
        }}
        player={{
          el: (
            <div>Player</div>
          ),
          play: vi.fn(),
          seek: vi.fn(),
          durationMilliseconds: 0,
        }}
      />
    );

    fireEvent.click(
      screen.getByRole('tab', { name: 'Animations' })
    )

    expect(
      screen.getByRole('tab', { selected: true, name: 'Animations' })
    ).toBeInTheDocument();
    
    const animationsTab = within(
      screen.getByRole('tabpanel', { name: 'Animations' })
    );

    expect(animationsTab.getByText('Animation clip')).toBeInTheDocument();
    expect(animationsTab.getByRole('img')).toHaveAttribute('src', 'animation-thumbnail');

  });
});