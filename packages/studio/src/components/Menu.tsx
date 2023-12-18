import { useTreeState, type Node, type TreeState } from 'react-stately';
import { useMenu, useMenuItem, type AriaMenuProps } from 'react-aria';
import { useRef } from 'react';


export { Item as MenuItem } from 'react-stately';

function MenuItem({ item, state }: { item: Node<object>, state: TreeState<object> }) {
  const ref = useRef(null);
  const { menuItemProps } = useMenuItem(
    { key: item.key },
    state,
    ref
  );

  return (
    <li {...menuItemProps} ref={ref}>
      {item.rendered}
    </li>
  );
}

interface Props<T extends object> extends  AriaMenuProps<T> {
  className?: string;
}

export function Menu<T extends object>(props: Props<T>) {
  const { className } = props;
  const state = useTreeState(props);
  const ref = useRef(null);
  const { menuProps } = useMenu(props, state, ref);
  return (
    <ul {...menuProps} className={className} ref={ref}>
      {[...state.collection].map((item) => {
        return (
          <MenuItem key={item.key} item={item} state={state} />
        );
      })}
    </ul>
  )
}
