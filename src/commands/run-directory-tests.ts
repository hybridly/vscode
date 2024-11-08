import { dirname } from 'node:path'
import type { ExtensionContext } from '../context'
import { registerPhpFileCommand } from '../utils/commands'
import { hasTestRunner } from '../utils/composer'
import { runTestsTask } from '../utils/tests'

export async function registerRunDirectoryTestsCommand(context: ExtensionContext) {
	registerPhpFileCommand(context, 'run-directory-tests', async (ctx) => {
		if (!hasTestRunner(context.cwd)) {
			return
		}

		await runTestsTask(context.cwd, dirname(ctx.file.fullPath))
	})
}
