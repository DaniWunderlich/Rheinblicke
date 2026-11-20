import { cpSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

const cesiumAssets = ['Assets', 'ThirdParty', 'Widgets', 'Workers']

export default defineConfig({
  base: './',
  plugins: [{
    name: 'cesium-static-assets',
    buildStart() {
      for (const name of cesiumAssets) {
        cpSync(resolve('node_modules/cesium/Build/Cesium', name), resolve('public/cesium', name), {
          recursive: true,
        })
      }
    },
  }],
})
