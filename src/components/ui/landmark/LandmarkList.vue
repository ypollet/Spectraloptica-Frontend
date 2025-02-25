<script setup lang="ts">
import { useImagesStore, useLandmarksStore } from "@/lib/stores";

import { Landmark } from "@/data/models/landmark";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from '@/components/ui/input'
import draggable from "vuedraggable"

import { ref } from "vue";

import { X, RefreshCcw, Eye, EyeOff } from "lucide-vue-next";
import type { Distance } from "@/data/models/distance";
import Separator from "../separator/Separator.vue";

const landmarksStore = useLandmarksStore()
const imagesStore = useImagesStore()

const scrollSnapType = ref<boolean>(true)
const landmarksElements = ref<InstanceType<typeof draggable> | null>(null)
const landmarksScroll = ref<HTMLElement | null>(null)


function changeColor(event: Event, landmark: Landmark) {
  let target = event.currentTarget as HTMLButtonElement;
  if (target == null) {
    return;
  }
  landmark.setColorHEX(target.value)
}
function changeLabel(payload: string | number, landmark: Landmark) {
  landmark.setLabel(payload.toString())
}

function removeLandmark(id: string) {
  landmarksStore.landmarks = landmarksStore.landmarks.filter((el) => !el.equals(id))
}



</script>

<template>
  <div ref="landmarksScroll" class="overflow-auto min-h-16 max-h-96 w-full border"
    :class="{ 'scroll-snap-type': scrollSnapType }">
    <draggable ref="landmarksElements" v-model="landmarksStore.landmarks" group="landmarks" item-key="id"
      :force-fallback="true" :animation="150" :scroll="true" :bubbleScroll="true" :handle="'.handle'"
      class="relative w-fit min-w-full" @start="scrollSnapType = false" @end="scrollSnapType = true">
      <template #item="{ element: landmark }: { element: Landmark }">
        <div class="scroll-align border flex grow p-2">
          <div class="h-12 flex grow flex-row justify-between items-center font-normal px-3 py-2">
            <div class="flex flex-row w-full items-center justify-start space-x-3 py-3 mr-3">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg"
                class="flex-none mr-2 h-6 w-6 handle">
                <path
                  d="M7.49985 0.877045C3.84216 0.877045 0.877014 3.84219 0.877014 7.49988C0.877014 11.1575 3.84216 14.1227 7.49985 14.1227C11.1575 14.1227 14.1227 11.1575 14.1227 7.49988C14.1227 3.84219 11.1575 0.877045 7.49985 0.877045ZM1.82701 7.49988C1.82701 4.36686 4.36683 1.82704 7.49985 1.82704C10.6328 1.82704 13.1727 4.36686 13.1727 7.49988C13.1727 10.6329 10.6328 13.1727 7.49985 13.1727C4.36683 13.1727 1.82701 10.6329 1.82701 7.49988ZM7.49999 9.49999C8.60456 9.49999 9.49999 8.60456 9.49999 7.49999C9.49999 6.39542 8.60456 5.49999 7.49999 5.49999C6.39542 5.49999 5.49999 6.39542 5.49999 7.49999C5.49999 8.60456 6.39542 9.49999 7.49999 9.49999Z"
                  fill="currentColor" fill-rule="evenodd" clip-rule="evenodd"></path>
              </svg>
              <input type="color"
                class="flex-none h-8 w-8 block bg-white border border-gray-950 cursor-pointer rounded-lg disabled:opacity-50 disabled:pointer-events-none dark:bg-slate-900 dark:border-gray-300"
                id="hs-color-input" :value="landmark.getColorHEX()" title="Choose your color"
                @change="changeColor($event, landmark)">
              <Label v-show="!landmark.getEdit()" class="whitespace-nowrap" @dblclick.stop="landmark.setEdit(true)">{{
                landmark.label }}</Label>
              <Input v-show="landmark.getEdit()" @dblclick.stop="" type="text" :model-value="landmark.label"
                class="flew grow h-auto" @focusout="landmark.setEdit(false)" @keyup.enter="landmark.setEdit(false)"
                @update:model-value="changeLabel($event, landmark)" />
            </div>
            <div class="flex items-center h-full w-auto justify-end space-x-3 pr-3">
              <Separator orientation="vertical" class="h-full w-0.5" />
              <Label class="whitespace-nowrap">{{ imagesStore.getImageName(landmark.pose.image) }}</Label>
            </div>
            <div class="flex items-center justify-end">
              <Button class="w-6 h-6 p-0 mr-3" v-show="landmark.show" variant="secondary"
                @click="landmark.show = false">
                <Eye class="relative w-4 h-4 p-0" />
              </Button>
              <Button class="w-6 h-6 p-0 mr-3" v-show="!landmark.show" variant="secondary"
                @click="landmark.show = true">
                <EyeOff class="relative w-4 h-4 p-0" />
              </Button>
              <Button class="w-6 h-6 p-0" variant="destructive" @click="removeLandmark(landmark.getId())">
                <X class="relative w-4 h-4 p-0" />
              </Button>
            </div>
          </div>
        </div>
      </template>
    </draggable>
  </div>
</template>