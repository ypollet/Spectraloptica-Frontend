import { DEFAULT_CAMERA, DEFAULT_IMAGE, nmToRGB, rgbToHex, DEFAULT_TAB, DEFAULT_SIZE } from "@/lib/utils";
import type { Position } from "@vueuse/core";
import * as math from 'mathjs';


export type SpectralImage = {
    name: string,
    image: string,
    label: string,
    thumbnail: string,
    wavelength: Wavelength,
    cameraFilter: Filter | undefined,
    lightFilter: Filter  | undefined
}

export type Filter = {
    type: string,
    value: number,
    band: [number | null, number | null]
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
        this.spectralImages = structuredClone(data.spectralImages)
        this.individualImages = structuredClone(data.individualImages)
        this.thumbnails = data.thumbnails
        this.image = DEFAULT_TAB
        this.size = structuredClone(data.size)

        this.camera = structuredClone(DEFAULT_CAMERA);

        if (this.spectralImages.length == 0) {
            let imageRand = this.individualImages.keys().next().value!
            this.image = imageRand
        }
    }

    toJSON() {
        return {
            spectralImages: this.spectralImages,
            individualImages: Object.fromEntries(this.individualImages),
            thumbnails: this.thumbnails,
            size: this.size
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
        const n = this.spectralImages.length
        const stops = this.spectralImages.map((image, i) => {
            const [r, g, b] = nmToRGB(image.wavelength.value!)
            const pos = n > 1 ? i * 94 / (n - 1) + 3 : 50
            return `${rgbToHex(r, g, b)} ${pos}%`
        })
        return `linear-gradient(to right, #000000, ${stops.join(", ")})`
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
    size: structuredClone(DEFAULT_SIZE),
    thumbnails: false
})


export type Ratio = Size