import type { Repository } from "./repository";
import type { ProjectData, SpectralImage } from "../models/spectral_image";

import type { DataProvider } from "../providers/providers";
import type { Position } from "../models/coordinates";
import type { Pose } from "../models/landmark";

export class DataRepository implements Repository {
    provider: DataProvider;

    constructor(provider: DataProvider) {
        this.provider = provider
    }
    computeLandmarkPosition(objectPath: string, pose: Pose) : Promise<Position> {
        return this.provider.computeLandmarkPosition(objectPath, pose).then((rest) => {
            return rest.data as Position
        })
    }

    async getImages(objectPath: string): Promise<ProjectData> {
        return this.provider.getImages(objectPath).then((res) => {
            let data = res.data as ProjectData
            data.spectralImages.forEach((spectralImage) => {
                spectralImage.image = this.getFullImage(objectPath, spectralImage.name)
                if(data.thumbnails){
                    spectralImage.thumbnail = this.getThumbnail(objectPath, spectralImage.name)
                }
            })
            console.log(data.individualImages)
            data.individualImages = new Map(Object.entries(data.individualImages))
            data.individualImages.forEach((spectralImage, label) => {
                spectralImage.image = this.getFullImage(objectPath, spectralImage.name)
                if(data.thumbnails){
                    spectralImage.thumbnail = this.getThumbnail(objectPath, spectralImage.name)
                }
            })

            return data
        })
    }

    getFullImage(objectPath: string, imageName: string): string {
        return this.provider.getFullImage(objectPath, imageName)
    }

    getThumbnail(objectPath: string, imageName: string): string {
        return this.provider.getThumbnail(objectPath, imageName)
    }
}