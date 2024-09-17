import type { TextEditor } from 'vscode'
import { getSetting } from '../settings'
import type { PhpFile } from './psr4'
import classStub from './stubs/class.txt'
import enumStub from './stubs/enum.txt'
import interfaceStub from './stubs/interface.txt'
import traitStub from './stubs/trait.txt'
import invokableClassStub from './stubs/invokable-class.txt'

export type ClassType = 'class' | 'invokable-class' | 'enum' | 'interface' | 'trait'
export interface PreludeOptions {
	final?: boolean
	strictTypes?: boolean
	newLine?: boolean
}

export function generatePhpClass(editor: TextEditor, file: PhpFile, type: ClassType) {
	const prelude = generatePhpPrelude(editor, file, { strictTypes: true, newLine: true })
	const stub = {
		'class': classStub,
		'enum': enumStub,
		'interface': interfaceStub,
		'trait': traitStub,
		'invokable-class': invokableClassStub,
	}[type]
		.replaceAll('{name}', file.className)
		.replaceAll('{final}', getSetting<boolean>('generation.final') ? 'final ' : '')

	return `${prelude}${stub}`
}

export function generatePhpPrelude(editor: TextEditor, file: PhpFile, options: PreludeOptions = {}) {
	const eol = editor.document.eol === 1 ? '\n' : '\r\n'
	const strictTypes = options?.strictTypes && getSetting<boolean>('generation.strictTypes')
		? `${eol}declare(strict_types=1);${eol}`
		: ''

	return `<?php${eol}${strictTypes}${eol}namespace ${file.fqcn};${eol}${options?.newLine ? eol : ''}`
}
