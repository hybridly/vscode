/* eslint-disable prefer-regex-literals */
import { DocumentLink, DocumentLinkProvider, ProviderResult, TextDocument, Uri, workspace } from 'vscode'
import { locateInDocument } from '../utils/locate-in-document'

/**
* Inertia Component Link Provider
*
* This definition provider adds hyperlinks to component names when using
* Route::inertia() and Inertia::render method calls.
*/
export class ComponentLinkProvider implements DocumentLinkProvider {
	provideDocumentLinks(document: TextDocument): ProviderResult<DocumentLink[]> {
		// https://regex101.com/r/ohd4WC/1
		const hybridly = /hybridly\(\s*([\'"])(?<component>.+)(\1)\s*[\),]/gm
		const hybridlyView = /hybridly\(\)->view\(\s*([\'"])(?<component>.+)(\1)\s*[\),]/gm

		const components = [
			...locateInDocument(hybridly, 'component', document),
			...locateInDocument(hybridlyView, 'component', document),
		]

		const workspaceURI = workspace.getWorkspaceFolder(document.uri)?.uri
		if (!workspaceURI) {
			return []
		}

		const pagesFolder = workspace
			.getConfiguration('hybridly')
			.get('pages', 'resources/views/pages')

		return components.map((component) => {
			return {
				target: Uri.joinPath(
					workspaceURI,
					pagesFolder,
					`${component.value.replace('.', '/')}.vue`,
				),
				range: component.range,
			} as DocumentLink
		})
	}
}
