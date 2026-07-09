import type { App } from 'vue'

// 需要全局引入一些组件，如ElScrollbar，不然一些下拉项样式有问题
// 样式由 vite-plugin-style-import 按需注入，无需手动导入
import { ElLoading, ElScrollbar } from 'element-plus'

const plugins = [ElLoading]

const components = [ElScrollbar]

export const setupElementPlus = (app: App<Element>) => {
  plugins.forEach((plugin) => {
    app.use(plugin)
  })

  components.forEach((component) => {
    app.component(component.name!, component)
  })
}
