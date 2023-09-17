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
            accelerationVector: [0, 0, 0],
            velocityVector: [0, 0, 0],
            movementVectorU: [0, 0, 0],
            energyLoss: 0,
            collitionOn: true,
            collitionType: this.collitionTypes.Box,
            bounce: true,
            mass: 1,
            energy: {
                Kinetic: 0,
                Potential: 0,
            }
        }

        this.setKineticEnergy();
        this.setPotentialEnergy();

        this.config.accelerationVector[1] = this.config.gravity;

        if(config){
            for(let option in config){
                this.config[option] = config[option];
            }
        }
    }

    setPotentialEnergy(){
        this.config.energy.Potential = -this.config.mass*(this.object.position.y - this.object.geometry.parameters.radius)*this.config.gravity;
    }

    setKineticEnergy(){
        this.config.energy.Kinetic = this.config.mass*Math.pow(this.config.velocityVector[1], 2)/2;
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
    
    roundCollision(item){
        return this.checkCollisionCourse(item, "x") && this.checkCollisionCourse(item, "y") && this.checkCollisionCourse(item, "z");
    }

    checkCollisionCourse(item, axis){
        let property = this.checkProperty(axis);
        let collition = Math.abs(this.object.position[axis] - item.position[axis]) - (this.object.geometry.parameters.radius + item.geometry.parameters[property]/2);

        // if(axis === "y"){
        //     console.log(collition);
        // }
            
        return collition < 0;
    }
    
    minimalDistance(){
        return this.getPotentialEnergy() < 0 && Math.abs(this.config.velocityVector[1]) <= 0.3;
    }

    move(t){
        this.setKineticEnergy();
        this.setPotentialEnergy();

        // console.log(Math.round(this.getPotentialEnergy(), 1));

        this.config.movementVectorU = this.config.velocityVector.map((item)=>{
            return item/item;
        });

        if(this.config.gravity){
            this.gravityMovement(t);
        }

        this.generalMovement(t);

        // console.log(`x: ${this.checkCollisionCourse(this.items[0], "x")}, y: ${this.checkCollisionCourse(this.items[0], "y")}, z: ${this.checkCollisionCourse(this.items[0], "z")}`);

        if(this.config.collitionOn){           
            if(this.roundCollision(this.items[0]) && this.config.bounce){
                this.config.velocityVector[1]*=-(1-this.config.energyLoss);
            }
        }  
    }

    gravityMovement(t){
        // console.log(!this.minimalDistance(), this.getPotentialEnergy(), Math.abs(this.config.velocityVector[1]));
        if(!this.minimalDistance()){
            this.config.velocityVector[1] += this.config.accelerationVector[1]*t;
            this.object.position.y += this.config.velocityVector[1];
            
        }
        
        // this.config.velocityVector[1] += this.config.accelerationVector[1]*t;
        // this.object.position.y += this.config.velocityVector[1];
    }

    generalMovement(t){
        this.config.velocityVector[0] += this.config.accelerationVector[0]*t;
        this.config.velocityVector[2] += this.config.accelerationVector[2]*t;

        this.object.position.x += this.config.velocityVector[0];
        this.object.position.z += this.config.velocityVector[2];
    }

    loadColliderItems(...items){
        this.items = items;
    }
}

export default PhysicsSim;