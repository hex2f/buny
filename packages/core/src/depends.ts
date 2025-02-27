import type { VNode } from "../jsx-runtime";

/**
 * Represents a tree structure of nodes with dependencies.
 * This class allows for defining relationships between nodes where some nodes
 * depend on others, enabling proper ordering during rendering.
 */
export class DependantNodeTree {
	/**
	 * Creates a new DependantNodeTree instance.
	 * @param deps - An array of nodes that this node depends on
	 * @param node - The actual node that has dependencies
	 */
	constructor(public deps: Array<VNode | DependantNodeTree>, public node: VNode | DependantNodeTree) {
	}

	/**
	 * Retrieves the underlying VNode, traversing through any nested DependantNodeTree instances.
	 * @returns The actual VNode at the end of the dependency chain
	 */
	getVNode(): VNode {
		return this.node instanceof DependantNodeTree ? this.node.getVNode() : this.node
	}
}

/**
 * Creates a dependency relationship between nodes.
 * @param deps - An array of nodes that must be processed before the dependent node
 * @param node - The node that depends on the specified dependencies
 * @returns A new DependantNodeTree representing this dependency relationship
 */
export function depends(deps: Array<VNode | DependantNodeTree>, node: VNode | DependantNodeTree) {
	// basic check for circular dependencies
	for (const dep of deps) {
		if (dep instanceof DependantNodeTree) {
			if (dep.getVNode() === (node instanceof DependantNodeTree ? node.getVNode() : node)) {
				throw new Error("Circular dependency detected")
			}
		}
	}

	return new DependantNodeTree(deps, node)
}

/**
 * Determines the correct order of execution for a set of nodes with dependencies.
 * Uses a depth-first search algorithm to ensure dependencies are processed before
 * the nodes that depend on them.
 * 
 * @param trees - An array of nodes or dependency trees to order
 * @returns An ordered array of nodes where dependencies come before dependent nodes
 */
export function unravelOrderOfDependencies(trees: Array<DependantNodeTree | VNode>) {
	const order: Array<VNode | DependantNodeTree> = []
	const visited = new Set()
	
	function dfs(node: DependantNodeTree | VNode) {
		// Skip if already visited to prevent cycles
		if (visited.has(node)) {
			return;
		}
		
		// If it's a dependency tree, process its dependencies first
		if (node instanceof DependantNodeTree) {
			// Mark as being processed to detect cycles
			visited.add(node);
			
			// Process all dependencies first
			for (const dep of node.deps) {
				dfs(dep);
			}
			
			// Then process the node itself
			dfs(node.node);
		} else {
			// For regular VNodes, just add to the order if not visited
			if (!visited.has(node)) {
				visited.add(node);
				order.push(node);
			}
		}
	}
	
	// Start DFS from each tree in the array
	for (const tree of trees) {
		dfs(tree);
	}
	
	return order;
}
