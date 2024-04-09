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
    normalMatrix: mat4x4<f32>,
    position: vec3<f32>,
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
    @location(2) vPos : vec3<f32>,

};

const pi = 3.14159265359;
const halfpi = pi/2;
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
    var r = halfpi;
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
    
    var n = vec4<f32>((x)/r, (y)/r, (z)/r, 0); 
    n = object.normalMatrix * n;

    // normal is used for lighting, using the normalized position of the light as normal for the flat shape makes it always lit up.
    let nlp = normalize(transformer.light.lightPosition);
    n.x = n.x*m1 + nlp.x*(1-m1);
    n.y = n.y*m1 + nlp.y*(1-m1);
    n.z = n.z*m1 + nlp.z*(1-m1);

    var output : Fragment;
    var pos = vec4<f32>(x, y, z, 1.0);
    pos = object.model * pos;
    output.vPos = pos.xyz;
    pos = transformer.projection * transformer.view * pos;
   
    output.Position = pos;
    output.TexCoord = vertexTexCoord;

    output.Normal = n.xyz;


    return output;
}

@fragment
fn fs_main(frag: Fragment) -> @location(0) vec4<f32> {
    let col1 = textureSample(myTexture, mySampler, frag.TexCoord);
    let col2 = textureSample(myTextureDark, mySamplerDark, frag.TexCoord);

    let vNormal = normalize(frag.Normal);
    
    let diffuseLightStrength = transformer.light.diffuseStrength;
    let ambientLightIntensity = transformer.light.ambientIntensity;


    let lightDir = normalize(transformer.light.lightPosition - frag.vPos.xyz);
    let lightMagnitude = dot(vNormal, lightDir);

    let diffuseLightFinal: f32 = diffuseLightStrength * max(lightMagnitude, 0);
    var lightFinal = diffuseLightFinal + ambientLightIntensity;


    var col = col1*lightFinal + col2*(1-lightFinal);
    col[3] = 1.0;
    return col;
}