/* eslint-disable prefer-regex-literals */
import { execSync } from 'node:child_process'
import { DocumentLink, DocumentLinkProvider, ProviderResult, TextDocument, Uri, workspace } from 'vscode'
import { LocatedPattern, locateInDocument } from '../utils/locate-in-document'
import { log } from '../utils/log'
import { actionToLink } from '../utils/psr4'

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

		const workspaceUri = workspace.getWorkspaceFolder(document.uri)?.uri

		if (!workspaceUri) {
			return []
		}

		const cwd = workspaceUri.fsPath
		const routes = JSON.parse(execSync('php artisan route:list --json', { cwd }).toString()) as Array<{
			domain?: string
			method: string
			uri: string
			name: string
			action: string
			middleware: string[]
		}>

		function getControllerUri(routeName: LocatedPattern): Uri | undefined {
			const route = routes.find((route) => route.name === routeName.value)

			if (!route) {
				log.appendLine(`Could not find route: ${route}`)
			}

			return actionToLink(workspaceUri!, route!.action)?.uri
		}

		return components
			.filter((component) => getControllerUri(component))
			.map((component) => ({
				target: getControllerUri(component),
				range: component.range,
			}))
	}
}
