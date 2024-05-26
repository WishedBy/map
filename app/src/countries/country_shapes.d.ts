import { vec2 } from "gl-matrix"

export type CountryShape = {
    geo_point_2d: {
        lon: number,
        lat: number,
    },
    geo_shape:{
        type: "Feature",
        geometry: MultiPolygonGeometry|PolygonGeometry,
        properties: {},
    },
    cntry_name: string,
    join_name: string,
    iso2_2: string|null,
    iso_a2: string|null,
    iso2: string,
    cou_iso3_code: string,
    iso3: string,
};

export type MultiPolygonGeometry = {
    type: "MultiPolygon",
    coordinates: vec2[][][],
}

export type PolygonGeometry = {
    type: "Polygon",
    coordinates: vec2[][],
}




export const shapes: CountryShape[]