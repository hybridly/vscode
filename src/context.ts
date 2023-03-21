import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { CompletionItem, CompletionItemKind, ExtensionContext, RelativePattern, Uri, workspace } from 'vscode'
import { loadHybridlyConfig, ResolvedHybridlyConfig, resolvePageOrLayoutGlob } from '@hybridly/config'
import { log } from './utils/log'
import { actionToLink, ControllerAction } from './utils/psr4'

interface HybridlyCompletionItem {
	identifier: string
	path: string
	target: Uri
	generateCompletion: (start?: string) => CompletionItem
}

interface Completions {
	pages: HybridlyCompletionItem[]
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
	hybridly: ResolvedHybridlyConfig
	completions: Completions
	routes: Route[]
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

	const hybridly = await loadHybridlyConfig(cwd)

	return {
		extension,
		workspace,
		cwd,
		uri,
		hybridly,
		completions: {
			pages: [],
			layouts: [],
		},
		routes: [],
	}
}

export async function registerContextUpdater(context: Context) {
	async function updateAllCompletions() {
		await updateCompletions('pages', resolvePageOrLayoutGlob('pages', context.hybridly).replace(/^\//, ''))
		await updateCompletions('layouts', resolvePageOrLayoutGlob('layouts', context.hybridly).replace(/^\//, ''))
		await updateRoutes()
	}

	async function updateConfig() {
		log.appendLine('hybridly.config.ts changed, reloading...')
		context.hybridly = await loadHybridlyConfig(context.cwd)
		await updateAllCompletions()
	}

	async function updateCompletions(directory: keyof Completions, glob: string) {
		log.appendLine(`Collecting ${directory}...`)

		const files = await workspace.findFiles({
			base: context.cwd,
			baseUri: context.uri,
			pattern: glob,
		})

		const components = files.flatMap((uri) => {
			const regexp = context.hybridly.domains
				? new RegExp(`${context.hybridly.domains}\/(.*)\/${directory}\/(.*)\.vue`)
				: new RegExp(`${directory}\/(.*)\.vue`)

			const [match, domain, component] = uri.path.match(regexp) || []

			const identifier = context.hybridly.domains
				? `${domain}:${component}`
				: domain

			if (!match) {
				return []
			}

			const lines = fs.readFileSync(uri.fsPath).toString().split('\n')
			const lineIndexOfAction = lines.findIndex((line) => line.includes('<script setup')) + 1
			const target = uri.with({ fragment: `L${lineIndexOfAction + 1},0` })

			return [{
				path: uri.path,
				identifier: identifier?.replaceAll('/', '.'),
				target,
			}]
		})

		log.appendLine(`Collected ${components.length} ${directory}.`)

		context.completions[directory] = components.map((component) => ({
			identifier: component.identifier,
			path: component.path,
			target: component.target,
			generateCompletion: (start?: string) => new CompletionItem({
				label: start ? component.identifier.replace(start, '') : component.identifier,
				description: directory === 'pages' ? 'Hybrid page component' : 'Hybrid layout component',
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

	const completionWatcher = workspace.createFileSystemWatcher(new RelativePattern(`${context.cwd}/${context.hybridly.root}`, '**/*'))
	completionWatcher.onDidChange(updateAllCompletions)
	completionWatcher.onDidCreate(updateAllCompletions)
	completionWatcher.onDidDelete(updateAllCompletions)

	const configWatcher = workspace.createFileSystemWatcher(new RelativePattern(context.cwd, 'hybridly.config.ts'))
	configWatcher.onDidChange(updateConfig)

	const routeWatcher = workspace.createFileSystemWatcher(new RelativePattern(`${context.cwd}/routes`, '**/*.php'))
	routeWatcher.onDidChange(updateRoutes)

	updateAllCompletions()
}
