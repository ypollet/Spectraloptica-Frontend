<script setup lang="ts">
import { ref } from 'vue';

import { Loader2 } from 'lucide-vue-next';

import { useQuery } from '@tanstack/vue-query'

import { useImagesStore } from '@/lib/stores';

import { SpectralGroup, type SpectralData } from '@/data/models/spectral_image'

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

async function getImages(): Promise<Map<string,SpectralGroup>> {
  console.log(imagesStore.spectralImages)
  if (imagesStore.spectralImages.size > 0) {
    console.log("Existing groups")
    console.log(imagesStore.spectralImages)
    return new Map();
  }
  console.log("get groups")
  return repository.getImages(imagesStore.objectPath).then((data) => {
    imagesStore.spectralImages = new Map<string, SpectralGroup>()
    data.forEach((spectralData, key) => {
      
      imagesStore.spectralImages.set(key, new SpectralGroup(spectralData))
    })

    imagesStore.index = imagesStore.spectralImages.keys().next().value || ""
    
    imagesStore.spectralImages.forEach((spectralGroup) => {
      console.log(spectralGroup.camera)
    })
    return imagesStore.spectralImages;
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