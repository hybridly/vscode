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
import { getCompletions } from '../utils/completions'

export class LayoutAutocompletionProvider implements CompletionItemProvider {
	provideCompletionItems(document: TextDocument, position: Position): ProviderResult<CompletionItem[] | CompletionList<CompletionItem>> {
		const lineContentUpToCursor = document.getText(new Range(position.line - 1, 0, position.line, position.character))

		if (!/<template\s+layout=\s*(['"])?\S*$/.test(lineContentUpToCursor)) {
			return
		}

		const workspaceUri = workspace.getWorkspaceFolder(document.uri)?.uri
		if (!workspaceUri) {
			return
		}

		return getCompletions(workspaceUri, (glob) => glob.includes('layout'))
	}
}
