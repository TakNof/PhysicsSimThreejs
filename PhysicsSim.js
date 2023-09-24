import * as THREE from "three";

class PhysicsSim{
    /**
     * @param {THREE.Scene} scene
     * @param {THREE.Mesh} object 
     * @param {*} config 
     */
    constructor(scene, object, config){
        this.scene = scene;
        this.object = object;

        this.collitionTypes = Object.freeze({
            Box: Symbol("box"),
            Sphere: Symbol("autumn"),
        });

        this.energyTypes = Object.freeze({
            Kinetic: "Kinetic",
            Potential: "Potential"
        });

        this.config = {
            gravity: -9.8,
            accelerationVector: new THREE.Vector3(),
            velocityVector: new THREE.Vector3(),
            energyLoss: 0,
            collitionOn: true,
            collitionType: this.collitionTypes.Box,
            bounce: true,
            mass: 1,
            energy: {
                Kinetic: 0,
                Potential: 0
            }
        }
        this.groundRaycaster = new THREE.Raycaster();
        let objective = new THREE.Vector3(0, - 1, 0).normalize();
        this.groundRaycaster.set(this.object.position, objective);

        this.setKineticEnergy();
        this.setPotentialEnergy();

        this.config.accelerationVector.setComponent(1, this.config.gravity);

        this.viewMovementHelper = true;

        this.createArrowHelper(this.config.velocityVector, this.object.position, 1);

        this.items = [];

        this.__collisionChecked = false;
        this.__checkingCollision = false;

        if(config){
            for(let option in config){
                this.config[option] = config[option];
                if(option == "accelerationVector" || option == "velocityVector"){
                    this.config[option] = new THREE.Vector3().fromArray(config[option]);
                }
            }
        }
    }

    setPotentialEnergy(){
        let distanceToGround;
        let intersect = this.groundRaycaster.intersectObjects(this.scene.children);

        if(this.scene.children.length > 0 && intersect.length > 0){
            let object = intersect[0].object;
            distanceToGround = intersect[0].distance;
            this.config.energy.Potential = -this.config.mass*(this.object.position.y - this.object.geometry.parameters.radius + distanceToGround + object.position.y + object.geometry.parameters[this.checkProperty("y")])*this.config.gravity;
        }else{
            this.config.energy.Potential = Infinity;
        }
    }

    setKineticEnergy(){
        this.config.energy.Kinetic = this.config.mass*Math.pow(this.config.velocityVector.getComponent(1), 2)/2;
    }

    getPotentialEnergy(){
        return this.config.energy.Potential;
    }

    getKineticEnergy(){
        return this.config.energy.Kinetic;
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

    roundCollition2(item){    
        if(item.shape == "Box"){
            let raycaster = new THREE.Raycaster();
            raycaster.set(this.object.position, item.position.clone().normalize());
            let intersects = raycaster.intersectObject(item);

            console.log(intersects);

            let face;
            if(intersects.length > 0){
                face = intersects[0].face;

                let collisions = this.checkCollitionCourse3(item);
                for(let [i, axis] of ["x", "y", "z"].entries()){
                    if(face.normal[axis] != 0 && collisions[i]){
                        this.config.velocityVector[axis] *= -(Math.abs(face.normal[axis]) - this.config.energyLoss);
                        // console.log(`Colliding: ${axis} against face: ${indexOfNearestFace} with normal: ${face.normal[axis]}`);
                        console.log(`Colliding ${item.shape}: ${axis} against face with normal: ${face.normal[axis]}`);

                        if(axis == "y" && face.normal.y != 0){
                            this.object.position.y = item.position.y + item.geometry.parameters.height*face.normal.y/2 + this.object.geometry.parameters.radius;
                        }
                    }
                }
            }
        }        
        
    }

    checkCollitionCourse(item, axis){
        let deltaAxisAbs = Math.abs(this.object.position[axis] - item.position[axis]);

        if(item.shape == "Box"){
            return this.__roundDecimals(deltaAxisAbs) - this.__roundDecimals(this.object.geometry.parameters.radius + item.geometry.parameters[this.checkProperty(axis)]/2) < 0;
        }else if(item.shape == "Sphere"){
            return this.__roundDecimals(deltaAxisAbs) - this.__roundDecimals(this.object.geometry.parameters.radius + item.geometry.parameters.radius) < 0;
        }
    }
     
    checkGeneralCollitionCourse(item){
        return this.checkCollitionCourse(item, "x") && this.checkCollitionCourse(item, "y") && this.checkCollitionCourse(item, "z");
    }


    checkCollitionCourse3(item){
        let axles = ["x", "y", "z"];

        let collisions = new Array(3).fill(false);        
        // console.log(`collisionBounds: ${collisionBounds}`);

        for(let [i, axis] of axles.entries()){
            if(this.checkCollitionCourse(item, axis)){
                for( let [j, axis] of axles.entries()){
                    if(j != i && !collisions[j]){                        
                        collisions[j] = this.checkCollitionCourse(item, axis);
                        // console.log(collisions);
                    }
                }
            }
        }
         
        return collisions;
    }

    minimalGroundDistance(){
        return this.getPotentialEnergy() < 0 && this.getKineticEnergy() <= 0.05;
    }

    minimalWallDistance(){
        let axles = ["x", "y", "z"];
        let collition = false;
        for(let axis of axles){
            collition &&= this.getKineticEnergy() < 0 && Math.abs(this.config.velocityVector[["x", "y", "z"].indexOf(axis)]) <= 0.3
            if(collition){
                break;
            }
        }

        return collition;
    }; 

    move(t){
        this.setKineticEnergy();
        this.setPotentialEnergy();

        if(Math.abs(this.config.gravity)> 0){
            this.gravityMovement(t);
        }

        this.generalMovement(t);
        
        if(this.config.collitionOn){
            if(!this.__collitionChecked && !this.__checkingCollision){
                this.__checkingCollision = true;
                for(let item of this.items){
                    if(this.config.bounce && this.config.velocityVector.length() > 0.05){
                        this.roundCollition2(item);
                        // console.log("checking collision");
                    }
                }

                this.__collisionChecked = true;
                this.__checkingCollision = false;
                
            }else if(this.__collisionChecked && !this.__checkingCollision){
                this.__collisionChecked = false;
                this.__checkingCollision = false;
            }
        }

        if(this.viewMovementHelper){
            this.getArrowHelper().position.set(this.object.position.x, this.object.position.y, this.object.position.z);
            this.getArrowHelper().setDirection(this.config.velocityVector.clone().normalize());
            this.getArrowHelper().setLength(this.config.velocityVector.clone().clampLength(0, 10).lengthSq()*10 + 5);
        }
    }

    gravityMovement(t){
        // console.log(!this.minimalGroundDistance(), this.getPotentialEnergy(), this.getKineticEnergy());
        if(!this.minimalGroundDistance()){
            this.config.velocityVector.y += this.config.accelerationVector.y*t;
            this.object.position.y += this.config.velocityVector.y;
        }else{
            this.config.velocityVector.multiplyScalar(0);
        }
    }

    generalMovement(t){
        if(!this.minimalWallDistance()){
            this.config.velocityVector.x += this.config.accelerationVector.x*t;
            this.config.velocityVector.z += this.config.accelerationVector.z*t;
                    
            this.object.position.x += this.config.velocityVector.x;
            this.object.position.z += this.config.velocityVector.z;
        }
    }

    createArrowHelper(vdir, vorig = new THREE.Vector3(), length = 1, color = 0x04fc00){
        this.arrowHelper = new THREE.ArrowHelper(vdir.normalize(), vorig, length, color);
    }

    getArrowHelper(){
        return this.arrowHelper;
    }

    loadColliderItems(...items){
        for(let item of items){
            if(item.physics && this.items.indexOf(item) == -1){
                item.physics.items.push(this.object);
            }
        }
        this.items = items;
    }

    info(){
        return this.config.accelerationVector;
    }

    __roundDecimals(num, decimalsAmount = 2){
        let fix = Math.pow(10, decimalsAmount);
        return Math.round((num + Number.EPSILON) * fix) / fix;
    }
}

export default PhysicsSim;