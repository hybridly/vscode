import fs from 'node:fs'
import path from 'node:path'
import { window } from 'vscode'
import { log } from './log'

let hasLoggedPest = false
const caches = new Map<string, any>()

export function getComposer(cwd: string) {
	const key = `composer_${cwd}`
	if (!caches.has(key)) {
		caches.set(key, JSON.parse(fs.readFileSync(path.resolve(cwd, 'composer.json'), { encoding: 'utf-8' })))
	}

	return caches.get(key)
}

export function hasComposerPackage(cwd: string, pkg: string): boolean {
	return !!getComposer(cwd)?.require?.[pkg] || !!getComposer(cwd)?.['require-dev']?.[pkg]
}

export function hasPest(cwd: string) {
	if (!hasComposerPackage(cwd, 'pestphp/pest')) {
		if (!hasLoggedPest) {
			log.appendLine('Pest was not found in `composer.json`.')
			window.showErrorMessage('Pest is not installed in this project.')
			hasLoggedPest = true
		}

		return false
	}

	return true
}
