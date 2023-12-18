import { useRef,useState, type ReactNode, useContext, createContext } from "react";
import { usePopover, Overlay} from 'react-aria';
import { useOverlayTriggerState } from "react-stately";
import useResizeObserver from 'use-resize-observer';

export interface TimeRange {
  startMilliseconds: number;
  durationMilliseconds: number;
}

interface Props {
  className?: string;
  durationMilliseconds: number;
  onTimeMouseOver?(params: { milliseconds: number, translateX: number }): void;
  onTimeMouseOut?(): void;
  onTimeSelect?: (milliseconds: number) => void;
  contextMenu?: (milliseconds: number) => ReactNode;
  children?: ReactNode;
  timeRange: TimeRange;
}

function millisecondsToTranslateX(millisecond: number, displayWindow: TimeRange, containerWidth: number) {
  const { startMilliseconds, durationMilliseconds } = displayWindow;
  const pixelsPerMillisecond = containerWidth / durationMilliseconds;
  return (millisecond - startMilliseconds) * pixelsPerMillisecond;
}

function leftToMilliseconds(left: number, timeRange: TimeRange, containerWidth: number): number {
  const { startMilliseconds, durationMilliseconds } = timeRange;
  const millisecondsPerPixel = durationMilliseconds / containerWidth;
  return Math.round(left * millisecondsPerPixel) + startMilliseconds;
}

const TimelineContext = createContext<{
  timeRange: TimeRange;
  containerWidth: number;
} | null>(null);


export function useTimeline() {
  const context = useContext(TimelineContext);
  if (context === null) {
    throw new Error('Null timeline context');
  }
  const { timeRange, containerWidth } = context;
  return {
    getTranslateX: (millisecond: number) => {
      return millisecondsToTranslateX(millisecond, timeRange, containerWidth);
    },
    pixelToDurationMilliseconds(pixel: number) {
      return leftToMilliseconds(pixel, timeRange, containerWidth);
    }
  }
}

export function Timeline({ contextMenu: onContextMenu, className, onTimeMouseOut, timeRange, children, onTimeMouseOver, onTimeSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width: containerWidth } = useResizeObserver({
    ref: containerRef,
  });
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [contextMenu, setContextMenuState] = useState<{
    offset: number;
    crossOffset: number,
    content: ReactNode;
  } | undefined>(undefined);
  const overlayTriggerState = useOverlayTriggerState({
    isOpen: contextMenu !== undefined,
    onOpenChange(isOpen) {
      if (isOpen === false) {
        setContextMenuState(undefined);
      }
    }
  });
  const { popoverProps } = usePopover({
    placement: 'top start',
    triggerRef: containerRef,
    popoverRef,
    offset: contextMenu?.offset,
    crossOffset: contextMenu?.crossOffset,
    
  }, overlayTriggerState);
  
  return (
    <TimelineContext.Provider value={{
      containerWidth: containerWidth === undefined ? 0 : containerWidth,
      timeRange,
    }}>
      <div
        onContextMenu={(e) => {
          if (onContextMenu === undefined) {
            return;
          }
          e.preventDefault();
          if (containerWidth === undefined) {
            return;
          }

          const milliseconds = leftToMilliseconds(
            e.pageX,
            timeRange,
            containerWidth,
          );

          setContextMenuState({
            content: onContextMenu(milliseconds),
            crossOffset: e.pageX - 239,
            offset: 472 - e.pageY,
          })

        }}
        onMouseLeave={() => {
          onTimeMouseOut?.();
        }}
        onMouseMove={(e) => {
          if (containerWidth === undefined) {
            return;
          }
          const { left } = containerRef.current!.getBoundingClientRect();
          const relativeLeft = e.pageX - left;
          const milliseconds = leftToMilliseconds(
            relativeLeft,
            timeRange,
            containerWidth,
          );
          onTimeMouseOver?.({ milliseconds, translateX: relativeLeft });
        }}
        onClick={(e) => {
          if (containerWidth === undefined || e.ctrlKey === true) {
            return;
          }
          const { left } = containerRef.current!.getBoundingClientRect();
          const relativeLeft = e.pageX - left;
          const milliseconds = leftToMilliseconds(
            relativeLeft,
            timeRange,
            containerWidth,
          );
          onTimeSelect?.(milliseconds);
        }}
        ref={containerRef} className={className}>
          { contextMenu !== undefined && (
            <Overlay>
              <div {...popoverProps} ref={popoverRef}>
                {contextMenu.content}
              </div>
            </Overlay>
          )}
        {children}
      </div>
    </TimelineContext.Provider>
  )
}
