import { vec3 } from "gl-matrix"
import { Camera } from "../camera/camera"
import { RenderData } from "./renderData"

export class light {
    position: vec3
    diffuseStrength: number
    ambientIntensity: number

    constructor(position: vec3, diffuseStrength: number, ambientIntensity: number){
        this.position = position
        this.diffuseStrength = diffuseStrength
        this.ambientIntensity = ambientIntensity
    }

    getBuffer(): ArrayBuffer {
        return new Float32Array([...Array.from(this.position), this.diffuseStrength, this.ambientIntensity])
    }
}
export type scene = {
    update(): void
    getObserver(): Camera
    getRenderData():RenderData
    getLight(): light
}