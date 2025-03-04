import Color from "color"
import type { Coordinates, Position } from "@/data/models/coordinates"

export type Pose = {
    marker: Coordinates
    image: number
}



export class Landmark {
    id: string
    label: string
    pose: Pose
    position : Position
    color: Color
    show: boolean
    edit: boolean

    constructor(id: string, label: string, pose: Pose, position : Position, color: Color | null = null) {
        this.id = id
        this.label = label
        this.pose = pose
        this.position = position
        this.edit = false
        this.color = color || Color.rgb([Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)])
        this.show = true
    }

    equals(other : Landmark | string | null){
        if(other == null){
            return false
        }
        if(typeof other === "string"){
            return this.id == other
        }
        return this.id == other.id
    }

    toJSON() {
        return { id: this.id, label: this.label, color: this.color.hex(), pose: this.pose, position : this.position }
    }

    getId() : string {
        return this.id
    }
    getLabel() : string {
        return this.label
    }
    setLabel(label : string){
        this.label = label
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

    setPose(image : number, pose: Coordinates) {
        this.pose = {
            marker : pose,
            image : image
        }
    }
    
    getPose() : Pose {
        return this.pose
    }

    setPosition(position : Position) {
        this.position = position
    }

    getPosition() : Position {
        return this.position
    }

    
    getEdit() : boolean{
        return this.edit
    }
    setEdit(edit : boolean){
        this.edit = edit
    }
}