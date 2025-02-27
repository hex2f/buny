// Custom JSX runtime that renders to objects instead of DOM elements

export type PropsWithChildren<P> = P & { children?: VNode[] }
export type FC<P extends Record<string, any>> = (props: PropsWithChildren<P>) => VNode | Promise<VNode>

// Define the structure of our virtual nodes
export interface VNode {
  type: string | FC<any> | symbol;
  props: Record<string, any>;
  children: Array<VNode | string | number | boolean | null | undefined>;
}

// JSX Factory function for elements
export function jsx(
  type: string | FC<any> | symbol,
  props: Record<string, any> | null
): VNode {
  // Extract children from props
  const { children, ...restProps } = props || {};
  
  // Normalize children to an array
  const childrenArray = children === undefined 
    ? [] 
    : Array.isArray(children) 
      ? children 
      : [children];
  
  return {
    type,
    props: restProps || {},
    children: childrenArray.flat()
  };
}

// Fragment component - merges all children into a single object
export const FragmentSymbol = Symbol('Fragment');
export function Fragment(props: PropsWithChildren<{}>) {
  return {
    type: FragmentSymbol,
    props: {},
    children: props.children
  }
}

// List component - collects children into an array
export const ListSymbol = Symbol('List');
export function List(props: PropsWithChildren<{}>) {
  return {
    type: ListSymbol,
    props: {},
    children: props.children
  }
}

// Export namespace for TypeScript JSX integration
export namespace JSX {
  export interface IntrinsicElements {
    [key: string]: any;
  }
} 