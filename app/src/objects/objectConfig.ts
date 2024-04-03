

export type objectConfig = {
    shader: string
    getBindGroup(subModelBuffer: GPUBuffer): GPUBindGroup
    getPipeline(dss: GPUDepthStencilState): GPURenderPipeline
    getVerticies(subModelBuffer: GPUBuffer): GPUBuffer
    getVerticeNo(): number

}