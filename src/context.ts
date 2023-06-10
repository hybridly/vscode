import fs from 'node:fs'
import path, { resolve } from 'node:path'
import { execSync } from 'node:child_process'
import { CompletionItem, CompletionItemKind, ExtensionContext, RelativePattern, Uri, workspace } from 'vscode'
import { log } from './utils/log'
import { actionToLink, ControllerAction } from './utils/psr4'
import { getPhpPath } from './settings'

interface HybridlyCompletionItem {
	identifier: string
	path: string
	target: Uri
	generateCompletion: (start?: string) => CompletionItem
}

interface Completions {
	views: HybridlyCompletionItem[]
	layouts: HybridlyCompletionItem[]
}

interface Route {
	domain?: string
	method: string
	uri: string
	name: string
	action: string
	middleware: string[]
	controller: ControllerAction
}

export interface Context {
	extension: ExtensionContext
	workspace: typeof workspace
	cwd: string
	uri: Uri
	configuration: DynamicConfiguration
	completions: Completions
	routes: Route[]
}

interface DynamicConfiguration {
	architecture: {
		root: string
	}
	components: {
		eager?: boolean
		directories: string[]
		views: Component[]
		layouts: Component[]
		components: Component[]
	}
}

interface Component {
	path: string
	identifier: string
	namespace: string
}

export async function loadContext(extension: ExtensionContext): Promise<Context | false> {
	const uri = workspace.workspaceFolders?.[0].uri
	const cwd = uri?.fsPath

	if (!cwd) {
		log.append('No workspace loaded.')
		return false
	}

	const config = workspace.getConfiguration('hybridly')
	const disabled = config.get<boolean>('disable', false)
	if (!disabled) {
		log.appendLine('Disabled by configuration.')
		return false
	}

	const pkg = JSON.parse(fs.readFileSync(path.resolve(cwd, 'package.json'), { encoding: 'utf-8' }))
	const deps = { ...pkg.dependencies, ...pkg.devDependencies }
	if (!deps.hybridly) {
		log.appendLine('Hybridly was not found in `package.json`.')
		return false
	}

	const composer = JSON.parse(fs.readFileSync(path.resolve(cwd, 'composer.json'), { encoding: 'utf-8' }))
	if (!composer?.require?.['hybridly/laravel']) {
		log.appendLine('Hybridly was not found in `composer.json`.')
		return false
	}

	const configuration = await loadConfiguration(cwd)

	return {
		extension,
		workspace,
		cwd,
		uri,
		configuration,
		completions: {
			views: [],
			layouts: [],
		},
		routes: [],
	}
}

export async function registerContextUpdater(context: Context) {
	async function updateAllCompletions() {
		await updateConfig()
		await updateCompletions('views', context.configuration.components.views)
		await updateCompletions('layouts', context.configuration.components.layouts)
		await updateRoutes()
	}

	async function updateConfig() {
		log.appendLine('Updating configuration...')
		context.configuration = await loadConfiguration(context.cwd)
	}

	async function updateCompletions(type: keyof Completions, collection: Component[]) {
		log.appendLine(`Updating ${type} completions...`)

		const components = collection.map((component) => {
			const uri = Uri.file(resolve(context.cwd, component.path))
			const lines = fs.readFileSync(uri.fsPath).toString().split('\n')
			const lineIndexOfAction = lines.findIndex((line) => line.includes('<script setup')) + 1

			return {
				path: uri.path,
				identifier: component.identifier,
				target: uri.with({ fragment: `L${lineIndexOfAction + 1},0` }),
			}
		})

		log.appendLine(`Registered ${components.length} ${type}.`)

		context.completions[type] = components.map((component) => ({
			identifier: component.identifier,
			path: component.path,
			target: component.target,
			generateCompletion: (start?: string) => new CompletionItem({
				label: start ? component.identifier.replace(start, '') : component.identifier,
				description: type === 'views' ? 'Hybrid page component' : 'Hybrid layout component',
			}, CompletionItemKind.Value),
		}))
	}

	async function updateRoutes() {
		log.appendLine('Collecting routes...')
		const routes = JSON.parse(execSync('php artisan route:list --json', { cwd: context.cwd }).toString()) as Route[]

		context.routes = routes.flatMap((route) => {
			const controller = actionToLink(context.uri, route.action)

			if (!controller) {
				return []
			}

			return {
				...route,
				controller,
			}
		})

		log.appendLine(`Collected ${context.routes.length} routes.`)
	}

	const completionWatcher = workspace.createFileSystemWatcher(new RelativePattern(context.cwd, '**/*.vue'))
	completionWatcher.onDidChange(updateAllCompletions)
	completionWatcher.onDidCreate(updateAllCompletions)
	completionWatcher.onDidDelete(updateAllCompletions)

	const configWatcher = workspace.createFileSystemWatcher(new RelativePattern(`${context.cwd}/config`, 'hybridly.php'))
	configWatcher.onDidChange(updateAllCompletions)

	const routeWatcher = workspace.createFileSystemWatcher(new RelativePattern(`${context.cwd}/routes`, '**/*.php'))
	routeWatcher.onDidChange(updateAllCompletions)

	updateAllCompletions()
}

export async function loadConfiguration(cwd: string): Promise<DynamicConfiguration> {
	try {
		return JSON.parse(execSync(`${getPhpPath()} artisan hybridly:config`, { cwd }).toString())
	} catch (e) {
		console.error('Could not load configuration from [php artisan].')
		throw e
	}
}
