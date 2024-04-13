import { mat4 } from "gl-matrix"

export type RenderObject = {
    data: Float32Array
    vertexNo: number
    vertexOffset: number

}
export type RenderGroup = {
    objects: RenderObject[]
    vertexBuffer: GPUBuffer
    pipeline: GPURenderPipeline
    getBindGroup(subModelBuffer: GPUBuffer): GPUBindGroup
}

export type RenderData = {
    viewTransform: mat4
    groups: Array<RenderGroup>
}