import { vec2, vec3 } from "gl-matrix";
import { ImageTexture } from "./objects/ImageTexture";
import { Renderer, picker } from "./renderer";
import { MapScene, State } from "./map/map";
import { scene } from "./scene";
import { CountryShape } from "./countries/country_shapes";
import { FeatureCollection } from "./countries/geojson";



/**
 * https://gist.github.com/mjackson/5311256
 * 
 * adjusted to keep rgb in set [0, 1] instead of [0, 255]
 * 
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 1].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 */
function hslToRgb(h:number, s:number, l:number):vec3 {
    var r, g, b;
    function hue2rgb(p:number, q:number, t:number) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    }
  
    if (s == 0) {
      r = g = b = l; // achromatic
    } else {
  
      var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      var p = 2 * l - q;
  
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
  
    return [ r, g, b ];
}


export async function main(canvas: HTMLCanvasElement ){
    const countries = (await (await fetch('./assets/js/countries.json')).json()) as FeatureCollection;
    var device = <GPUDevice> await (await navigator.gpu?.requestAdapter())?.requestDevice();
    var mapMaterial = await ImageTexture.create(device, "assets/img/map.png");
    var mapMaterialDark = await ImageTexture.create(device, "assets/img/map-dark.png");

    var scene: MapScene;
    var mapState = new State();
    const renderer = new Renderer(canvas, device, (globalBuffer: GPUBuffer, p: picker): scene => {
        scene = new MapScene(device, globalBuffer, mapMaterial, mapMaterialDark, countries, mapState, p);
        return scene;
    });

    $(document).on("mousedown", (e: JQuery.MouseDownEvent) => {
        if(e.which == 1){
            mapState.leftMousePressed = true;
            mapState.mousePosStart = mapState.mousePosCurrent;
        }
    })
    $(document).on("mouseup", (e: JQuery.MouseUpEvent) => {
        if(e.which == 1){
            mapState.leftMousePressed = false;
        }
    })
    $(document).on("mousemove", (e: JQuery.MouseMoveEvent) => {
        mapState.mousePosCurrent = [e.pageX, e.pageY]
    })

    await renderer.Initialize();
    renderer.run();


    setInterval(() => {
        for(let i = 0; i < 1; i++){
            // let start:vec2 = [
            //     (Math.random()*360)-180,
            //     (Math.random()*180)-90,
            // ];
            // let end:vec2 = [
            //     (Math.random()*360)-180,
            //     (Math.random()*180)-90,
            // ];
            let start:vec2 = [
                8.631334,
                57.103187,
            ];
            let end:vec2 = [
                1.428307,
                51.364564,
            ];
            scene.doStream(start, end, hslToRgb(Math.random(), 1, 0.5));
        }
    }, 1500)


}