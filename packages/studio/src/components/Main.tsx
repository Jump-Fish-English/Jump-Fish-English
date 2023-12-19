import { useEffect, useState } from 'react';
import { produce } from 'immer';
import { v4 as uuidV4 } from 'uuid';
import { usePlayer } from '../hooks/usePlayer';
import { generateScreenshot, type AnimationPlayer } from 'animation-player';
import { Workspace } from './Workspace';
import { 
  type AnimationSource,
  type VideoDocument,
  type Source,
  type Clip,
  insertClip,
  createVideoDocument,
} from '@jumpfish/video-processor';

// videos
// import src from '../../../../videos/output.mp4';
// import other from '../../../../videos/estudiantes-de-ingles-nivel-a1-resumen-de-la-semana-10-de-futbol-americano/out.mp4';

const counter = {
  css: `
    .container {
      font-size: 128px;
      width: 1600px;
      height: 900px;
      position: relative;
      color: #000;
      background: red;
      animation: background 30s both;
    }

    .ball {
      height: 50px;
      width: 50px;
      background: black;
      animation: move-ball 2s both;
      animation-direction: alternate;
      position: absolute;
      left: 50%;
      top: 50%;
      z-index: 10;
    }

    .one {
      background: #fff;
      animation: fade-in 1s both;
    }

    .two {
      background: #fff;
      animation: fade-in 1s both;
      animation-delay: 1s;
    }

    .three {
      background: #fff;
      animation: fade-in 1s both;
      animation-delay: 2s;
    }

    .four {
      background: #fff;
      animation: fade-in 1s both;
      animation-delay: 3s;
    }

    .five {
      background: #fff;
      animation: fade-in 1s both;
      animation-delay: 4s;
    }

    @keyframes fade-in {
      0% {
        opacity: 0;
      }

      100% {
        opacity: 1;
      }
    }

    @keyframes background {
      0% {
        background: red;
      }

      100% {
        background: blue;
      }
    }

    @keyframes move-ball {
      0% {
        transform: translateX(0);
      }

      100% {
        transform: translateX(500px);
      }
    }
  
  `,
  html: `
    <div class="container">
      <div class="ball"></div>
      <div class="one">1</div>
      <div class="two">2</div>
      <div class="three">3</div>
      <div class="four">4</div>
      <div class="five">5</div>
    </div>
  `,
};

const animationContents = {
  css: `
    .container {
      height: 400px;
      width: 400px;
      background: purple;
    }
    
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
  <div class="container"></div>
  `,
};

async function loadAnimationSource({
  html,
  css,
}: {
  html: string;
  css: string;
}): Promise<AnimationSource> {
  const elm = document.createElement('jf-animation-player') as AnimationPlayer;
  const id = uuidV4();
  document.body.appendChild(elm);
  elm.style.position = 'fixed';
  elm.style.left = '-10000px';
  elm.style.visibility = 'hidden';
  const durationMilliseconds = await new Promise<number>((res) => {
    elm.addEventListener(
      'durationchange',
      () => {
        res(elm.duration * 1000);
      },
      { once: true },
    );

    elm.load({ html, css });
  });

  const screenShot = await generateScreenshot({
    contents: { html, css },
    milliseconds: 1000,
  });
  document.body.removeChild(elm);
  return {
    durationMilliseconds,
    id,
    title: 'Subscribe',
    thumbnail: screenShot,
    type: 'animation',
    html,
    css,
  };
}

// async function loadSource(arrayBuffer: ArrayBuffer): Promise<VideoSource> {
//   const id = uuidV4();
//   const videoFile = await writeVideoFile({
//     fileName: `${id}.mp4`,
//     buffer: new Uint8Array(arrayBuffer),
//     type: 'video/mp4',
//   });

//   const durationMilliseconds = await new Promise<number>((res) => {
//     const videoElm = document.createElement('video');
//     videoElm.preload = 'metadata';
//     videoElm.src = videoFile.url;
//     videoElm.addEventListener('durationchange', () => {
//       res(videoElm.duration * 1000);
//     }, {
//       once: true,
//     });
//   });

//   const thumbnailUrl = await exportFrame({
//     millisecond: 0,
//     source: videoFile,
//   });

//   return {
//     type: 'video',
//     title: id,
//     id,
//     durationMilliseconds,
//     thumbnailUrl,
//     videoFile,
//   };
// }

export function Main() {
  const [sources, setSources] = useState<Record<string, Source>>({});
  const [doc, setDoc] = useState<VideoDocument>(
    createVideoDocument({
      width: 1600,
      height: 900,
    })
  );

  const player = usePlayer({
    doc,
    sources,
  });

  useEffect(() => {
    // other
    // const  first = fetch(src)
    //   .then((resp) => resp.arrayBuffer())
    //   .then((buffer) => {
    //     return loadSource(buffer);
    //   });

    // const second = fetch(other)
    //   .then((resp) => resp.arrayBuffer())
    //   .then((buffer) => {
    //     return loadSource(buffer);
    //   });

    Promise.all([
      // first,
      // second,
      loadAnimationSource(animationContents),
      loadAnimationSource(counter),
    ]).then((sources) => {
      setSources(
        produce((draft) => {
          sources.forEach((source) => {
            draft[source.id] = source;
          });
        }),
      );
    });
  }, []);

  return (
    <Workspace
      onSourceSelect={(source) => {
        const clip: Clip = {
          id: uuidV4(),
          source: source.id,
          win: {
            startMilliseconds: 0,
            durationMilliseconds: source.durationMilliseconds,
          },
        };

        const nextDoc = insertClip({
          doc,
          insertMillisecond: doc.durationMilliseconds,
          clip,
        });

        setDoc(nextDoc);
      }}
      sources={sources}
      doc={doc}
      player={player}
    />
  );
}
