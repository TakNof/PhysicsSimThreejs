import * as THREE from "three";

class PhysicsSim{
    /**
     * 
     * @param {THREE.Mesh} object 
     * @param {*} config 
     */
    constructor(object, config){
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
        this.config.energy.Potential = -this.config.mass*(this.object.position.y - this.object.geometry.parameters.radius)*this.config.gravity;
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
    
    roundCollition(item){
        let angle;
        let copy = this.config.velocityVector.clone();
        for(let [i, face] of item.geometry.faces.entries()){
            if(i % 2 == 0){
                angle = copy.angleTo(face.normal);

                if(angle >= 0 && angle <= Math.PI && i/2 % 2 == 0){
                    let collisionsCourse = this.checkCollitionCourse2(item);

                    for(let [j, axis] of collisionsCourse.entries()){
                        if(axis){
                            this.config.velocityVector.setComponent(j,  this.config.velocityVector.getComponent(j)*-1);
                            this.config.velocityVector.multiplyScalar(1-this.config.energyLoss);
                            if(j == 1 && item.shape == "Box"){
                                this.object.position.y = item.position.y + item.geometry.parameters.height*face.normal.getComponent(1)/2 + this.object.geometry.parameters.radius;
                            }

                        }
                    }
                }
            }
        }
    }

    roundCollition2(item){
        let collisions = this.checkCollitionCourse3(item);

        if(item.geometry.faces){
            let indexOfNearestFace = this.__checkNearFace(item);
            let face = item.geometry.faces[indexOfNearestFace];
            for(let [j, axis] of ["x", "y", "z"].entries()){
                if(face.normal[axis] != 0 && collisions[j]){
                    this.config.velocityVector[axis] *= -(Math.abs(face.normal[axis]) - this.config.energyLoss);
                    console.log(`Colliding: ${axis} against face: ${indexOfNearestFace} with normal: ${face.normal[axis]}`);

                    if(axis == "y" && face.normal.y != 0 && item.shape == "Box"){
                        this.object.position.y = item.position.y + item.geometry.parameters.height*face.normal.y/2 + this.object.geometry.parameters.radius;
                    }
                }
            }

        }else{
            let distanceVector = this.object.position.clone().sub(item.position);
            let directionVector = distanceVector.normalize();
            angle = this.object.position.angleTo(item.position);


            if(angle != Math.PI/2){
                normalVector = directionVector;
                normalVector.multiplyScalar(-(1 - this.config.energyLoss));

                for(let [j, axis] of ["x", "y", "z"].entries()){
                    if(normalVector[axis] != 0 && collisionsCourse[j]){
                        this.config.velocityVector[axis] *= normalVector[axis];
                    }

                    // if(axis == "y" && normalVector.y != 0 && item.shape == "Box" && collisionsCourse[j]){
                    //     this.object.position.y = item.position.y + item.geometry.parameters.height*face.normal.y/2 + this.object.geometry.parameters.radius;
                    // }
                }

            }
        }
        
    }

    __checkNearFace(item){
        let distances = new Array(4).fill(Infinity);
        for(let [i, face] of item.geometry.faces.entries()){
            let faceCenter = item.position.clone();
            if(i % 2 == 0){
                for(let axis of ["x", "y", "z"]){
                    if(face.normal[axis] != 0 && this.config.velocityVector.angleTo(face.normal) != Math.PI/2){
                        faceCenter[axis] += face.normal[axis]*item.geometry.parameters[this.checkProperty(axis)]/2;
                        
                        distances[i/2] = this.object.position.clone().sub(faceCenter).length();

                        break;
                    }
                }
            }
            
        }
        return distances.indexOf(Math.min(...distances))*2;
    }

    checkCollitionCourse(item, axis){
        let deltaAxis = this.object.position[axis] - item.position[axis];
        let deltaAxisAbs = Math.abs(deltaAxis);

        if(item.shape == "Box"){
            return this.__roundDecimals(deltaAxisAbs) - this.__roundDecimals(this.object.geometry.parameters.radius + item.geometry.parameters[this.checkProperty(axis)]/2) < 0;
        }else if(item.shape == "Sphere"){
            return deltaAxisAbs - (this.object.geometry.parameters.radius + item.geometry.parameters.radius) < 0;
        }
    }
     
    checkGeneralCollitionCourse(item){
        return this.checkCollitionCourse(item, "x") && this.checkCollitionCourse(item, "y") && this.checkCollitionCourse(item, "z");
    }

    checkCollitionCourse2(item){
        let copy = this.config.velocityVector.clone();
        let unitary = copy.normalize();

        let axles = ["x", "y", "z"]

        let collisionsCourse = new Array(3);

        let deltaAxisAbs;

        let condition;

        for(let [i, axis] of axles.entries()){
            deltaAxisAbs = Math.abs(this.object.position[axis] - item.position[axis]);

            let unitarySign;
            
            if(unitary[axis] == 0){
                unitarySign = 0;
            }else{
                unitarySign = -unitary[axis]/Math.abs(unitary[axis]);
            } 

            if(item.shape == "Box"){
                condition = deltaAxisAbs + this.config.velocityVector[axis] + this.object.geometry.parameters.radius*unitarySign <= item.geometry.parameters[this.checkProperty(axis)]/2;


            }else if(item.shape == "Sphere"){
                condition = deltaAxisAbs + this.config.velocityVector[axis] + this.object.geometry.parameters.radius*unitarySign <= item.geometry.parameters.radius && this.object.position.clone().sub(item.position).length() <= (this.object.geometry.parameters.radius + item.geometry.parameters.radius)*1.2;

            }

            collisionsCourse[i] = !condition;
        }
         
        return collisionsCourse;
    }

    checkCollitionCourse3(item){
        let copy = this.config.velocityVector.clone();
        let unitary = copy.normalize();

        let axles = ["x", "y", "z"];

        let collisionBounds = new Array(3);
        let collisions = [false, false, false];

        let deltaAxisAbs;
        let deltaAxis;

        let condition;

        for(let [i, axis] of axles.entries()){
            deltaAxis = this.object.position[axis] - item.position[axis];
            deltaAxisAbs = Math.abs(deltaAxis);

            let unitarySign;
            
            if(unitary[axis] == 0){
                unitarySign = 0;
            }else{
                unitarySign = -unitary[axis]/Math.abs(unitary[axis]);
            }

            let side = 1;

            if(deltaAxis < 0){
                side = -1;
            }

            if(item.shape == "Box"){
                condition = deltaAxisAbs + this.config.velocityVector[axis] + this.object.geometry.parameters.radius*unitarySign*side < item.geometry.parameters[this.checkProperty(axis)]*side/2;


            }else if(item.shape == "Sphere"){
                condition = deltaAxisAbs + this.config.velocityVector[axis] + this.object.geometry.parameters.radius*unitarySign <= item.geometry.parameters.radius && this.object.position.clone().sub(item.position).length() <= (this.object.geometry.parameters.radius + item.geometry.parameters.radius)*1.2;

            }

            collisionBounds[i] = condition;
        }

        for(let i = 0; i < collisionBounds.length; i++){
            if(collisionBounds[i]){
                for( let [j, axis] of axles.entries()){
                    if(j != i && !collisions[j]){
                        deltaAxis = this.object.position[axis] - item.position[axis];
                        deltaAxisAbs = Math.abs(deltaAxis);
                        
                        collisions[j] = this.checkCollitionCourse(item, axis) && this.checkGeneralCollitionCourse(item);
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
        if(!this.minimalGroundDistance()){
            this.config.velocityVector.y += this.config.accelerationVector.y*t;
            this.object.position.y += this.config.velocityVector.y;
        }else{
            this.config.velocityVector.multiplyScalar(0);
        }
        // this.config.velocityVector.y += this.config.accelerationVector.y*t;
        // this.object.position.y += this.config.velocityVector.y;
    }

    generalMovement(t){
        if(!this.minimalWallDistance()){
            this.config.velocityVector.x += this.config.accelerationVector.x*t;
            this.config.velocityVector.z += this.config.accelerationVector.z*t;
                    
            this.object.position.x += this.config.velocityVector.x;
            this.object.position.z += this.config.velocityVector.z;
        }

        // this.config.velocityVector.x += this.config.accelerationVector.x*t;
        // this.config.velocityVector.z += this.config.accelerationVector.z*t;
                
        // this.object.position.x += this.config.velocityVector.x;
        // this.object.position.z += this.config.velocityVector.z;
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