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
    animationMod: f32,
    lengthNo: f32,
    widthNo: f32,
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
    let gradStepL: f32 = 1.0/20;
    let po: f32 = l/100*5;

    var center = i32(round(l*object.animationMod));
    let dist = abs(i32(frag.ColID.x) - center);
    var a = max(1.0-(f32(dist)*gradStepL), 0.0)*0.5;
    if(f32(frag.ColID.y) >= (w - 2) && (f32(frag.ColID.x) > po || f32(frag.ColID.x) < l-po)){
        a = 1;
    }
    return vec4<f32>(1, 0, 0, a);
}