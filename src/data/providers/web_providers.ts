import type { Matrix } from "mathjs";
import type { DataProvider } from "./providers";

import axios, { type AxiosResponse } from "axios";
import type { Pose } from "../models/landmark";

export class WebProvider implements DataProvider {
    server: string;

    constructor(server: string) {
        this.server = server
    }

    async getImages(objectPath: string): Promise<AxiosResponse> {
        const path = this.server + "/" + objectPath +'/images';
        return axios.get(path)
    }

    getFullImage(objectPath: string, imageName : string): string {
        const path = this.server + "/" + objectPath + '/' + imageName + "/full-image"
        return path
    }

    getThumbnail(objectPath: string, imageName : string): string {
        const path = this.server + "/" + objectPath + '/' + imageName + "/thumbnail"
        return path
    }

    async computeLandmarkPosition(objectPath: string, pose : Pose): Promise<AxiosResponse> {
        const path = this.server + "/" + objectPath +'/position?x=' + pose.marker.x + "&y=" + pose.marker.y;
        return axios.get(path)
    }
}