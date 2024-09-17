import type { CompletionItemProvider } from 'vscode'
import { Range, languages } from 'vscode'
import type { HybridlyContext } from '../context'
import { log } from '../utils/log'

export async function registerLayoutAutocomplete(context: HybridlyContext) {
	log.appendLine('Registering layout autocomplete provider.')

	const regexp = /<template\s+layout=(['"])(?<layout>.+)?/
	const provider: CompletionItemProvider = {
		async provideCompletionItems(document, position) {
			const lineContentUpToCursor = document.getText(new Range(position.line - 1, 0, position.line, position.character))
			const [match,, word] = lineContentUpToCursor.match(regexp) || []

			if (!match) {
				return
			}

			return context.completions.layouts.flatMap((layout) => {
				if (!word) {
					return layout.generateCompletion()
				}

				if (layout.identifier.startsWith(word)) {
					return layout.generateCompletion(word)
				}

				return []
			})
		},
	}

	context.extension.subscriptions.push(languages.registerCompletionItemProvider(
		{ scheme: 'file', language: 'vue', pattern: '**/*.vue' },
		provider,
		...["'", '"', '=', '="', '=""'],
	))
}
