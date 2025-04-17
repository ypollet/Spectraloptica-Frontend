<script setup lang="ts">
import { ref } from 'vue';

import { Loader2 } from 'lucide-vue-next';

import { useQuery } from '@tanstack/vue-query'

import { useImagesStore } from '@/lib/stores';

import type { ProjectData, SpectralImage } from '@/data/models/spectral_image'

import ImageViewer from '@/components/ui/image-viewer/ImageViewer.vue';

import { RepositoryFactory } from '@/data/repositories/repository_factory'
import { repositorySettings } from "@/config/appSettings"

import Label from '../label/Label.vue';


const imagesStore = useImagesStore()

const { isPending, isError, data, error } = useQuery({
  queryKey: ['all_images'],
  queryFn: () => getImages(),
})

const repository = RepositoryFactory.get(repositorySettings.type)

async function getImages(): Promise<ProjectData> {
  if (imagesStore.spectralImages.length > 0 || imagesStore.individualImages.size > 0) {
    return {
      spectralImages: [],
      individualImages: new Map(),
      size: {width: 0, height:0},
      thumbnails: true
    }
  }
  return repository.getImages(imagesStore.objectPath).then((data) => {
    imagesStore.spectralImages = data.spectralImages
    imagesStore.size = data.size
    imagesStore.individualImages = data.individualImages

    if (imagesStore.spectralImages.length == 0) {
      let imageRand = data.individualImages.keys().next().value!
      console.log("ImageRand : " + imageRand)
      imagesStore.image = imageRand
    }
    return data
  })
}
</script>
<template>
  <div class="w-full h-full flex justify-center items-center">
    <div v-if="isPending" class="w-full h-full flex justify-center items-center">
      <Loader2 class="animate-spin mr-10" width="10%" height="10%" />
    </div>
    <div v-if="isError" class="w-full h-full flex justify-center items-center">
      <div class="text-red-600">{{ error }}</div>
    </div>
    <div v-if="data" class="w-full h-full flex flex-col items-center">
      <ImageViewer class="object-fit flex-auto" aspect-ratio="auto" draggable="false" />
    </div>
  </div>
</template>

<style scoped>
.object-fit {
  max-width: 100%;
  max-height: 100%;
  width: 100%;
  height: 100%;
  display: block;
}
</style>