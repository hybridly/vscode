/* eslint-disable prefer-regex-literals */
import fs from 'node:fs'
import { execSync } from 'node:child_process'
import { DocumentLink, DocumentLinkProvider, ProviderResult, TextDocument, Uri, workspace } from 'vscode'
import { LocatedPattern, locateInDocument } from '../utils/locate-in-document'

/**
* Adds hyperlinks to `route()` calls.
*/
export class RouteLinkProvider implements DocumentLinkProvider {
	provideDocumentLinks(document: TextDocument): ProviderResult<DocumentLink[]> {
		// https://regex101.com/r/cfX43R/1
		const route = /route\(\s*([\'"])(?<route>.+)(\1)\s*[\),]/gmd

		const components = [
			...locateInDocument(route, 'route', document),
		]

		const workspaceURI = workspace.getWorkspaceFolder(document.uri)?.uri

		if (!workspaceURI) {
			return []
		}

		const routes = JSON.parse(execSync('php artisan route:list --json', { cwd: workspaceURI.fsPath }).toString()) as Array<{
			domain?: string
			method: string
			uri: string
			name: string
			action: string
			middleware: string[]
		}>

		// TODO: keep configuration DRY hybridly.config.ts
		const getControllerUri = (routeName: LocatedPattern): Uri | undefined => {
			const route = routes.find((route) => route.name === routeName.value)
			// replace a PHP PSR-4 namespace to a filesystem path
			const path = route?.action
				.replace(/\\/, '/')
				.replace(/App/, 'app')
				.replace(/@.*/, '')
				.replaceAll('\\', '/')

			const action = route?.action.split('@')?.at(1) ?? '__invoke'
			const uri = Uri.joinPath(workspaceURI, `${path}.php`)

			if (!fs.existsSync(uri.fsPath)) {
				return
			}

			// pls pardon me
			const lineIndexOfAction = fs.readFileSync(uri.fsPath)
				.toString()
				.split('\n')
				.findIndex((line) => line.includes(`function ${action}`)) + 1

			return uri.with({
				fragment: `L${lineIndexOfAction}`,
			})
		}

		return components
			.filter((component) => getControllerUri(component))
			.map((component) => ({
				target: getControllerUri(component),
				range: component.range,
			}))
	}
}
