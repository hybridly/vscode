import type { ExtensionContext } from '../context'
import { registerEditorCommand } from '../utils/commands'
import { runPreviousTestTask } from '../utils/tests'

export async function registerRunPreviousTestCommand(context: ExtensionContext) {
	registerEditorCommand(context, 'run-previous-tests', async () => {
		await runPreviousTestTask()
	})
}
