import { CustomTexture } from "../../customtexture";
import { TestMesh } from "./mesh";
import test from "./shaders/test.wgsl";


export class shaderConfig{
    device: GPUDevice

    shader = test
    bindGroups = [] as GPUBindGroup[]
    mesh: TestMesh = new TestMesh();


    bindGroupLayout: GPUBindGroupLayout

    globalBuffer: GPUBuffer

    texture: CustomTexture

   

    constructor(device: GPUDevice, globalBuffer: GPUBuffer, texture: CustomTexture){
        this.device = device
        this.globalBuffer = globalBuffer
        this.texture = texture
    
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
                {
                    binding: 2,
                    visibility: GPUShaderStage.FRAGMENT,
                    texture: {
                    }
                },
                {
                    binding: 3,
                    visibility: GPUShaderStage.FRAGMENT,
                    sampler: {}
                },
            ]

        });

    

    }

    getPipeline(dss: GPUDepthStencilState, sampleCount: number): GPURenderPipeline {
        
        return this.device.createRenderPipeline({
            vertex : {
                module : this.device.createShaderModule({
                    code : test
                }),
                entryPoint : "vs_main",
                buffers: [
                    this.mesh.bufferLayout
                ]
            },
    
            fragment : {
                module : this.device.createShaderModule({
                    code : test
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
                {
                    binding: 2,
                    resource: this.texture.view
                },
                {
                    binding: 3,
                    resource: this.texture.sampler
                },
            ]
        });
    }


}