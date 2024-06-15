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
    position: vec3<f32>,
    animationMod: f32,
};


@binding(0) @group(0) var<uniform> transformer: TransformData;


@binding(1) @group(0) var<storage, read> object: model;

@binding(2) @group(0) var testTexture: texture_2d_array<f32>;
@binding(3) @group(0) var testSampler: sampler;



struct Fragment {
    @builtin(position) Position : vec4<f32>,
    @location(0) Color : vec3<f32>,
    @location(1) TexCoord : vec2<f32>,

};

const pi = 3.14159265359;
const halfpi = pi/2;
const r = halfpi;


@vertex
fn vs_main( @location(0) vertexPostion: vec2<f32>,  @location(1) vertexPostionSphere: vec3<f32>, @location(2) vertexTexCoord: vec2<f32>) -> Fragment {

    var m = object.animationMod;
    var m1 = 0.0;
    var m2 = 0.0;
    if(m <= 0.5){
        m1 = (m*2);
    }else{
        m1 = 1;
        m2 = (m*2)-1;
    }
    var lon = vertexPostion[0];
    var lat = vertexPostion[1];

    var x = 0.0;
    var y = lon;
    var z = lat;
    if(m == 1){
        x = -1*vertexPostionSphere.x;
        y = vertexPostionSphere.y;
        z = vertexPostionSphere.z;
    }else if(m > 0){
        x = -1 * ((r*cos(lon)*m1*(1-m2) + vertexPostionSphere.x*m2));
        y = r*sin(lon)*m1*(1-m2) + vertexPostionSphere.y*m2;
        z = (1-m2)*lat + vertexPostionSphere.z*m2;
        y = ((1-m1)*lon) + (y);
    }
    
    var output : Fragment;
    var pos = vec4<f32>(x, y, z, 1.0);
    pos = object.model * pos;
    pos = transformer.projection * transformer.view * pos;
   
    output.Position = pos;
    output.TexCoord = vertexTexCoord;
    output.Color = vec3<f32>(0,1,0);



    return output;
}

@fragment
fn fs_main(frag: Fragment) -> @location(0) vec4<f32>{
    let a = textureSample(testTexture, testSampler, frag.TexCoord, 0);
    return vec4<f32>(frag.Color, a[0]*255);
}

@fragment
fn pick(frag: Fragment) -> @location(0) vec4<f32>{
    let a = textureSample(testTexture, testSampler, frag.TexCoord, 0);
    return vec4<f32>((a[0]), (frag.TexCoord[0]), (frag.TexCoord[1]), 0.0);
}