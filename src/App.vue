<script setup lang="ts">
import { useImagesStore } from './lib/stores';
import ViewerView from './views/ViewerView.vue';

const imageStore = useImagesStore()

function changePicture(event: KeyboardEvent) {
  let key = event.key
  if(key == "ArrowUp" || key == "ArrowRight"){
    imageStore.selectedGroup.increment()
  }
  if(key == "ArrowDown" || key == "ArrowLeft"){
    imageStore.selectedGroup.decrement()
  }
}
</script>

<template>
  <div class="overflow-hidden"> <ViewerView @keydown="changePicture"/></div>
</template>

