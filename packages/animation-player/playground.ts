import { AnimationPlayer } from './src/AnimationPlayer.ts';
import { generateScreenshot } from './src/screenshot.ts';

customElements.define('x-foo', AnimationPlayer);

generateScreenshot({
  css: `
    .ball {
      border-radius: 10px;
      width: 100px;
      height: 100px;
      background: red;
      animation: foo 1s;
    }

    @keyframes foo {
      0% {
        opacity: 0;
      }

      100% {
        opacity: 1;
      }
    }
  `,
  html: `
    <div class="ball"></div>
  `
}).then((url) => {
  const img = document.createElement('img');
  img.src = url;
  document.body.appendChild(img);
});

