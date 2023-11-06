import { CompletionItemProvider, languages, Range } from 'vscode'
import { HybridlyContext } from '../context'
import { log } from '../utils/log'
import { escapeRegExp } from '../utils/regexp'
import { getSetting } from '../settings'

export async function registerPageAutocomplete(context: HybridlyContext) {
	log.appendLine('Registering page autocomplete provider.')

	const methods = getSetting<string[]>('componentMethods')
	const regexp = new RegExp(`(?:${methods.map(escapeRegExp).join('|')})\\(\\s*(?:.+\:)?\\s*([\\'"])(?<component>.+)?(?:(\\1)\\s*[\\),])?`)
	const provider: CompletionItemProvider = {
		async provideCompletionItems(document, position) {
			const lineContentUpToCursor = document.getText(new Range(position.line - 1, 0, position.line, position.character))
			const [match,, word] = lineContentUpToCursor.match(regexp) || []

			if (!match) {
				return
			}

			return context.completions.views.flatMap((view) => {
				if (!word) {
					return view.generateCompletion()
				}

				if (view.identifier.startsWith(word)) {
					return view.generateCompletion(word)
				}

				return []
			})
		},
	}

	context.extension.subscriptions.push(languages.registerCompletionItemProvider(
		{ scheme: 'file', language: 'php', pattern: '**/*.php' },
		provider,
		...["'", '"', '.', ':'],
	))
}
