import { mat4 } from "gl-matrix"
import { objectConfig } from "../objects/objectConfig"

export type RenderGroup = {
    config: objectConfig
    count: number
    bufferLayout: GPUVertexBufferLayout
    buffer: GPUBuffer
    data: Float32Array
}

export type RenderData = {
    viewTransform: mat4
    groups: RenderGroup[]
}