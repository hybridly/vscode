import path from 'node:path'
import { ShellExecution, Task, TaskScope, commands, tasks } from 'vscode'

export async function runTestsTask(cwd: string, args: string = '') {
	const binaryName = process.platform === 'win32' ? 'pest.bat' : 'pest'
	const binaryPath = path.join(cwd, 'vendor', 'bin', binaryName)
	const command = `${binaryPath} ${args}`

	await commands.executeCommand('workbench.action.terminal.clear')
	await tasks.executeTask(new Task({ type: 'tests' }, TaskScope.Workspace, 'run tests', 'Hybridly', new ShellExecution(command), '$pest'))
}
