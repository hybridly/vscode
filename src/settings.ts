import { workspace } from 'vscode'

export function getComponentMethods() {
	return [
		'hybridly',
		'view',
		'component',
		'hybridly()->view',
		'hybridly()->component',
		'partial_headers',
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

export function generatesStrictTypes() {
	return workspace.getConfiguration('hybridly').get<boolean>('generation.strictTypes') || false
}

export function generatesFinal() {
	return workspace.getConfiguration('hybridly').get<boolean>('generation.final') || false
}

export function getTestDirectory() {
	return workspace.getConfiguration('hybridly').get<string>('test.directory')
}

export function getPhpPath(): string {
	return workspace.getConfiguration('php.validate').get<string>('executablePath')
		?? workspace.getConfiguration('hybridly.php').get<string>('executablePath')
		?? process.env.PHP_EXECUTABLE_PATH
		?? 'php'
}
