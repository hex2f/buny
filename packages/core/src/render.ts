import type { VNode } from '../jsx-runtime';
import { FragmentSymbol, ListSymbol } from '../jsx-runtime';
import { OriginError } from './error';

/**
 * Renders a virtual node (VNode) to a JavaScript object.
 * 
 * This function recursively processes JSX elements and components, converting them
 * into plain JavaScript objects. It handles various node types:
 * - Primitive values (strings, numbers, booleans)
 * - Function components
 * - String-key elements (HTML/XML tags)
 * - Special symbols (Fragment, List)
 * 
 * @param vnode - The virtual node to render
 * @param callStack - Array tracking the component hierarchy for error reporting
 * @returns A Promise resolving to the rendered JavaScript object
 * @throws {OriginError} When rendering fails, with component stack trace
 */
export async function renderToObject(vnode: VNode['children'][0], callStack: string[] = []): Promise<any> {
  try {
    // Handle null or undefined nodes
    if (vnode === null || vnode === undefined) {
      return null
    }

    // Handle primitive values (string, number, boolean)
    if (typeof vnode === 'string' || typeof vnode === 'number' || typeof vnode === 'boolean') {
      callStack.push(vnode.toString())
      if (typeof vnode === 'string' && vnode.length === 0) {
        return ''
      }
    
      // Convert numeric strings to numbers
      if (!isNaN(Number(vnode))) {
        return Number(vnode)
      }

      // Convert 'true'/'false' strings to booleans
      if (vnode === 'true' || vnode === 'false') {
        return vnode === 'true'
      }

      return vnode
    }

    // Validate that the node is at least a somewhat proper VNode
    if (!('type' in vnode)) {
      console.warn(`Tried to render object as a VNode: Object`, vnode)
      throw new Error('Object is not a valid VNode')
    }

    // Update call stack based on node type for error reporting
    switch (typeof vnode.type) {
      case 'function':
        callStack.push(vnode.type.name)
        break
      case 'string':
        callStack.push(vnode.type)
        break
      case 'symbol':
        // These already get added via their factory functions
        // callStack.push(String(vnode.type))
        break
      default:
        callStack.push('unknown')
    }

    // Handle function components
    if (typeof vnode.type === 'function') {
      const props = { ...vnode.props, children: vnode.children ?? [] }
      const result = vnode.type(props)

      return await renderToObject(
        result instanceof Promise ? await result : result, // await the result if it's a promise
        [...callStack]
      )
    }

    // Handle string-key elements with a single child (simple key-value pair)
    if (typeof vnode.type === 'string' && vnode.children?.length === 1) {
      return { [vnode.type]: await renderToObject(vnode.children[0] as VNode, [...callStack]) }
    }

    // Handle special symbol types (Fragment and List)
    if (typeof vnode.type === 'symbol') {
      if (vnode.type !== FragmentSymbol && vnode.type !== ListSymbol) {
        throw new Error(`Tried to render symbol ${String(vnode.type)} as a component`)
      }

      // List symbol renders children as an array
      // TODO: Should this be flattening the array? 
      if (vnode.type === ListSymbol) {
        return await Promise.all(
          vnode.children.map(child => renderToObject(child as VNode, [...callStack]))
        ).then(results => results.reduce((acc, result) => ([ ...acc, result ]), []))
      }

      // Fragment merges all children into a single object
      return await Promise.all(
        vnode.children.map(child => renderToObject(child as VNode, [...callStack]))
      ).then(results => results.reduce((acc, result) => (deepMerge(acc, result)), {}))
    }
    
    // Handle string-key elements with multiple children
    return { [vnode.type]: await Promise.all(
      vnode.children.map(child => renderToObject(child as VNode, [...callStack]))
    ).then(results => results.reduce((acc, result) => (deepMerge(acc, result)), {})) }
  } catch (e) {
    // Enhance errors with component stack trace
    if (e instanceof OriginError) {
      throw e
    } else if (e instanceof Error) {
      throw new OriginError(e.message, callStack)
    } else {
      throw new Error('Unknown error')
    }
  }
}

/**
 * Deeply merges two objects together, combining their properties recursively.
 * 
 * @param target - The target object to merge into
 * @param source - The source object to merge from
 * @returns A new object containing the merged properties of both objects
 * 
 * Merging behavior:
 * - Objects are recursively merged
 * - Arrays are concatenated
 * - Primitive values from source will be added to target
 * - If a primitive value exists in both objects with the same key, an error is thrown
 *   to prevent accidental overwriting
 * 
 * @throws Error when attempting to overwrite a primitive value that already exists
 */
export function deepMerge<T extends Record<string, any>, U extends Record<string, any>>(
  target: T,
  source: U
): T & U {
  const output = { ...target } as Record<string, any>;
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else if (Array.isArray(source[key])) {
        output[key] = Array.isArray(target[key])
          ? [...target[key], ...source[key]]
          : [...source[key]];
      } else {
        if (key in output) {
          throw new Error(`The key "${key}" cannot be merged as it isn't itself an object and already exists in the target object.`)
        }
          
        output[key] = source[key];
      }
    });
  }
  
  return output as T & U;
}

function isObject(item: any): item is Record<string, any> {
  return item && typeof item === 'object' && !Array.isArray(item);
}
