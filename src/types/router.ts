export {}

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean
    hideChrome?: boolean
    fullBleed?: boolean
  }
}
