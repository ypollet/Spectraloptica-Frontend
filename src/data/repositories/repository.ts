import type { ProjectData, SpectralImage } from "@/data/models/spectral_image";
import type { Pose } from "@/data/models/landmark";
import type { Position } from "@/data/models/coordinates";

export interface Repository {
    getImages : (objectPath:string) => Promise<ProjectData>;
    getFullImage : (objectPath:string, imageName : string) => string;
    getThumbnail : (objectPath:string, imageName : string) => string;
    computeLandmarkPosition : (objectPath:string, pose : Pose) => Promise<Position>;
}