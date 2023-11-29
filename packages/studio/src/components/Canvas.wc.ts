import { createPlayer, type Player } from '../lib/player';
import html2Canvas from 'html2canvas';

export interface RasterizeOptions {
  dimensions?: {
    height: number;
    width: number;
  },
  includeVideo?: boolean;
}

export class Canvas extends HTMLElement {
  shadowRoot: ShadowRoot;
  #player: Player;
  constructor() {
    super();
    this.shadowRoot = this.attachShadow({ mode: 'open' });

    this.#player = createPlayer({
      onTimeUpdate: (milliseconds) => {
        this.dispatchEvent(
          new CustomEvent('timeupdate', {
            detail: {
              currentTimeMilliseconds: milliseconds,
            }
          })
        )
      },
      onPlayStateChange: (playState) => {
        this.dispatchEvent(
          new CustomEvent('playstatechange', {
            detail: {
              playState,
            },
          })
        )
      }
    });
  }

  async load(media: string) {
    this.shadowRoot.innerHTML = media;
    await new Promise<void>((res) => {
      requestAnimationFrame(() => {
        if (this.parentNode === null) {
          // detatched from DOM, forget about it
          return;
        }
        const animations = this.shadowRoot.getAnimations();
        const videos = this.shadowRoot.querySelectorAll('video');
        this.#player.load([...animations, ...videos]);
        res();
      });
    });
  }

  seek(milliseconds: number) {
    this.#player.seek(milliseconds);
  }

  get playState() {
    return this.#player.playState;
  }

  get duration(): number | null {
    return this.#player.duration || null;
  }

  pause() {
    return this.#player.pause();
  }

  play() {
    return this.#player.play();
  }

  async rasterize(millisecond: number, options?: RasterizeOptions) {
    const raster = await html2Canvas(this, {
      logging: false,
      onclone: (doc) => {
        const localAnimations = doc.getAnimations();
        const player = createPlayer();
        player.load(localAnimations);
        player.seek(millisecond);
      }
    });

    if (options?.dimensions === undefined) {
      return raster.toDataURL();
    }
    const { height, width } = options.dimensions;

    const resizedCanvas = document.createElement('canvas');
    const resizedContext = resizedCanvas.getContext('2d');

    if (resizedContext === null) {
      throw new Error('Canvas context is null');
    }

    resizedCanvas.height = height;
    resizedCanvas.width = width;
    resizedContext.drawImage(raster, 0, 0, width, height);

    return resizedCanvas.toDataURL();
  }
}