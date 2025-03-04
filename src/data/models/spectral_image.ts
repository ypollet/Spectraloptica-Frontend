export type SpectralImage = {
    name: string,
    image: string,
    thumbnail: string,
    wavelength: Wavelength,
    filter : Filter
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

export type ProjectData = {
    spectralImages: Array<SpectralImage>,
    individualImages: Map<string, SpectralImage>,
    size: Size,
    thumbnails : boolean
}

export type Ratio = {
    ratioH: number,
    ratioW: number
}