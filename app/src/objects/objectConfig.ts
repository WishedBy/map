

export type objectConfig = {
    shader: string
    getBindGroup(subModelBuffer: GPUBuffer): GPUBindGroup
    pipeline: GPURenderPipeline
    getVerticies(subModelBuffer: GPUBuffer): GPUBuffer
    getVerticeNo(): number

}