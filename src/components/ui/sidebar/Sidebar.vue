<script setup lang="ts">
import { Slider } from "@/components/ui/slider";
import { useImagesStore } from "@/lib/stores";
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { storeToRefs } from "pinia";
import ThumbnailViewer from "../thumbnail-viewer/ThumbnailViewer.vue";
import Label from "../label/Label.vue";

const imageStore = useImagesStore()

const { selectedImage, selectedGroup, listGradients} = storeToRefs(imageStore)

</script>

<template>
  <div class="flex flex-col pb-4 space-y-4 w-auto h-full">
    <div class="flex space-y-4">
      <ToggleGroup class="w-full flex flex-wrap justify-around gap-3" type="single" :model-value="imageStore.index"
      @update:modelValue="$event => {if($event) {imageStore.index = $event.toString()}}">
        <ToggleGroupItem v-for="group in imageStore.spectralImages.keys()" :value="group">
          {{ group }}
        </ToggleGroupItem>
        
      </ToggleGroup>
    </div>
    <div class="flex w-full flex-row w-full justify-center">
        <Label>{{ selectedImage.label }}</Label>
      </div>
    <div class="flex justify-center">
      <div class="w-4/5">
        <ThumbnailViewer/>
      </div>
    </div>
    <div class="flex space-y-4">
      <ToggleGroup class="w-full flex flex-wrap justify-around gap-3" type="single" :model-value="selectedGroup.image"
      @update:modelValue="$event => {if($event) {selectedGroup.image = $event.toString()}}">
        <ToggleGroupItem value="wavelength" v-if="selectedGroup.spectralImages.length > 0">
          Wavelength
        </ToggleGroupItem>
        <ToggleGroupItem v-for="spectral in selectedGroup.individualImages.keys()" :value="spectral">
          {{ spectral }}
        </ToggleGroupItem>
        
      </ToggleGroup>
    </div>
    <div class="flex-none space-y-4">
      <div class="px-3 py-2 fibggor" v-if="selectedGroup.spectralImages.length > 0">
        <!-- bg-linear-to-r/decreasing from-purple-600 to-red-600 -->
        <Slider :model-value="[selectedGroup.index]" :max="selectedGroup.spectralImages.length - 1" :step="1"
          @update:modelValue="$event => selectedGroup.setIndex($event![0])" />
        <div className='mt-1.5 flex flex-row justify-between'>
          <span class="w-5 text-center text-white" v-for="i in new Array(selectedGroup.spectralImages.length)">
            |
          </span>
        </div>
      </div>
      <div class="flex flex-row px-3 py-2 justify-around text-center">
        <div class="flex flex-col">
          <h3 class="font-bold">Wavelength</h3>
          <span>{{ selectedImage.wavelength.type }}</span>
          <span>{{ selectedImage.wavelength.value }}</span>
        </div>
        <div class="flex flex-col">
          <h3 class="font-bold">Filter</h3>
          <span>{{ selectedImage.filter.type }}</span>
          <span>{{ selectedImage.filter.description }}</span>
        </div>
      </div>
      <!--
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
    -->
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
