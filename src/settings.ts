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

export function getDirectoryPatterns(): string[] {
	const settings = workspace.getConfiguration('hybridly').get<string[] | string>('directories', [])

	if (!settings.length) {
		return [
			'resources/domains/{domain}/pages/{page}.vue',
			'resources/domains/{domain}/layouts/{layout}.vue',
			'resources/views/pages/{page}.vue',
			'resources/views/layouts/{layout}.vue',
		]
	}

	return Array.isArray(settings) ? settings : [settings]
}
