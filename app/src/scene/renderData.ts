import { mat4 } from "gl-matrix"
import { objectConfig } from "../objects/objectConfig"

export type RenderGroup = {
    config: objectConfig
    count: Number
}

export type RenderData = {
    viewTransform: mat4
    data: Float32Array
    groups: RenderGroup[]
}