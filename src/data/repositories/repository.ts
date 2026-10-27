import type { SpectralData, SpectralImage } from "@/data/models/spectral_image";
import type { Pose } from "@/data/models/landmark";
import type { Position } from "@/data/models/coordinates";

export interface Repository {
    supportsProcessing : boolean;
    getImages : (objectPath:string) => Promise<Map<string, SpectralData>>;
    getFullImage : (objectPath:string, imageName : string) => string;
    getThumbnail : (objectPath:string, imageName : string) => string;
    computeLandmarkPosition : (objectPath:string, pose : Pose) => Promise<Position>;
    // both resolve to an object URL of the resulting PNG
    computeFalseColor : (objectPath:string, red : string, green : string, blue : string, thumb : boolean) => Promise<string>;
    computeOperation : (objectPath:string, operation : string, left : string, right : string, thumb : boolean) => Promise<string>;
}