import {
	CompletionItem,
	CompletionItemProvider,
	CompletionList,
	Position,
	ProviderResult,
	Range,
	TextDocument,
	workspace,
} from 'vscode'
import { getComponentMethods } from '../settings'
import { getCompletions } from '../utils/completions'
import { escapeRegExp } from '../utils/regexp'

export class ComponentAutocompletionProvider implements CompletionItemProvider {
	provideCompletionItems(document: TextDocument, position: Position): ProviderResult<CompletionItem[] | CompletionList<CompletionItem>> {
		const lineContentUpToCursor = document.getText(new Range(position.line - 1, 0, position.line, position.character))
		const methods = getComponentMethods()

		// https://regex101.com/r/7PbMO2/1
		if (!methods.some((method) => new RegExp(`${escapeRegExp(method)}\\([\\s\\s]*["']$`).test(lineContentUpToCursor))) {
			return
		}

		const workspaceUri = workspace.getWorkspaceFolder(document.uri)?.uri
		if (!workspaceUri) {
			return
		}

		return getCompletions(workspaceUri, (glob) => !glob.includes('layout'))
	}
}
