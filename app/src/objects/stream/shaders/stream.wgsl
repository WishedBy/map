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
    fadeSteps: f32,
};


@binding(0) @group(0) var<uniform> transformer: TransformData;


@binding(1) @group(0) var<storage, read> object: model;



struct Fragment {
    @builtin(position) Position : vec4<f32>,
    @location(0) @interpolate(linear) Color : vec4<f32>,

};

// const alphaTable = array<f32, 0>(

// );

const pi = 3.14159265359;
const halfpi = pi/2;
const r = halfpi+0.001;

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
    x -= 0.1 * (1-m1);
  
    var npos = vec4<f32>(x, y, z, 1.0);

    var output : Fragment;
    npos = object.model * npos;
    npos = transformer.projection * transformer.view * npos;
    output.Position = npos;

    
    let l: i32 = i32(object.lengthNo);
    var steps: i32 = i32(object.fadeSteps);
    var sp: f32 = object.streamPos;
    var center = i32(round(f32(l)*sp));


    if(center < steps){
        steps = center;
    }
    else if(center > l-steps){
        steps = l-center;
    }
    let dist = abs(i32(colid.x) - center);

    let gradStepL: f32 = 1.0/f32(steps);
    var a = 0.0;

    if(colid.y == 2 || colid.y == 5){
        a = max(1.0-(f32(dist)*gradStepL), 0.0);
        if(i32(colid.x) <= center && colid.y == 2){
            a -= gradStepL;
        }
        else if(i32(colid.x) >= center && colid.y == 5){
            a -= gradStepL;
        }
    }
 
    output.Color = vec4<f32>(object.color, a);

    return output;
}

@fragment
fn fs_main(frag: Fragment) -> @location(0) vec4<f32> {

    return frag.Color;
}