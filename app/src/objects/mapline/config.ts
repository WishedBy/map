import { Material } from "../material";
import { LineMesh } from "./mesh";
import line from "./shaders/line.wgsl";


export class shaderConfig{
    device: GPUDevice

    shader = line
    bindGroups = [] as GPUBindGroup[]
    mesh: LineMesh = new LineMesh();


    bindGroupLayout: GPUBindGroupLayout

    globalBuffer: GPUBuffer

   

    constructor(device: GPUDevice, globalBuffer: GPUBuffer){
        this.device = device
        this.globalBuffer = globalBuffer
    
        this.bindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {}
                },
                {
                    binding: 1,
                    visibility: GPUShaderStage.VERTEX,
                    buffer: {
                        type: "read-only-storage" as GPUBufferBindingType
                    }
                },
            ]

        });

    

    }

    getPipeline(dss: GPUDepthStencilState, sampleCount: number): GPURenderPipeline {
        
        return this.device.createRenderPipeline({
            vertex : {
                module : this.device.createShaderModule({
                    code : line
                }),
                entryPoint : "vs_main",
                buffers: [
                    this.mesh.bufferLayout
                ]
            },
    
            fragment : {
                module : this.device.createShaderModule({
                    code : line
                }),
                entryPoint : "fs_main",
                targets : [{
                    format : "bgra8unorm" as GPUTextureFormat,
                    blend: {
                        color:{
                            operation: "add" as GPUBlendOperation,
                            srcFactor: "src-alpha" as GPUBlendFactor,
                            dstFactor: "one-minus-src-alpha" as GPUBlendFactor,
                        },
                        alpha:{
                            operation: "add" as GPUBlendOperation,
                            srcFactor: "src-alpha" as GPUBlendFactor,
                            dstFactor: "one-minus-src-alpha" as GPUBlendFactor,
                        },
                    },
                }]
            },
            multisample: {
                count: sampleCount,
            },
            primitive : {
                topology : "triangle-list",
                cullMode: 'none',
            },
    
            layout: this.device.createPipelineLayout({
                bindGroupLayouts: [this.bindGroupLayout]
            }),
            depthStencil: dss,
        });
    }


    getBindGroup(subModelBuffer: GPUBuffer): GPUBindGroup{

        
        return this.device.createBindGroup({
            layout: this.bindGroupLayout,
            entries: [
                {
                    binding: 0,
                    resource: {
                        buffer: this.globalBuffer
                    }
                },
                {
                    binding: 1,
                    resource: {
                        buffer: subModelBuffer
                    }
                },
            ]
        });
    }


}
