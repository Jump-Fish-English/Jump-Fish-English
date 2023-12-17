import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { waitFor } from '@testing-library/dom';
import { AnimationPlayer } from './AnimationPlayer';

async function waitForCanPlayThrough(elm: HTMLElement) {
  return new Promise((res) => {
    elm.addEventListener('canplaythrough', res, {
      once: true,
    })
  })
}

describe('AnimationPlayer', () => {
  beforeAll(() => {
    customElements.define('x-foo', AnimationPlayer);
  });

  afterEach(() => {
    [
      ...document.querySelectorAll('x-foo')
    ].forEach((el) => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    })
  });

  describe('loading', () => {
    it('should fire canplaythrough event when ready', async () => {
      const elm = document.createElement('x-foo') as AnimationPlayer;
      document.body.appendChild(elm);
      const contents = {
        css: `
          #ball {
            animation: show-ball 400ms;
          }

          @keyframes show-ball {
            0% {
              opacity: 0;
            }

            100% {
              opacity: 1;
            }
          }
        `,
        html: `
          <div id="ball"></div>
        `
      }

      const spy = vi.fn();
      elm.addEventListener('canplaythrough', spy);

      elm.load(contents);

      await waitFor(() => {
        expect(spy).toHaveBeenCalled();
      });
    });

    it('should fire loadstart when loading data', async () => {
      const elm = document.createElement('x-foo') as AnimationPlayer;
      document.body.appendChild(elm);
      const contents = {
        css: `
          #ball {
            animation: show-ball 400ms;
          }

          @keyframes show-ball {
            0% {
              opacity: 0;
            }

            100% {
              opacity: 1;
            }
          }
        `,
        html: `
          <div id="ball"></div>
        `
      }

      const spy = vi.fn();
      elm.addEventListener('loadstart', spy);

      elm.load(contents);

      await waitFor(() => {
        expect(spy).toHaveBeenCalled();
      });

    });

    it.only('should fire a durationchange event', async () => {
      const elm = document.createElement('x-foo') as AnimationPlayer;
      document.body.appendChild(elm);
      const contents = {
        css: `
          #ball {
            animation: show-ball 400ms;
          }

          @keyframes show-ball {
            0% {
              opacity: 0;
            }

            100% {
              opacity: 1;
            }
          }
        `,
        html: `
          <div id="ball"></div>
        `
      }

      const spy = vi.fn();
      elm.addEventListener('durationchange', spy);

      elm.load(contents);

      await waitFor(() => {
        expect(spy).toHaveBeenCalled();
      });

      expect(elm.duration).toBe(0.4);
    });
  });

  it('should have duration 0 before any contents are loaded', () => {
    const elm = document.createElement('x-foo') as AnimationPlayer;
    document.body.appendChild(elm);
    expect(elm.duration).toBe(0);
  });

  it('should report correct duration when contents are loaded', async () => {
    const elm = document.createElement('x-foo') as AnimationPlayer;
    document.body.appendChild(elm);
    const contents = {
      css: `
        #ball {
          animation: show-ball 400ms;
        }

        @keyframes show-ball {
          0% {
            opacity: 0;
          }

          100% {
            opacity: 1;
          }
        }
      `,
      html: `
        <div id="ball"></div>
      `
    }
    elm.load(contents);
    await waitForCanPlayThrough(elm);
    
    expect(elm.duration).toBe(0.4);
  });

  it('should report correct duration when where are multiple animations', async () => {
    const elm = document.createElement('x-foo') as AnimationPlayer;
    document.body.appendChild(elm);
    const contents = {
      css: `
        #first {
          animation: show-ball 400ms;
        }

        #second {
          animation: show-ball 1s;
        }

        @keyframes show-ball {
          0% {
            opacity: 0;
          }

          100% {
            opacity: 1;
          }
        }
      `,
      html: `
        <div id="first"></div>
        <div id="second"></div>
      `
    }
    elm.load(contents);
    await waitForCanPlayThrough(elm);
    
    expect(elm.duration).toBe(1);
  });

  it('should report correct duration when there is an animation delay', async () => {
    const elm = document.createElement('x-foo') as AnimationPlayer;
    document.body.appendChild(elm);
    const contents = {
      css: `
        #first {
          animation: show-ball 400ms;
          animation-delay: 1s;
        }

        #second {
          animation: show-ball 1s;
        }

        @keyframes show-ball {
          0% {
            opacity: 0;
          }

          100% {
            opacity: 1;
          }
        }
      `,
      html: `
        <div id="first"></div>
        <div id="second"></div>
      `
    }
    elm.load(contents);
    await waitForCanPlayThrough(elm);
    
    expect(elm.duration).toBe(1.4);
  });

  it('should fire an ended event when animations are completed', async () => {
    const elm = document.createElement('x-foo') as AnimationPlayer;
    document.body.appendChild(elm);
    const contents = {
      css: `
        #first {
          animation: show-ball 50ms;
        }

        @keyframes show-ball {
          0% {
            opacity: 0;
          }

          100% {
            opacity: 1;
          }
        }
      `,
      html: `
        <div id="first"></div>
      `
    }
    elm.load(contents);
    await waitForCanPlayThrough(elm);

    const spy = vi.fn();
    elm.addEventListener('ended', spy, {
      once: true,
    });
    elm.play();

    await waitFor(() => {
      expect(spy).toHaveBeenCalled();
    });
  });

  it('should fire timeupdate events', async () => {
    const elm = document.createElement('x-foo') as AnimationPlayer;
    document.body.appendChild(elm);
    const contents = {
      css: `
        #first {
          animation: show-ball 50ms;
        }

        @keyframes show-ball {
          0% {
            opacity: 0;
          }

          100% {
            opacity: 1;
          }
        }
      `,
      html: `
        <div id="first"></div>
      `
    }
    elm.load(contents);
    await waitForCanPlayThrough(elm);

    const spy = vi.fn();
    elm.addEventListener('timeupdate', spy, {
      once: true,
    });
    elm.play();

    await waitFor(() => {
      expect(spy).toHaveBeenCalled();
    });
  });

  it('should not fire timeupdate events after ended event', async () => {
    const elm = document.createElement('x-foo') as AnimationPlayer;
    document.body.appendChild(elm);
    const contents = {
      css: `
        #first {
          animation: show-ball 50ms;
        }

        @keyframes show-ball {
          0% {
            opacity: 0;
          }

          100% {
            opacity: 1;
          }
        }
      `,
      html: `
        <div id="first"></div>
      `
    }
    elm.load(contents);
    await waitForCanPlayThrough(elm);
    
    elm.play();

    await new Promise((res) => {
      elm.addEventListener('ended', res, { once: true });
    });

    const spy = vi.fn();
    elm.addEventListener('timeupdate', spy, {
      once: true,
    });

    await new Promise((res) => {
      setTimeout(res, 100);
    });

    expect(spy).not.toHaveBeenCalled();
  });

  describe('currentTime', () => {
    it('should report 0 currentTime before animation has loaded', () => {
      const elm = document.createElement('x-foo') as AnimationPlayer;
      document.body.appendChild(elm);
  
      expect(elm.currentTime).toBe(0);
    });

    it('should report 0 currentTime before animation has started', async () => {
      const elm = document.createElement('x-foo') as AnimationPlayer;
      document.body.appendChild(elm);
      const contents = {
        css: `
          #first {
            animation: show-ball 50ms;
          }

          @keyframes show-ball {
            0% {
              opacity: 0;
            }

            100% {
              opacity: 1;
            }
          }
        `,
        html: `
          <div id="first"></div>
        `
      }
      elm.load(contents);
      await waitForCanPlayThrough(elm);

      expect(elm.currentTime).toBe(0);
    });

    it('should report correct times when playing', async () => {
      const elm = document.createElement('x-foo') as AnimationPlayer;
      document.body.appendChild(elm);
      const contents = {
        css: `
          #first {
            animation: show-ball 50ms;
          }

          @keyframes show-ball {
            0% {
              opacity: 0;
            }

            100% {
              opacity: 1;
            }
          }
        `,
        html: `
          <div id="first"></div>
        `
      }
      elm.load(contents);
      await waitForCanPlayThrough(elm);

      let currentTime = NaN;
      elm.addEventListener('timeupdate', () => {
        currentTime = elm.currentTime;
      }, {
        once: true,
      });

      elm.play();

      await waitFor(() => {
        expect(currentTime).not.toBeNaN();
      });

      await waitFor(() => {
        expect(currentTime).not.toBe(0);
      });

    });
  });

  describe('pause', () => {
    it('should pause animation', async () => {
      const elm = document.createElement('x-foo') as AnimationPlayer;
      document.body.appendChild(elm);
      const contents = {
        css: `
          #first {
            animation: show-ball 50ms;
          }

          @keyframes show-ball {
            0% {
              opacity: 0;
            }

            100% {
              opacity: 1;
            }
          }
        `,
        html: `
          <div id="first"></div>
        `
      }
      elm.load(contents);

      const spy = vi.fn();
      elm.addEventListener('pause', spy, {
        once: true,
      });

      elm.addEventListener('timeupdate', () => {
        elm.pause();
      }, {
        once: true,
      });

      elm.play();

      await waitFor(() => {
        expect(spy).toHaveBeenCalled();
      });
    });

    it('should report correct currentTime', async () => {
      const elm = document.createElement('x-foo') as AnimationPlayer;
      document.body.appendChild(elm);
      const contents = {
        css: `
          #first {
            animation: show-ball 50ms;
          }

          @keyframes show-ball {
            0% {
              opacity: 0;
            }

            100% {
              opacity: 1;
            }
          }
        `,
        html: `
          <div id="first"></div>
        `
      }
      elm.load(contents);

      let currentTime = 0;
      const spy = vi.fn();
      elm.addEventListener('pause', spy, {
        once: true,
      });

      elm.addEventListener('timeupdate', () => {
        currentTime = elm.currentTime;
        elm.pause();
      }, {
        once: true,
      });

      elm.play();

      await waitFor(() => {
        expect(spy).toHaveBeenCalled();
      });

      expect(currentTime).toBe(elm.currentTime);
    });
  });
});