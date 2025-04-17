<script setup lang="ts">
import { LandmarkList } from "@/components/ui/landmark";
import { DistanceComputed, DistanceList } from "@/components/ui/distance";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useImagesStore, useLandmarksStore } from "@/lib/stores";
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { storeToRefs } from "pinia";
import ThumbnailViewer from "../thumbnail-viewer/ThumbnailViewer.vue";
import Label from "../label/Label.vue";

const imageStore = useImagesStore()
const landmarksStore = useLandmarksStore()

const { listGradients } = storeToRefs(imageStore)
</script>

<template>
  <div class="flex flex-col pb-4 space-y-4 w-auto h-full">
    <div class="flex w-full flex-row w-full justify-center">
        <Label>{{ imageStore.selectedImage.label }}</Label>
      </div>
    <div class="flex justify-center">
      <div class="w-4/5">
        <ThumbnailViewer/>
      </div>
    </div>
    <div class="flex space-y-4">
      <ToggleGroup class="flex px-2 inline-grid grid-cols-4 place-items-center" type="single" :model-value="imageStore.image"
      @update:modelValue="$event => {if($event) {imageStore.image = $event.toString()}}">
        <ToggleGroupItem value="wavelength" v-if="imageStore.spectralImages.length > 0">
          Wavelength
        </ToggleGroupItem>
        <ToggleGroupItem v-for="spectral in imageStore.individualImages.keys()" :value="spectral">
          {{ spectral }}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
    <div class="flex-none space-y-4">
      <div class="px-3 py-2 fibggor" v-if="imageStore.spectralImages.length > 0">
        <!-- bg-linear-to-r/decreasing from-purple-600 to-red-600 -->
        <Slider :model-value="[imageStore.index]" :max="imageStore.spectralImages.length - 1" :step="1"
          @update:modelValue="$event => imageStore.setIndex($event![0])" />
        <div className='mt-1.5 flex flex-row justify-between'>
          <span class="w-5 text-center text-white" v-for="i in new Array(imageStore.spectralImages.length)">
            |
          </span>
        </div>
      </div>
      <div class="flex flex-row px-3 py-2 justify-around text-center">
        <div class="flex flex-col">
          <h3 class="font-bold">Wavelength</h3>
          <span>{{ imageStore.selectedImage.wavelength.type }}</span>
          <span>{{ imageStore.selectedImage.wavelength.value }}</span>
        </div>
        <div class="flex flex-col">
          <h3 class="font-bold">Filter</h3>
          <span>{{ imageStore.selectedImage.filter.type }}</span>
          <span>{{ imageStore.selectedImage.filter.description }}</span>
        </div>
      </div>
      <Tabs :model-value="landmarksStore.tab" @update:modelValue="$event => landmarksStore.tab = $event.toString()"
        default-value="landmarks" class="w-full my-4">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="landmarks">
            Landmarks
          </TabsTrigger>
          <TabsTrigger value="distances">
            Distances
          </TabsTrigger>
        </TabsList>
        <TabsContent value="landmarks">
          <LandmarkList />
        </TabsContent>
        <TabsContent value="distances">
          <DistanceList />
        </TabsContent>
      </Tabs>
    </div>
    <div class="flex grow pb-4">
      <DistanceComputed />
    </div>
  </div>
</template>

<style>
.scroll-align {
  scroll-snap-align: start;
  scroll-behavior: auto;
}

.scroll-snap-type {
  scroll-snap-type: y mandatory;
}

.fibggor {
  background-image: linear-gradient(v-bind(listGradients));
}
</style>
