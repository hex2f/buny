import { version } from '../package.json';

import { renderToObject } from '@x2f/buny-core';
import type { VNode } from '@x2f/buny-core/jsx-runtime';
import path from 'path';
import YAML from 'json-to-pretty-yaml';
import { DependantNodeTree, unravelOrderOfDependencies } from '@x2f/buny-core/src/depends';

export async function renderFile(filePath: string): Promise<{
	fulfilled: Array<{ key: string, result: PromiseFulfilledResult<any> }>
	failures: Array<{ key: string, result: PromiseRejectedResult }>
}> {
	const mod = await import(filePath);

	const orderOfExecution = unravelOrderOfDependencies(Object.values(mod) as unknown as Array<VNode>)
		.map(node => node instanceof DependantNodeTree ? node.getVNode() : node)

	const promisesMap = Object.entries(mod)
		.map(([key, value]) => ({ key, node: value instanceof DependantNodeTree ? value.getVNode() : value as VNode }))
		.sort((a, b) => {
			const indexA = orderOfExecution.indexOf(a.node);
			const indexB = orderOfExecution.indexOf(b.node);
			return indexA - indexB;
		})
		.reduce((acc, { key, node }) => {
			acc[key] = renderToObject(node)
			return acc
		}, {} as Record<string, Promise<any>>)

	const keys = Object.keys(promisesMap)
	const promises = Object.values(promisesMap)
	const results = (await Promise.allSettled(promises))
		.map((result, index) => ({ key: keys[index], result }))

	const failures = results
		.filter(({ result }) => result.status === 'rejected') as Array<{ key: string, result: PromiseRejectedResult }>

	const fulfilled = results
		.filter(({ result }) => result.status === 'fulfilled') as Array<{ key: string, result: PromiseFulfilledResult<any> }>

	return {
		fulfilled,
		failures
	}
}