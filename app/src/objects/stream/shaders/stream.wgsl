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
    fadeDist: f32,
};


@binding(0) @group(0) var<uniform> transformer: TransformData;


@binding(1) @group(0) var<storage, read> object: model;



struct Fragment {
    @builtin(position) Position : vec4<f32>,
    @location(0) @interpolate(flat) Color : vec3<f32>,
    @location(1) @interpolate(linear) uv : vec2<f32>,

};

// const alphaTable = array<f32, 0>(

// );

const pi = 3.14159265359;
const halfpi = pi/2;
const r = halfpi+0.001;

@vertex
fn vs_main( @location(0) vertexPostion: vec2<f32>,  @location(1) vertexPostionSphere: vec3<f32>,  @location(2) uv: vec2<f32>) -> Fragment {

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
    x -= 0.001 * (1-m1);
  
    var npos = vec4<f32>(x, y, z, 1.0);

    var output : Fragment;
    npos = object.model * npos;
    npos = transformer.projection * transformer.view * npos;
    output.Position = npos;

    
    var uvCenter = vec2<f32>(0.5, object.streamPos);
    var fd = object.fadeDist;
    if(uvCenter.y < fd){
        fd = uvCenter.y;
    }
    if(uvCenter.y > 1-fd){
        fd = 1-uvCenter.y;
    }
    var dm = 1/fd;

    
    var hd = (uv.x-uvCenter.x)*2;
    var vd = (uv.y-uvCenter.y)*2*dm;


    output.Color = object.color;
    output.uv = vec2<f32>(hd, vd);

    return output;
}

struct Output{
	@location(0) color: vec4<f32>,
	// @builtin(frag_depth) depth: f32
}

@fragment
fn fs_main(frag: Fragment) -> Output {
    var x = frag.uv.x;
    if(x < 0.0){
        x = x * -1.0;
    }
    var y = frag.uv.y;
    if(y < 0.0){
        y = y * -1.0;
    }
    var a = 1.0-sqrt(x*x + y*y);
    var output : Output;
    output.color = vec4<f32>(frag.Color, a);
    // output.depth = -0.5;
    return output;
}