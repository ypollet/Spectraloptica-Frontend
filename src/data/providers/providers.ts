import type { AxiosResponse } from "axios";
import type { Pose } from "../models/landmark";

export interface DataProvider {
        supportsProcessing: boolean;
        getImages: (objectPath: string) => Promise<AxiosResponse>;
        getFullImage : (objectPath:string, imageName : string) => string;
        getThumbnail : (objectPath:string, imageName : string) => string;
        computeLandmarkPosition : (objectPath:string, pose : Pose) => Promise<AxiosResponse>;
        getFalseColor : (objectPath:string, red : string, green : string, blue : string, thumb : boolean) => Promise<AxiosResponse>;
        getOperation : (objectPath:string, operation : string, left : string, right : string, thumb : boolean) => Promise<AxiosResponse>;
}
