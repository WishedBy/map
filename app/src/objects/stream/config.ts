import { Material } from "../material";
import stream from "./shaders/stream.wgsl";


export class shaderConfig{
    device: GPUDevice
    quality: number

    shader = stream
    bindGroups = [] as GPUBindGroup[]


    bindGroupLayout: GPUBindGroupLayout

    globalBuffer: GPUBuffer
    mapMaterial: Material
    mapMaterialDark: Material

    depthStencilBuffer!: GPUTexture;
    depthStencilView!: GPUTextureView;
    depthStencilAttachment!: GPURenderPassDepthStencilAttachment;
   

    constructor(device: GPUDevice, globalBuffer: GPUBuffer, mapMaterial: Material, mapMaterialDark: Material, quality: number = 1){
        this.device = device
        this.quality = quality
        this.globalBuffer = globalBuffer
        this.mapMaterial = mapMaterial
        this.mapMaterialDark = mapMaterialDark
    
        this.bindGroupLayout = this.device.createBindGroupLayout({
            entries: [
                {
                    binding: 0,
                    visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
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

    getPipeline(dss: GPUDepthStencilState): GPURenderPipeline {
        
        return this.device.createRenderPipeline({
            vertex : {
                module : this.device.createShaderModule({
                    code : stream
                }),
                entryPoint : "vs_main",
                buffers: [
                    {
                        arrayStride: 4*4,
                        attributes: [
                            {
                                shaderLocation: 0,
                                format: "float32x2" as const,
                                offset: 0
                            },
                            {
                                shaderLocation: 1,
                                format: "float32x2" as const,
                                offset: 2*4
                            },
                        ]
                    },
                ]
            },
    
            fragment : {
                module : this.device.createShaderModule({
                    code : stream
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


    getVerticeNo(): number{
        return 6
    }
}