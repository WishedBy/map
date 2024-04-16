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
    model2d: mat2x2<f32>,
    offset2d: vec2<f32>,
    color: vec3<f32>,
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

@vertex
fn vs_main( @location(0) vertexPostion: vec2<f32>,  @location(1) vertexPostionSphere: vec3<f32>,  @location(2) colid: vec2<f32>) -> Fragment {

    var vpos = vertexPostion;

    vpos = object.model2d * vpos;
    
    vpos += object.offset2d;

    var pos = vec4<f32>(0, vpos, 1.0);


  

    var output : Fragment;
    pos = object.model * pos;
    pos = transformer.projection * transformer.view * pos;
   
    output.Position = pos;
    output.ColID = vec2<u32>(colid);



    return output;
}

@fragment
fn fs_main(frag: Fragment) -> @location(0) vec4<f32> {

    let w: f32 = object.widthNo;
    let l: f32 = object.lengthNo;
    var steps: f32 = object.fadeSteps;

    var center = i32(round(l*object.animationMod));
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