import * as THREE from "three";
import ObjectPhysics from "./ObjectPhysics.js";

class ShapeGenerator extends THREE.Mesh{
    constructor(shape, data, materialType = "Basic", config = {color: 0x1EA5DC}){
        super(
            new THREE[`${shape}Geometry`](...data),
            new THREE[`Mesh${materialType}Material`](config)
        );
        this.shape = shape;
    }

    createPhysics(scene, config){
        this.physics = new ObjectPhysics(scene, this, config);
    }
}

export default ShapeGenerator;