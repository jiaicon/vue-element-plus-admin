import { resolve } from 'path'
import { defineConfig, loadEnv } from 'vite'
import type { UserConfig, ConfigEnv } from 'vite'
import Vue from '@vitejs/plugin-vue'
import VueJsx from '@vitejs/plugin-vue-jsx'
import { ViteEjsPlugin } from 'vite-plugin-ejs'
import { viteMockServe } from 'vite-plugin-mock'
import ServerUrlCopy from 'vite-plugin-url-copy'
import VueI18nPlugin from '@intlify/unplugin-vue-i18n/vite'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import UnoCSS from 'unocss/vite'
import { visualizer } from 'rollup-plugin-visualizer'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// https://vitejs.dev/config/
const root = process.cwd()

function pathResolve(dir: string) {
  return resolve(root, '.', dir)
}

export default defineConfig(({ command, mode }: ConfigEnv): UserConfig => {
  let env = {} as any
  const isBuild = command === 'build'
  if (!isBuild) {
    env = loadEnv(process.argv[3] === '--mode' ? process.argv[4] : process.argv[3], root)
  } else {
    env = loadEnv(mode, root)
  }
  return {
    base: env.VITE_BASE_PATH,
    plugins: [
      Vue(),
      VueJsx(),
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia', '@vueuse/core'],
        resolvers: [ElementPlusResolver()],
        dts: 'types/auto-imports.d.ts'
      }),
      Components({
        resolvers: [ElementPlusResolver()],
        dts: 'types/components.d.ts'
      }),
      ServerUrlCopy(),
      VueI18nPlugin({
        runtimeOnly: true,
        compositionOnly: true,
        include: [resolve(__dirname, 'src/locales/**')]
      }),
      createSvgIconsPlugin({
        iconDirs: [pathResolve('src/assets/svgs')],
        symbolId: 'icon-[dir]-[name]',
        svgoOptions: true
      }),
      env.VITE_USE_MOCK === 'true'
        ? viteMockServe({
            ignore: /^\_/,
            mockPath: 'mock',
            enable: !isBuild
          })
        : undefined,
      ViteEjsPlugin({
        title: env.VITE_APP_TITLE
      }),
      UnoCSS(),
      env.VITE_USE_BUNDLE_ANALYZER === 'true'
        ? visualizer({
            open: true,
            gzipSize: true,
            brotliSize: true,
            filename: 'stats.html'
          })
        : undefined
    ].filter(Boolean),

    css: {
      preprocessorOptions: {
        less: {
          additionalData: '@import "./src/styles/variables.less";',
          javascriptEnabled: true
        }
      }
    },
    resolve: {
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.less', '.css'],
      alias: [
        {
          find: /\@\//,
          replacement: `${pathResolve('src')}/`
        }
      ]
    },
    build: {
      minify: 'oxc',
      outDir: env.VITE_OUT_DIR || 'dist',
      sourcemap: env.VITE_SOURCEMAP === 'true',
      terserOptions: {
        compress: {
          drop_console: env.VITE_DROP_CONSOLE === 'true',
          drop_debugger: env.VITE_DROP_DEBUGGER === 'true'
        }
      },
      // brotliSize: false,
      rolldownOptions: {
        // 拆包
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'vue-chunks',
                test: /node_modules\/(vue|vue-router|pinia|vue-i18n)\//
              },
              {
                name: 'element-plus',
                test: /node_modules\/element-plus\//
              },
              {
                name: 'echarts',
                test: /node_modules\/(echarts|zrender|echarts-wordcloud)\//
              },
              {
                name: 'wang-editor',
                test: /node_modules\/@wangeditor\//
              },
              {
                name: 'monaco-editor',
                test: /node_modules\/monaco-editor\//
              },
              {
                name: 'vendor',
                test: /node_modules\//
              }
            ]
          }
        }
      },
      cssCodeSplit: env.VITE_USE_CSS_SPLIT !== 'false',
      cssTarget: 'chrome90'
    },
    server: {
      port: 4000,
      proxy: {
        // 选项写法
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        }
      },
      hmr: {
        overlay: false
      },
      host: '0.0.0.0'
    },
    optimizeDeps: {
      include: [
        'element-plus/es/locale/lang/zh-cn',
        'element-plus/es/locale/lang/en',
        '@iconify/iconify',
        'qs',
        'echarts',
        'echarts-wordcloud',
        'qrcode',
        '@wangeditor/editor',
        '@wangeditor/editor-for-vue',
        'vue-json-pretty',
        '@zxcvbn-ts/core',
        'cropperjs'
      ]
    }
  }
})
