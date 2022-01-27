// All GGG modules must begin with the following statement.
// This ensures they can be used separately and independently.
if (!GGG) { 
    var GGG = {}; // Initialize the GGG framework object
}

(function(){
    /**
     * Gorgeous Grid Gallery module for GGG framework
     * EDIT: moddified for use as a Web-Worker as required by my 
     * collage generator web app
     */
    const GorgeousGridGallery = (function(){
        // Private-ish Variable Names
        const ROWS = Symbol('rows');
        const COLS = Symbol('cols');
        const MAX_W = Symbol('maxW');
        const MIN_W = Symbol('minW');
        const MAX_H = Symbol('maxH');
        const MIN_H = Symbol('minH');
        const ELEM = Symbol('elem');
        const CSS_ELEM = Symbol('css');
        const GRIDS = Symbol('grids');
        // Private-ish Static Variables
        let numberOfInstances = 0;
        /**
         * Grid - Helper Class for GGG.GorgeousGridGallery
         * 
         * Idea: Create one of these to do work for each of
         *      Bootstrap 4's responsive breakpoints.
         */
        let Grid = (function(){
            // Private-ish Variable Names
            const WIDTH = Symbol('width');
            const HEIGHT = Symbol('height');
            const AREA = Symbol('area');
            const TARGET_AREA = Symbol('targetArea');
            const ARRAY = Symbol('array');
            const ITEMS = Symbol('items');
            const CSS_STR = Symbol('cssStr');
            const HORIZONTAL = Symbol('horizontal');
            const VERTICAL = Symbol('vertical');
            const XSUMS = Symbol('xsums');
            const YSUMS = Symbol('ysums');
            const NUMITEMS_C = Symbol('numItems_H');
            const NUMITEMS_R = Symbol('numItems_V');
            
            function genPossibleSums(length, min, max, array) {
                let maxNum = Math.floor(length/min);
                let minNum = Math.ceil(length/max);
                if (minNum > maxNum) {
                    minNum = maxNum;
                }
                let cntrs = new Array(minNum);

                for (let i = minNum; i <= maxNum; ++i) {
                    let tmpArr = [];
                    cntrs = new Array(i);
                    generateSums(length, i, tmpArr, cntrs, min, max);
                    array.push(tmpArr);
                }

                function generateSums(length, size, arr, cntrs, min, max) {
                    function count(index) {
                        ++cntrs[index];
                        let sum = 0;
                        for (let i of cntrs) {
                            sum += i;
                        }
                        if (sum == length) {
                            arr.push(cntrs.slice(0));
                        }
                        if (index < size - 1) {
                            count(index + 1);
                        }
                    }
                    function loop(prevIndex, loopLevel, maxLoopLevel) {
                    if (loopLevel < maxLoopLevel) {
                        for (let i = prevIndex; i < size; ++i) {
                            loop(i, loopLevel + 1, maxLoopLevel);
                        }
                    }
                    else {
                        for (let i = prevIndex; i < size; ++i) {
                            cntrs.fill(min, i+1);
                            count(i);
                        }
                    }
                    }
                    cntrs.fill(min, 0);
                    let sum = 0;
                    for (let i of cntrs) {
                        sum += i;
                    }
                    if (sum == length) {
                        arr.push(cntrs.slice(0));
                    }
                    count(0);
                    for (let i = 1; i < max-min; ++i) {
                        loop(0,1,i);
                    }
                    // console.log(arr);
                }
            }

            /**
             * GridItem - Helper Class for Grid
             */
            let GridItem = (function(){
                // Private-ish Variable Names
                const X = Symbol('x');
                const Y = Symbol('y');
                const WIDTH = Symbol('width');
                const HEIGHT = Symbol('height');
                // Public Class Declaration
                return class GridItem {
                    constructor(x, y, w, h) {
                        this[X] = x;
                        this[Y] = y;
                        this[WIDTH] = w;
                        this[HEIGHT] = h;
                    }
                    get height() {
                        return this[HEIGHT];
                    }
                    get width() {
                        return this[WIDTH];
                    }
                    get area() {
                        return this[WIDTH] * this[HEIGHT];
                    }
                    get x() {
                        return this[X];
                    }
                    get y() {
                        return this[Y];
                    }
                };
            })();
            // Public Class Declaration
            return class Grid {
                constructor(rows, cols, maxH, minH, maxW, minW, bp) {
                    this[WIDTH] = cols;
                    this[HEIGHT] = rows;
                    this[TARGET_AREA] = this[WIDTH] * this[HEIGHT];
                    this[AREA] = 0;
                    this[ITEMS] = [];
                    this[CSS_STR] = '';
                    this[ARRAY] = Array.from(Array(this[HEIGHT]), 
                            () => new Array(this[WIDTH]).fill(false));
                    this[HORIZONTAL] = Array.from(Array(this[HEIGHT]), 
                            () => new Array(this[WIDTH]).fill(false));
                    this[VERTICAL] = Array.from(Array(this[HEIGHT]), 
                            () => new Array(this[WIDTH]).fill(false));
                    this[NUMITEMS_C] = new Array(this[WIDTH]);
                    this[NUMITEMS_R] = new Array(this[HEIGHT]);
                    this[NUMITEMS_C].fill(false);
                    this[NUMITEMS_R].fill(false);
                    this[XSUMS] = [];
                    this[YSUMS] = [];
                    while (this[XSUMS].length == 0) {
                        --maxW;
                        if (maxW < minW) {
                            minW = maxW;
                        }
                        genPossibleSums(cols, minW, maxW, this[XSUMS]);
                    }
                    while (this[YSUMS].length == 0) {
                        --maxH;
                        if (maxH < minH) {
                            minH = maxH;
                        }
                        genPossibleSums(rows, minH, maxH, this[YSUMS]);
                    }
                    if (this[XSUMS].length == 0 || this[YSUMS].length == 0) { 
                        console.log('Invalid min/max. No sums able to be generated ' + 
                                'for either horizontal or vertical direction.');
                        // return 1x1 grid
                        return;
                    }
                    // console.log(this[XSUMS]);
                    // console.log(this[YSUMS]);
                    // helper methods for randomness
                    function isSubArray(arr, sub) { 
                        let i = 0, j = 0; 
                        while (i < arr.length && j < sub.length) { 
                            if (arr[i] == sub[j]) { 
                                i++; 
                                j++; 
                                if (j == sub.length) 
                                    return true;
                            } 
                            else { 
                                i++;
                                j = 0;
                            }
                        } 
                        return false; 
                    }
                    function matches(sums, arr) {
                        arr.sort((a,b)=>(b-a));
                        let ret = false;
                        for (let i = 0; i < sums.length && !ret; ++i) {
                            ret = isSubArray(sums[i], arr);
                        }
                        return ret;
                    }
                    function matchesNumItems(sums, arr) {
                        if (arr.length == 0) {
                            return true;
                        }
                        arr.sort((a,b)=>(b-a));
                        let ret = false;
                        for (let i = 0; i < sums.length && !ret; ++i) {
                            ret = isSubArray(sums[i], arr);
                        }
                        return ret;
                    }
                    function genRand(min, max, arr) {
                        let tmp = min + Math.floor(Math.random() * (max+1 - min - arr.length));
                        arr.sort((a,b)=>(a-b));
                        for (let i = 0; i < arr.length; ++i) {
                            if (tmp < arr[i]) {
                                break;
                            }
                            ++tmp;
                        }
                        if (tmp < min) {
                            tmp = min;
                        }
                        arr.push(tmp);
                        return tmp;
                    }
                    function genNum(min, max, n, minN, arr, sums) {
                        let ret = min;
                        let numsTried = [];
                        do {
                            if (numsTried.length >= max - min + 1) {
                                // console.log('was not able to generate num: invalid min/max');
                                // console.log('numsTried = ' + numsTried);
                                // alert('genNum failed - press F12');
                                return ret;
                            }
                            ret = genRand(min, max, numsTried);
                        } 
                        while (!matches(sums[n - minN], arr.concat([ret])));
                        return ret;
                    }
                    function genNumItems(min, max, arr, sums) {
                        let ret = min;
                        let numsTried = [];
                        do { 
                            if (numsTried.length == max - min + 1) {
                                // console.log('was not able to generate N: invalid min/max');
                                // console.log('numsTried = ' + numsTried);
                                // alert('genNumItems failed - press F12');
                                return;
                            }
                            ret = genRand(min, max, numsTried); 
                        }
                        while (!matchesNumItems(sums[ret - min], arr));
                        return ret;
                    }
                    // initialize tmp variables
                    let w, h, x = 0, y = 0, gi, n, m, wArr = [], hArr = [];

                    let maxNumW = this[XSUMS][this[XSUMS].length-1][0].length;
                    let minNumW = this[XSUMS][0][0].length;
                    let maxNumH = this[YSUMS][this[YSUMS].length-1][0].length;
                    let minNumH = this[YSUMS][0][0].length;
                    // console.log(maxNumW, minNumW);
                    // console.log(maxNumH, minNumH);

                    function updateCSS(h, w, index, t) {
                        t[CSS_STR] += '.GorgeousGridGallery-' 
                                + numberOfInstances + '-item-' + index + '{'
                                    + 'grid-row:span ' + h + ';'
                                    + 'grid-column:span ' + w + ';'
                                + '}';
                    }
                    switch(bp) {
                        default: 
                            break;
                        case 'xs':
                            this[CSS_STR] += '';
                            break;
                        case 'sm':
                            this[CSS_STR] += '@media (min-width: 576px) {';
                            break;
                        case 'md':
                            this[CSS_STR] += '@media (min-width: 768px) {';
                            break;
                        case 'lg':
                            this[CSS_STR] += '@media (min-width: 992px) {';
                            break;
                        case 'xl':
                            this[CSS_STR] += '@media (min-width: 1200px) {';
                            break;
                    }
                    while (this[AREA] < this[TARGET_AREA]) {
                        // find current x & y positions
                        for (; x < this[WIDTH] && this[ARRAY][y][x]; ++x);
                        if (this[WIDTH] - x == 0) { // go to next row
                            ++y;
                            x = 0;
                            // inspect horizontal grid
                            wArr = [];
                            for (let i = 0; i < this[WIDTH]; ++i) {
                                let tmp = this[HORIZONTAL][y][i];
                                if (tmp) {
                                    wArr.push(tmp);
                                }
                            }
                            wArr.sort((a,b)=>(b-a));
                        }
                        else {
                            let spaceX = 0, spaceY = this[HEIGHT] - y; 
                            for (; x + spaceX < this[WIDTH]  
                                    && !this[ARRAY][y][x + spaceX]; ++spaceX);
                            // inspect vertical grid
                            hArr = [];
                            for (let i = 0; i < this[HEIGHT]; ++i) {
                                let tmp = this[VERTICAL][i][x];
                                if (tmp) {
                                    hArr.push(tmp);
                                }
                            }
                            hArr.sort((a,b)=>(b-a));

                            if (this[NUMITEMS_R][y]) {
                                n = this[NUMITEMS_R][y];
                            }
                            else {
                                n = genNumItems(minNumW, maxNumW, wArr, this[XSUMS]);
                                this[NUMITEMS_R][y] = n;
                            }
                            if (this[NUMITEMS_C][x]) {
                                m = this[NUMITEMS_C][x];
                            }
                            else {
                                m = genNumItems(minNumH, maxNumH, hArr, this[YSUMS]);
                                this[NUMITEMS_C][x] = m;
                            }

                            if (n === undefined || m === undefined) {
                                // console.log(this[NUMITEMS_R]);
                                // console.log(this[NUMITEMS_C]);
                                n = (n)? n : minNumW;
                                m = (m)? m : minNumH;
                            }

                            // Do I seriously STILL need to do the grow/shrink algorithm?
                            // ANS: YES, but it's waaay more simple this time!
                            // just check if spaceX < min*2, spaceX = new min

                            let localMin = minW;
                            if (spaceX < minW * 2) {
                                localMin = spaceX;
                            }
                            w = genNum(localMin, Math.min(maxW, spaceX), n, minNumW, wArr, this[XSUMS]);
                            
                            localMin = minH;
                            if (spaceY < minH * 2) {
                                localMin = spaceY;
                            }
                            h = genNum(localMin, Math.min(maxH, spaceY), m, minNumH, hArr, this[YSUMS]);

                            // console.log(x, y, w, h);
                            gi = new GridItem(x, y, w, h);

                            this[ITEMS].push(gi);
                            this[AREA] += gi.area;
                            for (let i = x; i < x + gi.width; ++i) {
                                for (let j = y; j < y + gi.height; ++j) {
                                    this[ARRAY][j][i] = true;
                                }
                            }
                            for (let i = 0; i < gi.height; ++i) {
                                this[HORIZONTAL][gi.y + i][gi.x] = gi.width;
                            }
                            for (let i = 0; i < gi.width; ++i) {
                                this[VERTICAL][gi.y][gi.x + i] = gi.height;
                            }

                            wArr.push(gi.width);
                            wArr.sort((a,b)=>(b-a));

                            x += gi.width;
                            let index = this[ITEMS].length - 1;
                            updateCSS(gi.height, gi.width, index, this);
                        }
                    }
                    if (this[CSS_STR].startsWith('@media')) {
                        this[CSS_STR] += '}';
                    }
                }
                get numItems(){
                    return this[ITEMS].length;
                }
                get css() {
                    return this[CSS_STR];
                }
            };
        })();
        // Public Class Declaration
        return class GorgeousGridGallery {
            constructor(props) {
                ++numberOfInstances;
                // set defaults
                this[ROWS] = {xs: 1, sm: 1, md: 1, lg: 1, xl: 1};
                this[COLS] = {xs: 1, sm: 1, md: 1, lg: 1, xl: 1};
                this[MAX_H] = {xs: 1, sm: 1, md: 1, lg: 1, xl: 1};
                this[MIN_H] = {xs: 1, sm: 1, md: 1, lg: 1, xl: 1};
                this[MAX_W] = {xs: 1, sm: 1, md: 1, lg: 1, xl: 1};
                this[MIN_W] = {xs: 1, sm: 1, md: 1, lg: 1, xl: 1};

                //#region check input for errors
                function checkIfInputNum(sym, arg, t) {
                    if (Number.isInteger(arg) && arg >= 1) {
                        t[sym] = {
                            xs: arg,
                            sm: arg,
                            md: arg,
                            lg: arg,
                            xl: arg
                        };
                    }
                    else if (typeof arg === 'number' && arg < 1) {
                        console.warn('Invalid input to constructor: ' + sym);
                    }
                }
                function checkIfInputObject(sym, arg, t) {
                    if (typeof arg === 'object') {
                        if (!Number.isInteger(arg.xs)) {
                            t[sym].xs = 1;
                        }
                        else {
                            t[sym].xs = arg.xs;
                        }
                        if (!Number.isInteger(arg.sm)) {
                            t[sym].sm = t[sym].xs;
                        }
                        else {
                            t[sym].sm = arg.sm;
                        }
                        if (!Number.isInteger(arg.md)) {
                            t[sym].md = t[sym].sm;
                        }
                        else {
                            t[sym].md = arg.md;
                        }
                        if (!Number.isInteger(arg.lg)) {
                            t[sym].lg = t[sym].md;
                        }
                        else {
                            t[sym].lg = arg.lg;
                        }
                        if (!Number.isInteger(arg.xl)) {
                            t[sym].xl = t[sym].lg;
                        }
                        else {
                            t[sym].xl = arg.xl;
                        }
                    }
                }
                function checkInputMaxMin(maxSym, minSym, t) {
                    let err = '';
                    if (t[maxSym].xs < t[minSym].xs) {
                        t[minSym].xs = t[maxSym].xs;
                        err += 'xs';
                    }
                    if (t[maxSym].sm < t[minSym].sm) {
                        t[minSym].sm = t[maxSym].sm;
                        err += ', sm';
                    }
                    if (t[maxSym].md < t[minSym].md) {
                        t[minSym].md = t[maxSym].md;
                        err += ', md';
                    }
                    if (t[maxSym].lg < t[minSym].lg) {
                        t[minSym].lg = t[maxSym].lg;
                        err += ', lg';
                    }
                    if (t[maxSym].xl < t[minSym].xl) {
                        t[minSym].xl = t[maxSym].xl;
                        err += ', xl';
                    }
                    if (err) {
                        console.warn('Invalid input to constructor: '
                                + maxSym + ' ' + err);
                    }
                }
                checkIfInputNum(ROWS, props.rows, this);
                checkIfInputNum(COLS, props.cols, this);
                checkIfInputNum(MAX_H, props.maxH, this);
                checkIfInputNum(MIN_H, props.minH, this);
                checkIfInputNum(MAX_W, props.maxW, this);
                checkIfInputNum(MIN_W, props.minW, this);
                checkIfInputObject(ROWS, props.rows, this);
                checkIfInputObject(COLS, props.cols, this);
                checkIfInputObject(MAX_H, props.maxH, this);
                checkIfInputObject(MIN_H, props.minH, this);
                checkIfInputObject(MAX_W, props.maxW, this);
                checkIfInputObject(MIN_W, props.minW, this);
                checkInputMaxMin(MAX_H, MIN_H, this);
                checkInputMaxMin(MAX_W, MIN_W, this);
                //#endregion

                //#region create gallery element if necessary
                // if (props.ref instanceof Element) {
                //     this[ELEM] = props.ref;
                // }
                // else {
                //     // this[ELEM] = document.createElement('DIV');
                // }
                // this[ELEM].className += ' GorgeousGridGallery' 
                //         + ' GorgeousGridGallery-' + numberOfInstances;
                //#endregion

                //#region create CSS_ELEM
                // this[CSS_ELEM] = document.createElement('STYLE');
                // this[CSS_ELEM].className += ' GorgeousGridGallery-style'
                //         +' GorgeousGridGallery-'+numberOfInstances+'-style';
                // this[CSS_ELEM].innerHTML = 
                let cssStr = '<style class="GorgeousGridGallery-style GorgeousGridGallery-'+ numberOfInstances + '-style">'
                        + '.GorgeousGridGallery-' + numberOfInstances + '{'
                        + 'grid-template-columns:repeat(' + this[COLS].xs
                        + ', 1fr);'
                        + 'grid-template-rows:repeat(' + this[ROWS].xs
                        + ', 1fr);'
                        + '}'
                        + '@media (min-width: 576px) {'
                        +   '.GorgeousGridGallery-' + numberOfInstances + '{'
                        +   'grid-template-columns:repeat(' + this[COLS].sm
                        +   ', 1fr);'
                        +   'grid-template-rows:repeat(' + this[ROWS].sm
                        +   ', 1fr);'
                        +   '}'
                        + '}'
                        + '@media (min-width: 768px) {'
                        +   '.GorgeousGridGallery-' + numberOfInstances + '{'
                        +   'grid-template-columns:repeat(' + this[COLS].md
                        +   ', 1fr);'
                        +   'grid-template-rows:repeat(' + this[ROWS].md
                        +   ', 1fr);'
                        +   '}'
                        + '}'
                        + '@media (min-width: 992px) {'
                        +   '.GorgeousGridGallery-' + numberOfInstances + '{'
                        +   'grid-template-columns:repeat(' + this[COLS].lg
                        +   ', 1fr);'
                        +   'grid-template-rows:repeat(' + this[ROWS].lg
                        +   ', 1fr);'
                        +   '}'
                        + '}'
                        + '@media (min-width: 1200px) {'
                        +   '.GorgeousGridGallery-' + numberOfInstances + '{'
                        +   'grid-template-columns:repeat(' + this[COLS].xl
                        +   ', 1fr);'
                        +   'grid-template-rows:repeat(' + this[ROWS].xl
                        +   ', 1fr);'
                        +   '}'
                        + '}';
                //#endregion

                //#region this[GRIDS] constructing
                this[GRIDS] = {};
                this[GRIDS].xs = new Grid(
                    this[ROWS].xs, 
                    this[COLS].xs, 
                    this[MAX_H].xs, 
                    this[MIN_H].xs, 
                    this[MAX_W].xs, 
                    this[MIN_W].xs,
                    'xs'
                );
                // this[GRIDS].sm = new Grid(
                //     this[ROWS].sm, 
                //     this[COLS].sm, 
                //     this[MAX_H].sm, 
                //     this[MIN_H].sm, 
                //     this[MAX_W].sm, 
                //     this[MIN_W].sm,
                //     'sm'
                // );
                // this[GRIDS].md = new Grid(
                //     this[ROWS].md, 
                //     this[COLS].md, 
                //     this[MAX_H].md, 
                //     this[MIN_H].md, 
                //     this[MAX_W].md, 
                //     this[MIN_W].md,
                //     'md'
                // );
                // this[GRIDS].lg = new Grid(
                //     this[ROWS].lg, 
                //     this[COLS].lg, 
                //     this[MAX_H].lg, 
                //     this[MIN_H].lg, 
                //     this[MAX_W].lg, 
                //     this[MIN_W].lg,
                //     'lg'
                // );
                // this[GRIDS].xl = new Grid(
                //     this[ROWS].xl, 
                //     this[COLS].xl, 
                //     this[MAX_H].xl, 
                //     this[MIN_H].xl, 
                //     this[MAX_W].xl, 
                //     this[MIN_W].xl,
                //     'xl'
                // );
                //#endregion this[GRIDS] declarations

                // function that returns the minimum number of pictures
                // needed to fill the gallery across all breakpoints
                this.minPics = function () {
                    return Math.max(
                        this[GRIDS].xs.numItems,
                        // this[GRIDS].sm.numItems,
                        // this[GRIDS].md.numItems,
                        // this[GRIDS].lg.numItems,
                        // this[GRIDS].xl.numItems
                    );
                };
                let maxItems = this.minPics();
                // let cssStr = 
                cssStr += 
                          this[GRIDS].xs.css   ;
                        // + this[GRIDS].sm.css
                        // + this[GRIDS].md.css
                        // + this[GRIDS].lg.css
                        // + this[GRIDS].xl.css;
                //#region hide unused GridItems
                function hideUnusedGridItems(bp, numItems, itemsInGrid) {
                    let str = '';
                    switch(bp) {
                        default:
                            return '';
                            break;
                        case 'xs':
                            str += '@media (max-width: 575.98px) {';
                            break;
                        case 'sm': 
                            str += '@media (min-width: 576px) and (max-width: 767.98px) {';
                            break;
                        case 'md':
                            str += '@media (min-width: 768px) and (max-width: 991.98px) {';
                            break;
                        case 'lg':
                            str += '@media (min-width: 992px) and (max-width: 1199.98px) {';
                            break;
                        case 'xl':
                            str += '@media (min-width: 1200px) {';
                            break;
                    }
                    for (let i = numItems - 1; i > itemsInGrid - 1; --i) {
                        str += '.GorgeousGridGallery-' + numberOfInstances
                                + '-item-' + i + '{display:none;}';
                    }
                    if (str.startsWith('@media')) {
                        str += '}';
                    }
                    return str;
                }
                let bp = 'xs';
                cssStr += 
                        hideUnusedGridItems(
                            bp, 
                            maxItems, 
                            this[GRIDS].xs.numItems
                        );
                // bp = 'sm';
                // cssStr += 
                //         hideUnusedGridItems(
                //             bp, 
                //             maxItems, 
                //             this[GRIDS].sm.numItems
                //         );
                // bp = 'md';
                // cssStr += 
                //         hideUnusedGridItems(
                //             bp, 
                //             maxItems, 
                //             this[GRIDS].md.numItems
                //         );
                // bp = 'lg';
                // cssStr += 
                //         hideUnusedGridItems(
                //             bp, 
                //             maxItems, 
                //             this[GRIDS].lg.numItems
                //         );
                // bp = 'xl';
                // cssStr += 
                //         hideUnusedGridItems(
                //             bp, 
                //             maxItems, 
                //             this[GRIDS].xl.numItems
                //         );
                //#endregion hide unused GridItems
                
                cssStr += '</style>';


                // this[CSS_ELEM].innerHTML += cssStr;
                // document.body.appendChild(this[CSS_ELEM]);
                // let elemStr = '<div id="staging-area" class="GorgeousGridGallery GorgeousGridGallery-' + numberOfInstances + '">';
                let elemStr = '';
                for (let i = 0; i < maxItems; ++i) {
                    // let div = document.createElement('DIV');
                    elemStr += '<div id="GorgeousGridGallery-' + numberOfInstances + '-item-' + i 
                            + '" class="GorgeousGridGallery-' + numberOfInstances + '-item-' + i + ' GorgeousGridGallery-item"></div>';
                    // div.id = 'GorgeousGridGallery-'
                    //         + numberOfInstances + '-item-' + i;
                    // div.className += ' GorgeousGridGallery-' 
                    //         + numberOfInstances + '-item-' + i
                    //         + ' GorgeousGridGallery-item';
                    // this[ELEM].appendChild(div);
                }
                // elemStr += '</div>';

                this[ELEM] = {elem: elemStr, css: cssStr, num: numberOfInstances};
            }

            // returns reference element UPDATE: as an HTML string (for use as Web-Worker)
            // will need to be appended to document if not specified
            // in GorgeousGridGallery constructor
            get ref() {
                return this[ELEM];
            }

        };
    })();
    
    GGG.GorgeousGridGallery = GorgeousGridGallery;


    // Web-Worker code goes here
    onmessage = event => {
        // console.log('gallery received message');
        let gallery = new GGG.GorgeousGridGallery(event.data);
        postMessage(gallery.ref); // gets stringified
    };


})();