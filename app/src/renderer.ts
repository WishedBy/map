
import map from "./objects/map/shaders/map.wgsl";
import { mat4 } from "gl-matrix";
import { MapMesh } from "./objects/map/mesh";
import $ from "jquery";
import { Material } from "./objects/material";
import { scene } from "./scene/scene";

export class Renderer {

    canvas: HTMLCanvasElement;
    scene: scene

    // Device/Context objects
    device: GPUDevice;
    context!: GPUCanvasContext;
    format!: GPUTextureFormat;

    // Pipeline objects
    globalBuffer!: GPUBuffer;


    //a little dodgy but let's do this for not
    t: number = 0.0;

    
    depthStencilState!: GPUDepthStencilState;
    depthStencilBuffer!: GPUTexture;
    depthStencilView!: GPUTextureView;
    depthStencilAttachment!: GPURenderPassDepthStencilAttachment;

    multisampleTexture!:GPUTexture;

    sampleCount = 1;


    constructor(canvas: HTMLCanvasElement, device: GPUDevice, sceneBuilder: (b: GPUBuffer) => scene){
        this.canvas = canvas;
        this.device = device;
        this.t = 0.0; 

        this.globalBuffer = this.device.createBuffer({
            size: (64 * 2)+20+12,// +12 is alignment trailer
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        
        this.scene = sceneBuilder(this.globalBuffer);
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight
        $(window).on("resize", async () => {
            this.canvas.width = Math.max(1, Math.min(window.innerWidth, this.device.limits.maxTextureDimension2D));
            this.canvas.height = Math.max(1, Math.min(window.innerHeight, this.device.limits.maxTextureDimension2D));
            await this.makeDepthBufferResources();
        })
    }

    async Initialize() {

        await this.setupDevice();
        await this.makeDepthBufferResources();
        
    }

    async setupDevice() {

        //context: similar to vulkan instance (or OpenGL context)
        this.context = <GPUCanvasContext> this.canvas.getContext("webgpu");
        this.format = "bgra8unorm";
        this.context.configure({
            device: this.device,
            format: this.format,
            alphaMode: "opaque"
        });

    }


    
        

    async makeDepthBufferResources() {

        this.depthStencilState = {
            format: "depth24plus-stencil8",
            depthWriteEnabled: true,
            depthCompare: "less-equal",
        };

        const size: GPUExtent3D = {
            width: this.canvas.width,
            height: this.canvas.height,
            depthOrArrayLayers: 1
        };
        const depthBufferDescriptor: GPUTextureDescriptor = {
            size: size,
            format: "depth24plus-stencil8",
            usage: GPUTextureUsage.RENDER_ATTACHMENT,
            sampleCount: this.sampleCount
        }
        this.depthStencilBuffer = this.device.createTexture(depthBufferDescriptor);

        const viewDescriptor: GPUTextureViewDescriptor = {
            format: "depth24plus-stencil8",
            dimension: "2d",
            aspect: "all"
        };
        this.depthStencilView = this.depthStencilBuffer.createView(viewDescriptor);
        
        this.depthStencilAttachment = {
            view: this.depthStencilView,
            depthClearValue: 1.0,
            depthLoadOp: "clear",
            depthStoreOp: "store",

            stencilLoadOp: "clear",
            stencilStoreOp: "discard"
        };

    }



    render = () => {
        

        //make transforms
        const projection = mat4.create();
        mat4.perspective(projection, Math.PI/4, this.canvas.width/this.canvas.height, 0.1, Infinity);


        this.scene.update()
        var renderData = this.scene.getRenderData(this.depthStencilState, this.sampleCount)
        const view = renderData.viewTransform;

        
 
        this.device.queue.writeBuffer(this.globalBuffer, 0, <ArrayBuffer>view); 
        this.device.queue.writeBuffer(this.globalBuffer, 64, <ArrayBuffer>projection); 
        this.device.queue.writeBuffer(this.globalBuffer, 128, this.scene.getLight().getBuffer()); 

        


        const commandEncoder : GPUCommandEncoder = this.device.createCommandEncoder();
        const canvasTexture : GPUTexture = this.context.getCurrentTexture();
        const canvasTextureView : GPUTextureView = canvasTexture.createView();

        let reslvTarget: GPUTextureView|null = null;
        let renderView: GPUTextureView = canvasTextureView;
        if(this.sampleCount > 1){
            if (!this.multisampleTexture || (
                this.multisampleTexture.width !== canvasTexture.width ||
                this.multisampleTexture.height !== canvasTexture.height)
            ) {
                if (this.multisampleTexture) {
                    this.multisampleTexture.destroy();
                }
                this.multisampleTexture = this.device.createTexture({
                    format: canvasTexture.format,
                    usage: GPUTextureUsage.RENDER_ATTACHMENT,
                    size: [canvasTexture.width, canvasTexture.height],
                    sampleCount: this.sampleCount,
                });
            }

            reslvTarget = canvasTextureView
            renderView = this.multisampleTexture.createView()
        }
        
        //renderpass: holds draw commands, allocated from command encoder
        const renderpass : GPURenderPassEncoder = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: renderView,
                resolveTarget:reslvTarget||undefined,
                clearValue: {r: 0.0, g: 0.0, b: 0.0, a: 1.0},
                loadOp: "clear" as const,
                storeOp: "store" as const
            }],
            depthStencilAttachment: this.depthStencilAttachment,
        });
        
        for(let i = 0; i < renderData.groups.length; i++){
            let group = renderData.groups[i];
            renderpass.setPipeline(group.pipeline);
            renderpass.setVertexBuffer(0, group.vertexBuffer);
            for(let j = 0; j < group.objects.length; j++){
                let d = group.objects[j];
                let bsize = d.data.byteLength + (16-(d.data.byteLength%16));
                if(bsize < 144){
                    bsize = 144
                }
                let buffer = this.device.createBuffer({
                    size: bsize,
                    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
                });
                
                this.device.queue.writeBuffer(buffer, 0, <ArrayBuffer>d.data);
                buffer.unmap();
                renderpass.setBindGroup(0, group.getBindGroup(buffer));
                renderpass.draw(d.vertexNo, 1, d.vertexOffset);
            }
        }
        renderpass.end();
    
        this.device.queue.submit([commandEncoder.finish()]);

        requestAnimationFrame(this.render);
    }
    
}