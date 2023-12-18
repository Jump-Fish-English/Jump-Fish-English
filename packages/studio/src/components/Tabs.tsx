import type { TabListStateOptions } from '@react-stately/tabs';
import { useRef } from 'react';
import {useTab, useTabList, useTabPanel, type AriaTabPanelProps} from 'react-aria';
import { useTabListState, type TabListState, type Node } from 'react-stately';

export { Item as Tab } from 'react-stately';

interface Props extends TabListStateOptions<object> {
  className?: string;
  tabClassName?: string;
  tabListClassName?: string;
  tabPanelClassName?: string;
  tabActiveClassName?: string;
}

export function Tabs(props: Props) {
  const state = useTabListState(props);
  const ref = useRef(null);
  const { tabListProps, } = useTabList(props, state, ref);
  return (
    <div className={props.className}>
      <div {...tabListProps} ref={ref} className={props.tabListClassName}>
        {[...state.collection].map((item) => (
          <Tab activeClassName={props.tabActiveClassName} className={props.tabClassName} key={item.key} item={item} state={state} />
        ))}
      </div>
      <TabPanel className={props.tabPanelClassName} key={state.selectedItem?.key} state={state} />
    </div>
  );
}

function Tab({ className, item, state, activeClassName }: { activeClassName?: string, className?: string, state: TabListState<unknown>, item: Node<object> } ) {
  const { key, rendered } = item;
  const ref = useRef(null);
  const { tabProps, } = useTab({ key }, state, ref);
  const isSelected = state.selectedItem?.key === key;

  return (
    <div {...tabProps} ref={ref} className={isSelected === true ? activeClassName : className}>
      {rendered}
    </div>
  );
}

function TabPanel({ state, className, ...props }: AriaTabPanelProps & { className?: string, state: TabListState<unknown> }) {
  const ref = useRef(null);
  const { tabPanelProps } = useTabPanel(props, state, ref);
  return (
    <div {...tabPanelProps} ref={ref} className={className}>
      {state.selectedItem?.props.children}
    </div>
  );
}