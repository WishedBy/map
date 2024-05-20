import { rm } from "fs";
import { mat2, mat3, vec2, vec3 } from "gl-matrix";


export class StreamMesh {

    vertices!: number[]
    bufferLayout: GPUVertexBufferLayout

    lengthNo = 100; // segments in length

    constructor(lengthNo: number = 51) {
        this.lengthNo = lengthNo;
 
        //now define the buffer layout
        this.bufferLayout = {
            arrayStride: this.getVertexPartCount()*4,
            attributes: [
                {
                    shaderLocation: 0,
                    format: "float32x2" as const,
                    offset: 0
                },
                {
                    shaderLocation: 1,
                    format: "float32x3" as const,
                    offset: 2*4
                },
                {
                    shaderLocation: 2,
                    format: "float32x2" as const,
                    offset: 5*4
                },
            ]
        };

    }
    getVertexPartCount(): number {
        return 7;
    }

    
    getVertices(start: vec2, end: vec2, width: number): number[]{
        if(this.vertices && this.vertices.length > 0){
            return  this.vertices
        }
        let deg90 = 90*Math.PI/180;
        let angleRad = Math.atan2(end[1] - start[1], end[0] - start[0]);
        let length = Math.sqrt((start[0]-end[0])**2+(start[1]-end[1])**2);
        var r = (Math.PI/2)+0.001;

        let getBearing = (a: vec2, b: vec2): number => {
            let y = Math.sin(b[0] - a[0]) * Math.cos(b[1]);
            let x = Math.cos(a[1]) * Math.sin(b[1]) -
                  Math.sin(a[1]) * Math.cos(b[1]) * Math.cos(b[0] - a[0]);
            return Math.atan2(y, x);
        }
        let gcd = (start: vec2, end: vec2): number => {
            let lon1 = start[0];
            let lon2 = end[0];
            let lat1 = -start[1];
            let lat2 = -end[1];
            let lonDelta = lon2 - lon1;
            var a = Math.pow(Math.cos(lat2) * Math.sin(lonDelta) , 2) + Math.pow(Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(lonDelta) , 2);
            var b = Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) * Math.cos(lonDelta);
            
            return Math.atan2(Math.sqrt(a) , b) * r;
        }
        let sphere = (pos: vec2): number[] => {
            let x = pos[0];
            let y = pos[1];
            return [
                r*Math.cos(y)*Math.cos(x),
                r*Math.cos(y)*Math.sin(x),
                r*Math.sin(y),
            ]
        }

        let bearing = getBearing([start[0], -start[1]], [end[0], -end[1]]);
        let dist = gcd(start, end);

        let gcPosition = (start: vec2, d: number): vec2 => {
            let startX = start[0];
            let startY = -start[1];
            let dr = d/r;
            let y = (Math.asin( Math.sin(startY)*Math.cos(dr) + Math.cos(startY)*Math.sin(dr)*Math.cos(bearing)));

            let x = (startX + Math.atan2(Math.sin(bearing)*Math.sin(dr)*Math.cos(startY), Math.cos(dr)-Math.sin(startY)*Math.sin(y)));
            return [x, -y]
        }


        let verts: number[] = [];


        let chunkLength = length/this.lengthNo;
        let chunkDist = dist/this.lengthNo;
        let angleCWRad = (angleRad - deg90) % (Math.PI*2);
        let angleCCWRad = (angleRad + deg90) % (Math.PI*2);

        let lastPos: vec2 = start;
        let lastPosGC: vec2 = start;
        const offset = width/2


        for(let i = 0; i < this.lengthNo; i++){
            let nextPos: vec2 = [
                lastPos[0] + chunkLength * Math.cos(angleRad),
                lastPos[1] + chunkLength * Math.sin(angleRad),
            ];
            

            let lt: vec2 = [
                lastPos[0] + offset * Math.cos(angleCCWRad),
                lastPos[1] + offset * Math.sin(angleCCWRad),
            ];
            let rt: vec2 = [
                lastPos[0] + offset * Math.cos(angleCWRad),
                lastPos[1] + offset * Math.sin(angleCWRad),
            ];

            let lb: vec2 = [
                nextPos[0] + offset * Math.cos(angleCCWRad),
                nextPos[1] + offset * Math.sin(angleCCWRad),
            ];
            let rb: vec2 = [
                nextPos[0] + offset * Math.cos(angleCWRad),
                nextPos[1] + offset * Math.sin(angleCWRad),
            ];





            let nextPosGC: vec2 = gcPosition(start, chunkDist*(i+1));
            let angleRadGC = getBearing(lastPosGC, nextPosGC);
            let angleCWRadGC = (angleRadGC + deg90) % (Math.PI*2);
            let angleCCWRadGC = (angleRadGC - deg90) % (Math.PI*2);

            let ltGC: vec2 = [
                lastPosGC[0] + offset * Math.cos(angleCCWRadGC),
                lastPosGC[1] + offset * Math.sin(angleCCWRadGC),
            ];
            let rtGC: vec2 = [
                lastPosGC[0] + offset * Math.cos(angleCWRadGC),
                lastPosGC[1] + offset * Math.sin(angleCWRadGC),
            ];

            let lbGC: vec2 = [
                nextPosGC[0] + offset * Math.cos(angleCCWRadGC),
                nextPosGC[1] + offset * Math.sin(angleCCWRadGC),
            ];
            let rbGC: vec2 = [
                nextPosGC[0] + offset * Math.cos(angleCWRadGC),
                nextPosGC[1] + offset * Math.sin(angleCWRadGC),
            ];

            let uL = 0;
            let uR = 1;
            let vT = (1/this.lengthNo)*i;
            let vB = (1/this.lengthNo)*(i+1);

            // flat(2), sperical(3), alpha distances(2)
            verts.push(lt[0], lt[1],    ...sphere(ltGC), uL, vT);
            verts.push(rt[0], rt[1],    ...sphere(rtGC), uR, vT);
            verts.push(lb[0], lb[1],    ...sphere(lbGC), uL, vB);

            verts.push(lb[0], lb[1],    ...sphere(lbGC), uL, vB);
            verts.push(rt[0], rt[1],    ...sphere(rtGC), uR, vT);
            verts.push(rb[0], rb[1],    ...sphere(rbGC), uR, vB);
            lastPos = nextPos;
            lastPosGC = nextPosGC;


        }
        this.vertices = verts;
        return this.vertices;
    }
}