import { type VideoFile, type MillisecondRange, concatVideoFiles } from '@jumpfish/video-processor';

export interface VideoSource {
  type: 'video',
  id: string;
  durationMilliseconds: number;
  thumbnailUrl: string;
  videoFile: VideoFile;
}


export interface VideoClip {
  type: 'video',
  source: string;
  trim: MillisecondRange;
}

export interface VideoDocument {
  sources: Record<string, VideoSource>;
  timeline: VideoClip[];
  durationMilliseconds: number;
  videoUrl?: string;
}

export function insertClip({ doc, clip, insertMillisecond }: { insertMillisecond: number, clip: VideoClip, doc: VideoDocument }): VideoDocument {
  const newTimeline = [];
  const clipStart = insertMillisecond;
  const clipEnd = clipStart + clip.trim.durationMilliseconds;
  let clipInserted = false;

  for (const existingClip of doc.timeline) {
    const existingStart = existingClip.trim.startMilliseconds;
    const existingEnd = existingStart + existingClip.trim.durationMilliseconds;

    // If the existing clip ends before the insert point, keep it as is
    if (existingEnd <= clipStart) {
      newTimeline.push(existingClip);
    } else {
      // If the clip has not been inserted and the existing clip starts after the insert point
      if (!clipInserted && existingStart >= clipStart) {
        newTimeline.push({ ...clip, trim: { startMilliseconds: clipStart, durationMilliseconds: clip.trim.durationMilliseconds } });
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
    durationMilliseconds: newTimeline.reduce((max, clip) => {
      return max + clip.trim.durationMilliseconds;
    }, 0),
  }
}

export async function renderVideoDocument({ doc }: { doc: VideoDocument }) {
  const { timeline, sources } = doc;

  const file = await concatVideoFiles({
    output: {
      encodingPreset: 'ultrafast'
    },
    files: timeline.map(({ trim, source: sourceId }) => {
      const source = sources[sourceId];
      return {
        file: source.videoFile,
        inpointMilliseconds: trim.startMilliseconds,
        outpointMilliseconds: trim.durationMilliseconds,
      }
    })
  });

  return URL.createObjectURL(file.data);
}
