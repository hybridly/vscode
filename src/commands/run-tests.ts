/* eslint-disable brace-style */
import { ExtensionContext } from '../context'
import { registerCommand } from '../utils/commands'
import { hasPest } from '../utils/composer'
import { runTestsTask } from '../utils/tests'

export async function registerRunTestsCommand(context: ExtensionContext) {
	registerCommand(context, 'run-tests', async() => {
		if (!hasPest(context.cwd)) {
			return
		}

		await runTestsTask(context.cwd)
	})
}
