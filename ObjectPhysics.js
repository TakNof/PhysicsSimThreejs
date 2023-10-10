import * as THREE from "three";

class ObjectPhysics{
    /**
     * @param {THREE.Scene} scene
     * @param {THREE.Mesh} object 
     * @param {Object} config
     */
    constructor(scene, object, config){
        this.scene = scene;
        this.object = object;

        this.energyTypes = Object.freeze({
            Kinetic: "Kinetic",
            Potential: "Potential"
        });

        this.config = {
            accelerationVector: new THREE.Vector3(),
            velocityVector: new THREE.Vector3(),
            mass: 1,
            momentum: 0,
            energy: {
                Kinetic: 0,
                Potential: 0
            }
        }

        this.groundRaycaster = new THREE.Raycaster();
        this.groundRaycaster.set(this.object.position, new THREE.Vector3(0, -1, 0));

        if(config){
            for(let option in config){
                if(option == "accelerationVector" || option == "velocityVector"){
                    this.config[option] = new THREE.Vector3().fromArray(config[option]);
                }else{
                    this.config[option] = config[option];
                }
            }
        }

        this.setKineticEnergy();
        this.setPotentialEnergy();
        this.setMomentum();
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
            this.config.energy.Kinetic = this.#roundDecimals(this.config.mass*Math.pow(this.config.velocityVector.length(), 2)/4);
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

    setMomentum(){
        this.config.momentum = this.config.mass * this.config.velocityVector.length();
    }

    getMomentum(){
        return this.config.momentum;
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
        this.setMomentum();

        if(Math.abs(this.config.gravity)> 0){
            this.gravityMovement(divisor);
        }
        
        this.generalMovement(divisor);
        
        if(this.arrowHelper){
            this.getArrowHelper().position.set(this.object.position.x, this.object.position.y, this.object.position.z);
            this.getArrowHelper().setDirection(this.config.velocityVector.clone().normalize());
            this.getArrowHelper().setLength(this.config.velocityVector.clone().clampLength(0, 20).length()*10 + this.object.geometry.parameters.radius*2);
        }
    }

    gravityMovement(divisor){
        if(!this.minimalGroundDistance()){
            this.config.velocityVector.y += this.config.accelerationVector.y*divisor;
            this.object.position.y += this.config.velocityVector.y;
        }else{
            // console.log("canceling speed");
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

        if(this.config.velocityVector.length() < 1/10000){
            this.config.velocityVector.multiplyScalar(0);
        }

        this.rotateAccordingToDirection();
    }

    rotateAccordingToDirection(){
        let axles = ["x", "y", "z"];
        let complementaryAxels = ["z", "x", "y"];

        for(let [i, axis] of axles.entries()){
            this.object[`rotate${complementaryAxels[i].toUpperCase()}`](2*Math.PI * -this.config.velocityVector[axis]);
        }

    }

    createArrowHelper(vdir, vorig = new THREE.Vector3(), length = 1, color = 0x04fc00){
        this.arrowHelper = new THREE.ArrowHelper(vdir.normalize(), vorig, length, color);
        this.scene.add(this.arrowHelper);
    }

    getArrowHelper(){
        return this.arrowHelper;
    }

    #roundDecimals(num, decimalsAmount = 2){
        let fix = Math.pow(10, decimalsAmount);
        return Math.round((num + Number.EPSILON) * fix) / fix;
    }
}

export default ObjectPhysics;