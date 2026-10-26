<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppNavIcon from '@/components/shared/AppNavIcon.vue'
import { APP_NAV_ITEMS, appNavActiveIndex } from '@/utils/appNav'

const route = useRoute()
const activeIndex = computed(() => appNavActiveIndex(route))

const navRoot = ref<HTMLElement | null>(null)
const lightRef = ref<HTMLElement | null>(null)
const itemRefs = ref<HTMLElement[]>([])
const lightLeftPx = ref(0)

function setItemRef(el: unknown, index: number) {
  if (el instanceof HTMLElement) {
    itemRefs.value[index] = el
    return
  }
  delete itemRefs.value[index]
}

function updateLightPosition() {
  const nav = navRoot.value
  const light = lightRef.value
  const item = itemRefs.value[activeIndex.value]
  if (!nav || !light || !item) return

  const link = item.querySelector<HTMLElement>('.app-bottom-nav__link')
  if (!link) return

  const navRect = nav.getBoundingClientRect()
  const linkRect = link.getBoundingClientRect()
  const centerX = linkRect.left + linkRect.width / 2 - navRect.left
  lightLeftPx.value = centerX - light.offsetWidth / 2
}

let resizeObserver: ResizeObserver | undefined

onMounted(() => {
  nextTick(updateLightPosition)
  window.addEventListener('resize', updateLightPosition)
  if (navRoot.value) {
    resizeObserver = new ResizeObserver(() => updateLightPosition())
    resizeObserver.observe(navRoot.value)
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', updateLightPosition)
  resizeObserver?.disconnect()
})

watch(activeIndex, () => {
  nextTick(updateLightPosition)
})
</script>

<template>
  <nav class="app-bottom-nav-dock" aria-label="Main navigation">
    <div class="mx-auto w-full max-w-5xl px-3 sm:px-4">
      <div
        ref="navRoot"
        class="app-bottom-nav"
      :data-index="activeIndex"
      :style="{ '--nav-light-left': `${lightLeftPx}px` }"
    >
      <ul class="app-bottom-nav__links">
        <li
          v-for="(item, index) in APP_NAV_ITEMS"
          :key="item.to"
          :ref="(el) => setItemRef(el, index)"
          class="app-bottom-nav__item"
          :class="{ 'is-active': activeIndex === index }"
        >
          <RouterLink
            :to="item.to"
            class="app-bottom-nav__link"
            :aria-current="activeIndex === index ? 'page' : undefined"
            :aria-label="item.label"
          >
            <span class="app-bottom-nav__icon">
              <AppNavIcon :name="item.icon" />
            </span>
          </RouterLink>
        </li>
      </ul>
      <div ref="lightRef" class="app-bottom-nav__light" aria-hidden="true" />
      </div>
    </div>
  </nav>
</template>
