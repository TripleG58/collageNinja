//
// dependant on utility functions, "dqs" and "dqsa" being
// declared globally in a previous script tag
//

class GridGallery {
    #rows
    #cols
    #maxW
    #minW
    #maxH
    #minH
    #elem
    #css
    #grids
    static #NUMBER_OF_INSTANCES = 0;

    constructor(props) {
        GridGallery.#NUMBER_OF_INSTANCES++;
        console.log(GridGallery.#NUMBER_OF_INSTANCES);
    }

}