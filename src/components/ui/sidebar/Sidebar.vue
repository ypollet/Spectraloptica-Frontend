<script setup lang="ts">
import { LandmarkList } from "@/components/ui/landmark";
import { DistanceComputed, DistanceList } from "@/components/ui/distance";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useImagesStore, useLandmarksStore } from "@/lib/stores";
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

const imageStore = useImagesStore()
const landmarksStore = useLandmarksStore()

</script>

<template>
  <div class="flex flex-col pb-[12px] w-auto h-full">
    <div class="flex-none space-y-4 py-4">
      <div class="px-3 py-2 bg-linear-to-bl from-violet-500 to-fuchsia-500">
        <Slider :model-value="[imageStore.index]" :max="imageStore.spectralImages.length - 1" :step="1"
          @update:modelValue="$event => imageStore.setIndex($event![0])" />
        <div className='mt-1.5 flex flex-row justify-between'>
          <span class="w-5 text-center" v-for="i in new Array(imageStore.spectralImages.length)">
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
    <div class="flex grow items-end mt-4">
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
</style>
