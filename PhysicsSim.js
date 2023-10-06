import * as THREE from "three";

class PhysicsSim{
    /**
     * @param {THREE.Scene} scene
     * @param {THREE.Mesh} object 
     * @param {*} config
     * @param {boolean} viewMovementHelper 
     */
    constructor(scene, object, config, viewMovementHelper = false){
        this.scene = scene;
        this.object = object;

        this.collitionTypes = Object.freeze({
            Box: Symbol("box"),
            Sphere: Symbol("Sphere")
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
            friction: false,
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
        this.groundRaycaster.set(this.object.position, new THREE.Vector3(0, -1, 0));

        this.setKineticEnergy();
        this.setPotentialEnergy();

        this.config.accelerationVector.y = this.config.gravity;

        this.viewMovementHelper = viewMovementHelper;

        if(this.viewMovementHelper){
            this.createArrowHelper(this.config.velocityVector, this.object.position);
        }

        this.items = [];

        this.__collisionChecked = false;
        this.__checkingCollision = false;

        if(config){
            for(let option in config){
                if(option == "accelerationVector" || option == "velocityVector"){
                    this.config[option] = new THREE.Vector3().fromArray(config[option]);
                }else{
                    this.config[option] = config[option];
                }
            }
        }
    }

    setPotentialEnergy(){
        let distanceToGround;
        let intersect = this.groundRaycaster.intersectObjects(this.scene.children);
        this.groundRaycaster.set(this.object.position, new THREE.Vector3(0, -1, 0));

        if(this.scene.children.length > 0 && intersect.length > 0){
            distanceToGround = intersect[0].distance;
            this.config.energy.Potential = -this.config.mass*Math.abs(distanceToGround - this.object.geometry.parameters.radius)*this.config.gravity;
        }else{
            this.config.energy.Potential = Infinity;
        }
    }

    setKineticEnergy(){
        if(this.config.velocityVector.length() > 1/10000){
            this.config.energy.Kinetic = this.config.mass*Math.pow(this.config.velocityVector.length(), 2)/2;
        }else{
            this.config.energy.Kinetic = 0;
        }
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

    roundCollition(item){    
        if(item.shape == "Box"){
            let raycaster = new THREE.Raycaster();
            raycaster.set(this.object.position, this.config.velocityVector.clone().normalize());
            let intersects = raycaster.intersectObject(item);

            let face;
            if(intersects.length > 0){
                face = intersects[0].face;

                let collisions = this.checkCorrectedCollision(item);
                for(let [i, axis] of ["x", "y", "z"].entries()){
                    if(face.normal[axis] != 0 && collisions[i]){
                        this.config.velocityVector[axis] *= -(Math.abs(face.normal[axis]) - this.config.energyLoss);
                        // console.log(`Colliding: ${axis} against face: ${indexOfNearestFace} with normal: ${face.normal[axis]}`);
                        // console.log(`Colliding ${item.shape}: ${axis} against face with normal: ${face.normal[axis]}`);

                        if(axis == "y" && face.normal.y != 0){
                            this.object.position.y = item.position.y + item.geometry.parameters.height/2 + this.object.geometry.parameters.radius;
                        }
                    }
                }
            }
        }else if(item.shape == "Sphere"){
            let distance = this.object.position.clone().sub(item.position);

            if(this.checkBasicGeneralCollision(item)){
                // let direction = distance.clone().normalize();
                // let crossVector = new THREE.Vector3().crossVectors(this.config.velocityVector, direction).normalize();
                // let angle = this.config.velocityVector.angleTo(direction);
                // this.config.velocityVector.applyAxisAngle(crossVector, angle);

                let direction = distance.clone().normalize();
                let copyVelocity = this.config.velocityVector.clone().normalize().sub(direction).multiplyScalar(-1);
                let crossVector = new THREE.Vector3().crossVectors(this.config.velocityVector, copyVelocity).normalize();
                let angle = this.config.velocityVector.angleTo(copyVelocity);
                this.config.velocityVector.applyAxisAngle(crossVector, angle);
                this.config.velocityVector.multiplyScalar(1 - this.config.energyLoss);

                if(item.physics){
                    let copyVelocityInv = this.config.velocityVector.clone().normalize().sub(direction);
                    let crossVectorInv = new THREE.Vector3().crossVectors(this.config.velocityVector, copyVelocityInv).normalize();
                    let angleInv = item.physics.config.velocityVector.angleTo(copyVelocityInv);
                    item.physics.config.velocityVector.applyAxisAngle(crossVectorInv, angleInv);
                }

            }            
        }
        
    }

    checkBasicCollision(item, axis){
        let deltaAxisAbs = Math.abs(this.object.position[axis] - item.position[axis]);

        if(item.shape == "Box"){
            return this.#roundDecimals(deltaAxisAbs) - this.#roundDecimals(this.object.geometry.parameters.radius + item.geometry.parameters[this.checkProperty(axis)]/2) <= 0;
        }else if(item.shape == "Sphere"){          
            return this.#roundDecimals(deltaAxisAbs) - this.#roundDecimals((this.object.geometry.parameters.radius + item.geometry.parameters.radius)) <= 0;
        }
    }

    checkBasicGeneralCollision(item){
        return this.checkBasicCollision(item, "x") && this.checkBasicCollision(item, "y") && this.checkBasicCollision(item, "z");
    }
     
    checkCorrectedCollision(item){
        let axles = ["x", "y", "z"];

        let collisions = new Array(3).fill(false);

        for(let [i, axis] of axles.entries()){
            // console.log(this.checkBasicCollision(item, axis));
            if(this.checkBasicCollision(item, axis)){
                for( let [j, axis] of axles.entries()){
                    if(j != i && !collisions[j]){                        
                        collisions[j] = this.checkBasicCollision(item, axis);
                    }
                }
            }
        }
        return collisions;
    }

    minimalGroundDistance(){
        return this.getPotentialEnergy() < 0.1 && this.getKineticEnergy() <= 0.0025;
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

    move(divisor){
        this.setKineticEnergy();
        this.setPotentialEnergy();

        if(Math.abs(this.config.gravity)> 0){
            this.gravityMovement(divisor);
        }

        this.generalMovement(divisor);
        
        if(this.config.collitionOn){
            for(let item of this.items){
                if(this.config.bounce && !this.#roundDecimals(this.config.velocityVector.length()) < 0.05){
                    this.roundCollition(item);
                    // console.log("checking collision");
                }
            }
        }

        if(this.viewMovementHelper){
            this.getArrowHelper().position.set(this.object.position.x, this.object.position.y, this.object.position.z);
            this.getArrowHelper().setDirection(this.config.velocityVector.clone().normalize());
            this.getArrowHelper().setLength(this.config.velocityVector.clone().clampLength(0, 20).length()*10 + this.object.geometry.parameters.radius*2);
        }
    }

    gravityMovement(divisor){
        // console.log(!this.minimalGroundDistance(), this.getPotentialEnergy(), this.getKineticEnergy());
        if(!this.minimalGroundDistance()){
            this.config.velocityVector.y += this.config.accelerationVector.y*divisor;
            this.object.position.y += this.config.velocityVector.y;
        }else{
            console.log("canceling speed");
            this.config.velocityVector.y = 0;

            if(this.config.friction){
                this.config.velocityVector.x *= (0.99);
                this.config.velocityVector.z *= (0.99);
            }
        }

        
        // this.config.velocityVector.y += this.config.accelerationVector.y*divisor;
        // this.object.position.y += this.config.velocityVector.y;
    }

    generalMovement(divisor){
        if(!this.minimalWallDistance()){
            this.config.velocityVector.x += this.config.accelerationVector.x*divisor;
            this.config.velocityVector.z += this.config.accelerationVector.z*divisor;

            this.object.position.x += this.config.velocityVector.x;
            this.object.position.z += this.config.velocityVector.z;
        }

        if(this.config.velocityVector.length() < 1/1000){
            this.config.velocityVector.multiplyScalar(0);
        }
    }

    createArrowHelper(vdir, vorig = new THREE.Vector3(), length = 1, color = 0x04fc00){
        this.arrowHelper = new THREE.ArrowHelper(vdir.normalize(), vorig, length, color);
        this.scene.add(this.arrowHelper);
    }

    getArrowHelper(){
        return this.arrowHelper;
    }

    loadColliderItems(...items){
        this.items = items;
    }

    info(){
        return this.config.accelerationVector;
    }

    #roundDecimals(num, decimalsAmount = 2){
        let fix = Math.pow(10, decimalsAmount);
        return Math.round((num + Number.EPSILON) * fix) / fix;
    }
}

export default PhysicsSim;