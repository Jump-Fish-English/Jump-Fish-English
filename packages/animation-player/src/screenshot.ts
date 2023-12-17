import generate from 'html2canvas';
import { AnimationContents, AnimationPlayer } from "./AnimationPlayer";

export async function generateScreenshot(contents: AnimationContents) {
  const elm = new AnimationPlayer();
  elm.style.display = 'inline-block';
  document.body.appendChild(elm);

  const canPlayThroughPromise = new Promise((res) => {
    elm.addEventListener('canplaythrough', res, {
      once: true,
    });
  })

  elm.load(contents);

  await canPlayThroughPromise;
  elm.currentTime = 1;

  await new Promise(requestAnimationFrame);

  const container = elm.container();
  if (container === undefined) {
    throw new Error('Should be a container here');
  }
  const canvasElement = await generate(elm, {
    removeContainer: false,
    scale: 1,
    backgroundColor: 'transparent',
    onclone(doc, el) {
      doc.getAnimations().forEach((animation) => {
        animation.cancel();
      });
    }
  });
  document.body.appendChild(canvasElement);
  return canvasElement.toDataURL();
}