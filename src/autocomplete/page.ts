import { CompletionItemProvider, languages, Range } from 'vscode'
import { Context } from '../context'
import { getComponentMethods } from '../settings'
import { log } from '../utils/log'
import { escapeRegExp } from '../utils/regexp'

export async function registerPageAutocomplete(context: Context) {
	log.appendLine('Registering page autocomplete provider.')

	const methods = getComponentMethods()
	const regexp = new RegExp(`(?:${methods.map(escapeRegExp).join('|')})\\(\\s*([\\'"])(?<component>.+)?(?:(\\1)\\s*[\\),])?`)
	const provider: CompletionItemProvider = {
		async provideCompletionItems(document, position) {
			const lineContentUpToCursor = document.getText(new Range(position.line - 1, 0, position.line, position.character))
			const [match,, word] = lineContentUpToCursor.match(regexp) || []

			if (!match) {
				return
			}

			return context.completions.pages.flatMap((page) => {
				if (!word) {
					return page.generateCompletion()
				}

				if (page.identifier.startsWith(word)) {
					return page.generateCompletion(word)
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
