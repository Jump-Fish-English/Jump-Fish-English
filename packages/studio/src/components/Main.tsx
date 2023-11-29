import { Playhead } from './Playhead';
import { Timeline } from './Timeline';
import { Canvas } from './Canvas';

const video = `
  <style>
    .ball {
      background: red;
      height: 10px;
      width: 10px;
      border-radius: 10px;
      animation: move-ball 1s both;
    }

    @keyframes move-ball {
      0% {
        transform: translateX(0px);
      }

      100% {
        transform: translateX(100px);
      }
    }
  </style>
  <div class="ball"></div>
`;

export function Main() {
  return (
    <Canvas 
      video={video}
    >
      {({ player, play, pause, durationMilliseconds, playState, seek, currentTimeMilliseconds }) => {
        return (
          <>
            <Playhead 
              playState={playState}
              onPauseClick={pause}
              onPlayClick={play}
              currentTimeMilliseconds={currentTimeMilliseconds} 
              durationMilliseconds={durationMilliseconds}
            />
            {player}
            <Timeline 
              onTimeSelect={(time) => {
                seek(time);
              }}
              durationMilliseconds={durationMilliseconds}
              stepMilliseconds={100}
              currentTime={currentTimeMilliseconds}
            />
          </>
        )
      }}
    </Canvas>
  )
}