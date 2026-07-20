<script setup lang="ts">
import { computed } from 'vue'
import { ElDropdown, ElDropdownMenu, ElDropdownItem } from 'element-plus'
import { usePermissionStore } from '@/store/modules/permission'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from '@/hooks/web/useI18n'
import { Icon } from '@/components/Icon'
import { isUrl } from '@/utils/is'
import { hasOneShowingChild } from '@/components/Menu/src/helper'
import { pathResolve } from '@/utils/routerHelper'
import { useDesign } from '@/hooks/web/useDesign'

const { getPrefixCls } = useDesign()
const prefixCls = getPrefixCls('top-main-menu')

const permissionStore = usePermissionStore()
const router = useRouter()
const currentRoute = useRoute()
const { t } = useI18n()

// 与 renderTop 一致：使用 getRouters（constantRouterMap 中全是 hidden，过滤后只剩动态路由）
const routers = computed(() => permissionStore.getRouters)

// 获取一级路由（过滤 hidden）
const firstLevelRoutes = computed(() => {
  return routers.value.filter((v) => !v.meta?.hidden)
})

// 根据当前路由确定激活的一级菜单
const activeFirstLevel = computed(() => {
  const path = currentRoute.path
  const activeMenu = currentRoute.meta?.activeMenu as string | undefined
  const targetPath = activeMenu || path

  for (const route of firstLevelRoutes.value) {
    if (targetPath.startsWith(route.path)) {
      return route.path
    }
  }
  return ''
})

// 获取指定一级路由的二级子路由（与 Menu 组件的 useRenderMenuItem 逻辑一致）
const getChildrenRoutes = (parent: AppRouteRecordRaw): AppRouteRecordRaw[] => {
  if (!parent.children) return []
  return parent.children.filter((v) => !v.meta?.hidden)
}

// 判断一级路由是否应展示为下拉菜单（与 useRenderMenuItem 一致：
// 单子且非 alwaysShow 时折叠为直接跳转项，不显示下拉）
const shouldShowDropdown = (route: AppRouteRecordRaw): boolean => {
  const { oneShowingChild } = hasOneShowingChild(route.children, route)
  return !oneShowingChild || !!route.meta?.alwaysShow
}

// 获取单子路由的目标路径（折叠时直接跳转到唯一子路由的完整路径）
const getSingleChildPath = (route: AppRouteRecordRaw): string => {
  const { onlyOneChild } = hasOneShowingChild(route.children, route)
  if (onlyOneChild && !onlyOneChild.noShowingChildren) {
    return isUrl(onlyOneChild.path) ? onlyOneChild.path : pathResolve(route.path, onlyOneChild.path)
  }
  return route.path
}

// 获取用于显示的 meta（与 useRenderMenuItem 一致：单子折叠时用子路由的 meta）
const getDisplayMeta = (route: AppRouteRecordRaw) => {
  const { oneShowingChild, onlyOneChild } = hasOneShowingChild(route.children, route)
  if (
    oneShowingChild &&
    onlyOneChild &&
    !onlyOneChild.noShowingChildren &&
    !route.meta?.alwaysShow
  ) {
    return onlyOneChild.meta ?? {}
  }
  return route.meta ?? {}
}

// 获取子路由的完整路径
const resolveChildPath = (parentPath: string, childPath: string): string => {
  if (isUrl(childPath)) return childPath
  return pathResolve(parentPath, childPath)
}

// 点击导航
const handleMenuClick = (path: string) => {
  if (isUrl(path)) {
    window.open(path)
  } else {
    router.push(path)
  }
}
</script>

<template>
  <div :class="`${prefixCls} h-[var(--top-tool-height)] flex items-center`">
    <template v-for="route in firstLevelRoutes" :key="route.path">
      <!-- 有多个子路由 或 alwaysShow：使用 ElDropdown -->
      <ElDropdown
        v-if="shouldShowDropdown(route)"
        class="h-full"
        :popper-class="`${prefixCls}__popper`"
        trigger="hover"
        :hide-after="200"
        placement="bottom"
        :popper-options="{
          modifiers: [
            {
              name: 'offset',
              options: {
                offset: [0, 0]
              }
            }
          ]
        }"
      >
        <div
          :class="[
            `${prefixCls}__item`,
            'relative flex items-center h-full px-16px cursor-pointer select-none whitespace-nowrap transition-colors duration-200',
            {
              [`${prefixCls}__item--active`]: activeFirstLevel === route.path
            }
          ]"
          style="color: var(--top-header-text-color)"
        >
          <Icon
            v-if="route.meta?.icon"
            :icon="route.meta.icon as string"
            :size="16"
            class="mr-6px"
          />
          <span class="text-14px">{{ t(route.meta?.title as string) }}</span>
          <Icon
            icon="vi-ep:arrow-down"
            :size="12"
            class="ml-4px transition-transform duration-200"
          />
        </div>

        <template #dropdown>
          <ElDropdownMenu>
            <ElDropdownItem
              v-for="child in getChildrenRoutes(route)"
              :key="child.path"
              @click="handleMenuClick(resolveChildPath(route.path, child.path))"
            >
              <Icon
                v-if="child.meta?.icon"
                :icon="child.meta.icon as string"
                :size="14"
                class="mr-8px"
              />
              <span>{{ t(child.meta?.title as string) }}</span>
            </ElDropdownItem>
          </ElDropdownMenu>
        </template>
      </ElDropdown>

      <!-- 单子路由（非 alwaysShow）：折叠为直接跳转项，使用子路由 meta 展示 -->
      <div
        v-else
        :class="[
          `${prefixCls}__item`,
          'relative flex items-center h-full px-16px cursor-pointer select-none whitespace-nowrap transition-colors duration-200',
          {
            [`${prefixCls}__item--active`]: activeFirstLevel === route.path
          }
        ]"
        style="color: var(--top-header-text-color)"
        @click="handleMenuClick(getSingleChildPath(route))"
      >
        <Icon
          v-if="getDisplayMeta(route).icon"
          :icon="getDisplayMeta(route).icon as string"
          :size="16"
          class="mr-6px"
        />
        <span class="text-14px">{{ t(getDisplayMeta(route).title as string) }}</span>
      </div>
    </template>
  </div>
</template>

<style lang="less" scoped>
@prefix-cls: ~'@{adminNamespace}-top-main-menu';

.@{prefix-cls} {
  &__item {
    &:hover,
    &:focus-visible {
      outline: none !important;
    }

    &--active {
      color: var(--el-color-primary) !important;
    }
  }
}
</style>

<style lang="less">
@prefix-cls: ~'@{adminNamespace}-top-main-menu';

// ElDropdown popper 主题样式（非 scoped，因为下拉面板被 teleported 到 body）
.@{prefix-cls}__popper {
  // 覆盖 Element Plus 内部 CSS 变量
  --el-bg-color-overlay: var(--top-header-bg-color);
  --el-text-color-regular: var(--top-header-text-color);
  --el-border-color-lighter: var(--top-tool-border-color);

  padding: 4px 0 !important;

  // popper 容器本身
  background: var(--top-header-bg-color) !important;
  border: 1px solid var(--top-tool-border-color) !important;
  border-radius: 4px !important;
  box-shadow: 0 2px 12px rgb(0 0 0 / 10%) !important;

  // 消除 Element Plus 自带的箭头
  .el-popper__arrow {
    display: none !important;
  }

  // 菜单列表
  .el-dropdown-menu {
    background: var(--top-header-bg-color);
  }

  // 菜单项
  .el-dropdown-menu__item {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    font-size: 14px;
    color: var(--top-header-text-color);
    white-space: nowrap;
    transition:
      background-color 0.15s,
      color 0.15s;

    &:hover,
    &:focus-visible {
      color: var(--el-color-primary) !important;
      background-color: var(--top-header-hover-color) !important;
      outline: none !important;
    }
  }
}

// 暗黑模式（popper 被 teleported 到 body，无法使用 UnoCSS dark: 变体）
.dark {
  .@{prefix-cls}__popper {
    --el-bg-color-overlay: var(--el-bg-color);

    background: var(--el-bg-color) !important;

    .el-dropdown-menu {
      background: var(--el-bg-color);
    }
  }
}
</style>
