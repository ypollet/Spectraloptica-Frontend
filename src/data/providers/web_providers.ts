import type { Matrix } from "mathjs";
import type { DataProvider } from "./providers";

import axios, { type AxiosResponse } from "axios";
import type { Pose } from "../models/landmark";

export class WebProvider implements DataProvider {
    server: string;
    supportsProcessing = true;

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

    async getFalseColor(objectPath: string, red: string, green: string, blue: string, thumb: boolean): Promise<AxiosResponse> {
        const path = this.server + "/" + objectPath + "/false_color"
        return axios.get(path, { params: { r: red, g: green, b: blue, thumb: thumb }, responseType: "blob" })
    }

    async getOperation(objectPath: string, operation: string, left: string, right: string, thumb: boolean): Promise<AxiosResponse> {
        const path = this.server + "/" + objectPath + "/operation/" + operation
        return axios.get(path, { params: { left: left, right: right, thumb: thumb }, responseType: "blob" })
    }
}