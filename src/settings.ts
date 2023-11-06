import { workspace } from 'vscode'
import { contributes } from '../package.json'

type SettingName = Replace<keyof typeof contributes.configuration.properties, 'hybridly.', ''>
type Replace<Original extends string, Pattern extends string, Replacement extends string> = Original extends `${infer Prefix}${Pattern}${infer Suffix}`
	? `${Prefix}${Replacement}${Suffix}`
	: Original

export function getSetting<ReturnType = string>(setting: SettingName): ReturnType {
	return workspace.getConfiguration('hybridly').get(setting) as ReturnType
}

export function getPhpPath(): string {
	return workspace.getConfiguration('php.validate').get<string>('executablePath')
		?? workspace.getConfiguration('hybridly.php').get<string>('executablePath')
		?? process.env.PHP_EXECUTABLE_PATH
		?? 'php'
}
