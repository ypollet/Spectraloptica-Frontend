<script setup lang="ts">
import { ref, onMounted, nextTick, type HTMLAttributes, useTemplateRef, watch } from 'vue'
import { cn, ZOOM_MAX, ZOOM_MIN, DOT_RADIUS, SPACE_TARGET } from '@/lib/utils'
import { type Coordinates, type Position } from "@/data/models/coordinates"
import { Landmark, type Pose } from "@/data/models/landmark"
import { useLandmarksStore, useImagesStore } from '@/lib/stores'
import { RepositoryFactory } from '@/data/repositories/repository_factory'
import { repositorySettings } from "@/config/appSettings"
import type { Ratio } from '@/data/models/spectral_image'
import { Distance } from '@/data/models/distance'
import type Color from 'color'
import { storeToRefs } from 'pinia'


const repository = RepositoryFactory.get(repositorySettings.type)

const landmarksStore = useLandmarksStore()
const imagesStore = useImagesStore()


landmarksStore.$subscribe((mutation, state) => {
  update()
})

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()

const { selectedImage } = storeToRefs(imagesStore)
const screenZoom = ref<number>(1)

watch(
  selectedImage,
  () => {
    update()
    base_image.value.src = imagesStore.selectedImage.thumbnail || imagesStore.selectedImage.image
    base_image.value.alt = (imagesStore.selectedImage.thumbnail) ? 'Thumbnail of ' + imagesStore.selectedImage.name : imagesStore.selectedImage.name
    if (imagesStore.selectedImage.thumbnail) {
      base_image.value.onload = (ev: Event) => loaded()
    } else {
      base_image.value.onload = (ev: Event) => {
        if (imagesStore.zoom <= 0) {
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
    if (imagesStore.zoom <= 0) {
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
const landmarkDragged = ref<Landmark | null>(null)
const draggedPos = ref<Coordinates>({ x: -1, y: -1 })

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
    if (imagesStore.zoom <= 0) {
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
  if (canvas.value && base_image.value && base_image.value.complete && imagesStore.zoom > 0) {
    let ratio = getRatio()

    let ctx = canvas.value.getContext("2d")!

    let zoomX = imagesStore.zoom / ratio.width
    let zoomY = imagesStore.zoom / ratio.height

    let radius = DOT_RADIUS / zoomX

    ctx.scale(zoomX, zoomY)

    ctx.translate(imagesStore.offset.x * ratio.width, imagesStore.offset.y * ratio.height)

    shiftCanvas.value = {
      x: Math.max(0, (canvas.value.width - base_image.value.naturalWidth * zoomX) / 2) / zoomX,
      y: Math.max(0, (canvas.value.height - base_image.value.naturalHeight * zoomY) / 2) / zoomY
    }
    ctx.drawImage(base_image.value, 0, 0, base_image.value.naturalWidth, base_image.value.naturalHeight,
      shiftCanvas.value.x, shiftCanvas.value.y, base_image.value.naturalWidth, base_image.value.naturalHeight)

    // Stroke the lines
    landmarksStore.distances.forEach((distance) => {
      if (distance.landmarks.length == 0 || !distance.show) {
        return;
      }
      ctx.beginPath()
      let landmark = distance.landmarks[0]
      let marker = (landmark.equals(landmarkDragged.value)) ? draggedPos.value : landmark.pose.marker
      let shiftedMarker = {
        x: marker.x * ratio.width + shiftCanvas.value.x,
        y: marker.y * ratio.height + shiftCanvas.value.y
      }
      ctx.moveTo(shiftedMarker.x, shiftedMarker.y)
      for (let i = 1; i < distance.landmarks.length; i++) {
        landmark = distance.landmarks[i]
        marker = (landmark.equals(landmarkDragged.value)) ? draggedPos.value : landmark.pose.marker
        shiftedMarker = {
          x: marker.x * ratio.width + shiftCanvas.value.x,
          y: marker.y * ratio.height + shiftCanvas.value.y
        }
        ctx.lineTo(shiftedMarker.x, shiftedMarker.y)
      }
      ctx.strokeStyle = distance.getColorHEX();
      ctx.lineWidth = radius / 4;
      ctx.stroke()
      ctx.closePath()
    })

    landmarksStore.landmarks.forEach((landmark) => {
      if (!landmark.show) {
        return
      }
      if (landmark.equals(landmarkDragged.value)) {
        let marker = draggedPos.value
        // update pos marker depending on image
        marker = {
          x: marker.x * ratio.width,
          y: marker.y * ratio.height
        }

        drawTarget(ctx, marker, radius)
      }
      else {
        drawMarker(ctx, landmark, radius)
      }

    })


    // Stroke the points
    landmarksStore.distances.forEach((distance) => {
      if (!distance.show) {
        return;
      }

      // Stroke the markers
      distance.landmarks.forEach((landmark, id) => {
        if (landmark.equals(landmarkDragged.value)) {

          let marker = draggedPos.value
          // update pos marker depending on image
          marker = {
            x: marker.x * ratio.width,
            y: marker.y * ratio.height
          }

          drawTarget(ctx, marker, radius)
        }
        else {
          // Marker is defined and landmarkDragged not equals landmark
          drawMarker(ctx, landmark, radius)
        }
      });
    });
  }
}

function drawTarget(ctx: CanvasRenderingContext2D, marker: Coordinates, radius: number) {
  const targetRadius = radius * 4
  ctx.beginPath();
  // draw circle
  ctx.arc((marker.x + shiftCanvas.value.x), (marker.y + shiftCanvas.value.y), targetRadius, 0, 2 * Math.PI);
  ctx.strokeStyle = 'white';
  ctx.lineWidth = radius / 2;
  ctx.stroke()
  ctx.closePath();

  // draw white lines diagonals
  ctx.beginPath();
  let start: Coordinates = posCircle(marker, 45, targetRadius, shiftCanvas.value);
  let end: Coordinates = posCircle(marker, 45, targetRadius * SPACE_TARGET, shiftCanvas.value);
  ctx.moveTo(start.x, start.y)
  ctx.lineTo(end.x, end.y)

  start = posCircle(marker, 135, targetRadius, shiftCanvas.value);
  end = posCircle(marker, 135, targetRadius * SPACE_TARGET, shiftCanvas.value);
  ctx.moveTo(start.x, start.y)
  ctx.lineTo(end.x, end.y)

  start = posCircle(marker, 225, targetRadius, shiftCanvas.value);
  end = posCircle(marker, 225, targetRadius * SPACE_TARGET, shiftCanvas.value);
  ctx.moveTo(start.x, start.y)
  ctx.lineTo(end.x, end.y)

  start = posCircle(marker, 315, targetRadius, shiftCanvas.value);
  end = posCircle(marker, 315, targetRadius * SPACE_TARGET, shiftCanvas.value);
  ctx.moveTo(start.x, start.y)
  ctx.lineTo(end.x, end.y)

  ctx.strokeStyle = 'white';
  ctx.lineWidth = radius / 3;

  ctx.stroke()
  ctx.closePath();

  // draw black lines lines horizontal and vertical
  ctx.beginPath();

  //horizontal
  ctx.moveTo((marker.x + shiftCanvas.value.x) + (targetRadius * (1 - SPACE_TARGET)), (marker.y + shiftCanvas.value.y))
  ctx.lineTo((marker.x + shiftCanvas.value.x) + (targetRadius * SPACE_TARGET), (marker.y + shiftCanvas.value.y))

  ctx.moveTo((marker.x + shiftCanvas.value.x) - (targetRadius * (1 - SPACE_TARGET)), (marker.y + shiftCanvas.value.y))
  ctx.lineTo((marker.x + shiftCanvas.value.x) - (targetRadius * SPACE_TARGET), (marker.y + shiftCanvas.value.y))

  //vertical
  ctx.moveTo((marker.x + shiftCanvas.value.x), (marker.y + shiftCanvas.value.y) + (targetRadius * (1 - SPACE_TARGET)))
  ctx.lineTo((marker.x + shiftCanvas.value.x), (marker.y + shiftCanvas.value.y) + (targetRadius * SPACE_TARGET))

  ctx.moveTo((marker.x + shiftCanvas.value.x), (marker.y + shiftCanvas.value.y) - (targetRadius * (1 - SPACE_TARGET)))
  ctx.lineTo((marker.x + shiftCanvas.value.x), (marker.y + shiftCanvas.value.y) - (targetRadius * SPACE_TARGET))

  ctx.strokeStyle = 'black';
  ctx.lineWidth = radius / 3;
  ctx.stroke()
  ctx.closePath()
}

function drawMarker(ctx: CanvasRenderingContext2D, landmark: Landmark, radius: number) {
  let ratio = getRatio()
  let marker = {
    x: landmark.getPose().marker.x * ratio.width,
    y: landmark.getPose().marker.y * ratio.height
  }
  ctx.beginPath()
  ctx.arc((marker.x + shiftCanvas.value.x), (marker.y + shiftCanvas.value.y), radius, 0, 2 * Math.PI);
  ctx.fillStyle = landmark.getColorHEX()
  ctx.fill();
  ctx.lineWidth = radius / 2;
  ctx.strokeStyle = (landmark.getPose().image.name == imagesStore.selectedImage.name) ? "black" : "white";
  ctx.stroke();
  ctx.closePath()
}

function posCircle(center: Coordinates, angle: number, radius: number, translate: Coordinates = { x: 0, y: 0 }): Coordinates {
  return { x: (center.x + radius * Math.cos(degrees_to_radians(angle))) + translate.x, y: (center.y + radius * Math.sin(degrees_to_radians(angle))) + translate.y };
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
      x: Math.max(0, (canvas.value.width - imagesStore.size.width * imagesStore.zoom))/ imagesStore.zoom,
      y: Math.max(0, (canvas.value.height - imagesStore.size.height * imagesStore.zoom))/ imagesStore.zoom
    }

    imagesStore.zoomRect = {
      top: topLeft.y,
      left: topLeft.x,
      width: canvas.value.width / imagesStore.zoom - shift.x,
      height: canvas.value.height / imagesStore.zoom - shift.y,
    }
  }
}

function screenFit() {
  if (imageContainer.value && canvas.value) {
    canvas.value.width = Math.floor(imageContainer.value.clientWidth)
    canvas.value.height = Math.floor(imageContainer.value.clientHeight)

    screenZoom.value = Math.min(imageContainer.value.clientWidth / imagesStore.size.width, imageContainer.value.clientHeight / imagesStore.size.height)
    imagesStore.zoom = screenZoom.value
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
  let x = ((pos.x - svgRect.left) / imagesStore.zoom) - imagesStore.offset.x - (shiftCanvas.value.x / ratio.width)
  let y = ((pos.y - svgRect.top) / imagesStore.zoom) - imagesStore.offset.y - (shiftCanvas.value.y / ratio.height)
  return { x: x, y: y }
}

function updateOffset(movementX: number, movementY: number) {
  if (canvas.value) {
    imagesStore.offset.x = imagesStore.offset.x + movementX / imagesStore.zoom
    imagesStore.offset.y = imagesStore.offset.y + movementY / imagesStore.zoom

    //check value
    imagesStore.offset.x = Math.min(0, Math.max(-((imagesStore.size.width * imagesStore.zoom) - canvas.value.width) / imagesStore.zoom, imagesStore.offset.x))
    imagesStore.offset.y = Math.min(0, Math.max(-((imagesStore.size.height * imagesStore.zoom) - canvas.value.height) / imagesStore.zoom, imagesStore.offset.y))
  }
}

function updateZoom(zoomDelta: number) {
  imagesStore.zoom = +(imagesStore.zoom * (1 + zoomDelta / 20)).toFixed(5)
  imagesStore.zoom = Math.max(ZOOM_MIN*screenZoom.value, Math.min(ZOOM_MAX, imagesStore.zoom))
}


function zoomWithWheel(event: WheelEvent) {
  
  let oldZoom = imagesStore.zoom
  updateZoom(Math.sign(-event.deltaY))
  let deltaZoom = imagesStore.zoom / oldZoom

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
  let pos = getPos({x: event.pageX, y:event.pageY})
  if (event.button == 0) {
    dragging.value = true

    let landmark = checkPointCircle(pos)
    landmarkDragged.value = landmark
    draggedPos.value = landmark?.pose.marker ?? { x: -1, y: -1 }
  }
  else if (event.button == 2) {
    let pose = {
      marker: pos,
      image: imagesStore.selectedImage
    } as Pose
    if (!onImage(pos)) {
      // Image not clicked
      return;
    }
    let landmark = checkPointCircle(pos)
    if (landmark) {
      deleteLandmark(landmark)
    }
    else {
      switch (landmarksStore.tab) {
        case "landmarks":
          generateLandmark(pose)
          break;
        case "distances":
          if (landmarksStore.selectedDistance) {
            addLandmark(pose, landmarksStore.selectedDistance)
          } else {
            addDistance(pose)
            landmarksStore.selectedDistanceIndex = landmarksStore.distances.length - 1
          }
          break;
      }
    }
    //triangulate landmark
    update()
    // reinit landmarkDrag
    //reinitDraggedLandmark()
  }
  update()
}

function mousemove(event: MouseEvent) {
  if (dragging.value == true) {
    if (landmarkDragged.value == null) {
      // no marker to drag => pan image
      updateOffset(event.movementX, event.movementY)
    }
    else {
      // drag marker
      draggedPos.value = getPos({x: event.pageX, y:event.pageY})
    }

    update()
  }
}

function stopDrag(event: MouseEvent) {
  dragging.value = false
  if (landmarkDragged.value != null) {
    //update pos of landmark
    let landmark = landmarkDragged.value
    landmark.setPose(imagesStore.selectedImage, getPos({x: event.pageX, y:event.pageY}))
    repository.computeLandmarkPosition(imagesStore.objectPath, landmark.pose).then((position) => {
      landmark.setPosition(position)
    })

    // reinit landmarkDrag
    reinitDraggedLandmark()
  }
  update()
}

function reinitDraggedLandmark() {
  landmarkDragged.value = null
  draggedPos.value = { x: -1, y: -1 }
}

function printPos(event: MouseEvent) {
  let pos = getPos({x: event.pageX, y:event.pageY})
  console.log("Position = ", pos.x, " : ", pos.y)
}

function checkPointCircle(pos: Coordinates): Landmark | null {
  let landmarkClicked: Landmark | null = null
  landmarksStore.landmarks.forEach((landmark) => {
    if (!landmark.show) {
      return;
    }
    landmarkClicked = checkDragLandmark(pos, landmark) || landmarkClicked
  })
  landmarksStore.distances.forEach((distance) => {
    if (!distance.show) {
      return;
    }
    distance.landmarks.forEach((landmark) => {
      landmarkClicked = checkDragLandmark(pos, landmark) || landmarkClicked
    })
  })
  return landmarkClicked
}

function checkDragLandmark(pos: Coordinates, landmark: Landmark): Landmark | null {
  let pose = landmark.getPose()
  if (!pose) {
    //if undefined
    return null;
  }
  if (pointInsideCircle(pos, pose.marker, DOT_RADIUS / imagesStore.zoom)) {
    return landmark
  }
  return null;
}

function pointInsideCircle(pointCoord: Coordinates, circleCoord: Coordinates, radius: number) {
  const distance =
    Math.sqrt((pointCoord.x - circleCoord.x) ** 2 + (pointCoord.y - circleCoord.y) ** 2);
  return distance < radius;
}

function onImage(pos: Coordinates): boolean {
  let ratio = getRatio()
  if (base_image.value) {
    return pos.x >= 0 && pos.y >= 0 && pos.x <= base_image.value.naturalWidth / ratio.width && pos.y <= base_image.value.naturalHeight / ratio.height
  }
  return false
}


async function addDistance(pose: Pose) {
  let distance = new Distance("Distance " + (landmarksStore.distances.length + 1))
  let index = landmarksStore.distances.push(distance) - 1
  let landmark = await createLandmark(pose, distance.color)
  landmarksStore.distances[index].landmarks.push(landmark);
}

async function createLandmark(pose: Pose, color: Color | undefined = undefined): Promise<Landmark> {
  let id = landmarksStore.generateID()
  let position = await repository.computeLandmarkPosition(imagesStore.objectPath, pose)
  return new Landmark(id, id, pose, position, color)
}

async function addLandmark(pose: Pose, distance: Distance) {
  distance.landmarks.push(await createLandmark(pose, distance.color))
}

async function generateLandmark(pose: Pose) {
  landmarksStore.landmarks.push(await createLandmark(pose))
}

function deleteLandmark(landmark: Landmark) {
  landmarksStore.distances.forEach((dist, index) => {
    dist.landmarks = dist.landmarks.filter(x => !x.equals(landmark))
  })

  landmarksStore.landmarks = landmarksStore.landmarks.filter(land => !land.equals(landmark))
  update()
  // reinit landmarkDrag
  reinitDraggedLandmark()
}
</script>

<template>
  <div ref="imageContainer"
    :class="cn('border justify-center items-center', props.class)"
    @wheel.prevent>

    <canvas ref="canvas" tabindex='1' :class="{ 'cursor-none': landmarkDragged, 'cursor-pointer': !landmarkDragged }"
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
