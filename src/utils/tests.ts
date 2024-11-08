import path from 'node:path'
import { ShellExecution, Task, TaskScope, commands, tasks, window } from 'vscode'
import { getSetting } from '../settings'
import { getTestRunner } from './composer'

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
	const settingArgs = getSetting('test.arguments')
	const testRunner = getTestRunner(cwd)

	if (testRunner === 'pest') {
		if (testDirectory && !args.includes('--test-directory')) {
			args += ` --test-directory=${testDirectory} ${args}`
		}

		if (retries && !args.includes('--retry')) {
			args += ' --retry'
		}

		if (bail && !args.includes('--bail')) {
			args += ' --bail'
		}
	}

	if (settingArgs) {
		args += ` ${settingArgs}`
	}

	const binaryName = `${testRunner}${process.platform === 'win32' ? '.bat' : ''}`
	const binaryPath = path.join(cwd, 'vendor', 'bin', binaryName)
	const command = `${binaryPath} ${args}`

	await commands.executeCommand('workbench.action.terminal.clear')
	await tasks.executeTask(new Task({ type: 'tests' }, TaskScope.Workspace, 'run tests', 'Hybridly', new ShellExecution(command), '$pest'))

	latestTestContext = {
		cwd,
		args,
	}
}
