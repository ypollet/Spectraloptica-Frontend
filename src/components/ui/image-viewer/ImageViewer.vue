<script setup lang="ts">
import { ref, onMounted, nextTick, type HTMLAttributes, useTemplateRef, watch } from 'vue'
import { cn, ZOOM_MAX, ZOOM_MIN, DOT_RADIUS, SPACE_TARGET } from '@/lib/utils'
import { type Coordinates } from "@/data/models/coordinates"
import { useImagesStore } from '@/lib/stores'
import type { Ratio } from '@/data/models/spectral_image'
import { storeToRefs } from 'pinia'

const imagesStore = useImagesStore()

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const { selectedImage } = storeToRefs(imagesStore)
const screenZoom = ref<number>(1)

watch(
  selectedImage,
  () => {
    console.log("New Image")
    update()
    base_image.value.src = imagesStore.selectedImage.thumbnail || imagesStore.selectedImage.image
    base_image.value.alt = (imagesStore.selectedImage.thumbnail) ? 'Thumbnail of ' + imagesStore.selectedImage.name : imagesStore.selectedImage.name
    if (imagesStore.selectedImage.thumbnail) {
      base_image.value.onload = (ev: Event) => loaded()
    } else {
      base_image.value.onload = (ev: Event) => {
        if (imagesStore.camera.zoom <= 0) {
          screenFit()
        }
        update()
      }
    }
  }
)


const imageContainer = useTemplateRef('imageContainer')
const base_image = ref<HTMLImageElement>(new Image())
if (imagesStore.selectedImage.thumbnail) {
  base_image.value.onload = (ev: Event) => loaded()
} else {
  base_image.value.onload = (ev: Event) => {
    if (imagesStore.camera.zoom <= 0) {
      screenFit()
    }
    update()
  }
}
base_image.value.src = imagesStore.selectedImage.thumbnail || imagesStore.selectedImage.image
base_image.value.alt = (imagesStore.selectedImage.thumbnail) ? 'Thumbnail of ' + imagesStore.selectedImage.name : imagesStore.selectedImage.name

const canvas = useTemplateRef('canvas')

var full_image = new Image()
const shiftCanvas = ref<Coordinates>({ x: 0, y: 0 })
const dragging = ref<boolean>(false)

const degrees_to_radians = (deg: number) => (deg * Math.PI) / 180.0; // Convert degrees to radians using the formula: radians = (degrees * Math.PI) / 180

onMounted(() => {
  const resizeObserver = new ResizeObserver(function () {
    if (imageContainer.value && canvas.value && base_image.value) {
      canvas.value.width = Math.floor(imageContainer.value.clientWidth)
      canvas.value.height = Math.floor(imageContainer.value.clientHeight)
      update()
    }

  });
  if (imageContainer.value) {
    resizeObserver.observe(imageContainer.value);
  }
})

function loaded() {
  nextTick(() => {
    if (imagesStore.camera.zoom <= 0) {
      screenFit()
    }
    let image_name = imagesStore.selectedImage.name
    setTimeout(() => {
      if (image_name == imagesStore.selectedImage.name) {
        nextTick(() => {
          // Just verifies we draw the right image
          if (base_image.value.alt.endsWith(image_name)) {
            full_image = new Image()
            full_image.src = imagesStore.selectedImage.image
            full_image.alt = image_name

            full_image.onload = (ev: Event) => {
              if (base_image.value.alt.endsWith(full_image.alt)) {
                base_image.value = full_image
                update()
              }
            }
          }
        })
      }
    }, 500);


    update()
  })
}

function drawImage() {
  if (canvas.value && base_image.value && base_image.value.complete && imagesStore.camera.zoom > 0) {
    let ratio = getRatio()

    let ctx = canvas.value.getContext("2d")!

    let zoomX = imagesStore.camera.zoom / ratio.width
    let zoomY = imagesStore.camera.zoom / ratio.height

    let radius = DOT_RADIUS / zoomX

    ctx.scale(zoomX, zoomY)

    ctx.translate(imagesStore.camera.offset.x * ratio.width, imagesStore.camera.offset.y * ratio.height)

    shiftCanvas.value = {
      x: Math.max(0, (canvas.value.width - base_image.value.naturalWidth * zoomX) / 2) / zoomX,
      y: Math.max(0, (canvas.value.height - base_image.value.naturalHeight * zoomY) / 2) / zoomY
    }
    ctx.drawImage(base_image.value, 0, 0, base_image.value.naturalWidth, base_image.value.naturalHeight,
      shiftCanvas.value.x, shiftCanvas.value.y, base_image.value.naturalWidth, base_image.value.naturalHeight)
  }
}

function update() {
  if (canvas.value && base_image.value && base_image.value.complete) {
    // Clear canvas
    canvas.value.width = canvas.value.width

    // Check that offset values
    updateOffset(0, 0)

    //draw Image
    drawImage()

    const svgRect = canvas.value!.getBoundingClientRect();

    let topLeft = getPos({ x: svgRect.left, y: svgRect.top })
    topLeft = {
      x: Math.max(0, topLeft.x),
      y: Math.max(0, topLeft.y)
    }
    let shift = {
      x: Math.max(0, (canvas.value.width - imagesStore.size.width * imagesStore.camera.zoom))/ imagesStore.camera.zoom,
      y: Math.max(0, (canvas.value.height - imagesStore.size.height * imagesStore.camera.zoom))/ imagesStore.camera.zoom
    }

    imagesStore.camera.zoomRect = {
      top: topLeft.y,
      left: topLeft.x,
      width: canvas.value.width / imagesStore.camera.zoom - shift.x,
      height: canvas.value.height / imagesStore.camera.zoom - shift.y,
    }
  }
}

function screenFit() {
  if (imageContainer.value && canvas.value) {
    canvas.value.width = Math.floor(imageContainer.value.clientWidth)
    canvas.value.height = Math.floor(imageContainer.value.clientHeight)

    screenZoom.value = Math.min(imageContainer.value.clientWidth / imagesStore.size.width, imageContainer.value.clientHeight / imagesStore.size.height)
    console.log(screenZoom.value)
    console.log(imagesStore.camera)
    imagesStore.camera.zoom = screenZoom.value
  }
}

function getRatio(): Ratio {
  if (base_image.value && base_image.value.complete) {
    return {
      width: base_image.value.naturalWidth / imagesStore.size.width,
      height: base_image.value.naturalHeight / imagesStore.size.height
    }
  }
  return {
    width: 0,
    height: 0
  }
}

function getPos(pos: Coordinates): Coordinates {
  let ratio = getRatio()
  const svgRect = canvas.value!.getBoundingClientRect();
  let x = ((pos.x - svgRect.left) / imagesStore.camera.zoom) - imagesStore.camera.offset.x - (shiftCanvas.value.x / ratio.width)
  let y = ((pos.y - svgRect.top) / imagesStore.camera.zoom) - imagesStore.camera.offset.y - (shiftCanvas.value.y / ratio.height)
  return { x: x, y: y }
}

function updateOffset(movementX: number, movementY: number) {
  if (canvas.value) {
    imagesStore.camera.offset.x = imagesStore.camera.offset.x + movementX / imagesStore.camera.zoom
    imagesStore.camera.offset.y = imagesStore.camera.offset.y + movementY / imagesStore.camera.zoom

    //check value
    imagesStore.camera.offset.x = Math.min(0, Math.max(-((imagesStore.size.width * imagesStore.camera.zoom) - canvas.value.width) / imagesStore.camera.zoom, imagesStore.camera.offset.x))
    imagesStore.camera.offset.y = Math.min(0, Math.max(-((imagesStore.size.height * imagesStore.camera.zoom) - canvas.value.height) / imagesStore.camera.zoom, imagesStore.camera.offset.y))
  }
}

function updateZoom(zoomDelta: number) {
  imagesStore.camera.zoom = +(imagesStore.camera.zoom * (1 + zoomDelta / 20)).toFixed(5)
  imagesStore.camera.zoom = Math.max(ZOOM_MIN*screenZoom.value, Math.min(ZOOM_MAX, imagesStore.camera.zoom))
}


function zoomWithWheel(event: WheelEvent) {
  
  let oldZoom = imagesStore.camera.zoom
  updateZoom(Math.sign(-event.deltaY))
  let deltaZoom = imagesStore.camera.zoom / oldZoom

  //get pos mouse in canvas
  const svgRect = canvas.value!.getBoundingClientRect();
  let mouseX = event.pageX - svgRect.left
  let mouseY = event.pageY - svgRect.top

  //update offset
  let deltaOffsetX = -((svgRect.width * deltaZoom) - svgRect.width) * (mouseX / svgRect.width) // (dest offset - src offset) * ratio of pos mouse
  let deltaOffsetY = -((svgRect.height * deltaZoom) - svgRect.height) * (mouseY / svgRect.height)

  updateOffset(deltaOffsetX, deltaOffsetY)
  update()
}

function startDrag(event: MouseEvent) {
  dragging.value = true
  update()
}

function mousemove(event: MouseEvent) {
  if (dragging.value == true) {
    updateOffset(event.movementX, event.movementY)
    update()
  }
}

function stopDrag(event: MouseEvent) {
  dragging.value = false
  update()
}


function printPos(event: MouseEvent) {
  let pos = getPos({x: event.pageX, y:event.pageY})
  console.log("Position = ", pos.x, " : ", pos.y)
}

function onImage(pos: Coordinates): boolean {
  let ratio = getRatio()
  if (base_image.value) {
    return pos.x >= 0 && pos.y >= 0 && pos.x <= base_image.value.naturalWidth / ratio.width && pos.y <= base_image.value.naturalHeight / ratio.height
  }
  return false
}


</script>

<template>
  <div ref="imageContainer"
    :class="cn('border justify-center items-center', props.class)"
    @wheel.prevent>

    <canvas ref="canvas" tabindex='1'
      @mousedown="startDrag" @mouseup="stopDrag" @mousemove="mousemove" @mouseout="stopDrag" @wheel="zoomWithWheel"
      @contextmenu.prevent>
    </canvas>
    <!--
    <img ref="base_image" class="hidden" :src="imagesStore.selectedImage.thumbnail || imagesStore.selectedImage.image"
      :alt="(imagesStore.selectedImage.thumbnail) ? 'Thumbnail of ' + imagesStore.selectedImage.name : imagesStore.selectedImage.name"
      aspect-ratio="auto" @load="loaded">
      -->
  </div>

</template>

<style scoped>
.object-fit {
  display: flex;
  object-fit: contain;
  max-width: none;
}
</style>
