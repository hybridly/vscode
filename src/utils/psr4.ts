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

export interface PhpFile {
	relativePath: string
	fileName: string
	className: string
	rootPsr4Namespace: string
	fqcn: string
}

export function getComposerAutoloadPsr4(workspace: Uri): Autoload['psr-4'] {
	// TODO: cache
	const composer = JSON.parse(fs.readFileSync(path.resolve(workspace.fsPath, 'composer.json'), { encoding: 'utf-8' }))

	return { ...composer?.autoload?.['psr-4'] ?? {}, ...composer?.['autoload-dev']?.['psr-4'] ?? {} }
}

export function resolvePhpFile(workspace: Uri, file: Uri): PhpFile | undefined {
	log.appendLine(`Resolving ${file.fsPath}`)
	const psr4 = getComposerAutoloadPsr4(workspace)

	const relativePath = path.relative(workspace.fsPath, file.fsPath)
	const pathParts = relativePath.split(path.sep)
	const namespaceParts = pathParts.slice(0, -1)
	const fileName = pathParts.slice(-1)[0]
	const className = fileName.split('.')[0]
	const pathInferredNamespace = namespaceParts.join('\\')

	const rootNamespace = Object.entries(psr4)
		.find(([_, value]) => relativePath.startsWith(value))
		?.flat(1)

	if (!rootNamespace) {
		log.appendLine(`No root namespace found for ${file.fsPath}`)
		return
	}

	const normalizeNamespace = (namespace: string) => namespace
		.replaceAll('/', '\\')
		.replace(/\\$/, '')
		.replaceAll('\\\\', '\\')

	const rootPsr4Namespace = rootNamespace[0]
	const normalizedNamespacePath = normalizeNamespace(rootNamespace[1])
	const fqcn = normalizeNamespace(pathInferredNamespace.replace(normalizedNamespacePath, rootPsr4Namespace))

	log.appendLine(JSON.stringify({
		psr4,
		relativePath,
		pathParts,
		namespaceParts,
		fileName,
		className,
		rootNamespace,
		pathInferredNamespace,
		rootPsr4Namespace,
		normalizedNamespacePath,
		fqcn,
	}, null, 2))

	return {
		relativePath,
		fileName,
		className,
		rootPsr4Namespace,
		fqcn,
	}
}

export function fqcnToFile(workspace: Uri, fqcn: string): string {
	const psr4 = getComposerAutoloadPsr4(workspace)

	fqcn = fqcn.replaceAll('\\\\', '\\')

	Object.entries(psr4).forEach(([key, value]) => {
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
		// TODO: chances are this is a vendor controller
		// log.appendLine(`Could not find controller: ${uri.fsPath} [${fqcn}]`)
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
