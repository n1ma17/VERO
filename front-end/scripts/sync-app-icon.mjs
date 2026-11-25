import { copyFileSync, existsSync, unlinkSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = resolve(root, 'src/assets/icon.png')
const web = resolve(root, 'public/icon.png')
const capacitor = resolve(root, 'assets/icon.png')
const stale = resolve(root, 'assets/icon-only.png')

copyFileSync(source, web)
copyFileSync(source, capacitor)

// Custom-mode asset wins over assets/icon.png; remove stale file so icon.png is used.
if (existsSync(stale)) unlinkSync(stale)

console.log('Synced src/assets/icon.png → public/icon.png, assets/icon.png')