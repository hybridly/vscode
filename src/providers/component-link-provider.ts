/* eslint-disable prefer-regex-literals */
import fs from 'node:fs'
import { DocumentLink, DocumentLinkProvider, ProviderResult, TextDocument, Uri, workspace } from 'vscode'
import { LocatedPattern, locateInDocument } from '../utils/locate-in-document'
import { escapeRegExp } from '../utils/regexp'

/**
* Adds hyperlinks to `hybridly()` and `hybridly()->view()` calls.
*/
export class ComponentLinkProvider implements DocumentLinkProvider {
	provideDocumentLinks(document: TextDocument): ProviderResult<DocumentLink[]> {
		const methods = [
			'hybridly',
			'hybridly()->view',
			'assertHybridView',
			...workspace.getConfiguration('hybridly').get<string[]>('componentMethods', []),
		]

		// https://regex101.com/r/7PbMO2/1
		// https://regex101.com/r/9yvy9C/1
		const links = methods.flatMap((method) => locateInDocument(
			new RegExp(`${escapeRegExp(method)}\\(\\s*([\\'"])(?<component>.+)(\\1)\s*[\\),]`, 'gmd'),
			'component',
			document,
		))

		const workspaceURI = workspace.getWorkspaceFolder(document.uri)?.uri

		if (!workspaceURI) {
			return []
		}

		// TODO: keep configuration DRY hybridly.config.ts
		const getComponentUri = (component: LocatedPattern): Uri => {
			if (component.value.includes(':')) {
				const [domain, page] = component.value.split(':')
				return Uri.joinPath(workspaceURI, `${`resources.domains.${domain}.pages.${page}`.replaceAll('.', '/')}.vue`)
			}

			return Uri.joinPath(workspaceURI, `${`resources.views.pages.${component.value}`.replaceAll('.', '/')}.vue`)
		}

		return links
			.filter((component) => fs.existsSync(getComponentUri(component).fsPath))
			.map((component) => ({
				target: getComponentUri(component),
				range: component.range,
			}))
	}
}
