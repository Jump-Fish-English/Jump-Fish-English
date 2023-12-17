import type { AnimationPlayer } from "animation-player";
import { useLayoutEffect, useRef, useState } from "react";

interface Props {
  millisecond: number;
  className?: string;
  contents: {
    html: string;
    css: string;
  }
}

export function AnimationThumbnail({ className, millisecond, contents: { html, css } }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [elm] = useState(() => {
    return document.createElement('jf-animation-player') as AnimationPlayer;
  });

  useLayoutEffect(() => {
    const { current } = ref;
    if (current === null) {
      return;
    }
    current.appendChild(elm);
  }, []);

  useLayoutEffect(() => {
    requestAnimationFrame(() => {
      elm.currentTime = millisecond / 1000;
    });
  }, [millisecond]);

  useLayoutEffect(() => {
    elm.load({
      html,
      css,
    });
  }, [html, css]);


  return (
    <div className={className} ref={ref} />
  );
}