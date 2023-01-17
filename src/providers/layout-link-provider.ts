/* eslint-disable prefer-regex-literals */
import fs from 'node:fs'
import { DocumentLink, DocumentLinkProvider, Position, ProviderResult, Range, TextDocument, Uri, workspace } from 'vscode'
import { LocatedPattern, locateInDocument } from '../utils/locate-in-document'

/**
* Adds hyperlinks to <template layout> definitions.
*/
export class LayoutLinkProvider implements DocumentLinkProvider {
	provideDocumentLinks(document: TextDocument): ProviderResult<DocumentLink[]> {
		// https://regex101.com/r/UdrLZo/1
		const layoutWithArgument = /<template\s*layout=\s*([\'"])(?<layout>.+)(\1)\s*[>]/gm
		// https://regex101.com/r/0aVnrx/2
		const layoutWithoutArgument = /<template\s*(?<layout>layout)\s*[>]/gm

		const components = [
			...locateInDocument(layoutWithArgument, 'layout', document),
			...locateInDocument(layoutWithoutArgument, 'layout', document),
		].flatMap((component) => {
			if (component.value.includes(',')) {
				const layouts = component.value.split(',')
				return layouts.map((value, i) => ({
					value,
					range: new Range(
						new Position(component.range.start.line, component.range.start.character + layouts.slice(0, i).join(',').length + (i === 0 ? 0 : 1)),
						new Position(component.range.start.line, component.range.start.character + layouts.slice(0, i + 1).join(',').length),
					),
				}))
			}

			return [component]
		})

		const workspaceURI = workspace.getWorkspaceFolder(document.uri)?.uri

		if (!workspaceURI) {
			return []
		}

		// TODO: keep configuration DRY hybridly.config.ts
		const getComponentUri = (component: LocatedPattern): Uri => {
			if (component.value.includes(':')) {
				const [domain, page] = component.value.split(':')
				return Uri.joinPath(workspaceURI, `${`resources.domains.${domain}.layouts.${page}`.replaceAll('.', '/')}.vue`)
			}

			if (component.value === 'layout') {
				return Uri.joinPath(workspaceURI, 'resources/views/layouts/default.vue')
			}

			return Uri.joinPath(workspaceURI, `${`resources.views.layouts.${component.value}`.replaceAll('.', '/')}.vue`)
		}

		return components
			.filter((component) => fs.existsSync(getComponentUri(component).fsPath))
			.map((component) => ({
				target: getComponentUri(component),
				range: component.range,
			}))
	}
}
