
import { vec3,mat4, vec2 } from "gl-matrix";
import { Camera } from "../camera/camera";
import { MapModel } from "../objects/map/model";
import { RenderData, RenderGroup, RenderObject } from "./renderData";
import { shaderConfig as MapShaderConfig } from "../objects/map/config";
import { shaderConfig as StreamShaderConfig } from "../objects/stream/config";
import { shaderConfig as LineShaderConfig } from "../objects/mapline/config";
import { light, scene } from "./scene";
import { Material } from "../objects/material";
import { Stepper, StepperCycleType, StepperTimerType, easeInOutCubicDouble, easeNOOP } from "../stepper";
import { StreamModel } from "../objects/stream/model";
import { MapLineModel } from "../objects/mapline/model";

type mapOpts = {
    mapConfig: MapShaderConfig
}
type streamOpts = {
    streamConfig: StreamShaderConfig
}
type lineOpts = {
    lineConfig: LineShaderConfig
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
    lineOpts: lineOpts
    maps: MapModel[];
    streams: Map<string, StreamModel> = new Map<string, StreamModel>;
    lines: MapLineModel[] = [];
    observer: Camera;
    light: light = new light([-10,-10,0], 1, 0);

    rotationStepper: Stepper = new Stepper(StepperTimerType.Time, 5000, StepperCycleType.Restart, easeNOOP, true);
    sphereStepper: Stepper = new Stepper(StepperTimerType.Time, 3000, StepperCycleType.Reverse, easeInOutCubicDouble, false, true);

    vertexBbuffers: Map<string, GPUBuffer> = new Map<string, GPUBuffer>()

    rotateLast: vec3 = [0,0,0]

    streamDuration: number = 1000;

    mainMapPosition: vec3 = [0,0,0];


    constructor(device: GPUDevice, globalBuffer: GPUBuffer, mapMaterial: Material, mapMaterialDark: Material, state: State) {
        this.device = device
        this.state = state
        this.mapOpts = {
            mapConfig: new MapShaderConfig(device, globalBuffer, mapMaterial, mapMaterialDark)
        };
        this.streamOpts = {
            streamConfig: new StreamShaderConfig(device, globalBuffer)
        };

        this.lineOpts = {
            lineConfig: new LineShaderConfig(device, globalBuffer)
        };


        this.observer = new Camera(
            [-5, 0, 0], [0, 0, 0], [0, 0, -1]
        );
        this.maps = [
            new MapModel(this.mainMapPosition), 
        ];



        $(document).on("dblclick",(e: JQuery.DoubleClickEvent) => {
            this.sphereStepper.play();
        });

    }

    doStream(start: vec2, end: vec2, color: vec3) {

        let mapWidth    = 2*Math.PI;
        let mapHeight   = Math.PI;
        let lon2x = (lon: number):number => {
            return lon*(mapWidth/360)
        }
        let lat2y = (lat: number):number => {
            return ((lat * -1) * (mapHeight/ 180));
        }
        
        let m = new StreamModel(
            [lon2x(start[0]), lat2y(start[1])], 
            [lon2x(end[0]), lat2y(end[1])],
            color,
            this.mainMapPosition,
            this.streamDuration
        )
        
        let k = start.join('|')+'|'+end.join('|')+Date.now()

        this.streams.set(k, m)

        setTimeout(() => {this.streams.delete(k)}, this.streamDuration*1.02);

    }
    addLine(start: vec2, end: vec2, color: vec3) {

        let mapWidth    = 2*Math.PI;
        let mapHeight   = Math.PI;
        let lon2x = (lon: number):number => {
            return lon*(mapWidth/360)
        }
        let lat2y = (lat: number):number => {
            return ((lat * -1) * (mapHeight/ 180));
        }
        
        let m = new MapLineModel(
            [lon2x(start[0]), lat2y(start[1])], 
            [lon2x(end[0]), lat2y(end[1])],
            color,
            this.mainMapPosition
        )

        this.lines.push(m);
        
    }

    update() {

        this.observer.update();
        let a = this.rotationStepper.step();
        let b = this.sphereStepper.step();
        let rotationPauseCount = 0
        // b = 1;
        if((((a == 0 || a == 1) && this.rotationStepper.playing()) || !this.rotationStepper.playing()) && b < 0.3){
            rotationPauseCount++;
        }

        let rotate = this.rotateLast;

        if(this.state.leftMousePressed){
            rotationPauseCount++;
            rotate[1] += (this.state.mousePosCurrent[1] - this.state.mousePosLast[1])/100;
            rotate[2] += -1 * (this.state.mousePosCurrent[0] - this.state.mousePosLast[0]) / 100;
        }

        
        if(rotationPauseCount > 0 && this.rotationStepper.playing()){
            this.rotationStepper.pause();
        }else if(rotationPauseCount == 0 && !this.rotationStepper.playing()){
            this.rotationStepper.play();
        }

        this.maps.forEach((map) => {
            map.setRotation(rotate[0], rotate[1], rotate[2]);
            map.update(a,b);
        });
        this.streams.forEach((s) => {
            s.setRotation(rotate[0], rotate[1], rotate[2]);
            s.update(a, b);
        });
        this.lines.forEach((s) => {
            s.setRotation(rotate[0], rotate[1], rotate[2]);
            s.update(a, b);
        });

        this.rotateLast = rotate
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
            if(buffer.size >= vertices.length*4 && !overwrite){
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
        let mapv = this.mapOpts.mapConfig.mesh.getVertices();
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
            vertexBuffer: this.getVertexBuffer(vertices, "streams", true),
        }
        res.groups.push(streamsGroup)


        
        let dataLines: RenderObject[] = [];
        let verticesLines:number[] = [];
        this.lines.forEach((l, i) => {
            let verts = l.getVertices();
            let o:RenderObject = { 
                data: l.getRenderModel(),
                vertexNo: l.getVertexNo(),
                vertexOffset: verticesLines.length/l.getVertexPartCount(),
            }
            dataLines.push(o)
            verticesLines.push(...verts);
        });
        let lineGroup: RenderGroup = {
            objects: dataLines,
            pipeline: this.lineOpts.lineConfig.getPipeline(dss, sampleCount),
            getBindGroup: (subModelBuffer: GPUBuffer) => this.lineOpts.lineConfig.getBindGroup(subModelBuffer),
            vertexBuffer: this.getVertexBuffer(verticesLines, "lines"),
        }
        res.groups.push(lineGroup)

        return res;
    }


}