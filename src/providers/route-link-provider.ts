/* eslint-disable prefer-regex-literals */
import { execSync } from 'node:child_process'
import { DocumentLink, DocumentLinkProvider, ProviderResult, TextDocument, Uri, workspace } from 'vscode'
import { getRouteMethods } from '../settings'
import { LocatedPattern, locateInDocument } from '../utils/locate-in-document'
import { log } from '../utils/log'
import { actionToLink } from '../utils/psr4'
import { escapeRegExp } from '../utils/regexp'

/**
* Adds hyperlinks to `route()` calls.
*/
export class RouteLinkProvider implements DocumentLinkProvider {
	provideDocumentLinks(document: TextDocument): ProviderResult<DocumentLink[]> {
		const methods = getRouteMethods()

		// https://regex101.com/r/A6TgMf/1
		const links = methods.flatMap((method) => locateInDocument(
			new RegExp(`${escapeRegExp(method)}\\(\\s*([\\'"])(?<route>[^)]+)(\\1\\s*[\\),])`, 'gmd'),
			'route',
			document,
		))

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
				return
			}

			return actionToLink(workspaceUri!, route!.action)?.uri
		}

		return links
			.filter((component) => getControllerUri(component))
			.map((component) => ({
				target: getControllerUri(component),
				range: component.range,
			}))
	}
}
