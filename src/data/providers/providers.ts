import type { AxiosResponse } from "axios";
import type { Pose } from "../models/landmark";

export interface DataProvider {
        getImages: (objectPath: string) => Promise<AxiosResponse>;
        getFullImage : (objectPath:string, imageName : string) => string;
        getThumbnail : (objectPath:string, imageName : string) => string;
        computeLandmarkPosition : (objectPath:string, pose : Pose) => Promise<AxiosResponse>;
}
