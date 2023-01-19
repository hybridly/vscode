import { CompletionItem, CompletionItemKind, Uri, workspace } from 'vscode'
import { getDirectoryPatterns } from '../settings'
import { escapeRegExp } from './regexp'

export async function getCompletions(workspaceUri: Uri, filter?: (pattern: string) => boolean): Promise<CompletionItem[]> {
	filter ??= () => true

	const directories = getDirectoryPatterns()
	const promises = directories.filter(filter).map((pattern) => getCompletionItems(pattern, workspaceUri))
	const completions = await Promise.all(promises)

	return completions.flat()
}

export async function getCompletionItems(pattern: string, workspaceUri: Uri): Promise<CompletionItem[]> {
	const completions: CompletionItem[] = []
	const regexp = new RegExp(escapeRegExp(pattern).replace('\\{domain\\}', '([^\/]*)').replace('\\{page\\}', '([^\.]*)').replace('\\{layout\\}', '([^\.]*)'), 'm')
	const files = await workspace.findFiles({
		base: workspaceUri.toString(),
		baseUri: workspaceUri,
		pattern: pattern
			.replace('{domain}', '*')
			.replace('{page}', '**/*')
			.replace('{layout}', '**/*'),
	})

	completions.push(...files.flatMap((uri) => {
		const [matches, domain, page] = uri.fsPath.match(regexp) || []

		if (!matches) {
			return []
		}

		const label = domain && page
			? `${domain}:${page}`
			: domain

		return [new CompletionItem({
			label: label.replaceAll('/', '.'),
			description: 'Hybrid page component',
		}, CompletionItemKind.Value)]
	}))

	return completions
}
