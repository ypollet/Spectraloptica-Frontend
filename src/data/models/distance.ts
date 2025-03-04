import { Landmark } from "@/data/models/landmark"
import Color from "color"
import * as math from "mathjs"

export class Distance {
    label : string
    landmarks : Array<Landmark>
    color: Color
    edit_label: boolean
    edit_distance: boolean
    show : boolean
    
    constructor(label: string, landmarks : Array<Landmark> | null = null, color: Color | null = null){
        this.label = label
        this.landmarks = landmarks || new Array()
        this.edit_label = false
        this.edit_distance = false
        this.show = true
        this.color = color || Color.rgb([Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)])
    }

    get distance() : [number, number][] | undefined{
        if(this.landmarks.length < 2 ){
            return undefined
        }
        let distance : [number, number][] = new Array()
        for(let i = 1; i < this.landmarks.length; i++){
            distance.push([
                math.abs(this.landmarks[i].position.x - this.landmarks[i-1].position.x),
                math.abs(this.landmarks[i].position.y - this.landmarks[i-1].position.y)
            ])
        }
        return distance
    }

    get distancePx() : [number, number][] | undefined{
        if(this.landmarks.length < 2 ){
            return undefined
        }
        let distance : [number, number][] = new Array()
        for(let i = 1; i < this.landmarks.length; i++){
            distance.push([
                math.abs(this.landmarks[i].pose.marker.x - this.landmarks[i-1].pose.marker.x),
                math.abs(this.landmarks[i].pose.marker.y - this.landmarks[i-1].pose.marker.y)
            ])
        }
        return distance
    }

    in(landmark : Landmark | string) : boolean{
        return this.landmarks.some(e => e.equals(landmark))
    }

    reset() : void {
        this.landmarks = new Array<Landmark>()
    }

    remove(landmark : Landmark | string){
        this.landmarks = this.landmarks.filter(e => !e.equals(landmark))
    }

    getColorHEX() : string{
        return this.color.hex()
    }
    setColorHEX(color: string) {
        this.color = Color(color)
    }
    setColorRGB(color: number[]) {
        if (color.length < 3) {
            return
        }
        this.color = Color.rgb(color[0], color[1], color[2])
    }

    toJSON() {
        return { label: this.label, color: this.color.hex(), landmarks : this.landmarks.map((x) => x.toJSON())}
    }
}