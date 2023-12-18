import { generateVideo } from './src/main';

const WIDTH = 800;
const HEIGHT = 300;

const canvas = document.createElement('canvas');
canvas.width = WIDTH * 2;
canvas.height = HEIGHT * 2;
const context = canvas.getContext('2d');
context?.rect(800, 400, 100, 150);
context?.fill();
document.body.appendChild(canvas);

const secondCanvas = document.createElement('canvas');
secondCanvas.width = WIDTH * 2;
secondCanvas.height = HEIGHT * 2;
const secondContext = secondCanvas.getContext('2d');
secondContext!.rect(800, 400, 100, 150);
secondContext!.fillStyle = 'red';
secondContext!.fill();
document.body.appendChild(secondCanvas);

async function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise<Blob>((res) => {
    canvas.toBlob((blob) => {
      if (blob === null) {
        throw new Error();
      }

      res(blob);
    })
  });
}

Promise.all([
  toBlob(canvas),
  toBlob(secondCanvas)
])
.then(([first, second]) => {
  generateVideo({
    dimensions: {
      width: WIDTH,
      height: HEIGHT,
    },
    images: [{
      data: first,
      range: {
        startMilliseconds: 0,
        endMilliseconds: 2000,
      }
    }, {
      data: second,
      range: {
        startMilliseconds: 2000,
        endMilliseconds: 5000,
      }
    }],
    frameRate: 30,
  }).then((vid) => {
    const elm = document.createElement('video');
    elm.src = vid.url;
    document.body.appendChild(elm);
  })
});