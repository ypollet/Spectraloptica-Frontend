<script setup lang="ts">
import { useLandmarksStore } from "@/lib/stores";

import { DistanceIteration } from ".";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { storeToRefs } from "pinia";
import type { Distance } from "@/data/models/distance";

const landmarksStore = useLandmarksStore()

const { selectedDistanceIndex } = storeToRefs(landmarksStore)

function updateSelectedDist(payload: string) {
    landmarksStore.selectedDistanceIndex = Number(payload)
}
</script>

<template>
    <div class="flex grow w-full flex-col space-y-5">
        <Select class="flex grow w-full" :model-value="selectedDistanceIndex.toString()"
            @update:model-value="updateSelectedDist">
            <SelectTrigger class="w-full">
                <SelectValue placeholder="Pick a distance" />
            </SelectTrigger>
            <SelectContent>
                <SelectGroup>
                    <SelectItem class="h-8" value="-1">
                    </SelectItem>
                    <SelectItem class="h-8" v-for="(distance, index) in landmarksStore.distances"
                        :value="index.toString()">
                        {{ distance.label }}
                    </SelectItem>
                </SelectGroup>
            </SelectContent>
        </Select>
        <DistanceIteration v-if="landmarksStore.selectedDistance != null" :distance="landmarksStore.selectedDistance"
            :index="landmarksStore.selectedDistanceIndex" :showLandmarks="true" />
        <div class="flex grow flex-col space-y-2">
            <div v-for="(map) in landmarksStore.distances.map((distanceMap, indexMap) => [distanceMap, indexMap] as [Distance, number]).filter((map) => map[1] != landmarksStore.selectedDistanceIndex)">
                <DistanceIteration v-if="map[1] != landmarksStore.selectedDistanceIndex" :distance="map[0]"
                    :index="map[1]" :showLandmarks="false" @dblclick="landmarksStore.selectedDistanceIndex = map[1]" />
            </div>
        </div>
    </div>
</template>