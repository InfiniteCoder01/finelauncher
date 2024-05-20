import { invoke } from '@tauri-apps/api/tauri'
import { BaseDirectory, FileEntry, readDir } from '@tauri-apps/api/fs'

import ModWrapper, { ModsConfig } from './mod'
import { setMods } from '../pages/ModsPage/components/Mod/Mod.interface'
import { IMods } from '../pages/ModsPage/ModsPage.interface'

type installVersion = (
	url: string,
	name: string,
	version: string
) => Promise<never>
type installMod = (
	url: string,
	name: string,
	mod_name: string
) => Promise<never>
type runGame = (version_name: string) => Promise<never>
type terminateGame = (pid: number) => void
type ShowInFolder = (version: string) => void
type checkVersion = (version: string) => Promise<boolean>
type checkMod = (version: string, mod_name: string) => Promise<boolean>
type getLauncherPath = () => Promise<string>
type getInstalledVersions = () => Promise<FileEntry[]>
type getModsByTag = (
	modWrapper: ModWrapper,
	setMods: setMods,
	tag_id: number[]
) => void
type getModsBySearchQuery = (
	modWrapper: ModWrapper,
	setMods: setMods,
	searchQuery: string
) => void

// Устанавливаем версию
export const installVersion: installVersion = async (
	url: string,
	name: string,
	version: string
) => await invoke('download_version', { url, name, version })

// Устанавливаем мод
export const installMod: installMod = async (
	url: string,
	version: string,
	mod_name: string
) => await invoke('download_mod', { url, version, mod_name })

// Запускаем версию
export const runGame: runGame = async (version_name: string) =>
	await invoke('run_game', { version_name })

export const terminateGame: terminateGame = async (pid: number) =>
	await invoke('terminate_game', { pid })

// Открываем папку с версией
export const ShowInFolder: ShowInFolder = async (version: string) =>
	await invoke('show_in_folder', { version })

// Проверяем наличие версии
export const checkVersion: checkVersion = async (version: string) =>
	await invoke('version_exists', { version })

// Проверяем наличие мода
export const checkMod: checkMod = async (version: string, mod_name: string) =>
	await invoke('mod_exists', { version, mod_name })

export const getLauncherPath: getLauncherPath = async () =>
	await invoke('get_launcher_path')

export const getInstalledVersions: getInstalledVersions = async () =>
	await readDir('finelauncher/versions', {
		dir: BaseDirectory.Document,
		recursive: true,
	})

export const getModsByTag: getModsByTag = (
	modWrapper: ModWrapper,
	setMods: setMods,
	tag_id: number[]
) => {
	modWrapper.getMods({ params: { tag_id } }).then(response => {
		console.log(response.data.data)
		setMods(response.data.data)
	})
}

export const getModsBySearchQuery: getModsBySearchQuery = (
	modWrapper: ModWrapper,
	setMods: setMods,
	searchQuery: string
) => {
	console.log(searchQuery)
	let config: ModsConfig = { params: { item_count: 1000 } }
	if (searchQuery !== '') config = { params: { title: searchQuery } }
	modWrapper.getMods(config).then(response => {
		if (response.data.data.content.length) setMods(response.data.data)
		else {
			const error: IMods = {}
			setMods(error)
		}
	})
}