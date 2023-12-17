import type { AnimationPlayer as AnimationPlayerElm } from "animation-player";
import { forwardRef, useLayoutEffect, useRef, useState } from "react"

interface Props {
  contents: {
    html: string;
    css: string;
  }
}

export const AnimationPlayer = forwardRef<AnimationPlayerElm, Props>(({ contents: { html, css } }, forwardRef) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [elm] = useState(() => {
    return document.createElement('jf-animation-player') as AnimationPlayerElm;
  });

  useLayoutEffect(() => {
    if (typeof forwardRef === 'function') {
      forwardRef(elm);
      return;
    }

    if (forwardRef === null) {
      return;
    }

    forwardRef.current = elm;
  }, []);

  useLayoutEffect(() => {
    const { current } = ref;
    if (current === null) {
      return;
    }

    current.appendChild(elm);
  }, []);

  useLayoutEffect(() => {
    elm.load({
      html,
      css,
    });
  }, [html, css]);


  return (
    <div ref={ref}></div>
  )
})