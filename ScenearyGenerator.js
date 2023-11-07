import ShapeGenerator from "./ShapeGenerator.js";


class ScenaryGenerator{
    /**
     * @constructor
     * @param {[height: Number, width: Number, depth: Number]} floorDimensions
     * @param {Number} wallHeight
     * @param {String} materialType
     * @param {Object} config
     */
    constructor(floorDimensions, wallHeight, materialType, config){
        let floor = new ShapeGenerator("Box", floorDimensions, materialType, config);
        floor.receiveShadow = true;
        floor.position.y = -0.5;
        // floor.position.y = 5
        // floor.rotation.z = Math.PI/6;

        let walls = new Array(4);

        for(let i = 0; i < walls.length; i++){
            let side = 1;
            let dimensions = [floor.geometry.parameters.width, wallHeight, floor.geometry.parameters.depth];
            let axis = "x";

            if(i % 2 == 0){
                side = -1;
            }

            if(i < 2){
                dimensions[0] = floor.geometry.parameters.height;
                
            }else{
                dimensions[2] = floor.geometry.parameters.height;
                axis = "z";
            }

            walls[i] = new ShapeGenerator("Box", dimensions, materialType, config);
            walls[i].receiveShadow = true;
            walls[i].position.y = wallHeight/2;
            walls[i].position[axis] =  ((floor.geometry.parameters[this.checkGeoParameters(axis)]/2) + (floor.geometry.parameters.height/2))*side;
        }

        this.items = [floor, ...walls];
    }

    checkGeoParameters(axis){
        switch (axis) {
            case "x":
                return "width";
            case "y":
                return "height";
            case "z":
                return "depth"
            default:
                throw new Error("Not valid axis");
        }
    }
}

export default ScenaryGenerator;