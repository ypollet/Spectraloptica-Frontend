// stackoptica - 3D Viewer on calibrated images - Frontend

// Copyright (C) 2024 Yann Pollet, Royal Belgian Institute of Natural Sciences

//

// This program is free software: you can redistribute it and/or

// modify it under the terms of the GNU General Public License as

// published by the Free Software Foundation, either version 3 of the

// License, or (at your option) any later version.

// 

// This program is distributed in the hope that it will be useful, but

// WITHOUT ANY WARRANTY; without even the implied warranty of

// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU

// General Public License for more details.

//

// You should have received a copy of the GNU General Public License

// along with this program. If not, see <http://www.gnu.org/licenses/>.

import type { DataProvider } from './providers';

import axios, { type AxiosResponse } from 'axios';
import type { Pose } from '../models/landmark';

export class OrthancProvider implements DataProvider {
    server: string;

    constructor(server: string) {
        this.server = server
    }

    async getImages(objectPath: string): Promise<AxiosResponse> {
        const path = this.server + '/spectraloptica/' + objectPath +'/images';
        return axios.get(path)
    }

    getFullImage(objectPath: string, imageName : string): string {
        const path = this.server + '/spectraloptica/' + imageName + '/full-image'
        return path
    }

    getThumbnail(objectPath: string, imageName : string) {
        const path = this.server + '/spectraloptica/' + imageName + '/thumbnail'
        return path
    }

    async computeLandmarkPosition(objectPath: string, pose: Pose) {
        const path = this.server + '/spectraloptica/' + pose.image.name +'/position?x=' + pose.marker.x + '&y=' + pose.marker.y;
        return axios.get(path)
    }


    

}