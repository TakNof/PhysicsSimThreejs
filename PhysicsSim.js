class PhysicsSim{
    constructor(object, config){
        this.object = object;

        this.collitionTypes = Object.freeze({
            Box: Symbol("box"),
            Sphere: Symbol("autumn"),
        })

        this.config = {
            gravity: -9.8,
            accelerationVector: [0, 0, 0],
            velocityVector: [0, 0, 0],
            movementVectorU: [0,0,0],
            energyLoss: 0,
            collitionOn: true,
            collitionType: this.collitionTypes.Box,
            bounce: true
        }

        this.config.accelerationVector[1] = this.config.gravity;

        if(config){
            for(let option in config){
                this.config[option] = config[option];
            }
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
    
    roundCollition(item){
        let property;
        let colliding;
        let axles = ["x", "y", "z"];
        for(let axis of axles){
            property = this.checkProperty(axis);
            colliding = this.object.position[axis] - this.object.geometry.parameters.radius*2.2 >= item.position[axis] + item.geometry.parameters[property]/2;
            if(colliding){
                break;
            }
        }
        return !colliding;
    }
    
    minimalDistance(range, item, axis = "y"){
        let property = this.checkProperty(axis);
        return this.object.position[axis] - this.object.geometry.parameters.radius - (item.position[axis] + item.geometry.parameters[property]/2) <= range;
    }

    move(t){
        this.config.movementVectorU = this.config.velocityVector.map((item)=>{
            return item/item;
        });

        if(this.config.gravity){
            this.gravityMovement(t);
        }

        this.generalMovement(t);

        if(this.config.collitionOn){           
            if(this.roundCollition(this.items[0]) && this.config.bounce){
                this.config.velocityVector[1]*=-(1-this.config.energyLoss);
            }
        }  
    }

    gravityMovement(t){
        if(!this.minimalDistance(0, this.items[0])){
            this.config.velocityVector[1] += this.config.accelerationVector[1]*t;
            this.object.position.y += this.config.velocityVector[1];
            
        } 
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