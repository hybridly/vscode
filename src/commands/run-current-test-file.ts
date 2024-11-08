import type { ExtensionContext } from '../context'
import { registerPhpFileCommand } from '../utils/commands'
import { hasTestRunner } from '../utils/composer'
import { runTestsTask } from '../utils/tests'

export async function registerRunCurrentTestFileCommand(context: ExtensionContext) {
	registerPhpFileCommand(context, 'run-current-test-file', async ({ editor }) => {
		if (!hasTestRunner(context.cwd)) {
			return
		}

		await runTestsTask(context.cwd, editor.document.fileName)
	})
}
