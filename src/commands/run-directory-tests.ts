/* eslint-disable brace-style */
import { dirname } from 'path'
import { ExtensionContext } from '../context'
import { registerEditorCommand, registerPhpFileCommand } from '../utils/commands'
import { hasPest } from '../utils/composer'
import { runTestsTask } from '../utils/tests'

export async function registerRunDirectoryTestsCommand(context: ExtensionContext) {
	registerPhpFileCommand(context, 'run-directory-tests', async(ctx) => {
		if (!hasPest(context.cwd)) {
			return
		}

		await runTestsTask(context.cwd, dirname(ctx.file.relativePath))
	})
}
