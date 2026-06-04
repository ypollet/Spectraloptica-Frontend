import { DEFAULT_CAMERA, DEFAULT_IMAGE, nmToRGB, rgbToHex, DEFAULT_TAB, DEFAULT_SIZE } from "@/lib/utils";
import type { Position } from "@vueuse/core";
import * as math from 'mathjs';


export type SpectralImage = {
    name: string,
    image: string,
    label: string,
    thumbnail: string,
    wavelength: Wavelength,
    filter: Filter
}

export type Filter = {
    type: string,
    description: string
}

export type Wavelength = {
    type: string,
    value: number | undefined
}

export type Size = {
    height: number,
    width: number
}

export type Rect = {
    top: number,
    left: number,
    width: number
    height: number,
}

export type SpectralData = {
    spectralImages: Array<SpectralImage>,
    individualImages: Map<string, SpectralImage>,
    size: Size,
    thumbnails: boolean
}

export type Camera = {
    zoom: number
    offset: Position
    zoomRect: Rect
}

export class SpectralGroup {
    index: number
    spectralImages: Array<SpectralImage>
    individualImages: Map<string, SpectralImage>
    thumbnails: boolean
    image: string
    size: Size
    camera: Camera

    constructor(data: SpectralData) {
        this.index = 0
        this.spectralImages = data.spectralImages
        this.individualImages = data.individualImages
        this.thumbnails = data.thumbnails
        this.image = DEFAULT_TAB
        this.size = data.size
        this.camera = structuredClone(DEFAULT_CAMERA);

        if (this.spectralImages.length == 0) {
            let imageRand = this.individualImages.keys().next().value!
            this.image = imageRand
        }
    }

    get selectedImage() {
        return (this.index >= 0 && this.index < this.spectralImages.length && this.image == DEFAULT_TAB) ?
            this.spectralImages[this.index] : (this.individualImages.has(this.image)) ?
                this.individualImages.get(this.image)! : DEFAULT_IMAGE
    }

    get minWavelength() {
        return Math.min.apply(null, this.spectralImages.map((image) => image.wavelength.value || Infinity))
    }
    get maxWavelength() {
        return Math.max.apply(null, this.spectralImages.map((image) => image.wavelength.value || -Infinity))
    }
    get listGradients() {
        let i = 0
        let list_gradients = [
            "to right",
            "#000000",
        ]
        this.spectralImages.forEach((image) => {
            let [r, g, b] = nmToRGB(image.wavelength.value!)
            list_gradients.push(rgbToHex(r, g, b) + " " + (i * 94 / (this.spectralImages.length - 1) + 3) + "%")
            i++;
        })
        return list_gradients;
    }

    setIndex(index: number) {
        this.image = DEFAULT_TAB
        this.index = math.min(math.max(0, index), this.spectralImages.length - 1)

    }

    moveIndex(move: number) {
        this.image = DEFAULT_TAB
        this.index = math.min(math.max(0, this.index + move), this.spectralImages.length - 1)
    }

    increment() {
        if (this.image == DEFAULT_TAB) {
            this.moveIndex(1)
        }
    }

    decrement() {
        if (this.image == DEFAULT_TAB) {
            this.moveIndex(-1)
        }
    }

    getImageName(index: number) {
        return (index >= 0 && index < this.spectralImages.length) ? this.spectralImages[index].name : "Image " + index
    }
}

export const DEFAULT_GROUP = new SpectralGroup({
  individualImages: new Map(),
  spectralImages: [],
  size : DEFAULT_SIZE,
  thumbnails: false
})


export type Ratio = Size