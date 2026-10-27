import { DEFAULT_CAMERA, DEFAULT_IMAGE, nmToRGB, rgbToHex, DEFAULT_TAB, DEFAULT_SIZE, DEFAULT_WAVELENGTH } from "@/lib/utils";
import type { Position } from "@vueuse/core";
import * as math from 'mathjs';


export type SpectralImage = {
    name: string,
    image: string,
    label: string,
    thumbnail: string,
    wavelength: Wavelength,
    cameraFilter: Filter | undefined,
    lightFilter: Filter  | undefined,
    // result of an operation or a false color, only kept for the current session
    computed?: boolean
}

export type Filter = {
    min : number | null,
    max : number | null,
    description: string
}

export type Wavelength = {
    value: number,
    bandwidth: number
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
            // computed images point to blob URLs that do not survive a reload
            individualImages: Object.fromEntries(Array.from(this.individualImages).filter(([_, image]) => !image.computed)),
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

    // starts with the thumbnail as image too, until setComputedFullImage provides the full resolution
    addComputedImage(label: string, thumbnail: string) {
        this.individualImages.set(label, {
            name: label,
            label: label,
            image: thumbnail,
            thumbnail: thumbnail,
            wavelength: DEFAULT_WAVELENGTH,
            cameraFilter: undefined,
            lightFilter: undefined,
            computed: true
        })
        this.image = label
    }

    // returns false if the image was removed in the meantime
    setComputedFullImage(label: string, image: string): boolean {
        const computed = this.individualImages.get(label)
        if (!computed?.computed) {
            return false
        }
        if (computed.image != computed.thumbnail) {
            URL.revokeObjectURL(computed.image)
        }
        // replace the entry rather than mutating it, so the viewer sees a new selected image and reloads
        this.individualImages.set(label, { ...computed, image: image })
        return true
    }

    removeComputedImage(label: string) {
        const image = this.individualImages.get(label)
        if (!image?.computed) {
            return
        }
        if (this.image == label) {
            this.image = (this.spectralImages.length > 0) ? DEFAULT_TAB : Array.from(this.individualImages.keys()).find((key) => key != label) ?? DEFAULT_TAB
        }
        this.individualImages.delete(label)
        URL.revokeObjectURL(image.thumbnail)
        if (image.image != image.thumbnail) {
            URL.revokeObjectURL(image.image)
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