import type { ExtensionContext } from '../context'
import { registerEditorCommand } from '../utils/commands'
import { hasTestRunner } from '../utils/composer'
import { runTestsTask } from '../utils/tests'

export async function registerRunTestsCommand(context: ExtensionContext) {
	registerEditorCommand(context, 'php.run-tests', async () => {
		if (!hasTestRunner(context.cwd)) {
			return
		}

		await runTestsTask(context.cwd)
	})
}
