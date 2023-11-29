import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Canvas as CanvasWebComponent, type RasterizeOptions } from './Canvas.wc.ts';
import type { PlayerStates } from '../lib/player.ts';

import styles from './Canvas.module.css';

interface Props {
  video: string;
  className?: string;
  children: (api: {
    play(): void;
    pause(): void;
    rasterize(millisecond: number, options?: RasterizeOptions): Promise<string>;
    player: ReactNode;
    durationMilliseconds: number;
    playState: PlayerStates;
    seek: (milliseconds: number) => void;
    currentTimeMilliseconds: number;
  }) => ReactNode;
}

export function Canvas({ children, video, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [playState, setPlayState] = useState<PlayerStates>('idle');
  const [durationMilliseconds, setDurationMilliseconds] = useState<number | null>(null);
  const [currentTimeMilliseconds, setCurrentTimeMilliseconds] = useState(0);
  const [canvas, setCanvas] = useState<CanvasWebComponent | undefined>(undefined);

  useLayoutEffect(() => {
    if (customElements.get('studio-canvas')) {
      return;
    }
    customElements.define('studio-canvas', CanvasWebComponent);
  }, []);

  useLayoutEffect(() => {
    const { current } = containerRef;
    if (current === null) {
      return;
    }

    const canvas = document.createElement('studio-canvas') as CanvasWebComponent;
    canvas.classList.add(styles.stage);
    setCanvas(canvas);
    current.appendChild(canvas);
    canvas.load(video).then(() => {
      setDurationMilliseconds(canvas.duration);
    });
    
    return () => {
      current.removeChild(canvas);
    }
  }, [
    containerRef.current,
    video
  ]);


  useLayoutEffect(() => {
    if (canvas === undefined) {
      return;
    }

    function onChange(e: CustomEvent<{ playState: PlayerStates }>) {
      setPlayState(e.detail.playState);
    }

    canvas.addEventListener('playstatechange', onChange as EventListener);

    return () => {
      canvas.removeEventListener('playstatechange', onChange as EventListener);
    }
  }, [canvas]);

  useLayoutEffect(() => {
    if (canvas === undefined) {
      return;
    }

    function onChange(e: CustomEvent<{ currentTimeMilliseconds: number }>) {
      setCurrentTimeMilliseconds(e.detail.currentTimeMilliseconds);
    }

    canvas.addEventListener('timeupdate', onChange as EventListener);

    return () => {
      canvas.removeEventListener('timeupdate', onChange as EventListener);
    }
  }, [canvas]);

  return children({
    durationMilliseconds: durationMilliseconds === null ? 0 : durationMilliseconds,
    playState,
    pause() {
      if (canvas === undefined) {
        return;
      }
      canvas.pause();
    },
    play() {
      if (canvas === undefined) {
        return;
      }
      canvas.play();
    },
    rasterize(millisecond: number, options?: RasterizeOptions) {
      if (canvas === undefined) {
        throw new Error('Canvas not defined');
      }

      return canvas.rasterize(millisecond, options);
    },
    player: (
      <div ref={containerRef} className={`${styles.canvas} ${className}`}>

      </div>
    ),
    currentTimeMilliseconds,
    seek(milliseconds) {
      if (canvas === undefined) {
        return;
      }
      canvas.seek(milliseconds);
    }
  });
}