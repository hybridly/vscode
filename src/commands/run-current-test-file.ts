/* eslint-disable brace-style */
import { ExtensionContext } from '../context'
import { registerCommand } from '../utils/commands'
import { hasPest } from '../utils/composer'
import { runTestsTask } from '../utils/tests'

export async function registerRunCurrentTestFileCommand(context: ExtensionContext) {
	registerCommand(context, 'run-current-test-file', async({ editor }) => {
		if (!hasPest(context.cwd)) {
			return
		}

		await runTestsTask(context.cwd, editor.document.fileName)
	})
}
