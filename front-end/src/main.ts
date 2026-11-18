import { createApp } from 'vue'
import '@fontsource-variable/archivo/wght.css'
import '@fontsource/ibm-plex-sans/latin-400.css'
import '@fontsource/ibm-plex-sans/latin-500.css'
import '@fontsource/ibm-plex-sans/latin-600.css'
import './styles/main.css'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
