import { workspace } from 'vscode'

export function getComponentMethods() {
	return [
		'hybridly',
		'hybridly()->view',
		'assertHybridView',
		...workspace.getConfiguration('hybridly').get<string[]>('componentMethods') || [],
	]
}

export function getRouteMethods() {
	return [
		'route',
		'to_route',
		'router.to',
		'base',
		...workspace.getConfiguration('hybridly').get<string[]>('routeMethods') || [],
	]
}
