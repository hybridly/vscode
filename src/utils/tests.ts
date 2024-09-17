import path from 'node:path'
import { ShellExecution, Task, TaskScope, commands, tasks, window } from 'vscode'
import { getSetting } from '../settings'

interface LatestTestContext {
	cwd: string
	args: string
}

let latestTestContext: LatestTestContext | undefined

export async function runPreviousTestTask() {
	if (!latestTestContext) {
		window.showInformationMessage('No tests were previously ran during this session.')
		return
	}

	return await runTestsTask(latestTestContext.cwd, latestTestContext.args)
}

export async function runTestsTask(cwd: string, args: string = '') {
	const testDirectory = getSetting('test.directory')
	const retries = getSetting('test.retry')
	const bail = getSetting('test.bail')

	if (testDirectory && !args.includes('--test-directory')) {
		args += ` --test-directory=${testDirectory} ${args}`
	}

	if (retries && !args.includes('--retry')) {
		args += ' --retry'
	}

	if (bail && !args.includes('--bail')) {
		args += ' --bail'
	}

	const binaryName = process.platform === 'win32' ? 'pest.bat' : 'pest'
	const binaryPath = path.join(cwd, 'vendor', 'bin', binaryName)
	const command = `${binaryPath} ${args}`

	await commands.executeCommand('workbench.action.terminal.clear')
	await tasks.executeTask(new Task({ type: 'tests' }, TaskScope.Workspace, 'run tests', 'Hybridly', new ShellExecution(command), '$pest'))

	latestTestContext = {
		cwd,
		args,
	}
}
