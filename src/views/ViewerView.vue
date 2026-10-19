<script setup lang="ts">
import { ref } from "vue";
import Menu from "@/components/Menu.vue";
import { Separator } from "@/components/ui/separator";
import { Sidebar } from "@/components/ui/sidebar";
import { useSettingsStore, useImagesStore } from "@/lib/stores";
import { CameraViewer } from "@/components/ui/camera-viewer"
import { MainLogo } from "@/components/ui/logo";

const settingsStore = useSettingsStore()
const imageStore = useImagesStore()


let urlParams = new URLSearchParams(window.location.search);

imageStore.setPath(urlParams.get('series') as string)

</script>

<template>
  <main class="h-screen">
    <div class="flex menu">
      <Menu class="sticky top-0 flex flex-row grow z-50"></Menu> 
      <div class="flex pr-2 items-center space-x-2">
        <MainLogo :height=35 :width=35 />
        <h1 class="font-dejavu font-bold text-brand">Spectraloptica</h1>
      </div>
    </div>
    <Separator></Separator>
    <div class="rest_height h-full flex"
    :class="settingsStore.isLeft ? 'flex-row' : 'flex-row-reverse'">
      <div class="h-full w-96 flex-none overflow-auto border p-4">
        <Sidebar />
      </div>

      <div class="h-full w-0 flex-auto items-center justify-centerborder">
        <CameraViewer/>
      </div>
    </div>
  </main>
</template>

<style scoped>

.menu {
  height: 40px;
}


.rest_height {
  height: calc(100% - 41px);
}

</style>
