export {}

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean
    hideChrome?: boolean
    fullBleed?: boolean
    /** Receipt printer pages — skip global loading overlay (router + API). */
    skipLoadingOverlay?: boolean
  }
}
