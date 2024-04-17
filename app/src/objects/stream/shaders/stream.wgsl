struct light{
    lightPosition: vec3<f32>,
    diffuseStrength: f32,
    ambientIntensity: f32,
}
struct TransformData {
    view: mat4x4<f32>,
    projection: mat4x4<f32>,
    light: light
};

struct model {
    model: mat4x4<f32>,
    color: vec3<f32>,
    streamPos: f32,
    animationMod: f32,
    lengthNo: f32,
    widthNo: f32,
    fadeSteps: f32,
};


@binding(0) @group(0) var<uniform> transformer: TransformData;


@binding(1) @group(0) var<storage, read> object: model;



struct Fragment {
    @builtin(position) Position : vec4<f32>,
    @location(0) @interpolate(flat) ColID : vec2<u32>,

};

const pi = 3.14159265359;
const halfpi = pi/2;

@vertex
fn vs_main( @location(0) vertexPostion: vec2<f32>,  @location(1) vertexPostionSphere: vec3<f32>,  @location(2) colid: vec2<f32>) -> Fragment {

    var vpos = vertexPostion;


    var pos = vec4<f32>(0, vpos, 1.0);

    var m = object.animationMod;
    var m1 = 0.0;
    var m2 = 0.0;
    if(m <= 0.5){
        m1 = (m*2);
    }else{
        m1 = 1;
        m2 = (m*2)-1;
    }
    var r = halfpi;

    var x = 0.0;
    var y = pos.y;
    var z = pos.z;
    if(m == 1){
        x = -1*vertexPostionSphere.x;
        y = vertexPostionSphere.y;
        z = vertexPostionSphere.z;
    }else if(m > 0){
        x = -1 * ((r*cos(pos.y)*m1*(1-m2) + vertexPostionSphere.x*m2));
        y = r*sin(pos.y)*m1*(1-m2) + vertexPostionSphere.y*m2;
        z = (1-m2)*pos.z + vertexPostionSphere.z*m2;
        y = ((1-m1)*pos.y) + (y);
    }
  
    var npos = vec4<f32>(x, y, z, 1.0);

    var output : Fragment;
    npos = object.model * npos;
    npos = transformer.projection * transformer.view * npos;
   
    output.Position = npos;
    output.ColID = vec2<u32>(colid);



    return output;
}

@fragment
fn fs_main(frag: Fragment) -> @location(0) vec4<f32> {

    let w: f32 = object.widthNo;
    let l: f32 = object.lengthNo;
    var steps: f32 = object.fadeSteps;

    var center = i32(round(l*object.streamPos));
    if(f32(center) < steps){
        steps = f32(center);
    }
    if(f32(center) > l-steps){
        steps = l-f32(center);
    }
    let dist = abs(i32(frag.ColID.x) - center);
    let gradStepL: f32 = 1.0/steps;
    var a = max(1.0-(f32(dist)*gradStepL), 0.0)*0.5;
    var r = object.color.x;
    if(r >= 0.5){
        r = 1;
    } else{
        r = 0;
    }
    var g = object.color.y;
    if(g >= 0.5){
        g = 1;
    } else{
        g = 0;
    }
    var b = object.color.z;
    if(b >= 0.5){
        b = 1;
    } else{
        b = 0;
    }
    return vec4<f32>(r, g, b, a);
}