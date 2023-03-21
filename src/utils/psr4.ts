import fs from 'node:fs'
import path from 'node:path'
import { Uri } from 'vscode'
import { log } from './log'

interface Autoload {
	'psr-4': Record<string, string>
}

export interface ControllerAction {
	fqcn: string
	file: string
	action: string
	uri: Uri
}

export function getComposerAutoload(workspace: Uri): Autoload {
	// TODO: cache
	const composer = JSON.parse(fs.readFileSync(path.resolve(workspace.fsPath, 'composer.json'), { encoding: 'utf-8' }))

	return composer.autoload
}

export function fqcnToFile(workspace: Uri, fqcn: string): string {
	const autoload = getComposerAutoload(workspace)

	fqcn = fqcn.replaceAll('\\\\', '\\')

	Object.entries(autoload['psr-4']).forEach(([key, value]) => {
		if (fqcn.startsWith(key)) {
			fqcn = fqcn.replace(key, value)
		}
	})

	return `${fqcn.replaceAll('\\', '/')}.php`
}

export function actionToLink(workspace: Uri, action: string): ControllerAction | undefined {
	const [fqcn, actionName = '__invoke'] = action.split('@')
	const file = fqcnToFile(workspace, fqcn)
	const uri = Uri.joinPath(workspace, file)

	if (!fs.existsSync(uri.fsPath)) {
		log.appendLine(`Could not find controller: ${uri.fsPath}`)
		return
	}

	const lines = fs.readFileSync(uri.fsPath).toString().split('\n')
	const lineIndexOfAction = lines.findIndex((line) => line.includes(`function ${actionName}`)) + 1
	const column = (lines.at(lineIndexOfAction)?.length ?? 0)

	return {
		fqcn,
		file,
		action: actionName,
		uri: uri.with({
			fragment: `L${lineIndexOfAction + 1},${column + 1}`,
		}),
	}
}
