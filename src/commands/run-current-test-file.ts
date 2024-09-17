import type { ExtensionContext } from '../context'
import { registerPhpFileCommand } from '../utils/commands'
import { hasPest } from '../utils/composer'
import { runTestsTask } from '../utils/tests'

export async function registerRunCurrentTestFileCommand(context: ExtensionContext) {
	registerPhpFileCommand(context, 'run-current-test-file', async ({ editor }) => {
		if (!hasPest(context.cwd)) {
			return
		}

		await runTestsTask(context.cwd, editor.document.fileName)
	})
}
