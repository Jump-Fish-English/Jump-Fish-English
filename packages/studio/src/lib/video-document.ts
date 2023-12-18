import { type VideoFile, type MillisecondRange } from '@jumpfish/video-processor';
import type { AnimationScreenshot } from 'animation-player';

export interface VideoSource {
  type: 'video',
  title: string;
  id: string;
  durationMilliseconds: number;
  thumbnailUrl: string;
  videoFile: VideoFile;
}

export interface AnimationSource {
  type: 'animation';
  title: string;
  id: string;
  html: string;
  css: string;
  durationMilliseconds: number;
  thumbnail: AnimationScreenshot;
}

export type Source = VideoSource | AnimationSource;
export type Clip = {
  id: string;
  source: string;
  win: MillisecondRange;
}

export interface VideoDocument {
  dimensions: {
    height: number;
    width: number;
  }
  timeline: Clip[];
  durationMilliseconds: number;
}

export function insertClip({ doc, clip, insertMillisecond }: { insertMillisecond: number, clip: Clip, doc: VideoDocument }): VideoDocument {
  const { win: clipWindow } = clip;
  const newTimeline = [];
  const clipStart = insertMillisecond;
  const clipEnd = clipStart + clipWindow.durationMilliseconds;
  let clipInserted = false;

  for (const existingClip of doc.timeline) {
    const { win: existingClipWindow } = existingClip;
    const existingStart = existingClipWindow.startMilliseconds;
    const existingEnd = existingStart + existingClipWindow.durationMilliseconds;

    // If the existing clip ends before the insert point, keep it as is
    if (existingEnd <= clipStart) {
      newTimeline.push(existingClip);
    } else {
      // If the clip has not been inserted and the existing clip starts after the insert point
      if (!clipInserted && existingStart >= clipStart) {
        newTimeline.push({ ...clip, trim: { startMilliseconds: clipStart, durationMilliseconds: clipWindow.durationMilliseconds } });
        clipInserted = true;
      }

      // Adjust the existing clip if it overlaps with the new clip
      if (existingStart < clipEnd) {
        if (existingEnd > clipEnd) {
          // Split the existing clip if it extends beyond the new clip
          newTimeline.push({ ...existingClip, trim: { startMilliseconds: clipEnd, durationMilliseconds: existingEnd - clipEnd } });
        }
      } else {
        // Add the existing clip if it starts after the new clip
        newTimeline.push(existingClip);
      }
    }
  }

  // Insert the clip at the end if not already inserted
  if (!clipInserted) {
    newTimeline.push({ ...clip });
  }
  
  return {
    ...doc,
    timeline: newTimeline,
    durationMilliseconds: newTimeline.reduce((max) => {
      return max + clipWindow.durationMilliseconds;
    }, 0),
  }
}
