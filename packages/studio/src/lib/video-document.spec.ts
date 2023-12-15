import { describe, expect, it } from 'vitest';
import { insertClip } from "./video-document";

describe('insertClip', () => {
  it('should return correct duration when previous timeline empty', () => {
    const doc = insertClip({
      insertMillisecond: 0,
      doc: {
        durationMilliseconds: 0,
        sources: {},
        timeline: [],
      },
      clip: {
        source: 'asd',
        type: 'video',
        trim: {
          startMilliseconds: 0,
          durationMilliseconds: 1000,
        },
      }
    });

    expect(doc.durationMilliseconds).toBe(1000);
  });

  it('should return correct value when previous timeline empty', () => {
    const doc = insertClip({
      insertMillisecond: 0,
      doc: {
        durationMilliseconds: 0,
        sources: {},
        timeline: [],
      },
      clip: {
        source: 'asd',
        type: 'video',
        trim: {
          startMilliseconds: 0,
          durationMilliseconds: 1000,
        }
      }
    });

    expect(doc.timeline).toEqual([{
      source: 'asd',
      type: 'video',
      trim: {
        startMilliseconds: 0,
        durationMilliseconds: 1000,
      }
    }]);
  });

  it('should return correct duration when other clips already exist', () => {
    const doc = insertClip({
      insertMillisecond: 0,
      doc: {
        durationMilliseconds: 0,
        sources: {},
        timeline: [{
          source: 'asd',
          type: 'video',
          trim: {
            startMilliseconds: 0,
            durationMilliseconds: 1000,
          }
        }],
      },
      clip: {
        source: 'asd',
        type: 'video',
        trim: {
          startMilliseconds: 0,
          durationMilliseconds: 500,
        }
      }
    });

    expect(doc.durationMilliseconds).toBe(1000);
  });

  it.only('should return correct value when inserting a clip over existing clip', () => {
    const doc = insertClip({
      insertMillisecond: 0,
      doc: {
        durationMilliseconds: 0,
        sources: {},
        timeline: [{
          source: 'asd',
          type: 'video',
          trim: {
            startMilliseconds: 0,
            durationMilliseconds: 1000,
          }
        }],
      },
      clip: {
        source: 'asd',
        type: 'video',
        trim: {
          startMilliseconds: 0,
          durationMilliseconds: 500,
        }
      }
    });

    expect(doc.timeline).toEqual([{
      source: 'asd',
      type: 'video',
      trim: {
        startMilliseconds: 0,
        durationMilliseconds: 500,
      }
    }, {
      source: 'asd',
      type: 'video',
      trim: {
        startMilliseconds: 500,
        durationMilliseconds: 500,
      }
    }]);
  });

  it('should return correct value when inserting a clip which is longer than existing clip', () => {
    const doc = insertClip({
      insertMillisecond: 0,
      doc: {
        durationMilliseconds: 0,
        sources: {},
        timeline: [{
          source: 'asd',
          type: 'video',
          trim: {
            startMilliseconds: 0,
            durationMilliseconds: 1000,
          }
        }],
      },
      clip: {
        source: 'asd',
        type: 'video',
        trim: {
          startMilliseconds: 0,
          durationMilliseconds: 1500,
        }
      }
    });
    
    expect(doc.timeline).toEqual([{
      source: 'asd',
      type: 'video',
      trim: {
        startMilliseconds: 0,
        durationMilliseconds: 1500,
      }
    }]);
  });

  it('should return correct value when inserting a clip which is longer than 2 existing clips', () => {
    const doc = insertClip({
      insertMillisecond: 0,
      doc: {
        durationMilliseconds: 0,
        sources: {},
        timeline: [{
          source: 'asd',
          type: 'video',
          trim: {
            startMilliseconds: 0,
            durationMilliseconds: 800,
          }
        }, {
          source: 'asd',
          type: 'video',
          trim: {
            startMilliseconds: 0,
            durationMilliseconds: 100,
          }
        }],
      },
      clip: {
        source: 'asd',
        type: 'video',
        trim: {
          startMilliseconds: 0,
          durationMilliseconds: 1000,
        }
      }
    });
    expect(doc.timeline).toEqual([{
      source: 'asd',
      type: 'video',
      trim: {
        startMilliseconds: 0,
        durationMilliseconds: 1000,
      }
    }]);
  });

  it('should return correct value when inserting a clip that starts partway though existing clips', () => {
    const doc = insertClip({
      insertMillisecond: 200,
      doc: {
        durationMilliseconds: 0,
        sources: {},
        timeline: [{
          source: 'asd',
          type: 'video',
          trim: {
            startMilliseconds: 0,
            durationMilliseconds: 400,
          }
        }, {
          source: 'asd',
          type: 'video',
          trim: {
            startMilliseconds: 0,
            durationMilliseconds: 400,
          }
        }],
      },
      clip: {
        source: 'asd',
        type: 'video',
        trim: {
          startMilliseconds: 0,
          durationMilliseconds: 400,
        }
      }
    });
    
    expect(doc.timeline).toEqual([{
      source: 'asd',
      type: 'video',
      trim: {
        startMilliseconds: 0,
        durationMilliseconds: 200,
      }
    }, {
      source: 'asd',
      type: 'video',
      trim: {
        startMilliseconds: 0,
        durationMilliseconds: 400,
      }
    }, {
      source: 'asd',
      type: 'video',
      trim: {
        startMilliseconds: 0,
        durationMilliseconds: 200,
      }
    }]);
  });

  it('should return correct value when inserting a clip in the middle of the timeline that has trim applied', () => {
    const doc = insertClip({
      insertMillisecond: 200,
      doc: {
        durationMilliseconds: 0,
        sources: {},
        timeline: [{
          source: 'asd',
          type: 'video',
          trim: {
            startMilliseconds: 0,
            durationMilliseconds: 400,
          }
        }, {
          source: 'asd',
          type: 'video',
          trim: {
            startMilliseconds: 100,
            durationMilliseconds: 400,
          }
        }],
      },
      clip: {
        source: 'asd',
        type: 'video',
        trim: {
          startMilliseconds: 0,
          durationMilliseconds: 400,
        }
      }
    });
    
    expect(doc.timeline).toEqual([{
      source: 'asd',
      type: 'video',
      trim: {
        startMilliseconds: 0,
        durationMilliseconds: 200,
      }
    }, {
      source: 'asd',
      type: 'video',
      trim: {
        startMilliseconds: 0,
        durationMilliseconds: 400,
      }
    }, {
      source: 'asd',
      type: 'video',
      trim: {
        startMilliseconds: 100,
        durationMilliseconds: 200,
      }
    }]);
  });
});