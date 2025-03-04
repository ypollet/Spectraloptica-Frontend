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


const imageStore = useImagesStore()

const { isPending, isError, data, error } = useQuery({
  queryKey: ['all_images'],
  queryFn: () => getImages(),
})

const repository = RepositoryFactory.get(repositorySettings.type)

async function getImages(): Promise<ProjectData> {
  return repository.getImages(imageStore.objectPath).then((data) => {
    imageStore.spectralImages = data.spectralImages
    imageStore.size = data.size
    imageStore.individualImages = data.individualImages
    console.log("image store updated")
    console.log(imageStore.individualImages)
    return data
  })
}
</script>
<template>
  <div class="w-full h-full border flex justify-center items-center">
    <div v-if="isPending" class="w-full h-full flex justify-center items-center">
      <Loader2 class="animate-spin mr-10" width="10%" height="10%" />
    </div>
    <div v-if="isError" class="w-full h-full flex justify-center items-center">
      <div class="text-red-600">{{ error }}</div>
    </div>
    <div v-if="data" class="w-full h-full flex flex-col items-center">
      <div class="flex grow flex-row w-full justify-start">
        <Label class="border p-2">{{ imageStore.selectedImage!.name }}</Label>
      </div>
      <ImageViewer class="object-fit" aspect-ratio="auto" draggable="false" />
    </div>
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
</style>