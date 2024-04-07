struct TransformData {
    view: mat4x4<f32>,
    projection: mat4x4<f32>,
};

struct model {
    model: mat4x4<f32>,
    rot: mat4x4<f32>,
    animationMod: f32,
};


@binding(0) @group(0) var<uniform> transformer: TransformData;

@binding(1) @group(0) var myTexture: texture_2d<f32>;
@binding(2) @group(0) var mySampler: sampler;

@binding(3) @group(0) var<storage, read> object: model;

@binding(4) @group(0) var myTextureDark: texture_2d<f32>;
@binding(5) @group(0) var mySamplerDark: sampler;


struct Fragment {
    @builtin(position) Position : vec4<f32>,
    @location(0) TexCoord : vec2<f32>,
    @location(1) Normal : vec3<f32>,
};

const pi = 3.14159265359;
const halfpi = pi/2;
@vertex
fn vs_main( @location(0) vertexPostion: vec2<f32>, @location(1) vertexTexCoord: vec2<f32>) -> Fragment {

    var m = object.animationMod;
    var r = halfpi;
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

    var x = -1 * ((r*cos(lon)*m1*(1-m2) + r*cos(lat)*cos(lon)*m2));
    var y = r*sin(lon)*m1*(1-m2) + r*cos(lat)*sin(lon)*m2;
    var z = (1-m2)*lat + r*sin(lat)*m2;
    
    
    x *= m1;
    y = ((1-m1)*lon) + (m1*y);
    var n = vec4<f32>(x, y, z, 1.0); // (x-0)/1, (y-0)/1, (z-0)/1

    var output : Fragment;
    var pos = vec4<f32>(x, y, z, 1.0);
    pos = object.rot * pos;
    pos = object.model * pos;
    pos = transformer.projection * transformer.view * pos;
   
    output.Position = pos;
    output.TexCoord = vertexTexCoord;

    let rn = object.rot * n;
    output.Normal = vec3<f32>(rn[0], rn[1], rn[2]);

    return output;
}

@fragment
fn fs_main(frag: Fragment) -> @location(0) vec4<f32> {
    let col1 = textureSample(myTexture, mySampler, frag.TexCoord);
    let col2 = textureSample(myTextureDark, mySamplerDark, frag.TexCoord);

    let vNormal = normalize(vec4<f32>(frag.Normal, 1));
    let lightPosition = vec4<f32>(0, 0, 5, 0);
    
    let diffuseLightStrength = 2.0;
    let ambientLightIntensity = 0.0;


    let lightDir = normalize(lightPosition - frag.Position);
    let lightMagnitude = dot(vNormal, lightDir);

    let diffuseLightFinal: f32 = diffuseLightStrength * max(lightMagnitude, 0);
    let lightFinal = diffuseLightFinal + ambientLightIntensity;

    var col = col1*lightFinal + col2*(1-lightFinal);
    col[3] = 1.0;
    return col;
}