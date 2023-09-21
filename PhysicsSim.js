import * as THREE from "three";

class PhysicsSim{
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
                // console.log(angle*180/Math.PI);
                if(angle >= 0 && angle <= Math.PI && i/2 % 2 == 0){
                    let collisionsCourse = this.checkCollitionCourse2(item);
                    // console.log(collisionsCourse);
                    for(let [j, axis] of collisionsCourse.entries()){
                        if(axis){
                            this.config.velocityVector.setComponent(j,  this.config.velocityVector.getComponent(j)*-1);
                            this.config.velocityVector.multiplyScalar(1-this.config.energyLoss);
                            // if(j == 1 && item.shape == "Box"){
                            //     this.object.position.y = item.position.y + item.geometry.parameters.height*face.normal.getComponent(1)/2 + this.object.geometry.parameters.radius;
                            //     console.log("Fixing sphere position");
                            // }
                            // console.log(`Colliding at: ${angle*180/Math.PI}`, j, face.normal, copy);
                        }
                    }
                }
            }
        }
    }

    roundCollition2(item){
        let angle;
        let copy = this.config.velocityVector.clone();
        let faceNormalVector;
        let collition = this.checkCollitionCourse3(item);

        for(let [i, face] of item.geometry.faces.entries()){
            if(i % 2 == 0){
                angle = copy.angleTo(face.normal);
                // console.log(i, angle*180/Math.PI);
                if(angle != Math.PI/2 && i/2 % 2 == 0 && collition){
                    faceNormalVector = face.normal.clone();
                    faceNormalVector.multiplyScalar(-1);

                    console.log(faceNormalVector);

                    for(let axis of ["x", "y", "z"]){
                        if(faceNormalVector[axis] != 0){
                            this.config.velocityVector[axis] *= faceNormalVector[axis];
                        }

                        if(axis == "y" && faceNormalVector.y != 0 && item.shape == "Box"){
                            this.object.position.y = item.position.y + item.geometry.parameters.height*face.normal.getComponent(1)/2 + this.object.geometry.parameters.radius;
                            console.log("fixing vertical collision");
                        }
                    }

                }
            }
        }
    }

    checkCollitionCourse(item, axis){
        let property = this.checkProperty(axis);
        let collition;
        if(item.shape == "Box"){
            collition = Math.abs(this.object.position[axis] - item.position[axis]) - (this.object.geometry.parameters.radius + item.geometry.parameters[property]/2);
        }else if(item.shape == "Sphere"){
            collition = Math.abs(this.object.position[axis] - item.position[axis]) - (this.object.geometry.parameters.radius + item.geometry.parameters.radius);
        }
            
        return collition < 0;
    }
    
    checkGeneralCollitionCourse(item){
        return this.checkCollitionCourse(item, "x") && this.checkCollitionCourse(item, "y") && this.checkCollitionCourse(item, "z");
    }

    checkCollitionCourse2(item){
        let copy = this.config.velocityVector.clone();
        let unitary = copy.normalize();

        let axles = ["x", "y", "z"]

        let collisionsCourse = new Array(3);

        let deltaAxis;
        let deltaAxisAbs;
        let side = 1;

        let condition;

        for(let [i, axis] of axles.entries()){
            deltaAxis = this.object.position[axis] - item.position[axis];
            deltaAxisAbs = Math.abs(deltaAxis);

            if(deltaAxis <  0){
                side = 1;
            }else{
                side = -1;
            }

            let unitarySign;
            
            if(unitary[axis] == 0){
                unitarySign = 0;
            }else{
                unitarySign = -unitary[axis]/Math.abs(unitary[axis]);
            } 

            if(item.shape == "Box"){
                condition = deltaAxisAbs + this.config.velocityVector[axis] + this.object.geometry.parameters.radius*unitarySign <= item.geometry.parameters[this.checkProperty(axis)]/2;
                // console.log(`axis: ${axis}\n\ndeltaAxisAbs: ${deltaAxisAbs}\nvelocity vector: ${this.config.velocityVector[axis]}\nradius: ${this.object.geometry.parameters.radius*unitarySign}\nsummary: ${deltaAxisAbs + this.config.velocityVector[axis] + this.object.geometry.parameters.radius*unitarySign}\nbox side: ${item.geometry.parameters[this.checkProperty(axis)]/2}`);

            }else if(item.shape == "Sphere"){
                condition = deltaAxisAbs + this.config.velocityVector[axis] + this.object.geometry.parameters.radius*unitarySign <= item.geometry.parameters.radius && this.object.position.clone().sub(item.position).length() <= (this.object.geometry.parameters.radius + item.geometry.parameters.radius)*1.2;
                // console.log(this.object.position.clone().sub(item.position).lengthSq(), (this.object.geometry.parameters.radius + item.geometry.parameters.radius)*1.2);
                
                // console.log("Sphere collition: ", condition);
            }

            collisionsCourse[i] = !condition;
        }
         
        return collisionsCourse;
    }

    checkCollitionCourse3(item){
        let copy = this.config.velocityVector.clone();
        let unitary = copy.normalize();

        let axles = ["x", "y", "z"]

        let collisionsCourse = false;

        let deltaAxis;
        let deltaAxisAbs;
        let side = 1;

        let condition;

        for(let [i, axis] of axles.entries()){
            deltaAxis = this.object.position[axis] - item.position[axis];
            deltaAxisAbs = Math.abs(deltaAxis);

            if(deltaAxis <  0){
                side = 1;
            }else{
                side = -1;
            }

            let unitarySign;
            
            if(unitary[axis] == 0){
                unitarySign = 0;
            }else{
                unitarySign = -unitary[axis]/Math.abs(unitary[axis]);
            } 

            if(item.shape == "Box"){
                condition = deltaAxisAbs + this.config.velocityVector[axis] + this.object.geometry.parameters.radius*unitarySign <= item.geometry.parameters[this.checkProperty(axis)]/2;
                // console.log(`axis: ${axis}\n\ndeltaAxisAbs: ${deltaAxisAbs}\nvelocity vector: ${this.config.velocityVector[axis]}\nradius: ${this.object.geometry.parameters.radius*unitarySign}\nsummary: ${deltaAxisAbs + this.config.velocityVector[axis] + this.object.geometry.parameters.radius*unitarySign}\nbox side: ${item.geometry.parameters[this.checkProperty(axis)]/2}`);

            }else if(item.shape == "Sphere"){
                condition = deltaAxisAbs + this.config.velocityVector[axis] + this.object.geometry.parameters.radius*unitarySign <= item.geometry.parameters.radius && this.object.position.clone().sub(item.position).length() <= (this.object.geometry.parameters.radius + item.geometry.parameters.radius)*1.2;
                // console.log(this.object.position.clone().sub(item.position).lengthSq(), (this.object.geometry.parameters.radius + item.geometry.parameters.radius)*1.2);
                
                // console.log("Sphere collition: ", condition);
            }

            // console.log(condition);

            collisionsCourse = collisionsCourse || condition;
        }
         
        return collisionsCourse;
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

        // console.log(this.config.velocityVector);

        this.generalMovement(t);
        
        if(this.config.collitionOn){
            if(!this.__collitionChecked && !this.__checkingCollision){
                this.__checkingCollision = true;
                for(let item of this.items){
                    if(this.config.bounce && this.checkGeneralCollitionCourse(item) && this.config.velocityVector.length() > 0.08){
                        this.roundCollition2(item);                        
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
        // console.log(!this.minimalWallDistance());
        // if(!this.minimalWallDistance()){
        //     this.__setVelocityVectorByAccelerationVector(0, t);
        //     this.__setVelocityVectorByAccelerationVector(2, t);

        //     this.object.position.x += this.config.velocityVector.getComponent(0);
        //     this.object.position.z += this.config.velocityVector.getComponent(2);
        // }

        this.config.velocityVector.x += this.config.accelerationVector.x*t;
        this.config.velocityVector.z += this.config.accelerationVector.z*t;
                
        this.object.position.x += this.config.velocityVector.x;
        this.object.position.z += this.config.velocityVector.z;
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
}

export default PhysicsSim;