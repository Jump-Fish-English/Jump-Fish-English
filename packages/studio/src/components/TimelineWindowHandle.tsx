import { useDrag } from "@use-gesture/react";

interface Props {
  className: string;
  onDrag(delta: number): void;
}

export function TimelineWindowHandle({ onDrag, className }: Props) {
  const dragHandlers = useDrag(({ delta }) => {
    onDrag(delta[0]);
  });

  return (
    <div 
      {...dragHandlers()}
      className={className}
    />
  )
}