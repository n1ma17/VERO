<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppNavIcon from '@/components/shared/AppNavIcon.vue'
import { APP_NAV_ITEMS, appNavActiveIndex } from '@/utils/appNav'

const route = useRoute()
const activeIndex = computed(() => appNavActiveIndex(route))
</script>

<template>
  <nav class="app-bottom-nav-dock" aria-label="Main navigation">
    <div class="app-bottom-nav" :data-index="activeIndex">
      <ul class="app-bottom-nav__list">
        <li
          v-for="(item, index) in APP_NAV_ITEMS"
          :key="item.to"
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
            <span class="app-bottom-nav__label">{{ item.shortLabel }}</span>
          </RouterLink>
        </li>
        <li class="app-bottom-nav__indicator" :data-index="activeIndex" aria-hidden="true" />
      </ul>
    </div>
  </nav>
</template>
