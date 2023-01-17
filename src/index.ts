import path from 'node:path'
import fs from 'node:fs'
import { ExtensionContext, languages, workspace } from 'vscode'
import { version } from '../package.json'
import { ComponentLinkProvider } from './providers/component-link-provider'
import { LayoutLinkProvider } from './providers/layout-link-provider'
import { RouteLinkProvider } from './providers/route-link-provider'
import { log } from './utils/log'

export async function activate(context: ExtensionContext) {
	log.appendLine(`Hybridly for Code v${version}\n`)

	const projectPath = workspace.workspaceFolders?.[0].uri.fsPath
	if (!projectPath) {
		log.appendLine('No active workspace found.')
		return
	}

	const config = workspace.getConfiguration('hybridly')
	const disabled = config.get<boolean>('disable', false)
	if (disabled) {
		log.appendLine('Disabled by configuration.')
		return
	}

	const root = config.get<string>('root')
	const cwd = root ? path.resolve(projectPath, root) : projectPath
	const pkg = JSON.parse(fs.readFileSync(path.resolve(cwd, 'package.json'), { encoding: 'utf-8' }))
	const deps = { ...pkg.dependencies, ...pkg.devDependencies }

	if (!deps.hybridly) {
		log.appendLine('Hybridly was not found in `package.json`.')
		return
	}

	log.appendLine('Activation checks passed.')

	context.subscriptions.push(languages.registerDocumentLinkProvider(
		{ scheme: 'file', language: 'php', pattern: '**/*.php' },
		new ComponentLinkProvider(),
	))

	context.subscriptions.push(languages.registerDocumentLinkProvider(
		{ scheme: 'file', language: 'vue', pattern: '**/*.vue' },
		new LayoutLinkProvider(),
	))

	context.subscriptions.push(languages.registerDocumentLinkProvider(
		[
			{ scheme: 'file', language: 'php', pattern: '**/*.php' },
			{ scheme: 'file', language: 'vue', pattern: '**/*.vue' },
			{ scheme: 'file', language: 'ts', pattern: '**/*.ts' },
		],
		new RouteLinkProvider(),
	))
}

export function deactivate() {
	log.appendLine('Disabled.')
}
