import type { ExtensionContext } from '../context'
import { registerEditorCommand } from '../utils/commands'
import { hasPest } from '../utils/composer'
import { runTestsTask } from '../utils/tests'

export async function registerRunTestsCommand(context: ExtensionContext) {
	registerEditorCommand(context, 'php.run-tests', async () => {
		if (!hasPest(context.cwd)) {
			return
		}

		await runTestsTask(context.cwd)
	})
}
