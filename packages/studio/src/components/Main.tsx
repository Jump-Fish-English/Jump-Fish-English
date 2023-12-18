import { useEffect, useState } from 'react';
import { produce } from 'immer';
import generate from 'html2canvas';
import { v4 as uuidV4 } from 'uuid';
import { exportFrame, writeFile as writeVideoFile } from '@jumpfish/video-processor';
import { type VideoDocument, type VideoSource, type AnimationSource, type Source } from '../lib/video-document';
import { usePlayer } from '../hooks/usePlayer';
import { generateScreenshot, type AnimationPlayer } from 'animation-player';
import { Workspace } from './Workspace';



// videos
import src from '../../../../videos/output.mp4';
import other from '../../../../videos/estudiantes-de-ingles-nivel-a1-resumen-de-la-semana-10-de-futbol-americano/out.mp4';


const animationContents = {
  css: `
    .parent {
      animation: hide-subscribe 350ms both;
      animation-delay: 4s;
      display: inline-block;
    }

    .subscribe {
      font-family: -apple-system;
      letter-spacing: 0.1rem;
      background: red;
      padding: 0.5rem 1rem;
      box-shadow: 0 0 10px #b1b1b1;
      color: #fff;
      
      border-radius: 20px;
      display: inline-flex;
      justify-content: center;
      align-items: center;
      animation: show-subscribe 350ms both;
      
    }

    @keyframes show-subscribe {
      0% {
        opacity: 0;
      }

      100% {
        opacity: 1;
      }
    }

    @keyframes hide-subscribe {
      0% {
        opacity: 1;
      }

      100% {
        opacity: 0;
      }
    }

    .subscribe-text {
      position: relative;
      align-items: center;
      justify-content: center;
      display: flex;
      animation: show-text 500ms both;
      margin-right: 18px;
    }

    .subscribe-text:after {
      content: " ";
      display: block;
      position: absolute;
      left: 100%;
      top: 50%;
      margin-top: 5px;
      margin-left: 0.3rem;
      border: 8px solid transparent;
      border-top-color: #fff;
      transform: translateY(-50%);
    }

    @keyframes show-text {
      0% {
        opacity: 0;
      }

      100% {
        opacity: 1;
      }
    }
  `,
  html: `
    <div class="parent">
      <div 
        class="subscribe"
      >
        <div class="subscribe-text">Subscribe</div>
      </div>
  </div>
  `
};

async function loadAnimationSource({ html, css }: { html: string, css: string }): Promise<AnimationSource> {
  const elm = document.createElement('jf-animation-player') as AnimationPlayer;
  const id = uuidV4();
  
  document.body.appendChild(elm);
  elm.style.position = 'fixed';
  elm.style.left = '-10000px';
  elm.style.visibility = 'hidden';
  const durationMilliseconds = await new Promise<number>((res) => {
    elm.addEventListener('durationchange', () => {
      res(elm.duration * 1000);
    }, { once: true });

    elm.load(animationContents);
  });

  const { url: thumbnailUrl } = await generateScreenshot({ html, css });
  return {
    durationMilliseconds,
    id,
    title: id,
    thumbnailUrl,
    type: 'animation',
    html,
    css,
  }
}


async function loadSource(arrayBuffer: ArrayBuffer): Promise<VideoSource> {
  const id = uuidV4();
  const videoFile = await writeVideoFile({
    fileName: `${id}.mp4`,
    buffer: new Uint8Array(arrayBuffer),
    type: 'video/mp4',
  });
  
  const durationMilliseconds = await new Promise<number>((res) => {
    const videoElm = document.createElement('video');
    videoElm.preload = 'metadata';
    videoElm.src = videoFile.url;
    videoElm.addEventListener('durationchange', () => {
      res(videoElm.duration * 1000);
    }, {
      once: true,
    });
  });

  const thumbnailUrl = await exportFrame({
    millisecond: 0,
    source: videoFile,
  });

  return {
    type: 'video',
    title: id,
    id,
    durationMilliseconds,
    thumbnailUrl,
    videoFile,
  };
}

export function Main() {
  const [sources, setSources] = useState<Record<string, Source>>({});
  const [doc, setDoc] = useState<VideoDocument>({
    timeline: [],
    durationMilliseconds: 0,
  });

  const player = usePlayer({
    doc
  });
  const { el: playerElement } = player;

  useEffect(() => {
    // other
    const  first = fetch(src)
      .then((resp) => resp.arrayBuffer())
      .then((buffer) => {
        return loadSource(buffer);
      });

    const second = fetch(other)
      .then((resp) => resp.arrayBuffer())
      .then((buffer) => {
        return loadSource(buffer);
      });

    const animation = loadAnimationSource(animationContents);

    Promise.all([
      first,
      second,
      animation,
    ]).then((sources) => {
      setSources(
        produce((draft) => {
          sources.forEach((source) => {
            draft[source.id] = source;
          });
        })
      )
    })
    
  }, []);


  return (
    <Workspace 
      sources={sources}
      doc={doc}
      player={player}
    />
  )
}