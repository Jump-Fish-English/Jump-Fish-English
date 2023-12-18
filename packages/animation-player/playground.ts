import { AnimationPlayer, AnimationContents } from './src/AnimationPlayer.ts';
import { generateScreenshot } from './src/screenshot.ts';

customElements.define('x-foo', AnimationPlayer);

function playground({ css, html }: AnimationContents) {
  const ballContainer = document.createElement('div');
  ballContainer.style.marginBottom = '20px';
  document.body.appendChild(ballContainer);

  generateScreenshot({
    css,
    html,
  }, {
    appendClone(clone) {
      ballContainer.appendChild(clone);
    },
    onCanvas(canvas) {
      ballContainer.appendChild(canvas);
    }
  }).then(({ url }) => {
    const img = document.createElement('img');
    img.src = url;
    ballContainer.appendChild(img);
  });
}

playground({
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
});

playground({
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
        transform: scaleX(0);
      }

      100% {
        opacity: 1;
        transform: scaleX(1);
      }
    }

    @keyframes hide-subscribe {
      0% {
        opacity: 1;
        transform: scaleX(1);
      }

      100% {
        opacity: 0;
        transform: scaleX(0);
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
});