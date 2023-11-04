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
        if(this.getVelocityVector().length() > 1/10000){
            this.config.energy.Kinetic = this.#roundDecimals(this.config.mass*Math.pow(this.getVelocityVector().length(), 2)/4);
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
        this.config.momentum = this.getVelocityVector().clone().multiplyScalar(this.config.mass);
    }

    getMomentum(){
        return this.config.momentum;
    }

    getVelocityVector(){
        return this.config.velocityVector;
    }

    getAccelerationVector(){
        return this.config.accelerationVector;
    }

    getMass(){
        return this.config.mass;
    }

    minimalGroundDistance(){
        return this.getPotentialEnergy() < 0.1 && this.getKineticEnergy() <= 0.0025;
    }

    minimalWallDistance(){
        let axles = ["x", "y", "z"];
        let collition = false;
        for(let axis of axles){
            collition &&= this.getKineticEnergy() < 0 && Math.abs(this.getVelocityVector()[["x", "y", "z"].indexOf(axis)]) <= 0.3
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
            this.getArrowHelper().setDirection(this.getVelocityVector().clone().normalize());
            if(this.object.geometry.parameters.radius){
                this.getArrowHelper().setLength(this.getVelocityVector().clone().clampLength(0, 20).length()*10 + this.object.geometry.parameters.radius*2);
            }else{
                this.getArrowHelper().setLength(this.getVelocityVector().clone().clampLength(0, 20).length()*10 + this.object.geometry.boundingSphere.radius*2);
            }
            
        }
    }

    gravityMovement(divisor){
        if(!this.minimalGroundDistance()){
            this.getVelocityVector().y += this.config.accelerationVector.y*divisor;
            this.object.position.y += this.getVelocityVector().y;
        }else{
            // console.log("canceling speed");
            this.getVelocityVector().y = 0;
        }

        if(this.getPotentialEnergy() < 0.1 && this.config.friction){
            this.getVelocityVector().x *= (0.99);
            this.getVelocityVector().z *= (0.99);
        }
        
        // this.getVelocityVector().y += this.config.accelerationVector.y*divisor;
        // this.object.position.y += this.getVelocityVector().y;
    }

    generalMovement(divisor){
        if(!this.minimalWallDistance()){
            this.getVelocityVector().x += this.config.accelerationVector.x*divisor;
            this.getVelocityVector().z += this.config.accelerationVector.z*divisor;

            this.object.position.x += this.getVelocityVector().x;
            this.object.position.z += this.getVelocityVector().z;
        }

        if(this.getVelocityVector().length() < 1/10000){
            this.getVelocityVector().multiplyScalar(0);
        }

        this.rotateAccordingToDirection();
    }

    rotateAccordingToDirection(){
        let axles = ["x", "y", "z"];
        let complementaryAxels = ["z", "x", "y"];

        for(let [i, axis] of axles.entries()){
            // this.object[`rotate${complementaryAxels[i].toUpperCase()}`](2*Math.PI * -this.getVelocityVector()[axis]);
            this.object[`rotate${complementaryAxels[i].toUpperCase()}`](-this.getVelocityVector()[axis]/this.object.geometry.parameters.radius);
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