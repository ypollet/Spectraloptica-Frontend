<script setup lang="ts">
import { useImagesStore, useLandmarksStore } from "@/lib/stores";

import { Distance } from "@/data/models/distance";

import { Separator } from '@/components/ui/separator'
import { Label } from "@/components/ui/label";
import { Input } from '@/components/ui/input'
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";


import { X } from "lucide-vue-next";

import * as math from "mathjs"
import { Scale } from "@/lib/utils";

const STEP = 0.01
const landmarksStore = useLandmarksStore()

function computeScaledDistance(distance : Distance): number {
    let intervals = distance.distance
    if(landmarksStore.scale == "px"){
        intervals = distance.distancePx
    }
    let dist = (intervals) ? computeDistance(intervals) : 0

    return dist * landmarksStore.adjustFactor / math.number(Scale[landmarksStore.scale as keyof typeof Scale])
}

function computeDistance(intervals: [number, number][]): number {
    let dist = 0
    intervals.forEach((interval) => {
        let squared = math.map(interval, math.square)
        let sum = math.sum(squared)
        // can't be a Complex number
        dist += math.sqrt(sum) as number
    })

    return dist
}

function changeScale(payload: string | number, distance: Distance) {
    landmarksStore.adjustFactor = math.number(payload) / computeDistance(distance.distance!) * math.number(Scale[landmarksStore.scale as keyof typeof Scale])
}

function resetScale() {
    landmarksStore.adjustFactor = 1
}
</script>

<template>
    <div class="w-full">
        <div class="flex flex-row ">
            <h2 class="flex items-center px-7 text-lg font-semibold tracking-tight">
                Measures
            </h2>
            <div class="w-full h-full flex justify-end space-x-2">
                <Select v-model="landmarksStore.scale">
                    <SelectTrigger class="w-16">
                        <SelectValue placeholder="Pick a scale" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Scale</SelectLabel>
                            <SelectItem v-for="scale in Object.keys(Scale).filter((v) => isNaN(Number(v)))"
                                :value="scale">
                                {{ scale }}
                            </SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <Button variant="secondary" @click="resetScale">
                    Reset Scale
                </Button>
            </div>
        </div>
        <div class="flex min-h-48 min-w-full w-fit flex flex-col border">
            <div v-for="(distance, index) in landmarksStore.distances" class="flex flex-col min-w-full w-fit h-10">
                <div class="flex flex-row items-center justify-between space-x-3 px-3 w-full h-full">
                    <div class="flex flex-row items-center justify-start space-x-3">
                        <Label class="flex whitespace-nowrap w-auto">{{ distance.label }}</Label>
                    </div>
                    <div class="flex flex-row items-center justify-end space-x-3">

                        <Label v-show="!distance.edit_distance" class="flex whitespace-nowrap w-auto"
                            @dblclick="distance.edit_distance = true">
                            {{ math.round(computeScaledDistance(distance), 5) }} 
                            {{ landmarksStore.scale }}
                        </Label>
                        <Input v-show="distance.edit_distance" type="number" :min="0" :step="STEP"
                            :model-value="computeScaledDistance(distance)"
                            class="flex h-auto w-auto px-0" @focusout="distance.edit_distance = false"
                            @keyup.enter="distance.edit_distance = false"
                            @update:model-value="changeScale($event, distance)" />
                        <Button class="relative w-6 h-6 p-0" variant="destructive"
                            @click="landmarksStore.distances.splice(index, 1)">
                            <X class="relative w-4 h-4 p-0" />
                        </Button>
                    </div>
                </div>
                <Separator class="w-full" />
            </div>
        </div>
    </div>
</template>