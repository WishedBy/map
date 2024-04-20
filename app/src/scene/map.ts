
import { vec3,mat4, vec2 } from "gl-matrix";
import { Camera } from "../camera/camera";
import { MapModel } from "../objects/map/model";
import { RenderData, RenderGroup, RenderObject } from "./renderData";
import { shaderConfig as MapShaderConfig } from "../objects/map/config";
import { shaderConfig as StreamShaderConfig } from "../objects/stream/config";
import { light, scene } from "./scene";
import { Material } from "../objects/material";
import { Stepper, StepperCycleType, StepperTimerType, easeInOutCubicDouble, easeNOOP } from "../stepper";
import { StreamModel } from "../objects/stream/model";

type mapOpts = {
    mapConfig: MapShaderConfig
}
type streamOpts = {
    streamConfig: StreamShaderConfig
}

export class State {
    leftMousePressed: boolean = false;
    mousePosStart: vec2 = [0,0]
    mousePosCurrent: vec2 = [0,0]
    mousePosLast: vec2 = [0,0]
}

export class MapScene implements scene {
    device: GPUDevice
    state: State
    mapOpts: mapOpts
    streamOpts: streamOpts
    maps: MapModel[];
    streams: StreamModel[] = [];
    observer: Camera;
    light: light = new light([-10,-10,0], 1, 0);

    rotationStepper: Stepper = new Stepper(StepperTimerType.Time, 5000, StepperCycleType.Restart, easeNOOP, true);
    sphereStepper: Stepper = new Stepper(StepperTimerType.Time, 7000, StepperCycleType.Reverse, easeInOutCubicDouble, false, true);

    vertexBbuffers: Map<string, GPUBuffer> = new Map<string, GPUBuffer>()


    constructor(device: GPUDevice, globalBuffer: GPUBuffer, mapMaterial: Material, mapMaterialDark: Material, state: State) {
        this.device = device
        this.state = state
        this.mapOpts = {
            mapConfig: new MapShaderConfig(device, globalBuffer, mapMaterial, mapMaterialDark)
        };
        this.streamOpts = {
            streamConfig: new StreamShaderConfig(device, globalBuffer, mapMaterial, mapMaterialDark)
        };


        this.observer = new Camera(
            [-5, 0, 0], [0, 0, 0], [0, 0, -1]
        );
        let mapPosition: vec3 = [0,0,0];
        this.maps = [
            new MapModel(mapPosition), 
        ];

        let mapWidth    = 2*Math.PI;
        let mapHeight   = Math.PI;
        let lon2x = (lon: number):number => {
            return lon*(mapWidth/360)
        }
        let lat2y = (lat: number):number => {
            return ((lat * -1) * (mapHeight/ 180));
        }

        this.streams = [
            new StreamModel(
                [lon2x(6.572019), lat2y(53.212365)], 
                [lon2x(-63.583266), lat2y(-54.751260)],
            ), 
            // new StreamModel(
            //     [lon2x(-63.583266), lat2y(-54.751260)],
            //     [lon2x(6.572019), lat2y(53.212365)], 
            // ), 
        ];


        $(document).on("dblclick",(e: JQuery.DoubleClickEvent) => {
            this.sphereStepper.play();
        });

    }
    update() {

        this.observer.update();
        let a = this.rotationStepper.step();
        let b = this.sphereStepper.step();
        // b = 1;
        this.maps.forEach((map) => {
            if(this.state.leftMousePressed){
                let dx = this.state.mousePosCurrent[0] - this.state.mousePosLast[0];
                let dy = this.state.mousePosCurrent[1] - this.state.mousePosLast[1];
                
                map.setRotation(0, map.yAngle + (dy/500)*-1, map.xAngle + (dx/500));
            }
            map.update(a,b);
        });
        this.streams.forEach((s) => {
            if(this.state.leftMousePressed){
                let dx = this.state.mousePosCurrent[0] - this.state.mousePosLast[0];
                let dy = this.state.mousePosCurrent[1] - this.state.mousePosLast[1];
                
                s.setRotation(0, s.yAngle + (dy/500)*-1, s.xAngle + (dx/500));
            }
            s.update(a, b);
        });

        this.state.mousePosLast = this.state.mousePosCurrent
    }

    getLight(): light {
        return this.light;
    }
    getObserver(): Camera {
        return this.observer;
    }

    getVertexBuffer(vertices: number[], id: string, overwrite: boolean = false): GPUBuffer{
        if(this.vertexBbuffers.has(id)){
            let buffer = this.vertexBbuffers.get(id) as GPUBuffer;
            if(buffer.size >= vertices.length*4){
                if(overwrite){
                    //Buffer has been created, now load in the vertices
                    new Float32Array(buffer.getMappedRange()).set(vertices);
                    buffer.unmap();
                }
                return buffer;
            }else{
                this.vertexBbuffers.delete(id)
            }


        }

        const descriptor: GPUBufferDescriptor = {
            size: vertices.length*4,
            usage: GPUBufferUsage.VERTEX,
            mappedAtCreation: true 
        };
        let buffer = this.device.createBuffer(descriptor);
        
        //Buffer has been created, now load in the vertices
        new Float32Array(buffer.getMappedRange()).set(vertices);
        buffer.unmap();
        this.vertexBbuffers.set(id, buffer)
        return buffer
    }

    getRenderData(dss: GPUDepthStencilState, sampleCount: number):RenderData{
        var res = { 
            viewTransform: this.observer.getView(),
            groups: [] as RenderGroup[], 
        }
        let mapv = this.mapOpts.mapConfig.mesh.getVertices(1);
        let objects: RenderObject[] = [];
        this.maps.forEach((map) => {
            let o:RenderObject = { 
                data: map.getRenderModel(),
                vertexNo: this.mapOpts.mapConfig.getVerticeNo(),
                vertexOffset: 0,
            }
            objects.push(o)

        });
        let mapGroup: RenderGroup = {
            objects: objects,
            pipeline: this.mapOpts.mapConfig.getPipeline(dss, sampleCount),
            getBindGroup: (subModelBuffer: GPUBuffer) => this.mapOpts.mapConfig.getBindGroup(subModelBuffer),
            vertexBuffer: this.getVertexBuffer(mapv, "map"),
        }
        res.groups.push(mapGroup)





        

        
        let dataStreams: RenderObject[] = [];
        let vertices:number[] = [];
        this.streams.forEach((stream, i) => {
            let verts = stream.getVertices();
            let o:RenderObject = { 
                data: stream.getRenderModel(),
                vertexNo: stream.getVertexNo(),
                vertexOffset: vertices.length/stream.getVertexPartCount(),
            }
            dataStreams.push(o)
            vertices.push(...verts);
        });
        let streamsGroup: RenderGroup = {
            objects: dataStreams,
            pipeline: this.streamOpts.streamConfig.getPipeline(dss, sampleCount),
            getBindGroup: (subModelBuffer: GPUBuffer) => this.streamOpts.streamConfig.getBindGroup(subModelBuffer),
            vertexBuffer: this.getVertexBuffer(vertices, "lines"),
        }
        res.groups.push(streamsGroup)

        return res;
    }


}