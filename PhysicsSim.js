class PhysicsSim{
    constructor(object, config){
        this.object = object;

        this.collitionTypes = Object.freeze({
            Box: Symbol("box"),
            Sphere: Symbol("autumn"),
        })

        this.config = {
            gravity: 9.8,
            accelerationVector: [0, this.gravity, 0],
            velocityVector: [0, 0, 0],
            movementVectorU: [0,0,0],
            energyLoss: 1,
            collition: true,
            collitionType: this.collitionTypes.Box,
            bounce: true
        } 

        if(config){
            for(let option in config){
                this.config[option] = config[option];
            }
        }
    }


}

export default PhysicsSim;