<template>
  <ThemeProvider>
    <SidebarProvider>
      <RouterView />
      <!-- Global toast stack (top-right). Reads the notification store; every
           composable already pushes success/error messages there. -->
      <AppToastContainer />
      <!-- Global styled confirm dialog (replaces window.confirm). -->
      <AppConfirmHost />
    </SidebarProvider>
  </ThemeProvider>
</template>

<script setup lang="ts">
import ThemeProvider from './components/layout/ThemeProvider.vue'
import SidebarProvider from './components/layout/SidebarProvider.vue'
import AppToastContainer from './components/organisms/AppToastContainer.vue'
import AppConfirmHost from './components/organisms/AppConfirmHost.vue'
</script>
