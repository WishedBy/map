
import { mat4, vec2, vec3, vec4 } from "gl-matrix";
import $ from "jquery";
import { scene } from "./scene";
export type picker = (pos: vec2) => Promise<vec4|null>
export class Renderer {

    canvas: HTMLCanvasElement;
    scene: scene

    // Device/Context objects
    device: GPUDevice;
    context!: GPUCanvasContext;
    format!: GPUTextureFormat;

    // Pipeline objects
    globalBuffer!: GPUBuffer;

    pickBuffer: GPUBuffer


    
    depthStencilState!: GPUDepthStencilState;
    depthStencilBuffer!: GPUTexture;
    depthStencilView!: GPUTextureView;
    depthStencilAttachment!: GPURenderPassDepthStencilAttachment;

    multisampleTexture!:GPUTexture;

    sampleCount = 1;

    running = true;

    currentPickTexSize = [0,0];

    pickTexture: GPUTexture 

    mousePos:vec2  = [0,0]
    

    constructor(canvas: HTMLCanvasElement, device: GPUDevice, sceneBuilder: (b: GPUBuffer, picker: picker) => scene){
        this.canvas = canvas;
        this.device = device;
        this.globalBuffer = this.device.createBuffer({
            size: (64 * 2)+20+12,// +12 is alignment trailer
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
        });
        this.pickBuffer = device.createBuffer({
            size: 16,
            usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST,
        });
    
        
        this.scene = sceneBuilder(this.globalBuffer, this.pick);
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight

        this.canvas.addEventListener('click', async (e) => {
            let res = await this.pick(this.mousePos);
            console.log(res)
        });
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mousePos = [e.clientX - rect.left,  e.clientY - rect.top];
        });

        this.pickTexture = this.device.createTexture({
            size: [window.innerWidth, window.innerHeight, 1],
            format: "rgba32float" as GPUTextureFormat,
            usage:
              GPUTextureUsage.COPY_SRC | 
              GPUTextureUsage.RENDER_ATTACHMENT,
        });

        $(window).on("resize", async () => {
            let w = Math.max(1, Math.min(window.innerWidth, this.device.limits.maxTextureDimension2D));
            let h = Math.max(1, Math.min(window.innerHeight, this.device.limits.maxTextureDimension2D));
            this.canvas.width = w;
            this.canvas.height = h;
            
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


    run = async () => {
        await this.render();
        if(this.running){
            requestAnimationFrame(this.run)
        }
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



    render = async () => {
        

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

    }


    pick = async (pos: vec2): Promise<vec4|null> => {
        if (pos[0] < 0 || pos[1] < 1 || pos[0] >= this.canvas.width || pos[1] >= this.canvas.height) {
          return null;
        }
        if(this.pickTexture.width != this.canvas.width || this.pickTexture.height != this.canvas.height){

            this.pickTexture.destroy();
            this.pickTexture = this.device.createTexture({
                size: [this.canvas.width, this.canvas.height, 1],
                format: "rgba32float" as GPUTextureFormat,
                usage:
                  GPUTextureUsage.COPY_SRC | 
                  GPUTextureUsage.RENDER_ATTACHMENT,
            });
        }

        let tex = this.pickTexture

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

        //renderpass: holds draw commands, allocated from command encoder
        const renderpass : GPURenderPassEncoder = commandEncoder.beginRenderPass({
            colorAttachments: [{
                view: tex.createView(),
                clearValue: {r: 0, g: 0, b: 0, a: 0},
                loadOp: "clear" as const,
                storeOp: "store" as const
            }],
            depthStencilAttachment: this.depthStencilAttachment,
        });
        
        for(let i = 0; i < renderData.groups.length; i++){
            let group = renderData.groups[i];

            if(group.pickPipeline == undefined || group.pickPipeline == null ){
                continue
            }
            renderpass.setPipeline(group.pickPipeline);
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
    
        commandEncoder.copyTextureToBuffer({
          texture: tex,
          origin: pos,
        }, {
          buffer: this.pickBuffer,
        }, {
          width: 1,
        });
        this.device.queue.submit([commandEncoder.finish()]);
        await this.pickBuffer.mapAsync(GPUMapMode.READ, 0, 16);
        let picked = new Float32Array(this.pickBuffer.getMappedRange(0, 16))
        let res: vec4 = [picked[0],picked[1],picked[2],picked[3]];
        this.pickBuffer.unmap();
        return res;
    }

}