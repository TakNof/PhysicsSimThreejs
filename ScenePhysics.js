import * as THREE from "three";

class ScenePhysics{
    /**
     * 
     * @param {THREE.Scene} scene 
     * @param {Object} config 
     */
    constructor(scene, config){
        this.scene = scene;

        this.axles = ["x", "y", "z"];

        this.config = {
            gravity: -9.8,
            energyLoss: 0,
            friction: true,
            momentum: true,
            collitionOn: true,
            bounce: true,
            viewMovementHelper: false
        }

        if(config){
            for(let option in config){
                this.config[option] = config[option];
            }
        }
    }

    add(...items){
        this.items = items;

        for(let item of items){
            if(item.physics){
                item.physics.config.gravity = this.config.gravity;
                item.physics.config.accelerationVector.y = this.config.gravity;
                item.physics.config.friction = this.config.friction;
                if(this.config.viewMovementHelper){
                    item.physics.createArrowHelper(item.physics.config.velocityVector.clone(), item.position);
                }
            }
        }
    }

    remove(item){
        let index = this.items.indexOf(item);
        if(index !== -1){
            if(this.items[index].physics.arrowHelper){
                this.scene.remove(this.items[index].physics.arrowHelper);
            }
            this.items.splice(index, 1);
        }
    }

    checkWorldCollisions(){
        for(let i = 0; i < this.items.length; i++){
            for(let j = i + 1; j < this.items.length; j++){
                if(this.config.bounce && (this.items[i].physics || this.items[j].physics)){
                    let index = this.checkCollisionByType(this.items[i], this.items[j]);
                    let collisionType = this.allCollisions(index);
                    if(index == 2){
                        this[collisionType](this.items[j], this.items[i]);
                    }else{
                        this[collisionType](this.items[i], this.items[j]);
                    }
                }
            }
        }
    }

    checkCollisionByType(item1, item2){
        if(item1.shape == "Sphere" && item2.shape == "Sphere"){
            return 0;
        }else if(item1.shape == "Box" && item2.shape == "Box"){
            return 1;
        }else{
            return 2;
        }
    }

    checkProperty(axis){
        switch (axis) {
            case "x":
                return "width";
            
            case "y":
                return "height";
            
            case "z":
                return "depth";
            
            default:
                return undefined;
        }
    }

    allCollisions(index){
        let allCollisionsList = ["checkSphereWithSphereCollision", "checkBoxWithBoxCollision", "checkSphereWithBoxCollision"];
        return allCollisionsList[index];
    }

    checkSphereWithSphereCollision(item1, item2){
        let distance = item1.position.clone().sub(item2.position);      
        let colliding = distance.length() <= (item1.geometry.parameters.radius + item2.geometry.parameters.radius);
        
        if(colliding){
            console.log(`Spheres colliding: ${item1.shape} ${item2.shape}`);

            let itemsVels = {item1Vel: 1, item2Vel: 1};

            if(this.config.momentum){
                itemsVels = this.calculateVelocityPostCollision(item1, item2);
            }
            
            
            if(item1.physics){
                if(item1.physics.config.velocityVector.length() == 0){
                    item1.physics.config.velocityVector = new THREE.Vector3(1,0,0);
                }

                item1.physics.config.velocityVector.applyAxisAngle(...this.dataToCollideSphere(distance, item1)).normalize().multiplyScalar(itemsVels.item1Vel*(1 - this.config.energyLoss));
            }

            if(item2.physics){
                if(item2.physics.config.velocityVector.length() == 0){
                    item2.physics.config.velocityVector = new THREE.Vector3(1,0,0);
                }

                item2.physics.config.velocityVector.applyAxisAngle(...this.dataToCollideSphere(distance.multiplyScalar(-1), item2)).normalize().multiplyScalar(itemsVels.item2Vel*(1 - this.config.energyLoss));
            }
        }
        
    }

    checkSphereWithBoxCollision(item1, item2){
        let raycaster = new THREE.Raycaster();
        raycaster.set(item1.position, item1.physics.config.velocityVector.clone().normalize());
        let intersects = raycaster.intersectObject(item2);

        if(intersects.length > 0 && this.boxGeneralCollisionBounds(item1, item2)){
            let face = intersects[0].face;

            let collisions = this.boxCollisionBounds(item1, item2);
            for(let [i, axis] of ["x", "y", "z"].entries()){
                if(face.normal[axis] != 0 && collisions[i]){
                    console.log(`Sphere colliding with box: ${item1.shape} ${item2.shape}`);
                    item1.physics.config.velocityVector[axis] *= -(Math.abs(face.normal[axis]) - this.config.energyLoss);

                    if(axis == "y" && face.normal.y != 0){
                        item1.position.y = item2.position.y + item2.geometry.parameters.height/2 + item1.geometry.parameters.radius;
                    }
                }
            }
        }
    }

    checkBoxWithBoxCollision(item1, item2){
        let raycaster = new THREE.Raycaster();
        raycaster.set(item1.position, item1.physics.config.velocityVector.clone().normalize());
        let intersects = raycaster.intersectObject(item2);

        if(intersects.length > 0 && this.boxGeneralCollisionBounds(item1, item2)){
            let face = intersects[0].face;

            let collisions = this.boxCollisionBounds(item1, item2);
            for(let [i, axis] of ["x", "y", "z"].entries()){
                if(face.normal[axis] != 0 && collisions[i]){
                    console.log(`Box colliding with box: ${item1.shape} ${item2.shape}`);
                    item1.physics.config.velocityVector[axis] *= -(Math.abs(face.normal[axis]) - this.config.energyLoss);

                    if(axis == "y" && face.normal.y != 0){
                        item1.position.y = item2.position.y + item2.geometry.parameters.height/2 + item1.geometry.parameters.height/2;
                    }
                }
            }
        }
    }

    boxAxisCollisionBounds(item1, item2, axis){
        let deltaAxisAbs = Math.abs(item1.position[axis] - item2.position[axis]);
        if(item1.shape == "Sphere"){
            return this.#roundDecimals(deltaAxisAbs) - this.#roundDecimals(item1.geometry.parameters.radius + item2.geometry.parameters[this.checkProperty(axis)]/2) <= 0;
        }

        if(item1.shape == "Box"){
            return this.#roundDecimals(deltaAxisAbs) - this.#roundDecimals(item1.geometry.parameters[this.checkProperty(axis)]/2 + item2.geometry.parameters[this.checkProperty(axis)]/2) <= 0;
        }
        
    }
    
    boxGeneralCollisionBounds(item1, item2){
        let collisionCourse = true;
        for(let axis of this.axles){
            collisionCourse &&= this.boxAxisCollisionBounds(item1, item2, axis);
        }

        return collisionCourse;
    }

    boxCollisionBounds(item1, item2){
        let collisions = new Array(3).fill(false);

        for(let [i, axis] of this.axles.entries()){
            // console.log(this.checkBasicCollision(item, axis));
            if(this.boxAxisCollisionBounds(item1, item2, axis)){
                for( let [j, axis] of this.axles.entries()){
                    if(j != i && !collisions[j]){                        
                        collisions[j] = this.boxAxisCollisionBounds(item1, item2, axis);
                    }
                }
            }
        }
        return collisions;
    }

    calculateVelocityPostCollision(item1, item2){
        let momentumByDiference = item1.physics.config.mass * (item2.physics.config.velocityVector.length() - item1.physics.config.velocityVector.length());
        let massAdd = item1.physics.config.mass + item2.physics.config.mass;

        let item2Vel = this.#roundDecimals((item1.physics.getMomentum() + item2.physics.getMomentum() - momentumByDiference)/massAdd);
        let item1Vel = this.#roundDecimals(item2.physics.config.velocityVector.length() - item1.physics.config.velocityVector.length() + item2Vel);

        return {item1Vel, item2Vel};
    }

    dataToCollideSphere(distance, item){
        let direction = distance.clone().normalize();
        let directionAdjust = direction.clone().normalize().sub(item.physics.config.velocityVector);
        let crossVector = new THREE.Vector3().crossVectors(item.physics.config.velocityVector, directionAdjust).normalize();
        let angle = item.physics.config.velocityVector.angleTo(directionAdjust);

        return [crossVector, angle];
    }

    #roundDecimals(num, decimalsAmount = 2){
        let fix = Math.pow(10, decimalsAmount);
        return Math.round((num + Number.EPSILON) * fix) / fix;
    }
}

export default ScenePhysics;