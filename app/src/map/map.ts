
import { vec3,mat4, vec2 } from "gl-matrix";
import { Camera } from "../camera/camera";
import { MapModel } from "../objects/map/model";
import { RenderData, RenderGroup, RenderObject } from "../renderData";
import { shaderConfig as MapShaderConfig } from "../objects/map/config";
import { shaderConfig as StreamShaderConfig } from "../objects/stream/config";
import { shaderConfig as countryConfig } from "../objects/countries/config";
import { light, scene } from "../scene";
import { ImageTexture } from "../objects/ImageTexture";
import { Stepper, StepperCycleType, StepperTimerType, easeInOutCubicDouble, easeNOOP } from "../stepper";
import { StreamModel } from "../objects/stream/model";
import { CountryModel } from "../objects/countries/model";
import { CountryTexture } from "../objects/countries/texture";
import { CountryShape, MultiPolygonGeometry, shapes } from "../countries/country_shapes";
import { FeatureCollection } from "../countries/geojson";
import { picker } from "../renderer";

type mapOpts = {
    mapConfig: MapShaderConfig
}
type streamOpts = {
    streamConfig: StreamShaderConfig
}

type countryOpts = {
    countryConfig: countryConfig
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
    countryOpts: countryOpts
    map: MapModel
    countries: CountryModel
    streams: Map<string, StreamModel> = new Map<string, StreamModel>;
    observer: Camera;
    light: light = new light([-10,-10,0], 1, 0);

    rotationStepper: Stepper = new Stepper(StepperTimerType.Time, 5000, StepperCycleType.Restart, easeNOOP, true);
    sphereStepper: Stepper = new Stepper(StepperTimerType.Time, 3000, StepperCycleType.Reverse, easeInOutCubicDouble, false, true);

    vertexBbuffers: Map<string, GPUBuffer> = new Map<string, GPUBuffer>()

    rotateLast: vec3 = [0,0,0]

    streamDuration: number = 1000;

    mainMapPosition: vec3 = [0,0,0];

    picker: picker

    objectIdCounter = 0;


    constructor(device: GPUDevice, globalBuffer: GPUBuffer, mapMaterial: ImageTexture, mapMaterialDark: ImageTexture, countries: FeatureCollection, state: State, picker: picker) {
        this.device = device
        this.state = state
        this.picker = picker
        this.mapOpts = {
            mapConfig: new MapShaderConfig(device, globalBuffer, mapMaterial, mapMaterialDark)
        };
        this.streamOpts = {
            streamConfig: new StreamShaderConfig(device, globalBuffer)
        };


        let t = new CountryTexture(device)
        this.countryOpts = {
            countryConfig: new countryConfig(device, globalBuffer, t)
        };


        this.observer = new Camera(
            [-4, 0, 0], [0, 0, 0], [0, 0, -1]
        );
        this.map = new MapModel(this.mainMapPosition)

        this.countries = new CountryModel(this.mainMapPosition)
        countries.features.forEach((f, i) => {
            console.log("Mapping country shapes. "+(i+1)+" of "+countries.features.length);
            // if(f.properties?.ISO_A2 == "DE"){
                const countryID = this.newID()
                t.addCountryShapeAsLayer(countryID, f.geometry)
            // }
        });

        $(document).on("dblclick",(e: JQuery.DoubleClickEvent) => {
            this.sphereStepper.play();
        });
        

    }

    newID(): number{
        this.objectIdCounter++
        return this.objectIdCounter
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

        this.map.setRotation(rotate[0], rotate[1], rotate[2]);
        this.countries.setRotation(rotate[0], rotate[1], rotate[2]);
        this.map.update(a,b);
        this.countries.update(a,b);
        
        this.streams.forEach((s) => {
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
        };

        (() => {
            let mapv = this.mapOpts.mapConfig.mesh.getVertices();
            let objects: RenderObject[] = [];
            
            objects.push({ 
                data: this.map.getRenderModel(),
                vertexNo: this.mapOpts.mapConfig.getVerticeNo(),
                vertexOffset: 0,
            })
    
            let mapGroup: RenderGroup = {
                objects: objects,
                pickPipeline: null,
                pipeline: this.mapOpts.mapConfig.getPipeline(dss, sampleCount),
                getBindGroup: (subModelBuffer: GPUBuffer) => this.mapOpts.mapConfig.getBindGroup(subModelBuffer),
                vertexBuffer: this.getVertexBuffer(mapv, "map"),
            }
            res.groups.push(mapGroup)
        })();

        (() => {
            let dataCountries: RenderObject[] = [];
            let verticesCountries:number[] =  this.countryOpts.countryConfig.mesh.getVertices();
            let o:RenderObject = { 
                data: this.countries.getRenderModel(),
                vertexNo: this.countryOpts.countryConfig.getVerticeNo(),
                vertexOffset: 0,
            }
            dataCountries.push(o)
            let countryGroup: RenderGroup = {
                objects: dataCountries,
                pipeline: this.countryOpts.countryConfig.getPipeline(dss, sampleCount),
                pickPipeline: this.countryOpts.countryConfig.getPickPipeline(dss, sampleCount),
                getBindGroup: (subModelBuffer: GPUBuffer) => this.countryOpts.countryConfig.getBindGroup(subModelBuffer),
                vertexBuffer: this.getVertexBuffer(verticesCountries, "countries", true),
            }
            res.groups.push(countryGroup)
        })();
        
        (() => {
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
                pickPipeline: null,
                getBindGroup: (subModelBuffer: GPUBuffer) => this.streamOpts.streamConfig.getBindGroup(subModelBuffer),
                vertexBuffer: this.getVertexBuffer(vertices, "streams", true),
            }
            res.groups.push(streamsGroup)
        })();

        

        

        

        return res;
    }


}