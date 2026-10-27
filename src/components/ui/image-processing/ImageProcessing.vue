<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { Loader2, X } from "lucide-vue-next";
import { useImagesStore } from "@/lib/stores";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RepositoryFactory } from "@/data/repositories/repository_factory";
import { repositorySettings } from "@/config/appSettings";

const OPERATIONS: Array<{ value: string, label: string, format: (left: string, right: string) => string }> = [
  { value: "add", label: "Addition", format: (left, right) => `${left} + ${right}` },
  { value: "sub", label: "Difference", format: (left, right) => `|${left} − ${right}|` },
  { value: "div", label: "Ratio", format: (left, right) => `${left} ÷ ${right}` },
  { value: "nd", label: "Normalized difference", format: (left, right) => `${left} NDVI ${right}` },
]

const CHANNELS = [
  { key: "red", label: "Red", color: "#ef4444" },
  { key: "green", label: "Green", color: "#22c55e" },
  { key: "blue", label: "Blue", color: "#3b82f6" },
] as const

const repository = RepositoryFactory.get(repositorySettings.type)
const imageStore = useImagesStore()
const { selectedGroup } = storeToRefs(imageStore)

const mode = ref("operation")
const operation = ref("sub")
const left = ref<string>()
const right = ref<string>()
const channels = ref<Record<string, string | undefined>>({ red: undefined, green: undefined, blue: undefined })

const loading = ref(false)
// labels whose thumbnail is shown while the full resolution is still being computed
const pendingFull = ref(new Set<string>())
const error = ref("")

// images on disk that can be used as inputs (computed results only exist in the browser)
const sources = computed(() => [
  ...Array.from(selectedGroup.value.individualImages.values()).filter((image) => !image.computed),
  ...selectedGroup.value.spectralImages,
])

const results = computed(() => Array.from(selectedGroup.value.individualImages.values()).filter((image) => image.computed))

const canCompute = computed(() => !loading.value && (mode.value == "operation"
  ? left.value != null && right.value != null
  : CHANNELS.every((channel) => channels.value[channel.key] != null)))

// selected file names belong to one group
watch(() => imageStore.index, () => {
  left.value = undefined
  right.value = undefined
  channels.value = { red: undefined, green: undefined, blue: undefined }
  error.value = ""
})

function labelOf(name: string): string {
  return sources.value.find((image) => image.name == name)?.label ?? name
}

async function compute() {
  const group = selectedGroup.value
  let label: string
  let request: (thumb: boolean) => Promise<string>

  if (mode.value == "operation") {
    const op = OPERATIONS.find((op) => op.value == operation.value)!
    const [leftName, rightName] = [left.value!, right.value!]
    label = op.format(labelOf(leftName), labelOf(rightName))
    request = (thumb) => repository.computeOperation(imageStore.objectPath, op.value, leftName, rightName, thumb)
  } else {
    const [red, green, blue] = CHANNELS.map((channel) => channels.value[channel.key]!)
    label = `R: ${labelOf(red)} · G: ${labelOf(green)} · B: ${labelOf(blue)}`
    request = (thumb) => repository.computeFalseColor(imageStore.objectPath, red, green, blue, thumb)
  }

  // already computed: just show it again
  if (group.individualImages.get(label)?.computed) {
    group.image = label
    return
  }

  // thumbnail first for a quick preview, then the full resolution in the background
  loading.value = true
  error.value = ""
  try {
    group.addComputedImage(label, await request(true))
  } catch (e: any) {
    error.value = errorMessage(e)
    return
  } finally {
    loading.value = false
  }

  pendingFull.value.add(label)
  try {
    const image = await request(false)
    if (!group.setComputedFullImage(label, image)) {
      URL.revokeObjectURL(image)
    }
  } catch (e: any) {
    error.value = `Full resolution of "${label}": ${errorMessage(e)}`
  } finally {
    pendingFull.value.delete(label)
  }
}

function errorMessage(e: any): string {
  const status = e?.response?.status
  return status ? `The computation failed (HTTP ${status}). Check that the images have the same size.` : String(e?.message ?? e)
}
</script>

<template>
  <div class="flex flex-col space-y-3 px-3">
    <h3 class="font-bold text-center">Image processing</h3>

    <p v-if="!repository.supportsProcessing" class="text-sm text-muted-foreground text-center">
      Operations and false colors are not available with this backend.
    </p>

    <template v-else>
      <Tabs v-model="mode" class="w-full">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="operation">Operation</TabsTrigger>
          <TabsTrigger value="false-color">False color</TabsTrigger>
        </TabsList>

        <TabsContent value="operation" class="space-y-3">
          <div class="space-y-1">
            <Label>Operation</Label>
            <Select v-model="operation">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="op in OPERATIONS" :key="op.value" :value="op.value">{{ op.label }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div class="space-y-1">
              <Label>Image A</Label>
              <Select v-model="left">
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="image in sources" :key="image.name" :value="image.name">{{ image.label }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-1">
              <Label>Image B</Label>
              <Select v-model="right">
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="image in sources" :key="image.name" :value="image.name">{{ image.label }}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="false-color" class="space-y-2">
          <div v-for="channel in CHANNELS" :key="channel.key" class="flex items-center gap-2">
            <span class="h-3 w-3 flex-none rounded-full" :style="{ backgroundColor: channel.color }"></span>
            <Label class="w-12 flex-none">{{ channel.label }}</Label>
            <Select v-model="channels[channel.key]">
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="image in sources" :key="image.name" :value="image.name">{{ image.label }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>
      </Tabs>

      <Button :disabled="!canCompute" @click="compute">
        <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
        {{ loading ? "Computing…" : "Compute" }}
      </Button>

      <p v-if="error" class="text-sm text-red-600">{{ error }}</p>

      <div v-if="results.length > 0" class="space-y-1">
        <Label>Results</Label>
        <ul class="space-y-1">
          <li v-for="image in results" :key="image.label"
            class="flex items-center justify-between gap-2 rounded-md border px-2 py-1 text-sm cursor-pointer hover:bg-accent"
            :class="{ 'bg-accent font-medium': selectedGroup.image == image.label }"
            @click="selectedGroup.image = image.label">
            <span class="truncate" :title="image.label">{{ image.label }}</span>
            <Loader2 v-if="pendingFull.has(image.label)" class="ml-auto h-4 w-4 flex-none animate-spin opacity-60" />
            <Button variant="ghost" size="icon" class="h-6 w-6 flex-none" title="Remove"
              @click.stop="selectedGroup.removeComputedImage(image.label)">
              <X class="h-4 w-4" />
            </Button>
          </li>
        </ul>
      </div>
    </template>
  </div>
</template>
