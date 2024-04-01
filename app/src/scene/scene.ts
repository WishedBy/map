import { Camera } from "../camera/camera"
import { RenderData } from "./renderData"

export type scene = {
    update(): void
    getObserver(): Camera
    getRenderData():RenderData
}