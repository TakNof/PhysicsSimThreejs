import * as THREE from "three";

class ShapeGenerator extends THREE.Mesh{
    constructor(shape, data, materialType = "Basic", config = {color: 0x1EA5DC}){
        super(
            new THREE[`${shape}Geometry`](...data),
            new THREE[`Mesh${materialType}Material`](config)
        );
            
        this.setCenter();
        this.setMovementRadius();
        this.setOrbitalSpeed();
    }

    setOrbitalSpeed(value = 1){
        this.orbitalSpeed = value;
    }

    setMovementRadius(radius = 10){
        this.radius = radius;
    }

    setCenter(center = {x: 0, y: 0}){
        this.pivot = center;
    }

    rotate(t){
        this.rotation.z = -t;
    }

    orbitate(t){
        this.position.x = this.pivot.x + this.radius*Math.sin(t*this.orbitalSpeed);
        this.position.y = this.pivot.y + this.radius*Math.cos(t*this.orbitalSpeed);
    }
}

export default ShapeGenerator;