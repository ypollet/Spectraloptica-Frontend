<!-- 
Sphaeroptica - 3D Viewer on calibrated images - Frontend

Copyright (C) 2024 Yann Pollet, Royal Belgian Institute of Natural Sciences


This program is free software: you can redistribute it and/or

modify it under the terms of the GNU General Public License as

published by the Free Software Foundation, either version 3 of the

License, or (at your option) any later version.



This program is distributed in the hope that it will be useful, but

WITHOUT ANY WARRANTY; without even the implied warranty of

MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU

General Public License for more details.


You should have received a copy of the GNU General Public License

along with this program. If not, see <http://www.gnu.org/licenses/>. 
-->

<script setup lang="ts">

import { onMounted, ref, watch } from 'vue';

import { storeToRefs } from 'pinia';
import { round } from 'mathjs'
import { useImagesStore } from '@/lib/stores';

const imagesStore = useImagesStore()

const { camera, size } = storeToRefs(imagesStore)

const scaledZoomRect = ref<{
  top: number;
  left: number;
  width: number;
  height: number;
}>(camera.value.zoomRect)

const base_image = ref<HTMLImageElement | null>(null)
const imageContainer = ref<HTMLDivElement | null>(null)

const isZoomedOut = ref<boolean>(true)

watch(camera, () => {
  updateRect()
})

onMounted(() => {
  updateRect()
})



function updateRect() {
  if (imageContainer.value && base_image.value && base_image.value.complete) {
    let ratioW = size.value.width / imageContainer.value.clientWidth
    let ratioH = size.value.height / imageContainer.value.clientHeight

    scaledZoomRect.value = {
      top: camera.value.zoomRect.top / ratioH,
      left: camera.value.zoomRect.left / ratioW,
      width: camera.value.zoomRect.width / ratioW,
      height: camera.value.zoomRect.height / ratioH
    }

    isZoomedOut.value = round(camera.value.zoomRect.width, 3) != round(size.value.width, 3) || round(camera.value.zoomRect.height, 3) != round(size.value.height, 3)
  }
}
</script>
<template>
    <div ref="imageContainer" class="w-full h-full border flex justify-center items-center relative">
      <div class="absolute bottom-0 left-0 w-full h-full">
        <svg v-if="isZoomedOut" class="w-full h-full">
          <rect id="box" :x="scaledZoomRect.left" :y="scaledZoomRect.top" :width="scaledZoomRect.width"
            :height="scaledZoomRect.height" />
        </svg>
      </div>
      <img class="object-fit" ref="base_image"
        :src="imagesStore.selectedImage.thumbnail || imagesStore.selectedImage.image"
        :alt="imagesStore.selectedImage.name" aspect-ratio="auto" draggable="false">
    </div>
</template>

<style scoped>
.object-fit {
  object-fit: contain;
  max-width: 100%;
  max-height: 100%;
  width: 100%;
  height: 100%;
  display: block;
}

#box {
  position: absolute;
  fill: transparent;
  stroke: red;
  stroke-width: 3;
}
</style>