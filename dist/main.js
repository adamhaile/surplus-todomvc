/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 9);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
// Public interface
var S = function S(fn, value) {
    var owner = Owner, running = RunningNode;
    if (owner === null)
        console.warn("computations created without a root or parent will never be disposed");
    var node = new ComputationNode(fn, value);
    Owner = RunningNode = node;
    if (RunningClock === null) {
        toplevelComputation(node);
    }
    else {
        node.value = node.fn(node.value);
    }
    if (owner && owner !== UNOWNED) {
        if (owner.owned === null)
            owner.owned = [node];
        else
            owner.owned.push(node);
    }
    Owner = owner;
    RunningNode = running;
    return function computation() {
        if (RunningNode !== null) {
            if (node.age === RootClock.time) {
                if (node.state === RUNNING)
                    throw new Error("circular dependency");
                else
                    updateNode(node); // checks for state === STALE internally, so don't need to check here
            }
            logComputationRead(node, RunningNode);
        }
        return node.value;
    };
};
// compatibility with commonjs systems that expect default export to be at require('s.js').default rather than just require('s-js')
Object.defineProperty(S, 'default', { value: S });
/* harmony default export */ __webpack_exports__["a"] = (S);
S.root = function root(fn) {
    var owner = Owner, root = fn.length === 0 ? UNOWNED : new ComputationNode(null, null), result = undefined, disposer = fn.length === 0 ? null : function _dispose() {
        if (RunningClock !== null) {
            RootClock.disposes.add(root);
        }
        else {
            dispose(root);
        }
    };
    Owner = root;
    if (RunningClock === null) {
        result = topLevelRoot(fn, disposer, owner);
    }
    else {
        result = disposer === null ? fn() : fn(disposer);
        Owner = owner;
    }
    return result;
};
function topLevelRoot(fn, disposer, owner) {
    try {
        return disposer === null ? fn() : fn(disposer);
    }
    finally {
        Owner = owner;
    }
}
S.on = function on(ev, fn, seed, onchanges) {
    if (Array.isArray(ev))
        ev = callAll(ev);
    onchanges = !!onchanges;
    return S(on, seed);
    function on(value) {
        var running = RunningNode;
        ev();
        if (onchanges)
            onchanges = false;
        else {
            RunningNode = null;
            value = fn(value);
            RunningNode = running;
        }
        return value;
    }
};
function callAll(ss) {
    return function all() {
        for (var i = 0; i < ss.length; i++)
            ss[i]();
    };
}
S.data = function data(value) {
    var node = new DataNode(value);
    return function data(value) {
        if (arguments.length > 0) {
            if (RunningClock !== null) {
                if (node.pending !== NOTPENDING) {
                    if (value !== node.pending) {
                        throw new Error("conflicting changes: " + value + " !== " + node.pending);
                    }
                }
                else {
                    node.pending = value;
                    RootClock.changes.add(node);
                }
            }
            else {
                if (node.log !== null) {
                    node.pending = value;
                    RootClock.changes.add(node);
                    event();
                }
                else {
                    node.value = value;
                }
            }
            return value;
        }
        else {
            if (RunningNode !== null) {
                logDataRead(node, RunningNode);
            }
            return node.value;
        }
    };
};
S.value = function value(current, eq) {
    var data = S.data(current), age = 0;
    return function value(update) {
        if (arguments.length === 0) {
            return data();
        }
        else {
            var same = eq ? eq(current, update) : current === update;
            if (!same) {
                var time = RootClock.time;
                if (age === time)
                    throw new Error("conflicting values: " + update + " is not the same as " + current);
                age = time;
                current = update;
                data(update);
            }
            return update;
        }
    };
};
S.freeze = function freeze(fn) {
    var result = undefined;
    if (RunningClock !== null) {
        result = fn();
    }
    else {
        RunningClock = RootClock;
        RunningClock.changes.reset();
        try {
            result = fn();
            event();
        }
        finally {
            RunningClock = null;
        }
    }
    return result;
};
S.sample = function sample(fn) {
    var result, running = RunningNode;
    if (running !== null) {
        RunningNode = null;
        result = fn();
        RunningNode = running;
    }
    else {
        result = fn();
    }
    return result;
};
S.cleanup = function cleanup(fn) {
    if (Owner !== null) {
        if (Owner.cleanups === null)
            Owner.cleanups = [fn];
        else
            Owner.cleanups.push(fn);
    }
    else {
        console.warn("cleanups created without a root or parent will never be run");
    }
};
// Internal implementation
/// Graph classes and operations
var Clock = (function () {
    function Clock() {
        this.time = 0;
        this.changes = new Queue(); // batched changes to data nodes
        this.updates = new Queue(); // computations to update
        this.disposes = new Queue(); // disposals to run after current batch of updates finishes
    }
    return Clock;
}());
var DataNode = (function () {
    function DataNode(value) {
        this.value = value;
        this.pending = NOTPENDING;
        this.log = null;
    }
    return DataNode;
}());
var ComputationNode = (function () {
    function ComputationNode(fn, value) {
        this.fn = fn;
        this.value = value;
        this.state = CURRENT;
        this.source1 = null;
        this.source1slot = 0;
        this.count = 0;
        this.sources = null;
        this.sourceslots = null;
        this.log = null;
        this.owned = null;
        this.cleanups = null;
        this.age = RootClock.time;
    }
    return ComputationNode;
}());
var Log = (function () {
    function Log() {
        this.node1 = null;
        this.node1slot = 0;
        this.count = 0;
        this.nodes = null;
        this.nodeslots = null;
        this.freecount = 0;
        this.freeslots = null;
    }
    return Log;
}());
var Queue = (function () {
    function Queue() {
        this.items = [];
        this.count = 0;
    }
    Queue.prototype.reset = function () {
        this.count = 0;
    };
    Queue.prototype.add = function (item) {
        this.items[this.count++] = item;
    };
    Queue.prototype.run = function (fn) {
        var items = this.items;
        for (var i = 0; i < this.count; i++) {
            fn(items[i]);
            items[i] = null;
        }
        this.count = 0;
    };
    return Queue;
}());
// Constants
var NOTPENDING = {}, CURRENT = 0, STALE = 1, RUNNING = 2;
// "Globals" used to keep track of current system state
var RootClock = new Clock(), RunningClock = null, // currently running clock 
RunningNode = null, // currently running computation
Owner = null, // owner for new computations
UNOWNED = new ComputationNode(null, null);
// Functions
function logRead(from, to) {
    var fromslot, toslot = to.source1 === null ? -1 : to.count++;
    if (from.node1 === null) {
        from.node1 = to;
        from.node1slot = toslot;
        fromslot = -1;
    }
    else if (from.nodes === null) {
        from.nodes = [to];
        from.nodeslots = [toslot];
        from.count = 1;
        fromslot = 0;
    }
    else {
        fromslot = from.freecount !== 0 ? from.freeslots[--from.freecount] : from.count++,
            from.nodes[fromslot] = to;
        from.nodeslots[fromslot] = toslot;
    }
    if (to.source1 === null) {
        to.source1 = from;
        to.source1slot = fromslot;
    }
    else if (to.sources === null) {
        to.sources = [from];
        to.sourceslots = [fromslot];
        to.count = 1;
    }
    else {
        to.sources[toslot] = from;
        to.sourceslots[toslot] = fromslot;
    }
}
function logDataRead(data, to) {
    if (data.log === null)
        data.log = new Log();
    logRead(data.log, to);
}
function logComputationRead(node, to) {
    if (node.log === null)
        node.log = new Log();
    logRead(node.log, to);
}
function event() {
    // b/c we might be under a top level S.root(), have to preserve current root
    var owner = Owner;
    RootClock.updates.reset();
    RootClock.time++;
    try {
        run(RootClock);
    }
    finally {
        RunningClock = RunningNode = null;
        Owner = owner;
    }
}
function toplevelComputation(node) {
    RunningClock = RootClock;
    RootClock.changes.reset();
    RootClock.updates.reset();
    try {
        node.value = node.fn(node.value);
        if (RootClock.changes.count > 0 || RootClock.updates.count > 0) {
            RootClock.time++;
            run(RootClock);
        }
    }
    finally {
        RunningClock = Owner = RunningNode = null;
    }
}
function run(clock) {
    var running = RunningClock, count = 0;
    RunningClock = clock;
    clock.disposes.reset();
    // for each batch ...
    while (clock.changes.count !== 0 || clock.updates.count !== 0 || clock.disposes.count !== 0) {
        if (count > 0)
            clock.time++;
        clock.changes.run(applyDataChange);
        clock.updates.run(updateNode);
        clock.disposes.run(dispose);
        // if there are still changes after excessive batches, assume runaway            
        if (count++ > 1e5) {
            throw new Error("Runaway clock detected");
        }
    }
    RunningClock = running;
}
function applyDataChange(data) {
    data.value = data.pending;
    data.pending = NOTPENDING;
    if (data.log)
        markComputationsStale(data.log);
}
function markComputationsStale(log) {
    var node1 = log.node1, nodes = log.nodes, nodeslots = log.nodeslots, dead = 0, slot, nodeslot, node;
    // mark all downstream nodes stale which haven't been already
    if (node1 !== null)
        markNodeStale(node1);
    for (var i = 0; i < log.count; i++) {
        // compact log.nodes as we iterate through it
        node = nodes[i];
        if (node) {
            markNodeStale(node);
            if (dead) {
                slot = i - dead;
                nodeslot = nodeslots[i];
                nodes[i] = null;
                nodes[slot] = node;
                nodeslots[slot] = nodeslot;
                if (nodeslot === -1) {
                    node.source1slot = slot;
                }
                else {
                    node.sourceslots[nodeslot] = slot;
                }
            }
        }
        else {
            dead++;
        }
    }
    log.count -= dead;
    log.freecount = 0;
}
function markNodeStale(node) {
    var time = RootClock.time;
    if (node.age < time) {
        node.age = time;
        node.state = STALE;
        RootClock.updates.add(node);
        if (node.owned !== null)
            markOwnedNodesForDisposal(node.owned);
        if (node.log !== null)
            markComputationsStale(node.log);
    }
}
function markOwnedNodesForDisposal(owned) {
    for (var i = 0; i < owned.length; i++) {
        var child = owned[i];
        child.age = RootClock.time;
        child.state = CURRENT;
        if (child.owned !== null)
            markOwnedNodesForDisposal(child.owned);
    }
}
function updateNode(node) {
    if (node.state === STALE) {
        var owner = Owner, running = RunningNode;
        Owner = RunningNode = node;
        node.state = RUNNING;
        cleanup(node, false);
        node.value = node.fn(node.value);
        node.state = CURRENT;
        Owner = owner;
        RunningNode = running;
    }
}
function cleanup(node, final) {
    var source1 = node.source1, sources = node.sources, sourceslots = node.sourceslots, cleanups = node.cleanups, owned = node.owned, i;
    if (cleanups !== null) {
        for (i = 0; i < cleanups.length; i++) {
            cleanups[i](final);
        }
        node.cleanups = null;
    }
    if (owned !== null) {
        for (i = 0; i < owned.length; i++) {
            dispose(owned[i]);
        }
        node.owned = null;
    }
    if (source1 !== null) {
        cleanupSource(source1, node.source1slot);
        node.source1 = null;
    }
    for (i = 0; i < node.count; i++) {
        cleanupSource(sources[i], sourceslots[i]);
        sources[i] = null;
    }
    node.count = 0;
}
function cleanupSource(source, slot) {
    if (slot === -1) {
        source.node1 = null;
    }
    else {
        source.nodes[slot] = null;
        if (slot === source.count - 1) {
            source.count--;
        }
        else if (source.freeslots === null) {
            source.freeslots = [slot];
            source.freecount = 1;
        }
        else {
            source.freeslots[source.freecount++] = slot;
        }
    }
}
function dispose(node) {
    node.fn = null;
    node.log = null;
    cleanup(node, true);
}


/***/ }),
/* 1 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__insert__ = __webpack_require__(14);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "insert", function() { return __WEBPACK_IMPORTED_MODULE_0__insert__["a"]; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__dom__ = __webpack_require__(13);
/* harmony namespace reexport (by provided) */ __webpack_require__.d(__webpack_exports__, "createElement", function() { return __WEBPACK_IMPORTED_MODULE_1__dom__["a"]; });
/* harmony namespace reexport (by provided) */ __webpack_require__.d(__webpack_exports__, "createSvgElement", function() { return __WEBPACK_IMPORTED_MODULE_1__dom__["b"]; });
/* harmony namespace reexport (by provided) */ __webpack_require__.d(__webpack_exports__, "createComment", function() { return __WEBPACK_IMPORTED_MODULE_1__dom__["c"]; });
/* harmony namespace reexport (by provided) */ __webpack_require__.d(__webpack_exports__, "createTextNode", function() { return __WEBPACK_IMPORTED_MODULE_1__dom__["d"]; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__spread__ = __webpack_require__(15);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "staticSpread", function() { return __WEBPACK_IMPORTED_MODULE_2__spread__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "SingleSpreadState", function() { return __WEBPACK_IMPORTED_MODULE_2__spread__["b"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "MultiSpreadState", function() { return __WEBPACK_IMPORTED_MODULE_2__spread__["c"]; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_s_js__ = __webpack_require__(0);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "S", function() { return __WEBPACK_IMPORTED_MODULE_3_s_js__["a"]; });






/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return ToDo; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ToDosModel; });
/* harmony export (immutable) */ __webpack_exports__["c"] = returnType;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_s_js__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_s_array__ = __webpack_require__(3);
/*0,0*/
/*1,0*/
/*2,0*/// our ToDo model
/*3,0*/var ToDo = function (title, completed) { return ({
/*4,0*/    title: jsonable(__WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].data(title)),
/*5,0*/    completed: jsonable(__WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].data(completed))
/*6,0*/}); };
/*7,0*/var toDoType = returnType(ToDo);
/*8,0*/// our main model
/*9,0*/var ToDosModel = function (todos) { return ({
/*10,0*/    todos: jsonable(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1_s_array__["b" /* default */])(todos))
/*11,0*/}); };
/*12,0*/var toDosModelType = returnType(ToDosModel);
/*13,0*/// A couple small utilities
/*14,0*/// TypeScript utility: do a little generic pattern matching to extract the return type of any function.
/*15,0*/// Lets us name that return type for usage in other function's signatures.
/*16,0*///     const fooReturnType = returnType(Foo);
/*17,0*///     type Foo = typeof fooReturnType;
/*18,0*/function returnType(fn) {
/*19,0*/    return null;
/*20,0*/}
/*21,0*/// Make any signal jsonable by adding a toJSON method that extracts its value during JSONization
/*22,0*/function jsonable(s) {
/*23,0*/    s.toJSON = toJSON;
/*24,0*/    return s;
/*25,0*/}
/*26,0*/function toJSON() {
/*27,0*/    var json = this();
/*28,0*/    // if the value has it's own toJSON, call it now
/*29,0*/    if (json && json.toJSON)
/*30,0*/        json = json.toJSON();
/*31,0*/    return json;
/*32,0*/}
/*33,0*/

/***/ }),
/* 3 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["b"] = SArray;
/* unused harmony export lift */
/* unused harmony export mapS */
/* harmony export (immutable) */ __webpack_exports__["a"] = mapSample;
/* unused harmony export forEach */
/* unused harmony export combine */
/* unused harmony export map */
/* unused harmony export find */
/* unused harmony export includes */
/* unused harmony export sort */
/* unused harmony export orderBy */
/* unused harmony export filter */
/* unused harmony export concat */
/* unused harmony export reduce */
/* unused harmony export reduceRight */
/* unused harmony export every */
/* unused harmony export some */
/* unused harmony export reverse */
/* unused harmony export slice */
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_s_js__ = __webpack_require__(0);
// synchronous array signals for S.js

function SArray(values) {
    if (!Array.isArray(values))
        throw new Error("SArray must be initialized with an array");
    var dirty = __WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].data(false), mutations = [], mutcount = 0, pops = 0, shifts = 0, data = __WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].root(function () { return __WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].on(dirty, update, values, true); });
    // add mutators
    var array = function array(newvalues) {
        if (arguments.length > 0) {
            mutation(function array() { values = newvalues; });
            return newvalues;
        }
        else {
            return data();
        }
    };
    array.push = push;
    array.pop = pop;
    array.unshift = unshift;
    array.shift = shift;
    array.splice = splice;
    // not ES5
    array.remove = remove;
    array.removeAll = removeAll;
    lift(array);
    return array;
    function mutation(m) {
        mutations[mutcount++] = m;
        dirty(true);
    }
    function update() {
        if (pops)
            values.splice(values.length - pops, pops);
        if (shifts)
            values.splice(0, shifts);
        pops = 0;
        shifts = 0;
        for (var i = 0; i < mutcount; i++) {
            mutations[i]();
            mutations[i] = null;
        }
        mutcount = 0;
        return values;
    }
    // mutators
    function push(item) {
        mutation(function push() { values.push(item); });
        return array;
    }
    function pop() {
        array();
        if ((pops + shifts) < values.length) {
            var value = values[values.length - ++pops];
            dirty(true);
            return value;
        }
    }
    function unshift(item) {
        mutation(function unshift() { values.unshift(item); });
        return array;
    }
    function shift() {
        array();
        if ((pops + shifts) < values.length) {
            var value = values[shifts++];
            dirty(true);
            return value;
        }
    }
    function splice() {
        var args = Array.prototype.slice.call(arguments);
        mutation(function splice() { Array.prototype.splice.apply(values, args); });
        return array;
    }
    function remove(item) {
        mutation(function remove() {
            for (var i = 0; i < values.length; i++) {
                if (values[i] === item) {
                    values.splice(i, 1);
                    break;
                }
            }
        });
        return array;
    }
    function removeAll(item) {
        mutation(function removeAll() {
            for (var i = 0; i < values.length;) {
                if (values[i] === item) {
                    values.splice(i, 1);
                }
                else {
                    i++;
                }
            }
        });
        return array;
    }
}
// util to add transformer methods
function lift(seq) {
    var _seq = seq;
    _seq.concat = chainConcat;
    _seq.every = chainEvery;
    _seq.filter = chainFilter;
    _seq.find = chainFind;
    //s.findIndex = findIndex;
    _seq.forEach = chainForEach;
    _seq.includes = chainIncludes;
    //s.indexOf   = indexOf;
    //s.join      = join;
    //s.lastIndexOf = lastIndexOf;
    _seq.map = chainMap;
    _seq.sort = chainSort;
    _seq.reduce = chainReduce;
    _seq.reduceRight = chainReduceRight;
    _seq.reverse = chainReverse;
    _seq.slice = chainSlice;
    _seq.some = chainSome;
    // non-ES5 transformers
    _seq.mapS = chainMapS;
    _seq.mapSample = chainMapSample;
    _seq.orderBy = chainOrderBy;
    return _seq;
}
function mapS(seq, enter, exit, move) {
    var items = [], mapped = [], disposers = [], len = 0;
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */])(function () { __WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].cleanup(function () { disposers.forEach(function (d) { d(); }); }); });
    return __WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].on(seq, function mapS() {
        var new_items = seq(), new_len = new_items.length, temp = new Array(new_len), tempdisposers = new Array(new_len), from = null, to = null, i, j, k, item;
        if (move)
            from = [], to = [];
        // 1) step through all old items and see if they can be found in the new set; if so, save them in a temp array and mark them moved; if not, exit them
        NEXT: for (i = 0, k = 0; i < len; i++) {
            item = items[i];
            for (j = 0; j < new_len; j++, k = (k + 1) % new_len) {
                if (item === new_items[k] && !temp.hasOwnProperty(k.toString())) {
                    temp[k] = mapped[i];
                    tempdisposers[k] = disposers[i];
                    if (move && i !== k) {
                        from.push(i);
                        to.push(k);
                    }
                    k = (k + 1) % new_len;
                    continue NEXT;
                }
            }
            if (exit)
                exit(item, mapped[i](), i);
            disposers[i]();
        }
        if (move && from.length)
            move(items, mapped, from, to);
        // 2) set all the new values, pulling from the temp array if copied, otherwise entering the new value
        for (i = 0; i < new_len; i++) {
            if (temp.hasOwnProperty(i.toString())) {
                mapped[i] = temp[i];
                disposers[i] = tempdisposers[i];
            }
            else {
                mapped[i] = __WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].root(mapper);
            }
        }
        // 3) in case the new set is shorter than the old, set the length of the mapped array
        len = mapped.length = new_len;
        // 4) save a copy of the mapped items for the next update
        items = new_items.slice();
        return mapped;
        function mapper(disposer) {
            disposers[i] = disposer;
            var _item = new_items[i], _i = i;
            return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */])(function (value) { return enter(_item, value, _i); }, undefined);
        }
    });
}
function chainMapS(enter, exit, move) {
    var r = lift(mapS(this, enter, exit, move));
    r.combine = chainCombine;
    return r;
}
function mapSample(seq, enter, exit, move) {
    var items = [], mapped = [], disposers = [], len = 0;
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */])(function () { __WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].cleanup(function () { disposers.forEach(function (d) { d(); }); }); });
    return __WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].on(seq, function mapSample() {
        var new_items = seq(), new_len = new_items.length, temp, tempdisposers, from = null, to = null, i, j, k, item;
        // fast path for empty arrays
        if (new_len === 0) {
            if (len !== 0) {
                if (exit !== undefined) {
                    for (i = 0; i < len; i++) {
                        item = items[i];
                        exit(item, mapped[i], i);
                        disposers[i]();
                    }
                }
                else {
                    for (i = 0; i < len; i++) {
                        disposers[i]();
                    }
                }
                items = [];
                mapped = [];
                disposers = [];
                len = 0;
            }
        }
        else if (len === 0) {
            for (i = 0; i < new_len; i++) {
                item = items[i] = new_items[i];
                mapped[i] = __WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].root(mapper);
            }
            len = new_len;
        }
        else {
            temp = new Array(new_len);
            tempdisposers = new Array(new_len);
            if (move)
                from = [], to = [];
            // 1) step through all old items and see if they can be found in the new set; if so, save them in a temp array and mark them moved; if not, exit them
            NEXT: for (i = 0, k = 0; i < len; i++) {
                item = items[i];
                for (j = 0; j < new_len; j++, k = (k + 1) % new_len) {
                    if (item === new_items[k] && !temp.hasOwnProperty(k.toString())) {
                        temp[k] = mapped[i];
                        tempdisposers[k] = disposers[i];
                        if (move && i !== k) {
                            from.push(i);
                            to.push(k);
                        }
                        k = (k + 1) % new_len;
                        continue NEXT;
                    }
                }
                if (exit)
                    exit(item, mapped[i], i);
                disposers[i]();
            }
            if (move && from.length)
                move(items, mapped, from, to);
            // 2) set all the new values, pulling from the temp array if copied, otherwise entering the new value
            for (i = 0; i < new_len; i++) {
                if (temp.hasOwnProperty(i.toString())) {
                    mapped[i] = temp[i];
                    disposers[i] = tempdisposers[i];
                }
                else {
                    mapped[i] = __WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].root(mapper);
                }
            }
            // 3) in case the new set is shorter than the old, set the length of the mapped array
            len = mapped.length = new_len;
            // 4) save a copy of the mapped items for the next update
            items = new_items.slice();
        }
        return mapped;
        function mapper(disposer) {
            disposers[i] = disposer;
            return enter(new_items[i], mapped[i], i);
        }
    });
}
function chainMapSample(enter, exit, move) {
    return lift(mapSample(this, enter, exit, move));
}
function forEach(seq, enter, exit, move) {
    var items = [], len = 0;
    return __WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].on(seq, function forEach() {
        var new_items = seq(), new_len = new_items.length, found = new Array(new_len), from = [], to = [], i, j, k, item;
        // 1) step through all old items and see if they can be found in the new set; if so, save them in a temp array and mark them moved; if not, exit them
        NEXT: for (i = 0, k = 0; i < len; i++) {
            item = items[i];
            for (j = 0; j < new_len; j++, k = (k + 1) % new_len) {
                if (item === new_items[k] && !found[k]) {
                    found[k] = true;
                    if (i !== k) {
                        from.push(i);
                        to.push(k);
                    }
                    k = (k + 1) % new_len;
                    continue NEXT;
                }
            }
            if (exit)
                exit(item, i);
        }
        if (move && from.length)
            move(from, to);
        // 2) set all the new values, pulling from the temp array if copied, otherwise entering the new value
        for (var i = 0; i < new_len; i++) {
            if (!found[i])
                enter(new_items[i], i);
        }
        // 3) in case the new set is shorter than the old, set the length of the mapped array
        len = new_len;
        // 4) save a copy of the mapped items for the next update
        items = new_items.slice();
        return items;
    });
}
function chainForEach(enter, exit, move) {
    return lift(forEach(this, enter, exit, move));
}
function combine(seq) {
    return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */])(function combine() {
        var s = seq(), result = new Array(s.length);
        for (var i = 0; i < s.length; i++) {
            result[i] = s[i]();
        }
        return result;
    });
}
function chainCombine() {
    return lift(combine(this));
}
function map(seq, enter, exit, move) {
    return combine(mapS(seq, enter, exit, move == undefined ? undefined :
        function (items, mapped, from, to) { move(items, mapped.map(function (s) { return s(); }), from, to); }));
}
function chainMap(enter, exit, move) {
    return lift(map(this, enter, exit, move));
}
function find(seq, pred) {
    return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */])(function find() {
        var s = seq(), i, item;
        for (i = 0; i < s.length; i++) {
            item = s[i];
            if (pred(item))
                return item;
        }
        return undefined;
    });
}
function chainFind(pred) {
    return find(this, pred);
}
function includes(seq, o) {
    return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */])(function find() {
        var s = seq();
        for (var i = 0; i < s.length; i++) {
            if (s[i] === o)
                return true;
        }
        return false;
    });
}
function chainIncludes(o) {
    return includes(this, o);
}
function sort(seq, fn) {
    return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */])(function sort() {
        var copy = seq().slice(0);
        if (fn)
            copy.sort(fn);
        else
            copy.sort();
        return copy;
    });
}
function chainSort(fn) {
    return lift(sort(this, fn));
}
function orderBy(seq, by) {
    var key, fn;
    if (typeof by !== 'function') {
        key = by;
        fn = function (o) { return o[key]; };
    }
    else {
        fn = by;
    }
    return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */])(function orderBy() {
        var copy = seq().slice(0);
        copy.sort(function (a, b) {
            a = fn(a);
            b = fn(b);
            return a < b ? -1 : a > b ? 1 : 0;
        });
        return copy;
    });
}
function chainOrderBy(by) {
    return lift(orderBy(this, by));
}
function filter(seq, predicate) {
    return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */])(function filter() {
        var s = seq(), result = [], i, v;
        for (i = 0; i < s.length; i++) {
            v = s[i];
            if (predicate(v))
                result.push(v);
        }
        return result;
    });
}
function chainFilter(predicate) {
    return lift(filter(this, predicate));
}
function concat(seq) {
    var others = [];
    for (var _a = 1; _a < arguments.length; _a++) {
        others[_a - 1] = arguments[_a];
    }
    return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */])(function concat() {
        var s = seq();
        for (var i = 0; i < others.length; i++) {
            s = s.concat(others[i]());
        }
        return s;
    });
}
function chainConcat() {
    var others = [];
    for (var _a = 0; _a < arguments.length; _a++) {
        others[_a] = arguments[_a];
    }
    return lift(concat.apply(void 0, [this].concat(others)));
}
function reduce(seq, fn, seed) {
    return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */])(function reduce() {
        var s = seq(), result = seed instanceof Function ? seed() : seed;
        for (var i = 0; i < s.length; i++) {
            result = fn(result, s[i], i, s);
        }
        return result;
    });
}
function chainReduce(fn, seed) {
    return reduce(this, fn, seed);
}
function reduceRight(seq, fn, seed) {
    return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */])(function reduceRight() {
        var s = seq(), result = seed instanceof Function ? seed() : seed;
        for (var i = s.length - 1; i >= 0; i--) {
            result = fn(result, s[i], i, s);
        }
        return result;
    });
}
function chainReduceRight(fn, seed) {
    return reduceRight(this, fn, seed);
}
function every(seq, fn) {
    return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */])(function every() {
        var s = seq();
        for (var i = 0; i < s.length; i++) {
            if (!fn(s[i]))
                return false;
        }
        return true;
    });
}
function chainEvery(fn) {
    return every(this, fn);
}
function some(seq, fn) {
    return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */])(function some() {
        var s = seq();
        if (fn === undefined)
            return s.length !== 0;
        for (var i = 0; i < s.length; i++) {
            if (fn(s[i]))
                return true;
        }
        return false;
    });
}
function chainSome(fn) {
    return some(this, fn);
}
function reverse(seq) {
    return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */])(function () {
        var copy = seq().slice(0);
        copy.reverse();
        return copy;
    });
}
function chainReverse() {
    return lift(reverse(this));
}
function slice(seq, s, e) {
    return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */])(function () {
        return seq().slice(s, e);
    });
}
function chainSlice(s, e) {
    return lift(slice(this, s, e));
}


/***/ }),
/* 4 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = ToDosCtrl;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_s_js__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__models__ = __webpack_require__(2);
/*0,0*/
/*1,0*/
/*2,0*/var toDosCtrlType = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__models__["c" /* returnType */])(ToDosCtrl);
/*3,0*/function ToDosCtrl(_a) {
/*4,0*/    var todos = _a.todos;
/*5,0*/    var editing = __WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].data(null), // the todo selected for editing, or null if none selected
/*6,0*/    filter = __WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].data(null), // null = no filtering, true = only completed, false = only incomplete
/*7,0*/    newTitle = __WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].data(''), all = todos.map(ToDoCtrl), completed = all.filter(function (t) { return t.completed(); }), remaining = all.filter(function (t) { return !t.completed(); }), displayed = function () { return filter() === null ? all() : filter() ? completed() : remaining(); };
/*8,0*/    return {
/*9,0*/        filter: filter,
/*10,0*/        newTitle: newTitle,
/*11,0*/        all: all,
/*12,0*/        completed: completed,
/*13,0*/        remaining: remaining,
/*14,0*/        displayed: displayed,
/*15,0*/        allCompleted: function () { return all().length > 0 && remaining().length === 0; },
/*16,0*/        setAll: function (c) { return __WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].freeze(function () { return todos().forEach(function (t) { return t.completed(c); }); }); },
/*17,0*/        clearCompleted: function () { return todos(todos().filter(function (t) { return !t.completed(); })); },
/*18,0*/        create: function () {
/*19,0*/            var title = newTitle().trim();
/*20,0*/            if (title) {
/*21,0*/                newTitle("");
/*22,0*/                todos.unshift(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__models__["b" /* ToDo */])(title, false));
/*23,0*/            }
/*24,0*/        }
/*25,0*/    };
/*26,0*/    function ToDoCtrl(todo) {
/*27,0*/        var title = __WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].data(__WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].sample(todo.title));
/*28,0*/        return {
/*29,0*/            title: title,
/*30,0*/            completed: todo.completed,
/*31,0*/            remove: function () { return todos.remove(todo); },
/*32,0*/            startEditing: function () { return editing(todo); },
/*33,0*/            editing: function () { return editing() === todo; },
/*34,0*/            endEditing: function (commit) {
/*35,0*/                if (commit) {
/*36,0*/                    var trimmed = title().trim();
/*37,0*/                    if (trimmed) {
/*38,0*/                        todo.title(title(trimmed));
/*39,0*/                    }
/*40,0*/                    else {
/*41,0*/                        todos.remove(todo);
/*42,0*/                    }
/*43,0*/                }
/*44,0*/                else {
/*45,0*/                    title(todo.title());
/*46,0*/                }
/*47,0*/                editing(null);
/*48,0*/            }
/*49,0*/        };
/*50,0*/    }
/*51,0*/}
/*52,0*/

/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = LocalStoragePersistence;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_s_js__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__models__ = __webpack_require__(2);
/*0,0*/
/*1,0*/
/*2,0*/var LOCAL_STORAGE_KEY = 'todos-surplus';
/*3,0*/function LocalStoragePersistence(model) {
/*4,0*/    // load stored todos on init
/*5,0*/    var stored = localStorage.getItem(LOCAL_STORAGE_KEY);
/*6,0*/    if (stored)
/*7,0*/        model.todos(JSON.parse(stored).todos.map(function (t) { return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__models__["b" /* ToDo */])(t.title, t.completed); }));
/*8,0*/    // store JSONized todos whenever they change
/*9,0*/    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */])(function () {
/*10,0*/        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(model));
/*11,0*/    });
/*12,0*/}
/*13,0*/

/***/ }),
/* 6 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = ToDosRouter;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_s_js__ = __webpack_require__(0);
/*0,0*/
/*1,0*/// with such a simple router scenario, no need for a lib, just hand-write it
/*2,0*/function ToDosRouter(ctrl) {
/*3,0*/    // filter() -> browser hash
/*4,0*/    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */])(function () {
/*5,0*/        var filter = ctrl.filter(), hash = filter === true ? "/completed" :
/*6,0*/            filter === false ? "/active" :
/*7,0*/                "/";
/*8,0*/        if (window.location.hash !== hash)
/*9,0*/            window.location.hash = hash;
/*10,0*/    });
/*11,0*/    // browser hash -> filter()
/*12,0*/    window.addEventListener('hashchange', setStateFromHash, false);
/*13,0*/    __WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].cleanup(function () { window.removeEventListener('hashchange', setStateFromHash); });
/*14,0*/    function setStateFromHash() {
/*15,0*/        var hash = window.location.hash, filter = hash === "#/completed" ? true :
/*16,0*/            hash === "#/active" ? false :
/*17,0*/                null;
/*18,0*/        if (ctrl.filter() !== filter)
/*19,0*/            ctrl.filter(filter);
/*20,0*/    }
/*21,0*/    // init from browser hash
/*22,0*/    __WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].sample(setStateFromHash);
/*23,0*/}
/*24,0*/

/***/ }),
/* 7 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AppView; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_surplus__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_s_array__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_classnames__ = __webpack_require__(8);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_classnames___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_classnames__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_surplus_mixin_data__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_surplus_mixin_onkey__ = __webpack_require__(12);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_surplus_mixin_focus__ = __webpack_require__(11);
/*0,0*/
/*1,0*/__WEBPACK_IMPORTED_MODULE_0_surplus__;
/*2,0*/
/*3,0*/
/*4,0*/
/*5,0*/
/*6,0*/
/*7,0*/var AppView = function (ctrl) {
/*8,0*/    return /*8,11*/(function () {
    var __, __section1, __section1_header1, __section1_header1_h11, __section1_header1_input2, __section1_header1_input2_fn4, __section1_header1_input2_fn5, __section1_header1_input2_fn6, __section1_section2, __section1_section2_input1, __section1_section2_label2, __section1_section2_ul3, __section1_section2_ul3_insert1, __section1_footer3, __section1_footer3_span1, __section1_footer3_span1_strong1, __section1_footer3_span1_strong1_insert1, __section1_footer3_span1_insert3, __section1_footer3_ul2, __section1_footer3_ul2_li1, __section1_footer3_ul2_li1_a1, __section1_footer3_ul2_li2, __section1_footer3_ul2_li2_a1, __section1_footer3_ul2_li3, __section1_footer3_ul2_li3_a1, __section1_footer3_button3, __footer2, __footer2_p1, __footer2_p2, __footer2_p2_a1, __footer2_p3, __footer2_p3_a1, __footer2_p4, __footer2_p4_a1;
    __ = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('section', null, null);
    __section1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('section', "todoapp", __);
    __section1_header1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('header', "header", __section1);
    __section1_header1_h11 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('h1', null, __section1_header1);
    __section1_header1_h11.textContent = 'todos';
    __section1_header1_input2 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('input', null, __section1_header1);
    __section1_section2 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('section', "main", __section1);
    __section1_section2_input1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('input', "toggle-all", __section1_section2);
    __section1_section2_label2 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('label', null, __section1_section2);
    __section1_section2_ul3 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('ul', "todo-list", __section1_section2);
    __section1_section2_ul3_insert1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createTextNode"]('', __section1_section2_ul3)
    __section1_footer3 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('footer', "footer", __section1);
    __section1_footer3_span1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('span', "todo-count", __section1_footer3);
    __section1_footer3_span1_strong1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('strong', null, __section1_footer3_span1);
    __section1_footer3_span1_strong1_insert1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createTextNode"]('', __section1_footer3_span1_strong1)
    __WEBPACK_IMPORTED_MODULE_0_surplus__["createTextNode"](' item', __section1_footer3_span1)
    __section1_footer3_span1_insert3 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createTextNode"]('', __section1_footer3_span1)
    __WEBPACK_IMPORTED_MODULE_0_surplus__["createTextNode"](' left', __section1_footer3_span1)
    __section1_footer3_ul2 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('ul', "filters", __section1_footer3);
    __section1_footer3_ul2_li1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('li', null, __section1_footer3_ul2);
    __section1_footer3_ul2_li1_a1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('a', null, __section1_footer3_ul2_li1);
    __section1_footer3_ul2_li2 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('li', null, __section1_footer3_ul2);
    __section1_footer3_ul2_li2_a1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('a', null, __section1_footer3_ul2_li2);
    __section1_footer3_ul2_li3 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('li', null, __section1_footer3_ul2);
    __section1_footer3_ul2_li3_a1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('a', null, __section1_footer3_ul2_li3);
    __section1_footer3_button3 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('button', "clear-completed", __section1_footer3);
    __footer2 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('footer', "info", __);
    __footer2_p1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('p', null, __footer2);
    __footer2_p1.textContent = 'Double-click to edit a todo';
    __footer2_p2 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('p', null, __footer2);
    __footer2_p2.textContent = 'Template by ';
    __footer2_p2_a1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('a', null, __footer2_p2);
    __footer2_p2_a1.href = "http://sindresorhus.com";
    __footer2_p2_a1.textContent = 'Sindre Sorhus';
    __footer2_p3 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('p', null, __footer2);
    __footer2_p3.textContent = 'Created by ';
    __footer2_p3_a1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('a', null, __footer2_p3);
    __footer2_p3_a1.href = "https://github.com/adamhaile";
    __footer2_p3_a1.textContent = 'Adam Haile';
    __footer2_p4 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('p', null, __footer2);
    __footer2_p4.textContent = 'Part of ';
    __footer2_p4_a1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('a', null, __footer2_p4);
    __footer2_p4_a1.href = "http://todomvc.com";
    __footer2_p4_a1.textContent = 'TodoMVC';
    /*12,16*/__WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function () {
        __section1_header1_input2.className = "new-todo";
        __section1_header1_input2.placeholder = "What needs to be done?";
        __section1_header1_input2.autoFocus = /*12,92*/true;
        __section1_header1_input2_fn4 = (/*12,103*/__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3_surplus_mixin_data__["a" /* default */])(ctrl.newTitle, 'keydown'))(__section1_header1_input2, __section1_header1_input2_fn4);
        __section1_header1_input2_fn5 = (/*12,140*/__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_4_surplus_mixin_onkey__["a" /* default */])('enter', ctrl.create))(__section1_header1_input2, __section1_header1_input2_fn5);
        __section1_header1_input2_fn6 = (/*12,174*/__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_4_surplus_mixin_onkey__["a" /* default */])('esc', function () { return ctrl.newTitle(''); }))(__section1_header1_input2, __section1_header1_input2_fn6);
    });
    /*15,16*/__WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function () {
        __section1_section2_input1.type = "checkbox";
        __section1_section2_input1.checked = /*15,71*/ctrl.allCompleted();
    });
    /*16,16*/__WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function () {
        __section1_section2_label2.htmlFor = "toggle-all";
        __section1_section2_label2.onclick = /*16,53*/function () { return ctrl.setAll(!ctrl.allCompleted()); };
        __section1_section2_label2.textContent = 'Mark all as complete';
    });
    /*18,20*/__WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function (__range) { return __WEBPACK_IMPORTED_MODULE_0_surplus__["insert"](__range, /*18,21*/__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1_s_array__["a" /* mapSample */])(ctrl.displayed, function (todo) {
/*19,0*/        return /*19,15*/(function () {
    var __, __div1, __div1_input1, __div1_input1_fn3, __div1_label2, __div1_label2_insert1, __div1_button3, __input2, __input2_fn2, __input2_fn4, __input2_fn5, __input2_fn6;
    __ = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('li', null, null);
    __div1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('div', "view", __);
    __div1_input1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('input', null, __div1);
    __div1_label2 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('label', null, __div1);
    __div1_label2.ondblclick = /*22,54*/todo.startEditing;
    __div1_label2_insert1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createTextNode"]('', __div1_label2)
    __div1_button3 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('button', "destroy", __div1);
    __div1_button3.onclick = /*23,69*/todo.remove;
    __input2 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('input', null, __);
    /*21,32*/__WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function () {
        __div1_input1.className = "toggle";
        __div1_input1.type = "checkbox";
        __div1_input1_fn3 = (/*21,78*/__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3_surplus_mixin_data__["a" /* default */])(todo.completed))(__div1_input1, __div1_input1_fn3);
    });
    /*22,73*/__WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function (__range) { return __WEBPACK_IMPORTED_MODULE_0_surplus__["insert"](__range, /*22,74*/todo.title()); }, { start: __div1_label2_insert1, end: __div1_label2_insert1 });
    /*25,28*/__WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function () {
        __input2.className = "edit";
        __input2_fn2 = (/*25,57*/__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3_surplus_mixin_data__["a" /* default */])(todo.title, 'keyup'))(__input2, __input2_fn2);
        __input2.onblur = /*25,92*/function () { return todo.endEditing(true); };
        __input2_fn4 = (/*25,144*/__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_4_surplus_mixin_onkey__["a" /* default */])('enter', function () { return todo.endEditing(true); }))(__input2, __input2_fn4);
        __input2_fn5 = (/*25,212*/__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_4_surplus_mixin_onkey__["a" /* default */])('esc', function () { return todo.endEditing(false); }))(__input2, __input2_fn5);
        __input2_fn6 = (/*25,279*/__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_5_surplus_mixin_focus__["a" /* default */])(todo.editing()))(__input2, __input2_fn6);
    });
    /*19,15*/__WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function () { __.className = /*19,30*/__WEBPACK_IMPORTED_MODULE_2_classnames__({ completed: todo.completed(), editing: todo.editing() }); });
    return __;
})()/*26,29*/;
/*27,0*/    })); }, { start: __section1_section2_ul3_insert1, end: __section1_section2_ul3_insert1 });
    /*14,12*/__WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function () { __section1_section2.hidden = /*14,46*/ctrl.all().length === 0; });
    /*31,53*/__WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function (__range) { return __WEBPACK_IMPORTED_MODULE_0_surplus__["insert"](__range, /*31,54*/ctrl.remaining().length); }, { start: __section1_footer3_span1_strong1_insert1, end: __section1_footer3_span1_strong1_insert1 });
    /*31,92*/__WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function (__range) { return __WEBPACK_IMPORTED_MODULE_0_surplus__["insert"](__range, /*31,93*/ctrl.remaining().length === 1 ? '' : 's'); }, { start: __section1_footer3_span1_insert3, end: __section1_footer3_span1_insert3 });
    /*34,24*/__WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function () {
        __section1_footer3_ul2_li1_a1.className = /*34,38*/__WEBPACK_IMPORTED_MODULE_2_classnames__({ selected: ctrl.filter() === null });
        __section1_footer3_ul2_li1_a1.href = "#/";
        __section1_footer3_ul2_li1_a1.textContent = 'All';
    });
    /*37,24*/__WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function () {
        __section1_footer3_ul2_li2_a1.className = /*37,38*/__WEBPACK_IMPORTED_MODULE_2_classnames__({ selected: ctrl.filter() === false });
        __section1_footer3_ul2_li2_a1.href = "#/active";
        __section1_footer3_ul2_li2_a1.textContent = 'Active';
    });
    /*40,24*/__WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function () {
        __section1_footer3_ul2_li3_a1.className = /*40,38*/__WEBPACK_IMPORTED_MODULE_2_classnames__({ selected: ctrl.filter() === true });
        __section1_footer3_ul2_li3_a1.href = "#/completed";
        __section1_footer3_ul2_li3_a1.textContent = 'Completed';
    });
    /*43,16*/__WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function () {
        __section1_footer3_button3.onclick = /*43,61*/ctrl.clearCompleted;
        __section1_footer3_button3.hidden = /*43,90*/ctrl.completed().length === 0;
        __section1_footer3_button3.textContent = 'Clear completed';
    });
    /*30,12*/__WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function () { __section1_footer3.hidden = /*30,47*/ctrl.all().length === 0; });
    return __;
})()/*52,14*/;
/*53,0*/};
/*54,0*/

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/*!
  Copyright (c) 2016 Jed Watson.
  Licensed under the MIT License (MIT), see
  http://jedwatson.github.io/classnames
*/
/* global define */

(function () {
	'use strict';

	var hasOwn = {}.hasOwnProperty;

	function classNames () {
		var classes = [];

		for (var i = 0; i < arguments.length; i++) {
			var arg = arguments[i];
			if (!arg) continue;

			var argType = typeof arg;

			if (argType === 'string' || argType === 'number') {
				classes.push(arg);
			} else if (Array.isArray(arg)) {
				classes.push(classNames.apply(null, arg));
			} else if (argType === 'object') {
				for (var key in arg) {
					if (hasOwn.call(arg, key) && arg[key]) {
						classes.push(key);
					}
				}
			}
		}

		return classes.join(' ');
	}

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = classNames;
	} else if (true) {
		// register as 'classnames', consistent with npm package name
		!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function () {
			return classNames;
		}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__),
				__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	} else {
		window.classNames = classNames;
	}
}());


/***/ }),
/* 9 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_s_js__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__models__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__controllers__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__router__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__persistence__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__views__ = __webpack_require__(7);
/*0,0*/
/*1,0*/
/*2,0*/
/*3,0*/
/*4,0*/
/*5,0*/
/*6,0*/__WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].root(function () {
/*7,0*/    var model = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__models__["a" /* ToDosModel */])([]), ctrl = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__controllers__["a" /* ToDosCtrl */])(model), router = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__router__["a" /* ToDosRouter */])(ctrl), storage = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_4__persistence__["a" /* LocalStoragePersistence */])(model), view = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_5__views__["a" /* AppView */])(ctrl);
/*8,0*/    document.body.appendChild(view);
/*9,0*/});
/*10,0*/

/***/ }),
/* 10 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = data;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_surplus__ = __webpack_require__(1);

function data(signal, arg1, arg2) {
    var event = arg1 || 'change', on = arg1 === undefined ? true : arg1, off = arg2 === undefined ? (on === true ? false : null) : arg2;
    return function (node) {
        if (node instanceof HTMLInputElement) {
            var type = node.type.toUpperCase();
            if (type === 'CHECKBOX') {
                checkboxData(node, signal, on, off);
            }
            else if (type === 'RADIO') {
                radioData(node, signal, on);
            }
            else {
                valueData(node, signal, event);
            }
        }
        else if (node instanceof HTMLSelectElement || node instanceof HTMLTextAreaElement) {
            valueData(node, signal, event);
        }
        else if (node.isContentEditable) {
            textContentData(node, signal, event);
        }
        else {
            throw new Error("@data can only be applied to a form control element, \n"
                + "such as <input/>, <textarea/> or <select/>, or to an element with "
                + "'contentEditable' set.  Element ``" + node.nodeName + "'' is \n"
                + "not such an element.  Perhaps you applied it to the wrong node?");
        }
    };
}
function valueData(node, signal, event) {
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_surplus__["S"])(function updateValue() {
        node.value = toString(signal());
    });
    node.addEventListener(event, valueListener, false);
    __WEBPACK_IMPORTED_MODULE_0_surplus__["S"].cleanup(function () { node.removeEventListener(event, valueListener); });
    function valueListener() {
        var cur = toString(__WEBPACK_IMPORTED_MODULE_0_surplus__["S"].sample(signal)), update = node.value;
        if (cur !== update)
            signal(update);
        return true;
    }
}
function checkboxData(node, signal, on, off) {
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_surplus__["S"])(function updateCheckbox() {
        node.checked = signal() === on;
    });
    node.addEventListener("change", checkboxListener, false);
    __WEBPACK_IMPORTED_MODULE_0_surplus__["S"].cleanup(function () { node.removeEventListener("change", checkboxListener); });
    function checkboxListener() {
        signal(node.checked ? on : off);
        return true;
    }
}
function radioData(node, signal, on) {
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_surplus__["S"])(function updateRadio() {
        node.checked = (signal() === on);
    });
    node.addEventListener("change", radioListener, false);
    __WEBPACK_IMPORTED_MODULE_0_surplus__["S"].cleanup(function () { node.removeEventListener("change", radioListener); });
    function radioListener() {
        if (node.checked)
            signal(on);
        return true;
    }
}
function textContentData(node, signal, event) {
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_surplus__["S"])(function updateTextContent() {
        node.textContent = toString(signal());
    });
    node.addEventListener(event, textContentListener, false);
    __WEBPACK_IMPORTED_MODULE_0_surplus__["S"].cleanup(function () { node.removeEventListener(event, textContentListener); });
    function textContentListener() {
        var cur = toString(__WEBPACK_IMPORTED_MODULE_0_surplus__["S"].sample(signal)), update = node.textContent;
        if (cur !== update)
            signal(update);
        return true;
    }
}
function toString(v) {
    return v == null ? '' : v.toString();
}


/***/ }),
/* 11 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = focus;
/**
 * In surplus, directives run when a node is created, meaning before it has usually
 * been inserted into the document.  This causes a problem for the @focus directive, as only
 * elements that are in the document (and visible) are focusable.  As a hack, we delay
 * the focus event until the next animation frame, thereby giving htmlliterals a chance
 * to get the node into the document.  If it isn't in by then (or if the user tried to focus
 * a hidden node) then we give up.
 */
var nodeToFocus = null, startPos = NaN, endPos = NaN, scheduled = false;
function focus(flag, start, end) {
    var _start = arguments.length > 1 ? start : NaN, _end = arguments.length > 2 ? end : _start, length;
    return function focus(node) {
        if (!node.focus) {
            throw new Error("@focus can only be applied to an element that has a .focus() method, like <input>, <select>, <textarea>, etc.");
        }
        if (flag) {
            length = node.textContent ? node.textContent.length : 0;
            nodeToFocus = node;
            startPos = _start < 0 ? Math.max(0, length + _start) : Math.min(length, _start);
            endPos = _end < 0 ? Math.max(startPos, length + _end) : Math.min(length, _end);
            if (!scheduled) {
                scheduled = true;
                window.requestAnimationFrame(focuser);
            }
        }
        else {
            node.blur();
        }
    };
}
;
function focuser() {
    scheduled = false;
    if (nodeToFocus === null)
        return;
    var trange, range, sel;
    nodeToFocus.focus();
    if (!isNaN(startPos)) {
        if (hasSetSelectionRange(nodeToFocus)) {
            nodeToFocus.setSelectionRange(startPos, endPos);
        }
        else if (hasCreateTextRnage(nodeToFocus)) {
            trange = nodeToFocus.createTextRange();
            trange.moveEnd('character', endPos);
            trange.moveStart('character', startPos);
            trange.select();
        }
        else if (nodeToFocus.isContentEditable && nodeToFocus.childNodes.length > 0) {
            range = document.createRange();
            range.setStart(nodeToFocus.childNodes[0], startPos);
            range.setEnd(nodeToFocus.childNodes[0], endPos);
            sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }
}
function hasSetSelectionRange(node) {
    return !!node.setSelectionRange;
}
function hasCreateTextRnage(node) {
    return !!node.createTextRange;
}


/***/ }),
/* 12 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = onkey;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_surplus__ = __webpack_require__(1);

function onkey(key, arg1, arg2) {
    var event = arguments.length < 3 ? 'keydown' : 'key' + arg1, fn = arguments.length < 3 ? arg1 : arg2;
    var parts = key.toLowerCase().split('-', 2), keyCode = keyCodes[parts[parts.length - 1]], mod = parts.length > 1 ? parts[0] + "Key" : null;
    if (keyCode === undefined)
        throw new Error("@onkey: unrecognized key identifier '" + key + "'");
    if (typeof fn !== 'function')
        throw new Error("@onkey: must supply a function to call when the key is entered");
    return function onkey(node) {
        node.addEventListener(event, onkeyListener, false);
        __WEBPACK_IMPORTED_MODULE_0_surplus__["S"].cleanup(function () { node.removeEventListener(event, onkeyListener); });
    };
    function onkeyListener(e) {
        if (e.keyCode === keyCode && (!mod || e[mod]))
            fn(e);
        return true;
    }
}
;
var keyCodes = {
    backspace: 8,
    tab: 9,
    enter: 13,
    shift: 16,
    ctrl: 17,
    alt: 18,
    pause: 19,
    break: 19,
    capslock: 20,
    esc: 27,
    escape: 27,
    space: 32,
    pageup: 33,
    pagedown: 34,
    end: 35,
    home: 36,
    leftarrow: 37,
    uparrow: 38,
    rightarrow: 39,
    downarrow: 40,
    prntscrn: 44,
    insert: 45,
    delete: 46,
    "0": 48,
    "1": 49,
    "2": 50,
    "3": 51,
    "4": 52,
    "5": 53,
    "6": 54,
    "7": 55,
    "8": 56,
    "9": 57,
    a: 65,
    b: 66,
    c: 67,
    d: 68,
    e: 69,
    f: 70,
    g: 71,
    h: 72,
    i: 73,
    j: 74,
    k: 75,
    l: 76,
    m: 77,
    n: 78,
    o: 79,
    p: 80,
    q: 81,
    r: 82,
    s: 83,
    t: 84,
    u: 85,
    v: 86,
    w: 87,
    x: 88,
    y: 89,
    z: 90,
    winkey: 91,
    winmenu: 93,
    f1: 112,
    f2: 113,
    f3: 114,
    f4: 115,
    f5: 116,
    f6: 117,
    f7: 118,
    f8: 119,
    f9: 120,
    f10: 121,
    f11: 122,
    f12: 123,
    numlock: 144,
    scrolllock: 145,
    ",": 188,
    "<": 188,
    ".": 190,
    ">": 190,
    "/": 191,
    "?": 191,
    "`": 192,
    "~": 192,
    "[": 219,
    "{": 219,
    "\\": 220,
    "|": 220,
    "]": 221,
    "}": 221,
    "'": 222,
    "\"": 222
};


/***/ }),
/* 13 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = createElement;
/* harmony export (immutable) */ __webpack_exports__["b"] = createSvgElement;
/* harmony export (immutable) */ __webpack_exports__["c"] = createComment;
/* harmony export (immutable) */ __webpack_exports__["d"] = createTextNode;
var svgNS = "http://www.w3.org/2000/svg";
function createElement(tag, className, parent) {
    var el = document.createElement(tag);
    if (className)
        el.className = className;
    if (parent)
        parent.appendChild(el);
    return el;
}
function createSvgElement(tag, className, parent) {
    var el = document.createElementNS(svgNS, tag);
    if (className)
        el.setAttribute("class", className);
    if (parent)
        parent.appendChild(el);
    return el;
}
function createComment(text, parent) {
    var comment = document.createComment(text);
    parent.appendChild(comment);
    return comment;
}
function createTextNode(text, parent) {
    var node = document.createTextNode(text);
    parent.appendChild(node);
    return node;
}


/***/ }),
/* 14 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = insert;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__index__ = __webpack_require__(1);

var DOCUMENT_FRAGMENT_NODE = 11, TEXT_NODE = 3;
function insert(range, value) {
    var parent = range.start.parentNode, test = range.start, good = null, t = typeof value;
    //if (parent === null) {
    //    throw new Error("Surplus.insert() can only be used on a node that has a parent node. \n"
    //        + "Node ``" + range.start + "'' is currently unattached to a parent.");
    //}
    //if (range.end.parentNode !== parent) {
    //    throw new Error("Surplus.insert() requires that the inserted nodes remain sibilings \n"
    //        + "of the original node.  The DOM has been modified such that this is \n"
    //        + "no longer the case.");
    //}
    if (t === 'string' || t === 'number' || t === 'boolean') {
        value = value.toString();
        if (test.nodeType === TEXT_NODE) {
            test.data = value;
            good = test;
        }
        else {
            value = document.createTextNode(value);
            parent.replaceChild(value, test);
            if (range.end === test)
                range.end = value;
            range.start = good = value;
        }
    }
    else if (value instanceof Node) {
        if (test !== value) {
            parent.replaceChild(value, test);
            if (range.end === test)
                range.end = value;
            range.start = value;
        }
        good = value;
    }
    else if (value instanceof Array) {
        insertArray(value);
    }
    else if (value instanceof Function) {
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__index__["S"])(function () {
            insert(range, value());
        });
        good = range.end;
    }
    else if (value !== null && value !== undefined) {
        value = value.toString();
        if (test.nodeType === TEXT_NODE) {
            test.data = value;
            good = test;
        }
        else {
            value = document.createTextNode(value);
            parent.replaceChild(value, test);
            if (range.end === test)
                range.end = value;
            range.start = good = value;
        }
    }
    if (good === null) {
        if (range.start === parent.firstChild && range.end === parent.lastChild && range.start !== range.end) {
            // fast delete entire contents
            parent.textContent = "";
            value = document.createTextNode("");
            parent.appendChild(value);
            good = range.start = range.end = value;
        }
        else if (test.nodeType === TEXT_NODE) {
            test.data = "";
            good = test;
        }
        else {
            value = document.createTextNode("");
            parent.replaceChild(value, test);
            if (range.end === test)
                range.end = value;
            range.start = good = value;
        }
    }
    // remove anything left after the good cursor from the insert range
    while (good !== range.end) {
        test = range.end;
        range.end = test.previousSibling;
        parent.removeChild(test);
    }
    return range;
    function insertArray(array) {
        for (var i = 0, len = array.length; i < len; i++) {
            var value = array[i];
            if (good === range.end) {
                if (value instanceof Node) {
                    good = range.end = (good.nextSibling ? parent.insertBefore(value, good.nextSibling) : parent.appendChild(value));
                }
                else if (value instanceof Array) {
                    insertArray(value);
                }
                else if (value !== null && value !== undefined) {
                    value = document.createTextNode(value.toString());
                    good = range.end = (good.nextSibling ? parent.insertBefore(value, good.nextSibling) : parent.appendChild(value));
                }
            }
            else {
                if (value instanceof Node) {
                    if (test !== value) {
                        if (good === null) {
                            if (range.end === value)
                                range.end = value.previousSibling;
                            parent.replaceChild(value, test);
                            range.start = value;
                            if (range.end === test)
                                range.end = value;
                            test = value.nextSibling;
                        }
                        else {
                            if (test.nextSibling === value && test !== value.nextSibling && test !== range.end) {
                                parent.removeChild(test);
                                test = value.nextSibling;
                            }
                            else {
                                if (range.end === value)
                                    range.end = value.previousSibling;
                                parent.insertBefore(value, test);
                            }
                        }
                    }
                    else {
                        test = test.nextSibling;
                    }
                    good = value;
                }
                else if (value instanceof Array) {
                    insertArray(value);
                }
                else if (value !== null && value !== undefined) {
                    value = value.toString();
                    if (test.nodeType === TEXT_NODE) {
                        test.data = value;
                        if (good === null)
                            range.start = test;
                        good = test, test = good.nextSibling;
                    }
                    else {
                        value = document.createTextNode(value);
                        parent.insertBefore(value, test);
                        if (good === null)
                            range.start = value;
                        good = value;
                    }
                }
            }
        }
    }
}


/***/ }),
/* 15 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = staticSpread;
/* unused harmony export staticStyle */
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return SingleSpreadState; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "c", function() { return MultiSpreadState; });
var assign = 'assign' in Object ? Object.assign :
    function assign(a, b) {
        var props = Object.keys(b);
        for (var i = 0, len = props.length; i < len; i++) {
            var name = props[i];
            a[name] = b[name];
        }
    };
function staticSpread(node, obj, svg) {
    var props = Object.keys(obj);
    for (var i = 0, len = props.length; i < len; i++) {
        var rawName = props[i];
        if (rawName === 'style') {
            assign(node.style, obj.style);
        }
        else {
            var propName = translateJSXPropertyName(rawName);
            setField(node, propName, obj[rawName], svg);
        }
    }
}
function staticStyle(node, style) {
    assign(node.style, style);
}
var SingleSpreadState = (function () {
    function SingleSpreadState(namedProps) {
        this.namedProps = namedProps;
        this.oldProps = null;
        this.oldStyles = null;
    }
    SingleSpreadState.prototype.apply = function (node, props, svg) {
        var oldProps = this.oldProps, newProps = Object.keys(props), newLen = newProps.length, i = 0;
        if (oldProps === null) {
            for (; i < newLen; i++) {
                this.setField(node, newProps[i], props, svg);
            }
        }
        else {
            var oldLen = oldProps.length, len = oldLen < newLen ? oldLen : newLen;
            for (; i < len; i++) {
                var propName = newProps[i], oldPropName = oldProps[i];
                if (oldPropName !== propName) {
                    this.check(node, oldPropName, props, svg);
                }
                this.setField(node, propName, props, svg);
            }
            for (; i < newLen; i++) {
                this.setField(node, newProps[i], props, svg);
            }
            for (; i < oldLen; i++) {
                this.check(node, oldProps[i], props, svg);
            }
        }
        this.oldProps = newProps;
    };
    SingleSpreadState.prototype.applyStyle = function (node, style) {
        var oldStyles = this.oldStyles, newStyles = Object.keys(style), newLen = newStyles.length, i = 0;
        if (oldStyles === null) {
            for (; i < newLen; i++) {
                setStyle(node, newStyles[i], style);
            }
        }
        else {
            var oldLen = oldStyles.length, len = oldLen < newLen ? oldLen : newLen;
            for (; i < len; i++) {
                var propName = newStyles[i], oldPropName = oldStyles[i];
                if (oldPropName !== propName && !style.hasOwnProperty(oldPropName)) {
                    clearStyle(node, oldPropName);
                }
                setStyle(node, propName, style);
            }
            for (; i < newLen; i++) {
                setStyle(node, newStyles[i], style);
            }
            for (; i < oldLen; i++) {
                oldPropName = oldStyles[i];
                if (!style.hasOwnProperty(oldPropName)) {
                    clearStyle(node, oldPropName);
                }
            }
        }
        this.oldStyles = newStyles;
    };
    SingleSpreadState.prototype.check = function (node, rawName, props, svg) {
        if (!props.hasOwnProperty(rawName)) {
            var propName = translateJSXPropertyName(rawName);
            if (!this.namedProps.hasOwnProperty(propName)) {
                clearField(node, propName, svg);
            }
        }
    };
    SingleSpreadState.prototype.setField = function (node, rawName, props, svg) {
        var value = props[rawName];
        if (rawName === 'style') {
            this.applyStyle(node, value);
        }
        else {
            var propName = translateJSXPropertyName(rawName);
            setField(node, propName, value, svg);
        }
    };
    return SingleSpreadState;
}());

var MultiSpreadState = (function () {
    function MultiSpreadState(namedProps) {
        this.namedProps = namedProps;
        this.current = 1;
        this.propAges = {};
        this.oldProps = [];
        this.checkProps = [];
        this.styleAges = {};
        this.oldStyles = null;
        this.checkStyles = null;
    }
    MultiSpreadState.prototype.apply = function (node, props, n, last, svg) {
        var oldProps = this.oldProps[n], newProps = Object.keys(props), newLen = newProps.length, i = 0;
        if (oldProps === undefined) {
            for (; i < newLen; i++) {
                this.setField(node, newProps[i], props, n, last, svg);
            }
        }
        else {
            var oldLen = oldProps.length, len = oldLen < newLen ? oldLen : newLen;
            for (; i < len; i++) {
                var propName = newProps[i], oldPropName = oldProps[i];
                if (oldPropName !== propName) {
                    this.check(oldPropName, props);
                }
                this.setField(node, propName, props, n, last, svg);
            }
            for (; i < newLen; i++) {
                this.setField(node, newProps[i], props, n, last, svg);
            }
            for (; i < oldLen; i++) {
                this.check(oldProps[i], props);
            }
        }
        this.oldProps[n] = newProps;
        if (last) {
            for (i = 0, len = this.checkProps.length; i < len; i++) {
                propName = this.checkProps.pop();
                if (this.propAges[propName] !== this.current) {
                    clearField(node, propName, svg);
                }
            }
            this.current++;
        }
    };
    MultiSpreadState.prototype.applyStyle = function (node, style, n, last) {
        var oldStyles = this.oldStyles && this.oldStyles[n], newStyles = Object.keys(style), styleAges = this.styleAges, current = this.current, styleAges = this.styleAges, checkStyles = this.checkStyles, newLen = newStyles.length, i = 0;
        if (!oldStyles) {
            for (; i < newLen; i++) {
                setStyle(node, newStyles[i], style);
            }
        }
        else {
            var oldLen = oldStyles.length, len = oldLen < newLen ? oldLen : newLen;
            for (; i < len; i++) {
                var propName = newStyles[i], oldPropName = oldStyles[i];
                if (oldPropName !== propName && !style.hasOwnProperty(oldPropName)) {
                    if (checkStyles === null)
                        checkStyles = this.checkStyles = [oldPropName];
                    else
                        checkStyles.push(oldPropName);
                }
                styleAges[propName] = current;
                setStyle(node, propName, style);
            }
            for (; i < newLen; i++) {
                propName = newStyles[i];
                styleAges[propName] = current;
                setStyle(node, propName, style);
            }
            for (; i < oldLen; i++) {
                oldPropName = oldStyles[i];
                if (!style.hasOwnProperty(oldPropName)) {
                    if (checkStyles === null)
                        checkStyles = this.checkStyles = [oldPropName];
                    else
                        checkStyles.push(oldPropName);
                }
            }
        }
        if (this.oldStyles === null)
            this.oldStyles = [];
        this.oldStyles[n] = newStyles;
        if (last) {
            if (checkStyles !== null) {
                for (i = 0, len = checkStyles.length; i < len; i++) {
                    propName = checkStyles.pop();
                    if (styleAges[propName] !== current) {
                        clearStyle(node, propName);
                    }
                }
            }
            this.current++;
        }
    };
    MultiSpreadState.prototype.check = function (rawName, props) {
        if (!props.hasOwnProperty(rawName)) {
            var propName = translateJSXPropertyName(rawName);
            if (!this.namedProps.hasOwnProperty(propName)) {
                this.checkProps.push(propName);
            }
        }
    };
    MultiSpreadState.prototype.setField = function (node, rawName, props, n, last, svg) {
        var value = props[rawName];
        if (rawName === 'style') {
            this.applyStyle(node, value, n, last);
        }
        else {
            var propName = translateJSXPropertyName(rawName);
            this.propAges[propName] = this.current;
            setField(node, propName, value, svg);
        }
    };
    return MultiSpreadState;
}());

function setField(node, name, value, svg) {
    if (name in node && !svg)
        node[name] = value;
    else if (value === false || value === null || value === undefined)
        node.removeAttribute(name);
    else
        node.setAttribute(name, value);
}
function clearField(node, name, svg) {
    if (name in node && !svg)
        node[name] = defaultValue(node.tagName, name);
    else
        node.removeAttribute(name);
}
function setStyle(node, name, style) {
    node.style[name] = style[name];
}
function clearStyle(node, name) {
    node.style[name] = '';
}
var defaultValues = {};
function defaultValue(tag, name) {
    var emptyNode = defaultValues[tag] || (defaultValues[tag] = document.createElement(tag));
    return emptyNode[name];
}
var jsxEventProperty = /^on[A-Z]/;
function translateJSXPropertyName(name) {
    return jsxEventProperty.test(name)
        ? (name === "onDoubleClick" ? "ondblclick" : name.toLowerCase())
        : name;
}


/***/ })
/******/ ]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgNzgxMjUxNTE5NWZlOWQ1MWQ3MmEiLCJ3ZWJwYWNrOi8vLy4vfi9zLWpzL2Rpc3QvZXMvUy5qcyIsIndlYnBhY2s6Ly8vLi9+L3N1cnBsdXMvZXMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL21vZGVscy50cyIsIndlYnBhY2s6Ly8vLi9+L3MtYXJyYXkvZXMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2NvbnRyb2xsZXJzLnRzIiwid2VicGFjazovLy8uL3NyYy9wZXJzaXN0ZW5jZS50cyIsIndlYnBhY2s6Ly8vLi9zcmMvcm91dGVyLnRzIiwid2VicGFjazovLy8uL3NyYy92aWV3cy50c3giLCJ3ZWJwYWNrOi8vLy4vfi9jbGFzc25hbWVzL2luZGV4LmpzIiwid2VicGFjazovLy8uL3NyYy9tYWluLnRzIiwid2VicGFjazovLy8uL34vc3VycGx1cy1taXhpbi1kYXRhL2luZGV4LmVzLmpzIiwid2VicGFjazovLy8uL34vc3VycGx1cy1taXhpbi1mb2N1cy9pbmRleC5lcy5qcyIsIndlYnBhY2s6Ly8vLi9+L3N1cnBsdXMtbWl4aW4tb25rZXkvaW5kZXguZXMuanMiLCJ3ZWJwYWNrOi8vLy4vfi9zdXJwbHVzL2VzL2RvbS5qcyIsIndlYnBhY2s6Ly8vLi9+L3N1cnBsdXMvZXMvaW5zZXJ0LmpzIiwid2VicGFjazovLy8uL34vc3VycGx1cy9lcy9zcHJlYWQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQSxtREFBMkMsY0FBYzs7QUFFekQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFLO0FBQ0w7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBMkIsMEJBQTBCLEVBQUU7QUFDdkQseUNBQWlDLGVBQWU7QUFDaEQ7QUFDQTtBQUNBOztBQUVBO0FBQ0EsOERBQXNELCtEQUErRDs7QUFFckg7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7OztBQ2hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQ0FBcUM7QUFDckM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxQ0FBcUMsV0FBVztBQUNoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIsZUFBZTtBQUN0QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUNBQW1DO0FBQ25DLG1DQUFtQztBQUNuQyxvQ0FBb0M7QUFDcEM7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCLGdCQUFnQjtBQUN2QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0Q7QUFDQSxtQkFBbUI7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7O0FDOURZO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0VBQStCLGdEQUFnRCxFQUFFO0FBQ2pGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBOzs7Ozs7Ozs7OztBQy9HQTtBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7OztBQzFCWTtBQUNaO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDJDQUEyQyxTQUFTO0FBQ3BEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7O0FDeEpBO0FBQUE7QUFDQTtBQUNBO0FBQ0EsMkNBQTJDLFNBQVM7QUFDcEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUNBQXVDLFNBQVM7QUFDaEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0IsWUFBWTtBQUM5QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCLFNBQVM7QUFDM0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCLFlBQVk7QUFDOUI7QUFDQTtBQUNBLGtCQUFrQixZQUFZO0FBQzlCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0IsWUFBWTtBQUM5QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCLFNBQVM7QUFDM0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCLFlBQVk7QUFDOUI7QUFDQTtBQUNBLGtCQUFrQixZQUFZO0FBQzlCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDTztBQUNSO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0IsWUFBWTtBQUM5QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCLFNBQVM7QUFDM0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCLFlBQVk7QUFDOUI7QUFDQTtBQUNBLGtCQUFrQixZQUFZO0FBQzlCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxxREFBcUQsU0FBUztBQUM5RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCLFlBQVk7QUFDOUI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQixTQUFTO0FBQzNCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCLFlBQVk7QUFDOUI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0IsWUFBWTtBQUM5QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EscURBQXFELFNBQVM7QUFDOUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDTztBQUNSO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Ii4vZGlzdC9tYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gaWRlbnRpdHkgZnVuY3Rpb24gZm9yIGNhbGxpbmcgaGFybW9ueSBpbXBvcnRzIHdpdGggdGhlIGNvcnJlY3QgY29udGV4dFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5pID0gZnVuY3Rpb24odmFsdWUpIHsgcmV0dXJuIHZhbHVlOyB9O1xuXG4gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIGdldHRlcikge1xuIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHtcbiBcdFx0XHRcdGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gXHRcdFx0XHRlbnVtZXJhYmxlOiB0cnVlLFxuIFx0XHRcdFx0Z2V0OiBnZXR0ZXJcbiBcdFx0XHR9KTtcbiBcdFx0fVxuIFx0fTtcblxuIFx0Ly8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubiA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuIFx0XHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cbiBcdFx0XHRmdW5jdGlvbiBnZXREZWZhdWx0KCkgeyByZXR1cm4gbW9kdWxlWydkZWZhdWx0J107IH0gOlxuIFx0XHRcdGZ1bmN0aW9uIGdldE1vZHVsZUV4cG9ydHMoKSB7IHJldHVybiBtb2R1bGU7IH07XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsICdhJywgZ2V0dGVyKTtcbiBcdFx0cmV0dXJuIGdldHRlcjtcbiBcdH07XG5cbiBcdC8vIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpOyB9O1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXyhfX3dlYnBhY2tfcmVxdWlyZV9fLnMgPSA5KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyB3ZWJwYWNrL2Jvb3RzdHJhcCA3ODEyNTE1MTk1ZmU5ZDUxZDcyYSIsIi8vIFB1YmxpYyBpbnRlcmZhY2VcbnZhciBTID0gZnVuY3Rpb24gUyhmbiwgdmFsdWUpIHtcbiAgICB2YXIgb3duZXIgPSBPd25lciwgcnVubmluZyA9IFJ1bm5pbmdOb2RlO1xuICAgIGlmIChvd25lciA9PT0gbnVsbClcbiAgICAgICAgY29uc29sZS53YXJuKFwiY29tcHV0YXRpb25zIGNyZWF0ZWQgd2l0aG91dCBhIHJvb3Qgb3IgcGFyZW50IHdpbGwgbmV2ZXIgYmUgZGlzcG9zZWRcIik7XG4gICAgdmFyIG5vZGUgPSBuZXcgQ29tcHV0YXRpb25Ob2RlKGZuLCB2YWx1ZSk7XG4gICAgT3duZXIgPSBSdW5uaW5nTm9kZSA9IG5vZGU7XG4gICAgaWYgKFJ1bm5pbmdDbG9jayA9PT0gbnVsbCkge1xuICAgICAgICB0b3BsZXZlbENvbXB1dGF0aW9uKG5vZGUpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgbm9kZS52YWx1ZSA9IG5vZGUuZm4obm9kZS52YWx1ZSk7XG4gICAgfVxuICAgIGlmIChvd25lciAmJiBvd25lciAhPT0gVU5PV05FRCkge1xuICAgICAgICBpZiAob3duZXIub3duZWQgPT09IG51bGwpXG4gICAgICAgICAgICBvd25lci5vd25lZCA9IFtub2RlXTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgb3duZXIub3duZWQucHVzaChub2RlKTtcbiAgICB9XG4gICAgT3duZXIgPSBvd25lcjtcbiAgICBSdW5uaW5nTm9kZSA9IHJ1bm5pbmc7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGNvbXB1dGF0aW9uKCkge1xuICAgICAgICBpZiAoUnVubmluZ05vZGUgIT09IG51bGwpIHtcbiAgICAgICAgICAgIGlmIChub2RlLmFnZSA9PT0gUm9vdENsb2NrLnRpbWUpIHtcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5zdGF0ZSA9PT0gUlVOTklORylcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY2lyY3VsYXIgZGVwZW5kZW5jeVwiKTtcbiAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgIHVwZGF0ZU5vZGUobm9kZSk7IC8vIGNoZWNrcyBmb3Igc3RhdGUgPT09IFNUQUxFIGludGVybmFsbHksIHNvIGRvbid0IG5lZWQgdG8gY2hlY2sgaGVyZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbG9nQ29tcHV0YXRpb25SZWFkKG5vZGUsIFJ1bm5pbmdOb2RlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbm9kZS52YWx1ZTtcbiAgICB9O1xufTtcbi8vIGNvbXBhdGliaWxpdHkgd2l0aCBjb21tb25qcyBzeXN0ZW1zIHRoYXQgZXhwZWN0IGRlZmF1bHQgZXhwb3J0IHRvIGJlIGF0IHJlcXVpcmUoJ3MuanMnKS5kZWZhdWx0IHJhdGhlciB0aGFuIGp1c3QgcmVxdWlyZSgncy1qcycpXG5PYmplY3QuZGVmaW5lUHJvcGVydHkoUywgJ2RlZmF1bHQnLCB7IHZhbHVlOiBTIH0pO1xuZXhwb3J0IGRlZmF1bHQgUztcblMucm9vdCA9IGZ1bmN0aW9uIHJvb3QoZm4pIHtcbiAgICB2YXIgb3duZXIgPSBPd25lciwgcm9vdCA9IGZuLmxlbmd0aCA9PT0gMCA/IFVOT1dORUQgOiBuZXcgQ29tcHV0YXRpb25Ob2RlKG51bGwsIG51bGwpLCByZXN1bHQgPSB1bmRlZmluZWQsIGRpc3Bvc2VyID0gZm4ubGVuZ3RoID09PSAwID8gbnVsbCA6IGZ1bmN0aW9uIF9kaXNwb3NlKCkge1xuICAgICAgICBpZiAoUnVubmluZ0Nsb2NrICE9PSBudWxsKSB7XG4gICAgICAgICAgICBSb290Q2xvY2suZGlzcG9zZXMuYWRkKHJvb3QpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZGlzcG9zZShyb290KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgT3duZXIgPSByb290O1xuICAgIGlmIChSdW5uaW5nQ2xvY2sgPT09IG51bGwpIHtcbiAgICAgICAgcmVzdWx0ID0gdG9wTGV2ZWxSb290KGZuLCBkaXNwb3Nlciwgb3duZXIpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmVzdWx0ID0gZGlzcG9zZXIgPT09IG51bGwgPyBmbigpIDogZm4oZGlzcG9zZXIpO1xuICAgICAgICBPd25lciA9IG93bmVyO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufTtcbmZ1bmN0aW9uIHRvcExldmVsUm9vdChmbiwgZGlzcG9zZXIsIG93bmVyKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGRpc3Bvc2VyID09PSBudWxsID8gZm4oKSA6IGZuKGRpc3Bvc2VyKTtcbiAgICB9XG4gICAgZmluYWxseSB7XG4gICAgICAgIE93bmVyID0gb3duZXI7XG4gICAgfVxufVxuUy5vbiA9IGZ1bmN0aW9uIG9uKGV2LCBmbiwgc2VlZCwgb25jaGFuZ2VzKSB7XG4gICAgaWYgKEFycmF5LmlzQXJyYXkoZXYpKVxuICAgICAgICBldiA9IGNhbGxBbGwoZXYpO1xuICAgIG9uY2hhbmdlcyA9ICEhb25jaGFuZ2VzO1xuICAgIHJldHVybiBTKG9uLCBzZWVkKTtcbiAgICBmdW5jdGlvbiBvbih2YWx1ZSkge1xuICAgICAgICB2YXIgcnVubmluZyA9IFJ1bm5pbmdOb2RlO1xuICAgICAgICBldigpO1xuICAgICAgICBpZiAob25jaGFuZ2VzKVxuICAgICAgICAgICAgb25jaGFuZ2VzID0gZmFsc2U7XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgUnVubmluZ05vZGUgPSBudWxsO1xuICAgICAgICAgICAgdmFsdWUgPSBmbih2YWx1ZSk7XG4gICAgICAgICAgICBSdW5uaW5nTm9kZSA9IHJ1bm5pbmc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgIH1cbn07XG5mdW5jdGlvbiBjYWxsQWxsKHNzKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGFsbCgpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzcy5sZW5ndGg7IGkrKylcbiAgICAgICAgICAgIHNzW2ldKCk7XG4gICAgfTtcbn1cblMuZGF0YSA9IGZ1bmN0aW9uIGRhdGEodmFsdWUpIHtcbiAgICB2YXIgbm9kZSA9IG5ldyBEYXRhTm9kZSh2YWx1ZSk7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIGRhdGEodmFsdWUpIHtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBpZiAoUnVubmluZ0Nsb2NrICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUucGVuZGluZyAhPT0gTk9UUEVORElORykge1xuICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgIT09IG5vZGUucGVuZGluZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY29uZmxpY3RpbmcgY2hhbmdlczogXCIgKyB2YWx1ZSArIFwiICE9PSBcIiArIG5vZGUucGVuZGluZyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUucGVuZGluZyA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICBSb290Q2xvY2suY2hhbmdlcy5hZGQobm9kZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUubG9nICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUucGVuZGluZyA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICBSb290Q2xvY2suY2hhbmdlcy5hZGQobm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIGV2ZW50KCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBub2RlLnZhbHVlID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKFJ1bm5pbmdOb2RlICE9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgbG9nRGF0YVJlYWQobm9kZSwgUnVubmluZ05vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIG5vZGUudmFsdWU7XG4gICAgICAgIH1cbiAgICB9O1xufTtcblMudmFsdWUgPSBmdW5jdGlvbiB2YWx1ZShjdXJyZW50LCBlcSkge1xuICAgIHZhciBkYXRhID0gUy5kYXRhKGN1cnJlbnQpLCBhZ2UgPSAwO1xuICAgIHJldHVybiBmdW5jdGlvbiB2YWx1ZSh1cGRhdGUpIHtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBkYXRhKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgc2FtZSA9IGVxID8gZXEoY3VycmVudCwgdXBkYXRlKSA6IGN1cnJlbnQgPT09IHVwZGF0ZTtcbiAgICAgICAgICAgIGlmICghc2FtZSkge1xuICAgICAgICAgICAgICAgIHZhciB0aW1lID0gUm9vdENsb2NrLnRpbWU7XG4gICAgICAgICAgICAgICAgaWYgKGFnZSA9PT0gdGltZSlcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY29uZmxpY3RpbmcgdmFsdWVzOiBcIiArIHVwZGF0ZSArIFwiIGlzIG5vdCB0aGUgc2FtZSBhcyBcIiArIGN1cnJlbnQpO1xuICAgICAgICAgICAgICAgIGFnZSA9IHRpbWU7XG4gICAgICAgICAgICAgICAgY3VycmVudCA9IHVwZGF0ZTtcbiAgICAgICAgICAgICAgICBkYXRhKHVwZGF0ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdXBkYXRlO1xuICAgICAgICB9XG4gICAgfTtcbn07XG5TLmZyZWV6ZSA9IGZ1bmN0aW9uIGZyZWV6ZShmbikge1xuICAgIHZhciByZXN1bHQgPSB1bmRlZmluZWQ7XG4gICAgaWYgKFJ1bm5pbmdDbG9jayAhPT0gbnVsbCkge1xuICAgICAgICByZXN1bHQgPSBmbigpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgUnVubmluZ0Nsb2NrID0gUm9vdENsb2NrO1xuICAgICAgICBSdW5uaW5nQ2xvY2suY2hhbmdlcy5yZXNldCgpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVzdWx0ID0gZm4oKTtcbiAgICAgICAgICAgIGV2ZW50KCk7XG4gICAgICAgIH1cbiAgICAgICAgZmluYWxseSB7XG4gICAgICAgICAgICBSdW5uaW5nQ2xvY2sgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59O1xuUy5zYW1wbGUgPSBmdW5jdGlvbiBzYW1wbGUoZm4pIHtcbiAgICB2YXIgcmVzdWx0LCBydW5uaW5nID0gUnVubmluZ05vZGU7XG4gICAgaWYgKHJ1bm5pbmcgIT09IG51bGwpIHtcbiAgICAgICAgUnVubmluZ05vZGUgPSBudWxsO1xuICAgICAgICByZXN1bHQgPSBmbigpO1xuICAgICAgICBSdW5uaW5nTm9kZSA9IHJ1bm5pbmc7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXN1bHQgPSBmbigpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblMuY2xlYW51cCA9IGZ1bmN0aW9uIGNsZWFudXAoZm4pIHtcbiAgICBpZiAoT3duZXIgIT09IG51bGwpIHtcbiAgICAgICAgaWYgKE93bmVyLmNsZWFudXBzID09PSBudWxsKVxuICAgICAgICAgICAgT3duZXIuY2xlYW51cHMgPSBbZm5dO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBPd25lci5jbGVhbnVwcy5wdXNoKGZuKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcImNsZWFudXBzIGNyZWF0ZWQgd2l0aG91dCBhIHJvb3Qgb3IgcGFyZW50IHdpbGwgbmV2ZXIgYmUgcnVuXCIpO1xuICAgIH1cbn07XG4vLyBJbnRlcm5hbCBpbXBsZW1lbnRhdGlvblxuLy8vIEdyYXBoIGNsYXNzZXMgYW5kIG9wZXJhdGlvbnNcbnZhciBDbG9jayA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQ2xvY2soKSB7XG4gICAgICAgIHRoaXMudGltZSA9IDA7XG4gICAgICAgIHRoaXMuY2hhbmdlcyA9IG5ldyBRdWV1ZSgpOyAvLyBiYXRjaGVkIGNoYW5nZXMgdG8gZGF0YSBub2Rlc1xuICAgICAgICB0aGlzLnVwZGF0ZXMgPSBuZXcgUXVldWUoKTsgLy8gY29tcHV0YXRpb25zIHRvIHVwZGF0ZVxuICAgICAgICB0aGlzLmRpc3Bvc2VzID0gbmV3IFF1ZXVlKCk7IC8vIGRpc3Bvc2FscyB0byBydW4gYWZ0ZXIgY3VycmVudCBiYXRjaCBvZiB1cGRhdGVzIGZpbmlzaGVzXG4gICAgfVxuICAgIHJldHVybiBDbG9jaztcbn0oKSk7XG52YXIgRGF0YU5vZGUgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIERhdGFOb2RlKHZhbHVlKSB7XG4gICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5wZW5kaW5nID0gTk9UUEVORElORztcbiAgICAgICAgdGhpcy5sb2cgPSBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gRGF0YU5vZGU7XG59KCkpO1xudmFyIENvbXB1dGF0aW9uTm9kZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQ29tcHV0YXRpb25Ob2RlKGZuLCB2YWx1ZSkge1xuICAgICAgICB0aGlzLmZuID0gZm47XG4gICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IENVUlJFTlQ7XG4gICAgICAgIHRoaXMuc291cmNlMSA9IG51bGw7XG4gICAgICAgIHRoaXMuc291cmNlMXNsb3QgPSAwO1xuICAgICAgICB0aGlzLmNvdW50ID0gMDtcbiAgICAgICAgdGhpcy5zb3VyY2VzID0gbnVsbDtcbiAgICAgICAgdGhpcy5zb3VyY2VzbG90cyA9IG51bGw7XG4gICAgICAgIHRoaXMubG9nID0gbnVsbDtcbiAgICAgICAgdGhpcy5vd25lZCA9IG51bGw7XG4gICAgICAgIHRoaXMuY2xlYW51cHMgPSBudWxsO1xuICAgICAgICB0aGlzLmFnZSA9IFJvb3RDbG9jay50aW1lO1xuICAgIH1cbiAgICByZXR1cm4gQ29tcHV0YXRpb25Ob2RlO1xufSgpKTtcbnZhciBMb2cgPSAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIExvZygpIHtcbiAgICAgICAgdGhpcy5ub2RlMSA9IG51bGw7XG4gICAgICAgIHRoaXMubm9kZTFzbG90ID0gMDtcbiAgICAgICAgdGhpcy5jb3VudCA9IDA7XG4gICAgICAgIHRoaXMubm9kZXMgPSBudWxsO1xuICAgICAgICB0aGlzLm5vZGVzbG90cyA9IG51bGw7XG4gICAgICAgIHRoaXMuZnJlZWNvdW50ID0gMDtcbiAgICAgICAgdGhpcy5mcmVlc2xvdHMgPSBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gTG9nO1xufSgpKTtcbnZhciBRdWV1ZSA9IChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUXVldWUoKSB7XG4gICAgICAgIHRoaXMuaXRlbXMgPSBbXTtcbiAgICAgICAgdGhpcy5jb3VudCA9IDA7XG4gICAgfVxuICAgIFF1ZXVlLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5jb3VudCA9IDA7XG4gICAgfTtcbiAgICBRdWV1ZS5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgdGhpcy5pdGVtc1t0aGlzLmNvdW50KytdID0gaXRlbTtcbiAgICB9O1xuICAgIFF1ZXVlLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgdmFyIGl0ZW1zID0gdGhpcy5pdGVtcztcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNvdW50OyBpKyspIHtcbiAgICAgICAgICAgIGZuKGl0ZW1zW2ldKTtcbiAgICAgICAgICAgIGl0ZW1zW2ldID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNvdW50ID0gMDtcbiAgICB9O1xuICAgIHJldHVybiBRdWV1ZTtcbn0oKSk7XG4vLyBDb25zdGFudHNcbnZhciBOT1RQRU5ESU5HID0ge30sIENVUlJFTlQgPSAwLCBTVEFMRSA9IDEsIFJVTk5JTkcgPSAyO1xuLy8gXCJHbG9iYWxzXCIgdXNlZCB0byBrZWVwIHRyYWNrIG9mIGN1cnJlbnQgc3lzdGVtIHN0YXRlXG52YXIgUm9vdENsb2NrID0gbmV3IENsb2NrKCksIFJ1bm5pbmdDbG9jayA9IG51bGwsIC8vIGN1cnJlbnRseSBydW5uaW5nIGNsb2NrIFxuUnVubmluZ05vZGUgPSBudWxsLCAvLyBjdXJyZW50bHkgcnVubmluZyBjb21wdXRhdGlvblxuT3duZXIgPSBudWxsLCAvLyBvd25lciBmb3IgbmV3IGNvbXB1dGF0aW9uc1xuVU5PV05FRCA9IG5ldyBDb21wdXRhdGlvbk5vZGUobnVsbCwgbnVsbCk7XG4vLyBGdW5jdGlvbnNcbmZ1bmN0aW9uIGxvZ1JlYWQoZnJvbSwgdG8pIHtcbiAgICB2YXIgZnJvbXNsb3QsIHRvc2xvdCA9IHRvLnNvdXJjZTEgPT09IG51bGwgPyAtMSA6IHRvLmNvdW50Kys7XG4gICAgaWYgKGZyb20ubm9kZTEgPT09IG51bGwpIHtcbiAgICAgICAgZnJvbS5ub2RlMSA9IHRvO1xuICAgICAgICBmcm9tLm5vZGUxc2xvdCA9IHRvc2xvdDtcbiAgICAgICAgZnJvbXNsb3QgPSAtMTtcbiAgICB9XG4gICAgZWxzZSBpZiAoZnJvbS5ub2RlcyA9PT0gbnVsbCkge1xuICAgICAgICBmcm9tLm5vZGVzID0gW3RvXTtcbiAgICAgICAgZnJvbS5ub2Rlc2xvdHMgPSBbdG9zbG90XTtcbiAgICAgICAgZnJvbS5jb3VudCA9IDE7XG4gICAgICAgIGZyb21zbG90ID0gMDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGZyb21zbG90ID0gZnJvbS5mcmVlY291bnQgIT09IDAgPyBmcm9tLmZyZWVzbG90c1stLWZyb20uZnJlZWNvdW50XSA6IGZyb20uY291bnQrKyxcbiAgICAgICAgICAgIGZyb20ubm9kZXNbZnJvbXNsb3RdID0gdG87XG4gICAgICAgIGZyb20ubm9kZXNsb3RzW2Zyb21zbG90XSA9IHRvc2xvdDtcbiAgICB9XG4gICAgaWYgKHRvLnNvdXJjZTEgPT09IG51bGwpIHtcbiAgICAgICAgdG8uc291cmNlMSA9IGZyb207XG4gICAgICAgIHRvLnNvdXJjZTFzbG90ID0gZnJvbXNsb3Q7XG4gICAgfVxuICAgIGVsc2UgaWYgKHRvLnNvdXJjZXMgPT09IG51bGwpIHtcbiAgICAgICAgdG8uc291cmNlcyA9IFtmcm9tXTtcbiAgICAgICAgdG8uc291cmNlc2xvdHMgPSBbZnJvbXNsb3RdO1xuICAgICAgICB0by5jb3VudCA9IDE7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB0by5zb3VyY2VzW3Rvc2xvdF0gPSBmcm9tO1xuICAgICAgICB0by5zb3VyY2VzbG90c1t0b3Nsb3RdID0gZnJvbXNsb3Q7XG4gICAgfVxufVxuZnVuY3Rpb24gbG9nRGF0YVJlYWQoZGF0YSwgdG8pIHtcbiAgICBpZiAoZGF0YS5sb2cgPT09IG51bGwpXG4gICAgICAgIGRhdGEubG9nID0gbmV3IExvZygpO1xuICAgIGxvZ1JlYWQoZGF0YS5sb2csIHRvKTtcbn1cbmZ1bmN0aW9uIGxvZ0NvbXB1dGF0aW9uUmVhZChub2RlLCB0bykge1xuICAgIGlmIChub2RlLmxvZyA9PT0gbnVsbClcbiAgICAgICAgbm9kZS5sb2cgPSBuZXcgTG9nKCk7XG4gICAgbG9nUmVhZChub2RlLmxvZywgdG8pO1xufVxuZnVuY3Rpb24gZXZlbnQoKSB7XG4gICAgLy8gYi9jIHdlIG1pZ2h0IGJlIHVuZGVyIGEgdG9wIGxldmVsIFMucm9vdCgpLCBoYXZlIHRvIHByZXNlcnZlIGN1cnJlbnQgcm9vdFxuICAgIHZhciBvd25lciA9IE93bmVyO1xuICAgIFJvb3RDbG9jay51cGRhdGVzLnJlc2V0KCk7XG4gICAgUm9vdENsb2NrLnRpbWUrKztcbiAgICB0cnkge1xuICAgICAgICBydW4oUm9vdENsb2NrKTtcbiAgICB9XG4gICAgZmluYWxseSB7XG4gICAgICAgIFJ1bm5pbmdDbG9jayA9IFJ1bm5pbmdOb2RlID0gbnVsbDtcbiAgICAgICAgT3duZXIgPSBvd25lcjtcbiAgICB9XG59XG5mdW5jdGlvbiB0b3BsZXZlbENvbXB1dGF0aW9uKG5vZGUpIHtcbiAgICBSdW5uaW5nQ2xvY2sgPSBSb290Q2xvY2s7XG4gICAgUm9vdENsb2NrLmNoYW5nZXMucmVzZXQoKTtcbiAgICBSb290Q2xvY2sudXBkYXRlcy5yZXNldCgpO1xuICAgIHRyeSB7XG4gICAgICAgIG5vZGUudmFsdWUgPSBub2RlLmZuKG5vZGUudmFsdWUpO1xuICAgICAgICBpZiAoUm9vdENsb2NrLmNoYW5nZXMuY291bnQgPiAwIHx8IFJvb3RDbG9jay51cGRhdGVzLmNvdW50ID4gMCkge1xuICAgICAgICAgICAgUm9vdENsb2NrLnRpbWUrKztcbiAgICAgICAgICAgIHJ1bihSb290Q2xvY2spO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZpbmFsbHkge1xuICAgICAgICBSdW5uaW5nQ2xvY2sgPSBPd25lciA9IFJ1bm5pbmdOb2RlID0gbnVsbDtcbiAgICB9XG59XG5mdW5jdGlvbiBydW4oY2xvY2spIHtcbiAgICB2YXIgcnVubmluZyA9IFJ1bm5pbmdDbG9jaywgY291bnQgPSAwO1xuICAgIFJ1bm5pbmdDbG9jayA9IGNsb2NrO1xuICAgIGNsb2NrLmRpc3Bvc2VzLnJlc2V0KCk7XG4gICAgLy8gZm9yIGVhY2ggYmF0Y2ggLi4uXG4gICAgd2hpbGUgKGNsb2NrLmNoYW5nZXMuY291bnQgIT09IDAgfHwgY2xvY2sudXBkYXRlcy5jb3VudCAhPT0gMCB8fCBjbG9jay5kaXNwb3Nlcy5jb3VudCAhPT0gMCkge1xuICAgICAgICBpZiAoY291bnQgPiAwKVxuICAgICAgICAgICAgY2xvY2sudGltZSsrO1xuICAgICAgICBjbG9jay5jaGFuZ2VzLnJ1bihhcHBseURhdGFDaGFuZ2UpO1xuICAgICAgICBjbG9jay51cGRhdGVzLnJ1bih1cGRhdGVOb2RlKTtcbiAgICAgICAgY2xvY2suZGlzcG9zZXMucnVuKGRpc3Bvc2UpO1xuICAgICAgICAvLyBpZiB0aGVyZSBhcmUgc3RpbGwgY2hhbmdlcyBhZnRlciBleGNlc3NpdmUgYmF0Y2hlcywgYXNzdW1lIHJ1bmF3YXkgICAgICAgICAgICBcbiAgICAgICAgaWYgKGNvdW50KysgPiAxZTUpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlJ1bmF3YXkgY2xvY2sgZGV0ZWN0ZWRcIik7XG4gICAgICAgIH1cbiAgICB9XG4gICAgUnVubmluZ0Nsb2NrID0gcnVubmluZztcbn1cbmZ1bmN0aW9uIGFwcGx5RGF0YUNoYW5nZShkYXRhKSB7XG4gICAgZGF0YS52YWx1ZSA9IGRhdGEucGVuZGluZztcbiAgICBkYXRhLnBlbmRpbmcgPSBOT1RQRU5ESU5HO1xuICAgIGlmIChkYXRhLmxvZylcbiAgICAgICAgbWFya0NvbXB1dGF0aW9uc1N0YWxlKGRhdGEubG9nKTtcbn1cbmZ1bmN0aW9uIG1hcmtDb21wdXRhdGlvbnNTdGFsZShsb2cpIHtcbiAgICB2YXIgbm9kZTEgPSBsb2cubm9kZTEsIG5vZGVzID0gbG9nLm5vZGVzLCBub2Rlc2xvdHMgPSBsb2cubm9kZXNsb3RzLCBkZWFkID0gMCwgc2xvdCwgbm9kZXNsb3QsIG5vZGU7XG4gICAgLy8gbWFyayBhbGwgZG93bnN0cmVhbSBub2RlcyBzdGFsZSB3aGljaCBoYXZlbid0IGJlZW4gYWxyZWFkeVxuICAgIGlmIChub2RlMSAhPT0gbnVsbClcbiAgICAgICAgbWFya05vZGVTdGFsZShub2RlMSk7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsb2cuY291bnQ7IGkrKykge1xuICAgICAgICAvLyBjb21wYWN0IGxvZy5ub2RlcyBhcyB3ZSBpdGVyYXRlIHRocm91Z2ggaXRcbiAgICAgICAgbm9kZSA9IG5vZGVzW2ldO1xuICAgICAgICBpZiAobm9kZSkge1xuICAgICAgICAgICAgbWFya05vZGVTdGFsZShub2RlKTtcbiAgICAgICAgICAgIGlmIChkZWFkKSB7XG4gICAgICAgICAgICAgICAgc2xvdCA9IGkgLSBkZWFkO1xuICAgICAgICAgICAgICAgIG5vZGVzbG90ID0gbm9kZXNsb3RzW2ldO1xuICAgICAgICAgICAgICAgIG5vZGVzW2ldID0gbnVsbDtcbiAgICAgICAgICAgICAgICBub2Rlc1tzbG90XSA9IG5vZGU7XG4gICAgICAgICAgICAgICAgbm9kZXNsb3RzW3Nsb3RdID0gbm9kZXNsb3Q7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGVzbG90ID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBub2RlLnNvdXJjZTFzbG90ID0gc2xvdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUuc291cmNlc2xvdHNbbm9kZXNsb3RdID0gc2xvdDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBkZWFkKys7XG4gICAgICAgIH1cbiAgICB9XG4gICAgbG9nLmNvdW50IC09IGRlYWQ7XG4gICAgbG9nLmZyZWVjb3VudCA9IDA7XG59XG5mdW5jdGlvbiBtYXJrTm9kZVN0YWxlKG5vZGUpIHtcbiAgICB2YXIgdGltZSA9IFJvb3RDbG9jay50aW1lO1xuICAgIGlmIChub2RlLmFnZSA8IHRpbWUpIHtcbiAgICAgICAgbm9kZS5hZ2UgPSB0aW1lO1xuICAgICAgICBub2RlLnN0YXRlID0gU1RBTEU7XG4gICAgICAgIFJvb3RDbG9jay51cGRhdGVzLmFkZChub2RlKTtcbiAgICAgICAgaWYgKG5vZGUub3duZWQgIT09IG51bGwpXG4gICAgICAgICAgICBtYXJrT3duZWROb2Rlc0ZvckRpc3Bvc2FsKG5vZGUub3duZWQpO1xuICAgICAgICBpZiAobm9kZS5sb2cgIT09IG51bGwpXG4gICAgICAgICAgICBtYXJrQ29tcHV0YXRpb25zU3RhbGUobm9kZS5sb2cpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIG1hcmtPd25lZE5vZGVzRm9yRGlzcG9zYWwob3duZWQpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG93bmVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBjaGlsZCA9IG93bmVkW2ldO1xuICAgICAgICBjaGlsZC5hZ2UgPSBSb290Q2xvY2sudGltZTtcbiAgICAgICAgY2hpbGQuc3RhdGUgPSBDVVJSRU5UO1xuICAgICAgICBpZiAoY2hpbGQub3duZWQgIT09IG51bGwpXG4gICAgICAgICAgICBtYXJrT3duZWROb2Rlc0ZvckRpc3Bvc2FsKGNoaWxkLm93bmVkKTtcbiAgICB9XG59XG5mdW5jdGlvbiB1cGRhdGVOb2RlKG5vZGUpIHtcbiAgICBpZiAobm9kZS5zdGF0ZSA9PT0gU1RBTEUpIHtcbiAgICAgICAgdmFyIG93bmVyID0gT3duZXIsIHJ1bm5pbmcgPSBSdW5uaW5nTm9kZTtcbiAgICAgICAgT3duZXIgPSBSdW5uaW5nTm9kZSA9IG5vZGU7XG4gICAgICAgIG5vZGUuc3RhdGUgPSBSVU5OSU5HO1xuICAgICAgICBjbGVhbnVwKG5vZGUsIGZhbHNlKTtcbiAgICAgICAgbm9kZS52YWx1ZSA9IG5vZGUuZm4obm9kZS52YWx1ZSk7XG4gICAgICAgIG5vZGUuc3RhdGUgPSBDVVJSRU5UO1xuICAgICAgICBPd25lciA9IG93bmVyO1xuICAgICAgICBSdW5uaW5nTm9kZSA9IHJ1bm5pbmc7XG4gICAgfVxufVxuZnVuY3Rpb24gY2xlYW51cChub2RlLCBmaW5hbCkge1xuICAgIHZhciBzb3VyY2UxID0gbm9kZS5zb3VyY2UxLCBzb3VyY2VzID0gbm9kZS5zb3VyY2VzLCBzb3VyY2VzbG90cyA9IG5vZGUuc291cmNlc2xvdHMsIGNsZWFudXBzID0gbm9kZS5jbGVhbnVwcywgb3duZWQgPSBub2RlLm93bmVkLCBpO1xuICAgIGlmIChjbGVhbnVwcyAhPT0gbnVsbCkge1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgY2xlYW51cHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNsZWFudXBzW2ldKGZpbmFsKTtcbiAgICAgICAgfVxuICAgICAgICBub2RlLmNsZWFudXBzID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKG93bmVkICE9PSBudWxsKSB7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBvd25lZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgZGlzcG9zZShvd25lZFtpXSk7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZS5vd25lZCA9IG51bGw7XG4gICAgfVxuICAgIGlmIChzb3VyY2UxICE9PSBudWxsKSB7XG4gICAgICAgIGNsZWFudXBTb3VyY2Uoc291cmNlMSwgbm9kZS5zb3VyY2Uxc2xvdCk7XG4gICAgICAgIG5vZGUuc291cmNlMSA9IG51bGw7XG4gICAgfVxuICAgIGZvciAoaSA9IDA7IGkgPCBub2RlLmNvdW50OyBpKyspIHtcbiAgICAgICAgY2xlYW51cFNvdXJjZShzb3VyY2VzW2ldLCBzb3VyY2VzbG90c1tpXSk7XG4gICAgICAgIHNvdXJjZXNbaV0gPSBudWxsO1xuICAgIH1cbiAgICBub2RlLmNvdW50ID0gMDtcbn1cbmZ1bmN0aW9uIGNsZWFudXBTb3VyY2Uoc291cmNlLCBzbG90KSB7XG4gICAgaWYgKHNsb3QgPT09IC0xKSB7XG4gICAgICAgIHNvdXJjZS5ub2RlMSA9IG51bGw7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBzb3VyY2Uubm9kZXNbc2xvdF0gPSBudWxsO1xuICAgICAgICBpZiAoc2xvdCA9PT0gc291cmNlLmNvdW50IC0gMSkge1xuICAgICAgICAgICAgc291cmNlLmNvdW50LS07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoc291cmNlLmZyZWVzbG90cyA9PT0gbnVsbCkge1xuICAgICAgICAgICAgc291cmNlLmZyZWVzbG90cyA9IFtzbG90XTtcbiAgICAgICAgICAgIHNvdXJjZS5mcmVlY291bnQgPSAxO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc291cmNlLmZyZWVzbG90c1tzb3VyY2UuZnJlZWNvdW50KytdID0gc2xvdDtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIGRpc3Bvc2Uobm9kZSkge1xuICAgIG5vZGUuZm4gPSBudWxsO1xuICAgIG5vZGUubG9nID0gbnVsbDtcbiAgICBjbGVhbnVwKG5vZGUsIHRydWUpO1xufVxuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9+L3MtanMvZGlzdC9lcy9TLmpzXG4vLyBtb2R1bGUgaWQgPSAwXG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsImV4cG9ydCB7IGluc2VydCB9IGZyb20gJy4vaW5zZXJ0JztcbmV4cG9ydCAqIGZyb20gJy4vZG9tJztcbmV4cG9ydCB7IHN0YXRpY1NwcmVhZCwgU2luZ2xlU3ByZWFkU3RhdGUsIE11bHRpU3ByZWFkU3RhdGUgfSBmcm9tICcuL3NwcmVhZCc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIFMgfSBmcm9tICdzLWpzJztcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vfi9zdXJwbHVzL2VzL2luZGV4LmpzXG4vLyBtb2R1bGUgaWQgPSAxXG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsImltcG9ydCBTLCB7IERhdGFTaWduYWwgfSBmcm9tICdzLWpzJztcclxuaW1wb3J0IFNBcnJheSBmcm9tICdzLWFycmF5JztcclxuXHJcbi8vIG91ciBUb0RvIG1vZGVsXHJcbmV4cG9ydCBjb25zdCBUb0RvID0gKHRpdGxlIDogc3RyaW5nLCBjb21wbGV0ZWQgOiBib29sZWFuKSA9PiAoe1xyXG4gICAgdGl0bGU6IGpzb25hYmxlKFMuZGF0YSh0aXRsZSkpLFxyXG4gICAgY29tcGxldGVkOiBqc29uYWJsZShTLmRhdGEoY29tcGxldGVkKSlcclxufSk7XHJcblxyXG5leHBvcnQgdHlwZSBUb0RvID0gdHlwZW9mIHRvRG9UeXBlOyBjb25zdCB0b0RvVHlwZSA9IHJldHVyblR5cGUoVG9Ebyk7XHJcblxyXG4vLyBvdXIgbWFpbiBtb2RlbFxyXG5leHBvcnQgY29uc3QgVG9Eb3NNb2RlbCA9ICh0b2RvczogVG9Eb1tdKSA9PiAoe1xyXG4gICAgdG9kb3M6IGpzb25hYmxlKFNBcnJheSh0b2RvcykpXHJcbn0pO1xyXG5cclxuZXhwb3J0IHR5cGUgVG9Eb3NNb2RlbCA9IHR5cGVvZiB0b0Rvc01vZGVsVHlwZTsgY29uc3QgdG9Eb3NNb2RlbFR5cGUgPSByZXR1cm5UeXBlKFRvRG9zTW9kZWwpO1xyXG5cclxuLy8gQSBjb3VwbGUgc21hbGwgdXRpbGl0aWVzXHJcblxyXG4vLyBUeXBlU2NyaXB0IHV0aWxpdHk6IGRvIGEgbGl0dGxlIGdlbmVyaWMgcGF0dGVybiBtYXRjaGluZyB0byBleHRyYWN0IHRoZSByZXR1cm4gdHlwZSBvZiBhbnkgZnVuY3Rpb24uXHJcbi8vIExldHMgdXMgbmFtZSB0aGF0IHJldHVybiB0eXBlIGZvciB1c2FnZSBpbiBvdGhlciBmdW5jdGlvbidzIHNpZ25hdHVyZXMuXHJcbi8vICAgICBjb25zdCBmb29SZXR1cm5UeXBlID0gcmV0dXJuVHlwZShGb28pO1xyXG4vLyAgICAgdHlwZSBGb28gPSB0eXBlb2YgZm9vUmV0dXJuVHlwZTtcclxuZXhwb3J0IGZ1bmN0aW9uIHJldHVyblR5cGU8VD4oZm4gOiAoLi4uYXJnczogYW55W10pID0+IFQpIDogVCB7IFxyXG4gICAgcmV0dXJuIG51bGwhIGFzIFQ7IFxyXG59XHJcblxyXG4vLyBNYWtlIGFueSBzaWduYWwganNvbmFibGUgYnkgYWRkaW5nIGEgdG9KU09OIG1ldGhvZCB0aGF0IGV4dHJhY3RzIGl0cyB2YWx1ZSBkdXJpbmcgSlNPTml6YXRpb25cclxuZnVuY3Rpb24ganNvbmFibGU8VCBleHRlbmRzICgpID0+IGFueT4ocyA6IFQpIDogVCAgeyBcclxuICAgIChzIGFzIGFueSkudG9KU09OID0gdG9KU09OO1xyXG4gICAgcmV0dXJuIHM7IFxyXG59XHJcblxyXG5mdW5jdGlvbiB0b0pTT04odGhpcyA6ICgpID0+IGFueSkge1xyXG4gICAgdmFyIGpzb24gPSB0aGlzKCk7XHJcbiAgICAvLyBpZiB0aGUgdmFsdWUgaGFzIGl0J3Mgb3duIHRvSlNPTiwgY2FsbCBpdCBub3dcclxuICAgIGlmIChqc29uICYmIGpzb24udG9KU09OKSBqc29uID0ganNvbi50b0pTT04oKTtcclxuICAgIHJldHVybiBqc29uO1xyXG59XHJcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9tb2RlbHMudHMiLCIvLyBzeW5jaHJvbm91cyBhcnJheSBzaWduYWxzIGZvciBTLmpzXHJcbmltcG9ydCBTIGZyb20gXCJzLWpzXCI7XHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIFNBcnJheSh2YWx1ZXMpIHtcclxuICAgIGlmICghQXJyYXkuaXNBcnJheSh2YWx1ZXMpKVxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNBcnJheSBtdXN0IGJlIGluaXRpYWxpemVkIHdpdGggYW4gYXJyYXlcIik7XHJcbiAgICB2YXIgZGlydHkgPSBTLmRhdGEoZmFsc2UpLCBtdXRhdGlvbnMgPSBbXSwgbXV0Y291bnQgPSAwLCBwb3BzID0gMCwgc2hpZnRzID0gMCwgZGF0YSA9IFMucm9vdChmdW5jdGlvbiAoKSB7IHJldHVybiBTLm9uKGRpcnR5LCB1cGRhdGUsIHZhbHVlcywgdHJ1ZSk7IH0pO1xyXG4gICAgLy8gYWRkIG11dGF0b3JzXHJcbiAgICB2YXIgYXJyYXkgPSBmdW5jdGlvbiBhcnJheShuZXd2YWx1ZXMpIHtcclxuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgbXV0YXRpb24oZnVuY3Rpb24gYXJyYXkoKSB7IHZhbHVlcyA9IG5ld3ZhbHVlczsgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiBuZXd2YWx1ZXM7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICByZXR1cm4gZGF0YSgpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbiAgICBhcnJheS5wdXNoID0gcHVzaDtcclxuICAgIGFycmF5LnBvcCA9IHBvcDtcclxuICAgIGFycmF5LnVuc2hpZnQgPSB1bnNoaWZ0O1xyXG4gICAgYXJyYXkuc2hpZnQgPSBzaGlmdDtcclxuICAgIGFycmF5LnNwbGljZSA9IHNwbGljZTtcclxuICAgIC8vIG5vdCBFUzVcclxuICAgIGFycmF5LnJlbW92ZSA9IHJlbW92ZTtcclxuICAgIGFycmF5LnJlbW92ZUFsbCA9IHJlbW92ZUFsbDtcclxuICAgIGxpZnQoYXJyYXkpO1xyXG4gICAgcmV0dXJuIGFycmF5O1xyXG4gICAgZnVuY3Rpb24gbXV0YXRpb24obSkge1xyXG4gICAgICAgIG11dGF0aW9uc1ttdXRjb3VudCsrXSA9IG07XHJcbiAgICAgICAgZGlydHkodHJ1ZSk7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiB1cGRhdGUoKSB7XHJcbiAgICAgICAgaWYgKHBvcHMpXHJcbiAgICAgICAgICAgIHZhbHVlcy5zcGxpY2UodmFsdWVzLmxlbmd0aCAtIHBvcHMsIHBvcHMpO1xyXG4gICAgICAgIGlmIChzaGlmdHMpXHJcbiAgICAgICAgICAgIHZhbHVlcy5zcGxpY2UoMCwgc2hpZnRzKTtcclxuICAgICAgICBwb3BzID0gMDtcclxuICAgICAgICBzaGlmdHMgPSAwO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbXV0Y291bnQ7IGkrKykge1xyXG4gICAgICAgICAgICBtdXRhdGlvbnNbaV0oKTtcclxuICAgICAgICAgICAgbXV0YXRpb25zW2ldID0gbnVsbDtcclxuICAgICAgICB9XHJcbiAgICAgICAgbXV0Y291bnQgPSAwO1xyXG4gICAgICAgIHJldHVybiB2YWx1ZXM7XHJcbiAgICB9XHJcbiAgICAvLyBtdXRhdG9yc1xyXG4gICAgZnVuY3Rpb24gcHVzaChpdGVtKSB7XHJcbiAgICAgICAgbXV0YXRpb24oZnVuY3Rpb24gcHVzaCgpIHsgdmFsdWVzLnB1c2goaXRlbSk7IH0pO1xyXG4gICAgICAgIHJldHVybiBhcnJheTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHBvcCgpIHtcclxuICAgICAgICBhcnJheSgpO1xyXG4gICAgICAgIGlmICgocG9wcyArIHNoaWZ0cykgPCB2YWx1ZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHZhbHVlc1t2YWx1ZXMubGVuZ3RoIC0gKytwb3BzXTtcclxuICAgICAgICAgICAgZGlydHkodHJ1ZSk7XHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiB1bnNoaWZ0KGl0ZW0pIHtcclxuICAgICAgICBtdXRhdGlvbihmdW5jdGlvbiB1bnNoaWZ0KCkgeyB2YWx1ZXMudW5zaGlmdChpdGVtKTsgfSk7XHJcbiAgICAgICAgcmV0dXJuIGFycmF5O1xyXG4gICAgfVxyXG4gICAgZnVuY3Rpb24gc2hpZnQoKSB7XHJcbiAgICAgICAgYXJyYXkoKTtcclxuICAgICAgICBpZiAoKHBvcHMgKyBzaGlmdHMpIDwgdmFsdWVzLmxlbmd0aCkge1xyXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSB2YWx1ZXNbc2hpZnRzKytdO1xyXG4gICAgICAgICAgICBkaXJ0eSh0cnVlKTtcclxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHNwbGljZSgpIHtcclxuICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XHJcbiAgICAgICAgbXV0YXRpb24oZnVuY3Rpb24gc3BsaWNlKCkgeyBBcnJheS5wcm90b3R5cGUuc3BsaWNlLmFwcGx5KHZhbHVlcywgYXJncyk7IH0pO1xyXG4gICAgICAgIHJldHVybiBhcnJheTtcclxuICAgIH1cclxuICAgIGZ1bmN0aW9uIHJlbW92ZShpdGVtKSB7XHJcbiAgICAgICAgbXV0YXRpb24oZnVuY3Rpb24gcmVtb3ZlKCkge1xyXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZhbHVlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlc1tpXSA9PT0gaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcy5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gYXJyYXk7XHJcbiAgICB9XHJcbiAgICBmdW5jdGlvbiByZW1vdmVBbGwoaXRlbSkge1xyXG4gICAgICAgIG11dGF0aW9uKGZ1bmN0aW9uIHJlbW92ZUFsbCgpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2YWx1ZXMubGVuZ3RoOykge1xyXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlc1tpXSA9PT0gaXRlbSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcy5zcGxpY2UoaSwgMSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBpKys7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICByZXR1cm4gYXJyYXk7XHJcbiAgICB9XHJcbn1cclxuLy8gdXRpbCB0byBhZGQgdHJhbnNmb3JtZXIgbWV0aG9kc1xyXG5leHBvcnQgZnVuY3Rpb24gbGlmdChzZXEpIHtcclxuICAgIHZhciBfc2VxID0gc2VxO1xyXG4gICAgX3NlcS5jb25jYXQgPSBjaGFpbkNvbmNhdDtcclxuICAgIF9zZXEuZXZlcnkgPSBjaGFpbkV2ZXJ5O1xyXG4gICAgX3NlcS5maWx0ZXIgPSBjaGFpbkZpbHRlcjtcclxuICAgIF9zZXEuZmluZCA9IGNoYWluRmluZDtcclxuICAgIC8vcy5maW5kSW5kZXggPSBmaW5kSW5kZXg7XHJcbiAgICBfc2VxLmZvckVhY2ggPSBjaGFpbkZvckVhY2g7XHJcbiAgICBfc2VxLmluY2x1ZGVzID0gY2hhaW5JbmNsdWRlcztcclxuICAgIC8vcy5pbmRleE9mICAgPSBpbmRleE9mO1xyXG4gICAgLy9zLmpvaW4gICAgICA9IGpvaW47XHJcbiAgICAvL3MubGFzdEluZGV4T2YgPSBsYXN0SW5kZXhPZjtcclxuICAgIF9zZXEubWFwID0gY2hhaW5NYXA7XHJcbiAgICBfc2VxLnNvcnQgPSBjaGFpblNvcnQ7XHJcbiAgICBfc2VxLnJlZHVjZSA9IGNoYWluUmVkdWNlO1xyXG4gICAgX3NlcS5yZWR1Y2VSaWdodCA9IGNoYWluUmVkdWNlUmlnaHQ7XHJcbiAgICBfc2VxLnJldmVyc2UgPSBjaGFpblJldmVyc2U7XHJcbiAgICBfc2VxLnNsaWNlID0gY2hhaW5TbGljZTtcclxuICAgIF9zZXEuc29tZSA9IGNoYWluU29tZTtcclxuICAgIC8vIG5vbi1FUzUgdHJhbnNmb3JtZXJzXHJcbiAgICBfc2VxLm1hcFMgPSBjaGFpbk1hcFM7XHJcbiAgICBfc2VxLm1hcFNhbXBsZSA9IGNoYWluTWFwU2FtcGxlO1xyXG4gICAgX3NlcS5vcmRlckJ5ID0gY2hhaW5PcmRlckJ5O1xyXG4gICAgcmV0dXJuIF9zZXE7XHJcbn1cclxuZXhwb3J0IGZ1bmN0aW9uIG1hcFMoc2VxLCBlbnRlciwgZXhpdCwgbW92ZSkge1xyXG4gICAgdmFyIGl0ZW1zID0gW10sIG1hcHBlZCA9IFtdLCBkaXNwb3NlcnMgPSBbXSwgbGVuID0gMDtcclxuICAgIFMoZnVuY3Rpb24gKCkgeyBTLmNsZWFudXAoZnVuY3Rpb24gKCkgeyBkaXNwb3NlcnMuZm9yRWFjaChmdW5jdGlvbiAoZCkgeyBkKCk7IH0pOyB9KTsgfSk7XHJcbiAgICByZXR1cm4gUy5vbihzZXEsIGZ1bmN0aW9uIG1hcFMoKSB7XHJcbiAgICAgICAgdmFyIG5ld19pdGVtcyA9IHNlcSgpLCBuZXdfbGVuID0gbmV3X2l0ZW1zLmxlbmd0aCwgdGVtcCA9IG5ldyBBcnJheShuZXdfbGVuKSwgdGVtcGRpc3Bvc2VycyA9IG5ldyBBcnJheShuZXdfbGVuKSwgZnJvbSA9IG51bGwsIHRvID0gbnVsbCwgaSwgaiwgaywgaXRlbTtcclxuICAgICAgICBpZiAobW92ZSlcclxuICAgICAgICAgICAgZnJvbSA9IFtdLCB0byA9IFtdO1xyXG4gICAgICAgIC8vIDEpIHN0ZXAgdGhyb3VnaCBhbGwgb2xkIGl0ZW1zIGFuZCBzZWUgaWYgdGhleSBjYW4gYmUgZm91bmQgaW4gdGhlIG5ldyBzZXQ7IGlmIHNvLCBzYXZlIHRoZW0gaW4gYSB0ZW1wIGFycmF5IGFuZCBtYXJrIHRoZW0gbW92ZWQ7IGlmIG5vdCwgZXhpdCB0aGVtXHJcbiAgICAgICAgTkVYVDogZm9yIChpID0gMCwgayA9IDA7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICAgICAgICBpdGVtID0gaXRlbXNbaV07XHJcbiAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBuZXdfbGVuOyBqKyssIGsgPSAoayArIDEpICUgbmV3X2xlbikge1xyXG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0gPT09IG5ld19pdGVtc1trXSAmJiAhdGVtcC5oYXNPd25Qcm9wZXJ0eShrLnRvU3RyaW5nKCkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGVtcFtrXSA9IG1hcHBlZFtpXTtcclxuICAgICAgICAgICAgICAgICAgICB0ZW1wZGlzcG9zZXJzW2tdID0gZGlzcG9zZXJzW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmIChtb3ZlICYmIGkgIT09IGspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnJvbS5wdXNoKGkpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0by5wdXNoKGspO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICBrID0gKGsgKyAxKSAlIG5ld19sZW47XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGludWUgTkVYVDtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBpZiAoZXhpdClcclxuICAgICAgICAgICAgICAgIGV4aXQoaXRlbSwgbWFwcGVkW2ldKCksIGkpO1xyXG4gICAgICAgICAgICBkaXNwb3NlcnNbaV0oKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG1vdmUgJiYgZnJvbS5sZW5ndGgpXHJcbiAgICAgICAgICAgIG1vdmUoaXRlbXMsIG1hcHBlZCwgZnJvbSwgdG8pO1xyXG4gICAgICAgIC8vIDIpIHNldCBhbGwgdGhlIG5ldyB2YWx1ZXMsIHB1bGxpbmcgZnJvbSB0aGUgdGVtcCBhcnJheSBpZiBjb3BpZWQsIG90aGVyd2lzZSBlbnRlcmluZyB0aGUgbmV3IHZhbHVlXHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG5ld19sZW47IGkrKykge1xyXG4gICAgICAgICAgICBpZiAodGVtcC5oYXNPd25Qcm9wZXJ0eShpLnRvU3RyaW5nKCkpKSB7XHJcbiAgICAgICAgICAgICAgICBtYXBwZWRbaV0gPSB0ZW1wW2ldO1xyXG4gICAgICAgICAgICAgICAgZGlzcG9zZXJzW2ldID0gdGVtcGRpc3Bvc2Vyc1tpXTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG1hcHBlZFtpXSA9IFMucm9vdChtYXBwZXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIDMpIGluIGNhc2UgdGhlIG5ldyBzZXQgaXMgc2hvcnRlciB0aGFuIHRoZSBvbGQsIHNldCB0aGUgbGVuZ3RoIG9mIHRoZSBtYXBwZWQgYXJyYXlcclxuICAgICAgICBsZW4gPSBtYXBwZWQubGVuZ3RoID0gbmV3X2xlbjtcclxuICAgICAgICAvLyA0KSBzYXZlIGEgY29weSBvZiB0aGUgbWFwcGVkIGl0ZW1zIGZvciB0aGUgbmV4dCB1cGRhdGVcclxuICAgICAgICBpdGVtcyA9IG5ld19pdGVtcy5zbGljZSgpO1xyXG4gICAgICAgIHJldHVybiBtYXBwZWQ7XHJcbiAgICAgICAgZnVuY3Rpb24gbWFwcGVyKGRpc3Bvc2VyKSB7XHJcbiAgICAgICAgICAgIGRpc3Bvc2Vyc1tpXSA9IGRpc3Bvc2VyO1xyXG4gICAgICAgICAgICB2YXIgX2l0ZW0gPSBuZXdfaXRlbXNbaV0sIF9pID0gaTtcclxuICAgICAgICAgICAgcmV0dXJuIFMoZnVuY3Rpb24gKHZhbHVlKSB7IHJldHVybiBlbnRlcihfaXRlbSwgdmFsdWUsIF9pKTsgfSwgdW5kZWZpbmVkKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxufVxyXG5mdW5jdGlvbiBjaGFpbk1hcFMoZW50ZXIsIGV4aXQsIG1vdmUpIHtcclxuICAgIHZhciByID0gbGlmdChtYXBTKHRoaXMsIGVudGVyLCBleGl0LCBtb3ZlKSk7XHJcbiAgICByLmNvbWJpbmUgPSBjaGFpbkNvbWJpbmU7XHJcbiAgICByZXR1cm4gcjtcclxufVxyXG5leHBvcnQgZnVuY3Rpb24gbWFwU2FtcGxlKHNlcSwgZW50ZXIsIGV4aXQsIG1vdmUpIHtcclxuICAgIHZhciBpdGVtcyA9IFtdLCBtYXBwZWQgPSBbXSwgZGlzcG9zZXJzID0gW10sIGxlbiA9IDA7XHJcbiAgICBTKGZ1bmN0aW9uICgpIHsgUy5jbGVhbnVwKGZ1bmN0aW9uICgpIHsgZGlzcG9zZXJzLmZvckVhY2goZnVuY3Rpb24gKGQpIHsgZCgpOyB9KTsgfSk7IH0pO1xyXG4gICAgcmV0dXJuIFMub24oc2VxLCBmdW5jdGlvbiBtYXBTYW1wbGUoKSB7XHJcbiAgICAgICAgdmFyIG5ld19pdGVtcyA9IHNlcSgpLCBuZXdfbGVuID0gbmV3X2l0ZW1zLmxlbmd0aCwgdGVtcCwgdGVtcGRpc3Bvc2VycywgZnJvbSA9IG51bGwsIHRvID0gbnVsbCwgaSwgaiwgaywgaXRlbTtcclxuICAgICAgICAvLyBmYXN0IHBhdGggZm9yIGVtcHR5IGFycmF5c1xyXG4gICAgICAgIGlmIChuZXdfbGVuID09PSAwKSB7XHJcbiAgICAgICAgICAgIGlmIChsZW4gIT09IDApIHtcclxuICAgICAgICAgICAgICAgIGlmIChleGl0ICE9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgaXRlbSA9IGl0ZW1zW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBleGl0KGl0ZW0sIG1hcHBlZFtpXSwgaSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3Bvc2Vyc1tpXSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwb3NlcnNbaV0oKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpdGVtcyA9IFtdO1xyXG4gICAgICAgICAgICAgICAgbWFwcGVkID0gW107XHJcbiAgICAgICAgICAgICAgICBkaXNwb3NlcnMgPSBbXTtcclxuICAgICAgICAgICAgICAgIGxlbiA9IDA7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAobGVuID09PSAwKSB7XHJcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBuZXdfbGVuOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGl0ZW0gPSBpdGVtc1tpXSA9IG5ld19pdGVtc1tpXTtcclxuICAgICAgICAgICAgICAgIG1hcHBlZFtpXSA9IFMucm9vdChtYXBwZXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGxlbiA9IG5ld19sZW47XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB0ZW1wID0gbmV3IEFycmF5KG5ld19sZW4pO1xyXG4gICAgICAgICAgICB0ZW1wZGlzcG9zZXJzID0gbmV3IEFycmF5KG5ld19sZW4pO1xyXG4gICAgICAgICAgICBpZiAobW92ZSlcclxuICAgICAgICAgICAgICAgIGZyb20gPSBbXSwgdG8gPSBbXTtcclxuICAgICAgICAgICAgLy8gMSkgc3RlcCB0aHJvdWdoIGFsbCBvbGQgaXRlbXMgYW5kIHNlZSBpZiB0aGV5IGNhbiBiZSBmb3VuZCBpbiB0aGUgbmV3IHNldDsgaWYgc28sIHNhdmUgdGhlbSBpbiBhIHRlbXAgYXJyYXkgYW5kIG1hcmsgdGhlbSBtb3ZlZDsgaWYgbm90LCBleGl0IHRoZW1cclxuICAgICAgICAgICAgTkVYVDogZm9yIChpID0gMCwgayA9IDA7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICAgICAgICAgICAgaXRlbSA9IGl0ZW1zW2ldO1xyXG4gICAgICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IG5ld19sZW47IGorKywgayA9IChrICsgMSkgJSBuZXdfbGVuKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGl0ZW0gPT09IG5ld19pdGVtc1trXSAmJiAhdGVtcC5oYXNPd25Qcm9wZXJ0eShrLnRvU3RyaW5nKCkpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBba10gPSBtYXBwZWRbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBkaXNwb3NlcnNba10gPSBkaXNwb3NlcnNbaV07XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtb3ZlICYmIGkgIT09IGspIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyb20ucHVzaChpKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRvLnB1c2goayk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgayA9IChrICsgMSkgJSBuZXdfbGVuO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZSBORVhUO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChleGl0KVxyXG4gICAgICAgICAgICAgICAgICAgIGV4aXQoaXRlbSwgbWFwcGVkW2ldLCBpKTtcclxuICAgICAgICAgICAgICAgIGRpc3Bvc2Vyc1tpXSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChtb3ZlICYmIGZyb20ubGVuZ3RoKVxyXG4gICAgICAgICAgICAgICAgbW92ZShpdGVtcywgbWFwcGVkLCBmcm9tLCB0byk7XHJcbiAgICAgICAgICAgIC8vIDIpIHNldCBhbGwgdGhlIG5ldyB2YWx1ZXMsIHB1bGxpbmcgZnJvbSB0aGUgdGVtcCBhcnJheSBpZiBjb3BpZWQsIG90aGVyd2lzZSBlbnRlcmluZyB0aGUgbmV3IHZhbHVlXHJcbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBuZXdfbGVuOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmICh0ZW1wLmhhc093blByb3BlcnR5KGkudG9TdHJpbmcoKSkpIHtcclxuICAgICAgICAgICAgICAgICAgICBtYXBwZWRbaV0gPSB0ZW1wW2ldO1xyXG4gICAgICAgICAgICAgICAgICAgIGRpc3Bvc2Vyc1tpXSA9IHRlbXBkaXNwb3NlcnNbaV07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBtYXBwZWRbaV0gPSBTLnJvb3QobWFwcGVyKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyAzKSBpbiBjYXNlIHRoZSBuZXcgc2V0IGlzIHNob3J0ZXIgdGhhbiB0aGUgb2xkLCBzZXQgdGhlIGxlbmd0aCBvZiB0aGUgbWFwcGVkIGFycmF5XHJcbiAgICAgICAgICAgIGxlbiA9IG1hcHBlZC5sZW5ndGggPSBuZXdfbGVuO1xyXG4gICAgICAgICAgICAvLyA0KSBzYXZlIGEgY29weSBvZiB0aGUgbWFwcGVkIGl0ZW1zIGZvciB0aGUgbmV4dCB1cGRhdGVcclxuICAgICAgICAgICAgaXRlbXMgPSBuZXdfaXRlbXMuc2xpY2UoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG1hcHBlZDtcclxuICAgICAgICBmdW5jdGlvbiBtYXBwZXIoZGlzcG9zZXIpIHtcclxuICAgICAgICAgICAgZGlzcG9zZXJzW2ldID0gZGlzcG9zZXI7XHJcbiAgICAgICAgICAgIHJldHVybiBlbnRlcihuZXdfaXRlbXNbaV0sIG1hcHBlZFtpXSwgaSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbn1cclxuZnVuY3Rpb24gY2hhaW5NYXBTYW1wbGUoZW50ZXIsIGV4aXQsIG1vdmUpIHtcclxuICAgIHJldHVybiBsaWZ0KG1hcFNhbXBsZSh0aGlzLCBlbnRlciwgZXhpdCwgbW92ZSkpO1xyXG59XHJcbmV4cG9ydCBmdW5jdGlvbiBmb3JFYWNoKHNlcSwgZW50ZXIsIGV4aXQsIG1vdmUpIHtcclxuICAgIHZhciBpdGVtcyA9IFtdLCBsZW4gPSAwO1xyXG4gICAgcmV0dXJuIFMub24oc2VxLCBmdW5jdGlvbiBmb3JFYWNoKCkge1xyXG4gICAgICAgIHZhciBuZXdfaXRlbXMgPSBzZXEoKSwgbmV3X2xlbiA9IG5ld19pdGVtcy5sZW5ndGgsIGZvdW5kID0gbmV3IEFycmF5KG5ld19sZW4pLCBmcm9tID0gW10sIHRvID0gW10sIGksIGosIGssIGl0ZW07XHJcbiAgICAgICAgLy8gMSkgc3RlcCB0aHJvdWdoIGFsbCBvbGQgaXRlbXMgYW5kIHNlZSBpZiB0aGV5IGNhbiBiZSBmb3VuZCBpbiB0aGUgbmV3IHNldDsgaWYgc28sIHNhdmUgdGhlbSBpbiBhIHRlbXAgYXJyYXkgYW5kIG1hcmsgdGhlbSBtb3ZlZDsgaWYgbm90LCBleGl0IHRoZW1cclxuICAgICAgICBORVhUOiBmb3IgKGkgPSAwLCBrID0gMDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICAgICAgICAgIGl0ZW0gPSBpdGVtc1tpXTtcclxuICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IG5ld19sZW47IGorKywgayA9IChrICsgMSkgJSBuZXdfbGVuKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoaXRlbSA9PT0gbmV3X2l0ZW1zW2tdICYmICFmb3VuZFtrXSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvdW5kW2tdID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAoaSAhPT0gaykge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBmcm9tLnB1c2goaSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvLnB1c2goayk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIGsgPSAoayArIDEpICUgbmV3X2xlbjtcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZSBORVhUO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmIChleGl0KVxyXG4gICAgICAgICAgICAgICAgZXhpdChpdGVtLCBpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKG1vdmUgJiYgZnJvbS5sZW5ndGgpXHJcbiAgICAgICAgICAgIG1vdmUoZnJvbSwgdG8pO1xyXG4gICAgICAgIC8vIDIpIHNldCBhbGwgdGhlIG5ldyB2YWx1ZXMsIHB1bGxpbmcgZnJvbSB0aGUgdGVtcCBhcnJheSBpZiBjb3BpZWQsIG90aGVyd2lzZSBlbnRlcmluZyB0aGUgbmV3IHZhbHVlXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBuZXdfbGVuOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKCFmb3VuZFtpXSlcclxuICAgICAgICAgICAgICAgIGVudGVyKG5ld19pdGVtc1tpXSwgaSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIDMpIGluIGNhc2UgdGhlIG5ldyBzZXQgaXMgc2hvcnRlciB0aGFuIHRoZSBvbGQsIHNldCB0aGUgbGVuZ3RoIG9mIHRoZSBtYXBwZWQgYXJyYXlcclxuICAgICAgICBsZW4gPSBuZXdfbGVuO1xyXG4gICAgICAgIC8vIDQpIHNhdmUgYSBjb3B5IG9mIHRoZSBtYXBwZWQgaXRlbXMgZm9yIHRoZSBuZXh0IHVwZGF0ZVxyXG4gICAgICAgIGl0ZW1zID0gbmV3X2l0ZW1zLnNsaWNlKCk7XHJcbiAgICAgICAgcmV0dXJuIGl0ZW1zO1xyXG4gICAgfSk7XHJcbn1cclxuZnVuY3Rpb24gY2hhaW5Gb3JFYWNoKGVudGVyLCBleGl0LCBtb3ZlKSB7XHJcbiAgICByZXR1cm4gbGlmdChmb3JFYWNoKHRoaXMsIGVudGVyLCBleGl0LCBtb3ZlKSk7XHJcbn1cclxuZXhwb3J0IGZ1bmN0aW9uIGNvbWJpbmUoc2VxKSB7XHJcbiAgICByZXR1cm4gUyhmdW5jdGlvbiBjb21iaW5lKCkge1xyXG4gICAgICAgIHZhciBzID0gc2VxKCksIHJlc3VsdCA9IG5ldyBBcnJheShzLmxlbmd0aCk7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHJlc3VsdFtpXSA9IHNbaV0oKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0pO1xyXG59XHJcbmZ1bmN0aW9uIGNoYWluQ29tYmluZSgpIHtcclxuICAgIHJldHVybiBsaWZ0KGNvbWJpbmUodGhpcykpO1xyXG59XHJcbmV4cG9ydCBmdW5jdGlvbiBtYXAoc2VxLCBlbnRlciwgZXhpdCwgbW92ZSkge1xyXG4gICAgcmV0dXJuIGNvbWJpbmUobWFwUyhzZXEsIGVudGVyLCBleGl0LCBtb3ZlID09IHVuZGVmaW5lZCA/IHVuZGVmaW5lZCA6XHJcbiAgICAgICAgZnVuY3Rpb24gKGl0ZW1zLCBtYXBwZWQsIGZyb20sIHRvKSB7IG1vdmUoaXRlbXMsIG1hcHBlZC5tYXAoZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHMoKTsgfSksIGZyb20sIHRvKTsgfSkpO1xyXG59XHJcbmZ1bmN0aW9uIGNoYWluTWFwKGVudGVyLCBleGl0LCBtb3ZlKSB7XHJcbiAgICByZXR1cm4gbGlmdChtYXAodGhpcywgZW50ZXIsIGV4aXQsIG1vdmUpKTtcclxufVxyXG5leHBvcnQgZnVuY3Rpb24gZmluZChzZXEsIHByZWQpIHtcclxuICAgIHJldHVybiBTKGZ1bmN0aW9uIGZpbmQoKSB7XHJcbiAgICAgICAgdmFyIHMgPSBzZXEoKSwgaSwgaXRlbTtcclxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpdGVtID0gc1tpXTtcclxuICAgICAgICAgICAgaWYgKHByZWQoaXRlbSkpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gaXRlbTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcclxuICAgIH0pO1xyXG59XHJcbmZ1bmN0aW9uIGNoYWluRmluZChwcmVkKSB7XHJcbiAgICByZXR1cm4gZmluZCh0aGlzLCBwcmVkKTtcclxufVxyXG5leHBvcnQgZnVuY3Rpb24gaW5jbHVkZXMoc2VxLCBvKSB7XHJcbiAgICByZXR1cm4gUyhmdW5jdGlvbiBmaW5kKCkge1xyXG4gICAgICAgIHZhciBzID0gc2VxKCk7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGlmIChzW2ldID09PSBvKVxyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0pO1xyXG59XHJcbmZ1bmN0aW9uIGNoYWluSW5jbHVkZXMobykge1xyXG4gICAgcmV0dXJuIGluY2x1ZGVzKHRoaXMsIG8pO1xyXG59XHJcbmV4cG9ydCBmdW5jdGlvbiBzb3J0KHNlcSwgZm4pIHtcclxuICAgIHJldHVybiBTKGZ1bmN0aW9uIHNvcnQoKSB7XHJcbiAgICAgICAgdmFyIGNvcHkgPSBzZXEoKS5zbGljZSgwKTtcclxuICAgICAgICBpZiAoZm4pXHJcbiAgICAgICAgICAgIGNvcHkuc29ydChmbik7XHJcbiAgICAgICAgZWxzZVxyXG4gICAgICAgICAgICBjb3B5LnNvcnQoKTtcclxuICAgICAgICByZXR1cm4gY29weTtcclxuICAgIH0pO1xyXG59XHJcbmZ1bmN0aW9uIGNoYWluU29ydChmbikge1xyXG4gICAgcmV0dXJuIGxpZnQoc29ydCh0aGlzLCBmbikpO1xyXG59XHJcbmV4cG9ydCBmdW5jdGlvbiBvcmRlckJ5KHNlcSwgYnkpIHtcclxuICAgIHZhciBrZXksIGZuO1xyXG4gICAgaWYgKHR5cGVvZiBieSAhPT0gJ2Z1bmN0aW9uJykge1xyXG4gICAgICAgIGtleSA9IGJ5O1xyXG4gICAgICAgIGZuID0gZnVuY3Rpb24gKG8pIHsgcmV0dXJuIG9ba2V5XTsgfTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIGZuID0gYnk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gUyhmdW5jdGlvbiBvcmRlckJ5KCkge1xyXG4gICAgICAgIHZhciBjb3B5ID0gc2VxKCkuc2xpY2UoMCk7XHJcbiAgICAgICAgY29weS5zb3J0KGZ1bmN0aW9uIChhLCBiKSB7XHJcbiAgICAgICAgICAgIGEgPSBmbihhKTtcclxuICAgICAgICAgICAgYiA9IGZuKGIpO1xyXG4gICAgICAgICAgICByZXR1cm4gYSA8IGIgPyAtMSA6IGEgPiBiID8gMSA6IDA7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcmV0dXJuIGNvcHk7XHJcbiAgICB9KTtcclxufVxyXG5mdW5jdGlvbiBjaGFpbk9yZGVyQnkoYnkpIHtcclxuICAgIHJldHVybiBsaWZ0KG9yZGVyQnkodGhpcywgYnkpKTtcclxufVxyXG5leHBvcnQgZnVuY3Rpb24gZmlsdGVyKHNlcSwgcHJlZGljYXRlKSB7XHJcbiAgICByZXR1cm4gUyhmdW5jdGlvbiBmaWx0ZXIoKSB7XHJcbiAgICAgICAgdmFyIHMgPSBzZXEoKSwgcmVzdWx0ID0gW10sIGksIHY7XHJcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgdiA9IHNbaV07XHJcbiAgICAgICAgICAgIGlmIChwcmVkaWNhdGUodikpXHJcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCh2KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0pO1xyXG59XHJcbmZ1bmN0aW9uIGNoYWluRmlsdGVyKHByZWRpY2F0ZSkge1xyXG4gICAgcmV0dXJuIGxpZnQoZmlsdGVyKHRoaXMsIHByZWRpY2F0ZSkpO1xyXG59XHJcbmV4cG9ydCBmdW5jdGlvbiBjb25jYXQoc2VxKSB7XHJcbiAgICB2YXIgb3RoZXJzID0gW107XHJcbiAgICBmb3IgKHZhciBfYSA9IDE7IF9hIDwgYXJndW1lbnRzLmxlbmd0aDsgX2ErKykge1xyXG4gICAgICAgIG90aGVyc1tfYSAtIDFdID0gYXJndW1lbnRzW19hXTtcclxuICAgIH1cclxuICAgIHJldHVybiBTKGZ1bmN0aW9uIGNvbmNhdCgpIHtcclxuICAgICAgICB2YXIgcyA9IHNlcSgpO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3RoZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHMgPSBzLmNvbmNhdChvdGhlcnNbaV0oKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBzO1xyXG4gICAgfSk7XHJcbn1cclxuZnVuY3Rpb24gY2hhaW5Db25jYXQoKSB7XHJcbiAgICB2YXIgb3RoZXJzID0gW107XHJcbiAgICBmb3IgKHZhciBfYSA9IDA7IF9hIDwgYXJndW1lbnRzLmxlbmd0aDsgX2ErKykge1xyXG4gICAgICAgIG90aGVyc1tfYV0gPSBhcmd1bWVudHNbX2FdO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIGxpZnQoY29uY2F0LmFwcGx5KHZvaWQgMCwgW3RoaXNdLmNvbmNhdChvdGhlcnMpKSk7XHJcbn1cclxuZXhwb3J0IGZ1bmN0aW9uIHJlZHVjZShzZXEsIGZuLCBzZWVkKSB7XHJcbiAgICByZXR1cm4gUyhmdW5jdGlvbiByZWR1Y2UoKSB7XHJcbiAgICAgICAgdmFyIHMgPSBzZXEoKSwgcmVzdWx0ID0gc2VlZCBpbnN0YW5jZW9mIEZ1bmN0aW9uID8gc2VlZCgpIDogc2VlZDtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgcmVzdWx0ID0gZm4ocmVzdWx0LCBzW2ldLCBpLCBzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH0pO1xyXG59XHJcbmZ1bmN0aW9uIGNoYWluUmVkdWNlKGZuLCBzZWVkKSB7XHJcbiAgICByZXR1cm4gcmVkdWNlKHRoaXMsIGZuLCBzZWVkKTtcclxufVxyXG5leHBvcnQgZnVuY3Rpb24gcmVkdWNlUmlnaHQoc2VxLCBmbiwgc2VlZCkge1xyXG4gICAgcmV0dXJuIFMoZnVuY3Rpb24gcmVkdWNlUmlnaHQoKSB7XHJcbiAgICAgICAgdmFyIHMgPSBzZXEoKSwgcmVzdWx0ID0gc2VlZCBpbnN0YW5jZW9mIEZ1bmN0aW9uID8gc2VlZCgpIDogc2VlZDtcclxuICAgICAgICBmb3IgKHZhciBpID0gcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICByZXN1bHQgPSBmbihyZXN1bHQsIHNbaV0sIGksIHMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgfSk7XHJcbn1cclxuZnVuY3Rpb24gY2hhaW5SZWR1Y2VSaWdodChmbiwgc2VlZCkge1xyXG4gICAgcmV0dXJuIHJlZHVjZVJpZ2h0KHRoaXMsIGZuLCBzZWVkKTtcclxufVxyXG5leHBvcnQgZnVuY3Rpb24gZXZlcnkoc2VxLCBmbikge1xyXG4gICAgcmV0dXJuIFMoZnVuY3Rpb24gZXZlcnkoKSB7XHJcbiAgICAgICAgdmFyIHMgPSBzZXEoKTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgaWYgKCFmbihzW2ldKSlcclxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9KTtcclxufVxyXG5mdW5jdGlvbiBjaGFpbkV2ZXJ5KGZuKSB7XHJcbiAgICByZXR1cm4gZXZlcnkodGhpcywgZm4pO1xyXG59XHJcbmV4cG9ydCBmdW5jdGlvbiBzb21lKHNlcSwgZm4pIHtcclxuICAgIHJldHVybiBTKGZ1bmN0aW9uIHNvbWUoKSB7XHJcbiAgICAgICAgdmFyIHMgPSBzZXEoKTtcclxuICAgICAgICBpZiAoZm4gPT09IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgcmV0dXJuIHMubGVuZ3RoICE9PSAwO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICBpZiAoZm4oc1tpXSkpXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfSk7XHJcbn1cclxuZnVuY3Rpb24gY2hhaW5Tb21lKGZuKSB7XHJcbiAgICByZXR1cm4gc29tZSh0aGlzLCBmbik7XHJcbn1cclxuZXhwb3J0IGZ1bmN0aW9uIHJldmVyc2Uoc2VxKSB7XHJcbiAgICByZXR1cm4gUyhmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIGNvcHkgPSBzZXEoKS5zbGljZSgwKTtcclxuICAgICAgICBjb3B5LnJldmVyc2UoKTtcclxuICAgICAgICByZXR1cm4gY29weTtcclxuICAgIH0pO1xyXG59XHJcbmZ1bmN0aW9uIGNoYWluUmV2ZXJzZSgpIHtcclxuICAgIHJldHVybiBsaWZ0KHJldmVyc2UodGhpcykpO1xyXG59XHJcbmV4cG9ydCBmdW5jdGlvbiBzbGljZShzZXEsIHMsIGUpIHtcclxuICAgIHJldHVybiBTKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICByZXR1cm4gc2VxKCkuc2xpY2UocywgZSk7XHJcbiAgICB9KTtcclxufVxyXG5mdW5jdGlvbiBjaGFpblNsaWNlKHMsIGUpIHtcclxuICAgIHJldHVybiBsaWZ0KHNsaWNlKHRoaXMsIHMsIGUpKTtcclxufVxyXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL34vcy1hcnJheS9lcy9pbmRleC5qc1xuLy8gbW9kdWxlIGlkID0gM1xuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCJpbXBvcnQgUyBmcm9tICdzLWpzJztcclxuaW1wb3J0IHsgVG9EbywgVG9Eb3NNb2RlbCwgcmV0dXJuVHlwZSB9IGZyb20gJy4vbW9kZWxzJztcclxuXHJcbmV4cG9ydCB0eXBlIFRvRG9zQ3RybCA9IHR5cGVvZiB0b0Rvc0N0cmxUeXBlOyBjb25zdCB0b0Rvc0N0cmxUeXBlID0gcmV0dXJuVHlwZShUb0Rvc0N0cmwpO1xyXG5leHBvcnQgZnVuY3Rpb24gVG9Eb3NDdHJsKHsgdG9kb3MgfSA6IFRvRG9zTW9kZWwpIHtcclxuICAgIGNvbnN0IGVkaXRpbmcgPSBTLmRhdGEobnVsbCBhcyBudWxsIHwgVG9EbyksIC8vIHRoZSB0b2RvIHNlbGVjdGVkIGZvciBlZGl0aW5nLCBvciBudWxsIGlmIG5vbmUgc2VsZWN0ZWRcclxuICAgICAgICBmaWx0ZXIgICAgPSBTLmRhdGEobnVsbCBhcyBudWxsIHwgYm9vbGVhbiksIC8vIG51bGwgPSBubyBmaWx0ZXJpbmcsIHRydWUgPSBvbmx5IGNvbXBsZXRlZCwgZmFsc2UgPSBvbmx5IGluY29tcGxldGVcclxuICAgICAgICBuZXdUaXRsZSAgPSBTLmRhdGEoJycpLFxyXG4gICAgICAgIGFsbCAgICAgICA9IHRvZG9zLm1hcChUb0RvQ3RybCksXHJcbiAgICAgICAgY29tcGxldGVkID0gYWxsLmZpbHRlcih0ID0+IHQuY29tcGxldGVkKCkpLFxyXG4gICAgICAgIHJlbWFpbmluZyA9IGFsbC5maWx0ZXIodCA9PiAhdC5jb21wbGV0ZWQoKSksXHJcbiAgICAgICAgZGlzcGxheWVkID0gKCkgPT4gZmlsdGVyKCkgPT09IG51bGwgPyBhbGwoKSA6IGZpbHRlcigpID8gY29tcGxldGVkKCkgOiByZW1haW5pbmcoKTtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIGZpbHRlcixcclxuICAgICAgICBuZXdUaXRsZSxcclxuICAgICAgICBhbGwsXHJcbiAgICAgICAgY29tcGxldGVkLFxyXG4gICAgICAgIHJlbWFpbmluZyxcclxuICAgICAgICBkaXNwbGF5ZWQsXHJcbiAgICAgICAgYWxsQ29tcGxldGVkICA6ICgpID0+IGFsbCgpLmxlbmd0aCA+IDAgJiYgcmVtYWluaW5nKCkubGVuZ3RoID09PSAwLFxyXG4gICAgICAgIHNldEFsbCAgICAgICAgOiAoYyA6IGJvb2xlYW4pID0+IFMuZnJlZXplKCgpID0+IHRvZG9zKCkuZm9yRWFjaCh0ID0+IHQuY29tcGxldGVkKGMpKSksXHJcbiAgICAgICAgY2xlYXJDb21wbGV0ZWQ6ICgpID0+IHRvZG9zKHRvZG9zKCkuZmlsdGVyKHQgPT4gIXQuY29tcGxldGVkKCkpKSxcclxuICAgICAgICBjcmVhdGUgICAgICAgIDogKCkgPT4ge1xyXG4gICAgICAgICAgICB2YXIgdGl0bGUgPSBuZXdUaXRsZSgpLnRyaW0oKTtcclxuICAgICAgICAgICAgaWYgKHRpdGxlKSB7XHJcbiAgICAgICAgICAgICAgICBuZXdUaXRsZShcIlwiKTtcclxuICAgICAgICAgICAgICAgIHRvZG9zLnVuc2hpZnQoVG9Ebyh0aXRsZSwgZmFsc2UpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgZnVuY3Rpb24gVG9Eb0N0cmwodG9kbyA6IFRvRG8pIHtcclxuICAgICAgICBjb25zdCB0aXRsZSA9IFMuZGF0YShTLnNhbXBsZSh0b2RvLnRpdGxlKSk7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgdGl0bGUsXHJcbiAgICAgICAgICAgIGNvbXBsZXRlZCAgIDogdG9kby5jb21wbGV0ZWQsXHJcbiAgICAgICAgICAgIHJlbW92ZSAgICAgIDogKCkgPT4gdG9kb3MucmVtb3ZlKHRvZG8pLFxyXG4gICAgICAgICAgICBzdGFydEVkaXRpbmc6ICgpID0+IGVkaXRpbmcodG9kbyksXHJcbiAgICAgICAgICAgIGVkaXRpbmcgICAgIDogKCkgPT4gZWRpdGluZygpID09PSB0b2RvLFxyXG4gICAgICAgICAgICBlbmRFZGl0aW5nICA6IChjb21taXQgOiBib29sZWFuKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoY29tbWl0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRyaW1tZWQgPSB0aXRsZSgpLnRyaW0oKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodHJpbW1lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0b2RvLnRpdGxlKHRpdGxlKHRyaW1tZWQpKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0b2Rvcy5yZW1vdmUodG9kbyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZSh0b2RvLnRpdGxlKCkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWRpdGluZyhudWxsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbn1cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvY29udHJvbGxlcnMudHMiLCJpbXBvcnQgUyBmcm9tICdzLWpzJztcclxuaW1wb3J0IHsgVG9EbywgVG9Eb3NNb2RlbCB9IGZyb20gJy4vbW9kZWxzJztcclxuXHJcbmNvbnN0IExPQ0FMX1NUT1JBR0VfS0VZID0gJ3RvZG9zLXN1cnBsdXMnO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIExvY2FsU3RvcmFnZVBlcnNpc3RlbmNlKG1vZGVsIDogVG9Eb3NNb2RlbCkge1xyXG4gICAgLy8gbG9hZCBzdG9yZWQgdG9kb3Mgb24gaW5pdFxyXG4gICAgY29uc3Qgc3RvcmVkID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oTE9DQUxfU1RPUkFHRV9LRVkpO1xyXG4gICAgaWYgKHN0b3JlZCkgbW9kZWwudG9kb3MoSlNPTi5wYXJzZShzdG9yZWQpLnRvZG9zLm1hcCgodCA6IGFueSkgPT4gVG9Ebyh0LnRpdGxlLCB0LmNvbXBsZXRlZCkpKTtcclxuXHJcbiAgICAvLyBzdG9yZSBKU09OaXplZCB0b2RvcyB3aGVuZXZlciB0aGV5IGNoYW5nZVxyXG4gICAgUygoKSA9PiB7XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oTE9DQUxfU1RPUkFHRV9LRVksIEpTT04uc3RyaW5naWZ5KG1vZGVsKSk7XHJcbiAgICB9KTtcclxufVxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9wZXJzaXN0ZW5jZS50cyIsImltcG9ydCBTIGZyb20gJ3MtanMnO1xyXG5pbXBvcnQgeyBUb0Rvc0N0cmwgfSBmcm9tICcuL2NvbnRyb2xsZXJzJztcclxuXHJcbi8vIHdpdGggc3VjaCBhIHNpbXBsZSByb3V0ZXIgc2NlbmFyaW8sIG5vIG5lZWQgZm9yIGEgbGliLCBqdXN0IGhhbmQtd3JpdGUgaXRcclxuZXhwb3J0IGZ1bmN0aW9uIFRvRG9zUm91dGVyKGN0cmwgOiBUb0Rvc0N0cmwpIHtcclxuICAgIC8vIGZpbHRlcigpIC0+IGJyb3dzZXIgaGFzaFxyXG4gICAgUygoKSA9PiB7XHJcbiAgICAgICAgdmFyIGZpbHRlciA9IGN0cmwuZmlsdGVyKCksXHJcbiAgICAgICAgICAgIGhhc2ggICA9IGZpbHRlciA9PT0gdHJ1ZSAgPyBcIi9jb21wbGV0ZWRcIiA6XHJcbiAgICAgICAgICAgICAgICAgICAgIGZpbHRlciA9PT0gZmFsc2UgPyBcIi9hY3RpdmVcIiAgICA6XHJcbiAgICAgICAgICAgICAgICAgICAgIFwiL1wiO1xyXG5cclxuICAgICAgICBpZiAod2luZG93LmxvY2F0aW9uLmhhc2ggIT09IGhhc2gpIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gaGFzaDtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIGJyb3dzZXIgaGFzaCAtPiBmaWx0ZXIoKVxyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2hhc2hjaGFuZ2UnLCBzZXRTdGF0ZUZyb21IYXNoLCBmYWxzZSk7XHJcbiAgICBTLmNsZWFudXAoZnVuY3Rpb24gKCkgeyB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignaGFzaGNoYW5nZScsIHNldFN0YXRlRnJvbUhhc2gpOyB9KTtcclxuICAgIGZ1bmN0aW9uIHNldFN0YXRlRnJvbUhhc2goKSB7XHJcbiAgICAgICAgdmFyIGhhc2ggICA9IHdpbmRvdy5sb2NhdGlvbi5oYXNoLFxyXG4gICAgICAgICAgICBmaWx0ZXIgPSBoYXNoID09PSBcIiMvY29tcGxldGVkXCIgPyB0cnVlICA6XHJcbiAgICAgICAgICAgICAgICAgICAgIGhhc2ggPT09IFwiIy9hY3RpdmVcIiAgICA/IGZhbHNlIDpcclxuICAgICAgICAgICAgICAgICAgICAgbnVsbDtcclxuXHJcbiAgICAgICAgaWYgKGN0cmwuZmlsdGVyKCkgIT09IGZpbHRlcikgY3RybC5maWx0ZXIoZmlsdGVyKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBpbml0IGZyb20gYnJvd3NlciBoYXNoXHJcbiAgICBTLnNhbXBsZShzZXRTdGF0ZUZyb21IYXNoKTtcclxufVxyXG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvcm91dGVyLnRzIiwiaW1wb3J0ICogYXMgU3VycGx1cyBmcm9tICdzdXJwbHVzJzsgU3VycGx1cztcclxuaW1wb3J0IHsgbWFwU2FtcGxlIH0gZnJvbSAncy1hcnJheSc7XHJcbmltcG9ydCAqIGFzIGN4IGZyb20gJ2NsYXNzbmFtZXMnO1xyXG5pbXBvcnQgZGF0YSBmcm9tICdzdXJwbHVzLW1peGluLWRhdGEnO1xyXG5pbXBvcnQgb25rZXkgZnJvbSAnc3VycGx1cy1taXhpbi1vbmtleSc7XHJcbmltcG9ydCBmb2N1cyBmcm9tICdzdXJwbHVzLW1peGluLWZvY3VzJztcclxuXHJcbmltcG9ydCB7IFRvRG9zQ3RybCB9IGZyb20gJy4vY29udHJvbGxlcnMnO1xyXG5cclxuZXhwb3J0IGNvbnN0IEFwcFZpZXcgPSAoY3RybCA6IFRvRG9zQ3RybCkgPT5cclxuICAgIDxzZWN0aW9uPlxyXG4gICAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cInRvZG9hcHBcIj5cclxuICAgICAgICAgICAgPGhlYWRlciBjbGFzc05hbWU9XCJoZWFkZXJcIj5cclxuICAgICAgICAgICAgICAgIDxoMT50b2RvczwvaDE+XHJcbiAgICAgICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPVwibmV3LXRvZG9cIiBwbGFjZWhvbGRlcj1cIldoYXQgbmVlZHMgdG8gYmUgZG9uZT9cIiBhdXRvRm9jdXM9e3RydWV9IFxyXG4gICAgICAgICAgICAgICAgICAgIGZuMT17ZGF0YShjdHJsLm5ld1RpdGxlLCAna2V5ZG93bicpfSBcclxuICAgICAgICAgICAgICAgICAgICBmbjI9e29ua2V5KCdlbnRlcicsIGN0cmwuY3JlYXRlKX1cclxuXHRcdFx0XHRcdGZuMz17b25rZXkoJ2VzYycsICgpID0+IGN0cmwubmV3VGl0bGUoJycpKX0gLz5cclxuICAgICAgICAgICAgPC9oZWFkZXI+XHJcbiAgICAgICAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cIm1haW5cIiBoaWRkZW49e2N0cmwuYWxsKCkubGVuZ3RoID09PSAwfT5cclxuICAgICAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9XCJ0b2dnbGUtYWxsXCIgdHlwZT1cImNoZWNrYm94XCIgXHJcbiAgICAgICAgICAgICAgICAgICAgY2hlY2tlZD17Y3RybC5hbGxDb21wbGV0ZWQoKX0gLz5cclxuICAgICAgICAgICAgICAgIDxsYWJlbCBodG1sRm9yPVwidG9nZ2xlLWFsbFwiIG9uQ2xpY2s9eygpID0+IGN0cmwuc2V0QWxsKCFjdHJsLmFsbENvbXBsZXRlZCgpKX0+TWFyayBhbGwgYXMgY29tcGxldGU8L2xhYmVsPlxyXG4gICAgICAgICAgICAgICAgPHVsIGNsYXNzTmFtZT1cInRvZG8tbGlzdFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIHttYXBTYW1wbGUoY3RybC5kaXNwbGF5ZWQsIHRvZG8gPT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGxpIGNsYXNzTmFtZT17Y3goeyBjb21wbGV0ZWQ6IHRvZG8uY29tcGxldGVkKCksIGVkaXRpbmc6IHRvZG8uZWRpdGluZygpIH0pfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidmlld1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9XCJ0b2dnbGVcIiB0eXBlPVwiY2hlY2tib3hcIiBmbj17ZGF0YSh0b2RvLmNvbXBsZXRlZCl9IC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxhYmVsIG9uRG91YmxlQ2xpY2s9e3RvZG8uc3RhcnRFZGl0aW5nfT57dG9kby50aXRsZSgpfTwvbGFiZWw+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJkZXN0cm95XCIgb25DbGljaz17dG9kby5yZW1vdmV9PjwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPVwiZWRpdFwiIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZuMT17ZGF0YSh0b2RvLnRpdGxlLCAna2V5dXAnKX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkJsdXI9eygpID0+IHRvZG8uZW5kRWRpdGluZyh0cnVlKX1cclxuXHRcdFx0XHRcdFx0XHQgICAgZm4yPXtvbmtleSgnZW50ZXInLCAoKSA9PiB0b2RvLmVuZEVkaXRpbmcodHJ1ZSkpfVxyXG5cdFx0XHRcdFx0XHRcdCAgICBmbjM9e29ua2V5KCdlc2MnLCAoKSA9PiB0b2RvLmVuZEVkaXRpbmcoZmFsc2UpKX1cclxuXHRcdFx0XHRcdFx0XHQgICAgZm40PXtmb2N1cyh0b2RvLmVkaXRpbmcoKSl9IC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvbGk+XHJcbiAgICAgICAgICAgICAgICAgICAgKX1cclxuICAgICAgICAgICAgICAgIDwvdWw+XHJcbiAgICAgICAgICAgIDwvc2VjdGlvbj5cclxuICAgICAgICAgICAgPGZvb3RlciBjbGFzc05hbWU9XCJmb290ZXJcIiBoaWRkZW49e2N0cmwuYWxsKCkubGVuZ3RoID09PSAwfT5cclxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRvZG8tY291bnRcIj48c3Ryb25nPntjdHJsLnJlbWFpbmluZygpLmxlbmd0aH08L3N0cm9uZz4gaXRlbXtjdHJsLnJlbWFpbmluZygpLmxlbmd0aCA9PT0gMSA/ICcnIDogJ3MnfSBsZWZ0PC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgPHVsIGNsYXNzTmFtZT1cImZpbHRlcnNcIj5cclxuICAgICAgICAgICAgICAgICAgICA8bGk+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT17Y3goeyBzZWxlY3RlZDogY3RybC5maWx0ZXIoKSA9PT0gbnVsbCB9KX0gaHJlZj1cIiMvXCI+QWxsPC9hPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvbGk+XHJcbiAgICAgICAgICAgICAgICAgICAgPGxpPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9e2N4KHsgc2VsZWN0ZWQ6IGN0cmwuZmlsdGVyKCkgPT09IGZhbHNlIH0pfSBocmVmPVwiIy9hY3RpdmVcIj5BY3RpdmU8L2E+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9saT5cclxuICAgICAgICAgICAgICAgICAgICA8bGk+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT17Y3goeyBzZWxlY3RlZDogY3RybC5maWx0ZXIoKSA9PT0gdHJ1ZSB9KX0gaHJlZj1cIiMvY29tcGxldGVkXCI+Q29tcGxldGVkPC9hPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvbGk+XHJcbiAgICAgICAgICAgICAgICA8L3VsPlxyXG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJjbGVhci1jb21wbGV0ZWRcIiBvbkNsaWNrPXtjdHJsLmNsZWFyQ29tcGxldGVkfSBoaWRkZW49e2N0cmwuY29tcGxldGVkKCkubGVuZ3RoID09PSAwfT5DbGVhciBjb21wbGV0ZWQ8L2J1dHRvbj5cclxuICAgICAgICAgICAgPC9mb290ZXI+XHJcbiAgICAgICAgPC9zZWN0aW9uPlxyXG4gICAgICAgIDxmb290ZXIgY2xhc3NOYW1lPVwiaW5mb1wiPlxyXG4gICAgICAgICAgICA8cD5Eb3VibGUtY2xpY2sgdG8gZWRpdCBhIHRvZG88L3A+XHJcbiAgICAgICAgICAgIDxwPlRlbXBsYXRlIGJ5IDxhIGhyZWY9XCJodHRwOi8vc2luZHJlc29yaHVzLmNvbVwiPlNpbmRyZSBTb3JodXM8L2E+PC9wPlxyXG4gICAgICAgICAgICA8cD5DcmVhdGVkIGJ5IDxhIGhyZWY9XCJodHRwczovL2dpdGh1Yi5jb20vYWRhbWhhaWxlXCI+QWRhbSBIYWlsZTwvYT48L3A+XHJcbiAgICAgICAgICAgIDxwPlBhcnQgb2YgPGEgaHJlZj1cImh0dHA6Ly90b2RvbXZjLmNvbVwiPlRvZG9NVkM8L2E+PC9wPlxyXG4gICAgICAgIDwvZm9vdGVyPlxyXG4gICAgPC9zZWN0aW9uPjtcclxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL3ZpZXdzLnRzeCIsIi8qIVxuICBDb3B5cmlnaHQgKGMpIDIwMTYgSmVkIFdhdHNvbi5cbiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlIChNSVQpLCBzZWVcbiAgaHR0cDovL2plZHdhdHNvbi5naXRodWIuaW8vY2xhc3NuYW1lc1xuKi9cbi8qIGdsb2JhbCBkZWZpbmUgKi9cblxuKGZ1bmN0aW9uICgpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBoYXNPd24gPSB7fS5oYXNPd25Qcm9wZXJ0eTtcblxuXHRmdW5jdGlvbiBjbGFzc05hbWVzICgpIHtcblx0XHR2YXIgY2xhc3NlcyA9IFtdO1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBhcmcgPSBhcmd1bWVudHNbaV07XG5cdFx0XHRpZiAoIWFyZykgY29udGludWU7XG5cblx0XHRcdHZhciBhcmdUeXBlID0gdHlwZW9mIGFyZztcblxuXHRcdFx0aWYgKGFyZ1R5cGUgPT09ICdzdHJpbmcnIHx8IGFyZ1R5cGUgPT09ICdudW1iZXInKSB7XG5cdFx0XHRcdGNsYXNzZXMucHVzaChhcmcpO1xuXHRcdFx0fSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGFyZykpIHtcblx0XHRcdFx0Y2xhc3Nlcy5wdXNoKGNsYXNzTmFtZXMuYXBwbHkobnVsbCwgYXJnKSk7XG5cdFx0XHR9IGVsc2UgaWYgKGFyZ1R5cGUgPT09ICdvYmplY3QnKSB7XG5cdFx0XHRcdGZvciAodmFyIGtleSBpbiBhcmcpIHtcblx0XHRcdFx0XHRpZiAoaGFzT3duLmNhbGwoYXJnLCBrZXkpICYmIGFyZ1trZXldKSB7XG5cdFx0XHRcdFx0XHRjbGFzc2VzLnB1c2goa2V5KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gY2xhc3Nlcy5qb2luKCcgJyk7XG5cdH1cblxuXHRpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGNsYXNzTmFtZXM7XG5cdH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgZGVmaW5lLmFtZCA9PT0gJ29iamVjdCcgJiYgZGVmaW5lLmFtZCkge1xuXHRcdC8vIHJlZ2lzdGVyIGFzICdjbGFzc25hbWVzJywgY29uc2lzdGVudCB3aXRoIG5wbSBwYWNrYWdlIG5hbWVcblx0XHRkZWZpbmUoJ2NsYXNzbmFtZXMnLCBbXSwgZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIGNsYXNzTmFtZXM7XG5cdFx0fSk7XG5cdH0gZWxzZSB7XG5cdFx0d2luZG93LmNsYXNzTmFtZXMgPSBjbGFzc05hbWVzO1xuXHR9XG59KCkpO1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9+L2NsYXNzbmFtZXMvaW5kZXguanNcbi8vIG1vZHVsZSBpZCA9IDhcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwiaW1wb3J0IFMgZnJvbSAncy1qcyc7XHJcblxyXG5pbXBvcnQgeyBUb0Rvc01vZGVsfSBmcm9tICcuL21vZGVscyc7XHJcbmltcG9ydCB7IFRvRG9zQ3RybCB9IGZyb20gJy4vY29udHJvbGxlcnMnO1xyXG5pbXBvcnQgeyBUb0Rvc1JvdXRlciB9IGZyb20gJy4vcm91dGVyJztcclxuaW1wb3J0IHsgTG9jYWxTdG9yYWdlUGVyc2lzdGVuY2UgfSBmcm9tICcuL3BlcnNpc3RlbmNlJztcclxuaW1wb3J0IHsgQXBwVmlldyB9IGZyb20gJy4vdmlld3MnO1xyXG5cclxuUy5yb290KCgpID0+IHtcclxuICAgIGNvbnN0IG1vZGVsID0gVG9Eb3NNb2RlbChbXSksXHJcbiAgICAgICAgY3RybCA9IFRvRG9zQ3RybChtb2RlbCksXHJcbiAgICAgICAgcm91dGVyID0gVG9Eb3NSb3V0ZXIoY3RybCksXHJcbiAgICAgICAgc3RvcmFnZSA9IExvY2FsU3RvcmFnZVBlcnNpc3RlbmNlKG1vZGVsKSxcclxuICAgICAgICB2aWV3ID0gQXBwVmlldyhjdHJsKTtcclxuXHJcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHZpZXcpO1xyXG59KTtcblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvbWFpbi50cyIsImltcG9ydCB7IFMgfSBmcm9tICdzdXJwbHVzJztcclxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gZGF0YShzaWduYWwsIGFyZzEsIGFyZzIpIHtcclxuICAgIHZhciBldmVudCA9IGFyZzEgfHwgJ2NoYW5nZScsIG9uID0gYXJnMSA9PT0gdW5kZWZpbmVkID8gdHJ1ZSA6IGFyZzEsIG9mZiA9IGFyZzIgPT09IHVuZGVmaW5lZCA/IChvbiA9PT0gdHJ1ZSA/IGZhbHNlIDogbnVsbCkgOiBhcmcyO1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChub2RlKSB7XHJcbiAgICAgICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50KSB7XHJcbiAgICAgICAgICAgIHZhciB0eXBlID0gbm9kZS50eXBlLnRvVXBwZXJDYXNlKCk7XHJcbiAgICAgICAgICAgIGlmICh0eXBlID09PSAnQ0hFQ0tCT1gnKSB7XHJcbiAgICAgICAgICAgICAgICBjaGVja2JveERhdGEobm9kZSwgc2lnbmFsLCBvbiwgb2ZmKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmICh0eXBlID09PSAnUkFESU8nKSB7XHJcbiAgICAgICAgICAgICAgICByYWRpb0RhdGEobm9kZSwgc2lnbmFsLCBvbik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZURhdGEobm9kZSwgc2lnbmFsLCBldmVudCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAobm9kZSBpbnN0YW5jZW9mIEhUTUxTZWxlY3RFbGVtZW50IHx8IG5vZGUgaW5zdGFuY2VvZiBIVE1MVGV4dEFyZWFFbGVtZW50KSB7XHJcbiAgICAgICAgICAgIHZhbHVlRGF0YShub2RlLCBzaWduYWwsIGV2ZW50KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAobm9kZS5pc0NvbnRlbnRFZGl0YWJsZSkge1xyXG4gICAgICAgICAgICB0ZXh0Q29udGVudERhdGEobm9kZSwgc2lnbmFsLCBldmVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJAZGF0YSBjYW4gb25seSBiZSBhcHBsaWVkIHRvIGEgZm9ybSBjb250cm9sIGVsZW1lbnQsIFxcblwiXHJcbiAgICAgICAgICAgICAgICArIFwic3VjaCBhcyA8aW5wdXQvPiwgPHRleHRhcmVhLz4gb3IgPHNlbGVjdC8+LCBvciB0byBhbiBlbGVtZW50IHdpdGggXCJcclxuICAgICAgICAgICAgICAgICsgXCInY29udGVudEVkaXRhYmxlJyBzZXQuICBFbGVtZW50IGBgXCIgKyBub2RlLm5vZGVOYW1lICsgXCInJyBpcyBcXG5cIlxyXG4gICAgICAgICAgICAgICAgKyBcIm5vdCBzdWNoIGFuIGVsZW1lbnQuICBQZXJoYXBzIHlvdSBhcHBsaWVkIGl0IHRvIHRoZSB3cm9uZyBub2RlP1wiKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59XHJcbmZ1bmN0aW9uIHZhbHVlRGF0YShub2RlLCBzaWduYWwsIGV2ZW50KSB7XHJcbiAgICBTKGZ1bmN0aW9uIHVwZGF0ZVZhbHVlKCkge1xyXG4gICAgICAgIG5vZGUudmFsdWUgPSB0b1N0cmluZyhzaWduYWwoKSk7XHJcbiAgICB9KTtcclxuICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgdmFsdWVMaXN0ZW5lciwgZmFsc2UpO1xyXG4gICAgUy5jbGVhbnVwKGZ1bmN0aW9uICgpIHsgbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LCB2YWx1ZUxpc3RlbmVyKTsgfSk7XHJcbiAgICBmdW5jdGlvbiB2YWx1ZUxpc3RlbmVyKCkge1xyXG4gICAgICAgIHZhciBjdXIgPSB0b1N0cmluZyhTLnNhbXBsZShzaWduYWwpKSwgdXBkYXRlID0gbm9kZS52YWx1ZTtcclxuICAgICAgICBpZiAoY3VyICE9PSB1cGRhdGUpXHJcbiAgICAgICAgICAgIHNpZ25hbCh1cGRhdGUpO1xyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG59XHJcbmZ1bmN0aW9uIGNoZWNrYm94RGF0YShub2RlLCBzaWduYWwsIG9uLCBvZmYpIHtcclxuICAgIFMoZnVuY3Rpb24gdXBkYXRlQ2hlY2tib3goKSB7XHJcbiAgICAgICAgbm9kZS5jaGVja2VkID0gc2lnbmFsKCkgPT09IG9uO1xyXG4gICAgfSk7XHJcbiAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgY2hlY2tib3hMaXN0ZW5lciwgZmFsc2UpO1xyXG4gICAgUy5jbGVhbnVwKGZ1bmN0aW9uICgpIHsgbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIGNoZWNrYm94TGlzdGVuZXIpOyB9KTtcclxuICAgIGZ1bmN0aW9uIGNoZWNrYm94TGlzdGVuZXIoKSB7XHJcbiAgICAgICAgc2lnbmFsKG5vZGUuY2hlY2tlZCA/IG9uIDogb2ZmKTtcclxuICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxufVxyXG5mdW5jdGlvbiByYWRpb0RhdGEobm9kZSwgc2lnbmFsLCBvbikge1xyXG4gICAgUyhmdW5jdGlvbiB1cGRhdGVSYWRpbygpIHtcclxuICAgICAgICBub2RlLmNoZWNrZWQgPSAoc2lnbmFsKCkgPT09IG9uKTtcclxuICAgIH0pO1xyXG4gICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHJhZGlvTGlzdGVuZXIsIGZhbHNlKTtcclxuICAgIFMuY2xlYW51cChmdW5jdGlvbiAoKSB7IG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCByYWRpb0xpc3RlbmVyKTsgfSk7XHJcbiAgICBmdW5jdGlvbiByYWRpb0xpc3RlbmVyKCkge1xyXG4gICAgICAgIGlmIChub2RlLmNoZWNrZWQpXHJcbiAgICAgICAgICAgIHNpZ25hbChvbik7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbn1cclxuZnVuY3Rpb24gdGV4dENvbnRlbnREYXRhKG5vZGUsIHNpZ25hbCwgZXZlbnQpIHtcclxuICAgIFMoZnVuY3Rpb24gdXBkYXRlVGV4dENvbnRlbnQoKSB7XHJcbiAgICAgICAgbm9kZS50ZXh0Q29udGVudCA9IHRvU3RyaW5nKHNpZ25hbCgpKTtcclxuICAgIH0pO1xyXG4gICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCB0ZXh0Q29udGVudExpc3RlbmVyLCBmYWxzZSk7XHJcbiAgICBTLmNsZWFudXAoZnVuY3Rpb24gKCkgeyBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIHRleHRDb250ZW50TGlzdGVuZXIpOyB9KTtcclxuICAgIGZ1bmN0aW9uIHRleHRDb250ZW50TGlzdGVuZXIoKSB7XHJcbiAgICAgICAgdmFyIGN1ciA9IHRvU3RyaW5nKFMuc2FtcGxlKHNpZ25hbCkpLCB1cGRhdGUgPSBub2RlLnRleHRDb250ZW50O1xyXG4gICAgICAgIGlmIChjdXIgIT09IHVwZGF0ZSlcclxuICAgICAgICAgICAgc2lnbmFsKHVwZGF0ZSk7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbn1cclxuZnVuY3Rpb24gdG9TdHJpbmcodikge1xyXG4gICAgcmV0dXJuIHYgPT0gbnVsbCA/ICcnIDogdi50b1N0cmluZygpO1xyXG59XHJcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vfi9zdXJwbHVzLW1peGluLWRhdGEvaW5kZXguZXMuanNcbi8vIG1vZHVsZSBpZCA9IDEwXG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsIi8qKlxyXG4gKiBJbiBzdXJwbHVzLCBkaXJlY3RpdmVzIHJ1biB3aGVuIGEgbm9kZSBpcyBjcmVhdGVkLCBtZWFuaW5nIGJlZm9yZSBpdCBoYXMgdXN1YWxseVxyXG4gKiBiZWVuIGluc2VydGVkIGludG8gdGhlIGRvY3VtZW50LiAgVGhpcyBjYXVzZXMgYSBwcm9ibGVtIGZvciB0aGUgQGZvY3VzIGRpcmVjdGl2ZSwgYXMgb25seVxyXG4gKiBlbGVtZW50cyB0aGF0IGFyZSBpbiB0aGUgZG9jdW1lbnQgKGFuZCB2aXNpYmxlKSBhcmUgZm9jdXNhYmxlLiAgQXMgYSBoYWNrLCB3ZSBkZWxheVxyXG4gKiB0aGUgZm9jdXMgZXZlbnQgdW50aWwgdGhlIG5leHQgYW5pbWF0aW9uIGZyYW1lLCB0aGVyZWJ5IGdpdmluZyBodG1sbGl0ZXJhbHMgYSBjaGFuY2VcclxuICogdG8gZ2V0IHRoZSBub2RlIGludG8gdGhlIGRvY3VtZW50LiAgSWYgaXQgaXNuJ3QgaW4gYnkgdGhlbiAob3IgaWYgdGhlIHVzZXIgdHJpZWQgdG8gZm9jdXNcclxuICogYSBoaWRkZW4gbm9kZSkgdGhlbiB3ZSBnaXZlIHVwLlxyXG4gKi9cclxudmFyIG5vZGVUb0ZvY3VzID0gbnVsbCwgc3RhcnRQb3MgPSBOYU4sIGVuZFBvcyA9IE5hTiwgc2NoZWR1bGVkID0gZmFsc2U7XHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGZvY3VzKGZsYWcsIHN0YXJ0LCBlbmQpIHtcclxuICAgIHZhciBfc3RhcnQgPSBhcmd1bWVudHMubGVuZ3RoID4gMSA/IHN0YXJ0IDogTmFOLCBfZW5kID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgPyBlbmQgOiBfc3RhcnQsIGxlbmd0aDtcclxuICAgIHJldHVybiBmdW5jdGlvbiBmb2N1cyhub2RlKSB7XHJcbiAgICAgICAgaWYgKCFub2RlLmZvY3VzKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkBmb2N1cyBjYW4gb25seSBiZSBhcHBsaWVkIHRvIGFuIGVsZW1lbnQgdGhhdCBoYXMgYSAuZm9jdXMoKSBtZXRob2QsIGxpa2UgPGlucHV0PiwgPHNlbGVjdD4sIDx0ZXh0YXJlYT4sIGV0Yy5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChmbGFnKSB7XHJcbiAgICAgICAgICAgIGxlbmd0aCA9IG5vZGUudGV4dENvbnRlbnQgPyBub2RlLnRleHRDb250ZW50Lmxlbmd0aCA6IDA7XHJcbiAgICAgICAgICAgIG5vZGVUb0ZvY3VzID0gbm9kZTtcclxuICAgICAgICAgICAgc3RhcnRQb3MgPSBfc3RhcnQgPCAwID8gTWF0aC5tYXgoMCwgbGVuZ3RoICsgX3N0YXJ0KSA6IE1hdGgubWluKGxlbmd0aCwgX3N0YXJ0KTtcclxuICAgICAgICAgICAgZW5kUG9zID0gX2VuZCA8IDAgPyBNYXRoLm1heChzdGFydFBvcywgbGVuZ3RoICsgX2VuZCkgOiBNYXRoLm1pbihsZW5ndGgsIF9lbmQpO1xyXG4gICAgICAgICAgICBpZiAoIXNjaGVkdWxlZCkge1xyXG4gICAgICAgICAgICAgICAgc2NoZWR1bGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZm9jdXNlcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIG5vZGUuYmx1cigpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn1cclxuO1xyXG5mdW5jdGlvbiBmb2N1c2VyKCkge1xyXG4gICAgc2NoZWR1bGVkID0gZmFsc2U7XHJcbiAgICBpZiAobm9kZVRvRm9jdXMgPT09IG51bGwpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgdmFyIHRyYW5nZSwgcmFuZ2UsIHNlbDtcclxuICAgIG5vZGVUb0ZvY3VzLmZvY3VzKCk7XHJcbiAgICBpZiAoIWlzTmFOKHN0YXJ0UG9zKSkge1xyXG4gICAgICAgIGlmIChoYXNTZXRTZWxlY3Rpb25SYW5nZShub2RlVG9Gb2N1cykpIHtcclxuICAgICAgICAgICAgbm9kZVRvRm9jdXMuc2V0U2VsZWN0aW9uUmFuZ2Uoc3RhcnRQb3MsIGVuZFBvcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKGhhc0NyZWF0ZVRleHRSbmFnZShub2RlVG9Gb2N1cykpIHtcclxuICAgICAgICAgICAgdHJhbmdlID0gbm9kZVRvRm9jdXMuY3JlYXRlVGV4dFJhbmdlKCk7XHJcbiAgICAgICAgICAgIHRyYW5nZS5tb3ZlRW5kKCdjaGFyYWN0ZXInLCBlbmRQb3MpO1xyXG4gICAgICAgICAgICB0cmFuZ2UubW92ZVN0YXJ0KCdjaGFyYWN0ZXInLCBzdGFydFBvcyk7XHJcbiAgICAgICAgICAgIHRyYW5nZS5zZWxlY3QoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAobm9kZVRvRm9jdXMuaXNDb250ZW50RWRpdGFibGUgJiYgbm9kZVRvRm9jdXMuY2hpbGROb2Rlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHJhbmdlID0gZG9jdW1lbnQuY3JlYXRlUmFuZ2UoKTtcclxuICAgICAgICAgICAgcmFuZ2Uuc2V0U3RhcnQobm9kZVRvRm9jdXMuY2hpbGROb2Rlc1swXSwgc3RhcnRQb3MpO1xyXG4gICAgICAgICAgICByYW5nZS5zZXRFbmQobm9kZVRvRm9jdXMuY2hpbGROb2Rlc1swXSwgZW5kUG9zKTtcclxuICAgICAgICAgICAgc2VsID0gd2luZG93LmdldFNlbGVjdGlvbigpO1xyXG4gICAgICAgICAgICBzZWwucmVtb3ZlQWxsUmFuZ2VzKCk7XHJcbiAgICAgICAgICAgIHNlbC5hZGRSYW5nZShyYW5nZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbmZ1bmN0aW9uIGhhc1NldFNlbGVjdGlvblJhbmdlKG5vZGUpIHtcclxuICAgIHJldHVybiAhIW5vZGUuc2V0U2VsZWN0aW9uUmFuZ2U7XHJcbn1cclxuZnVuY3Rpb24gaGFzQ3JlYXRlVGV4dFJuYWdlKG5vZGUpIHtcclxuICAgIHJldHVybiAhIW5vZGUuY3JlYXRlVGV4dFJhbmdlO1xyXG59XHJcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vfi9zdXJwbHVzLW1peGluLWZvY3VzL2luZGV4LmVzLmpzXG4vLyBtb2R1bGUgaWQgPSAxMVxuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCJpbXBvcnQgeyBTIH0gZnJvbSAnc3VycGx1cyc7XG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBvbmtleShrZXksIGFyZzEsIGFyZzIpIHtcbiAgICB2YXIgZXZlbnQgPSBhcmd1bWVudHMubGVuZ3RoIDwgMyA/ICdrZXlkb3duJyA6ICdrZXknICsgYXJnMSwgZm4gPSBhcmd1bWVudHMubGVuZ3RoIDwgMyA/IGFyZzEgOiBhcmcyO1xuICAgIHZhciBwYXJ0cyA9IGtleS50b0xvd2VyQ2FzZSgpLnNwbGl0KCctJywgMiksIGtleUNvZGUgPSBrZXlDb2Rlc1twYXJ0c1twYXJ0cy5sZW5ndGggLSAxXV0sIG1vZCA9IHBhcnRzLmxlbmd0aCA+IDEgPyBwYXJ0c1swXSArIFwiS2V5XCIgOiBudWxsO1xuICAgIGlmIChrZXlDb2RlID09PSB1bmRlZmluZWQpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkBvbmtleTogdW5yZWNvZ25pemVkIGtleSBpZGVudGlmaWVyICdcIiArIGtleSArIFwiJ1wiKTtcbiAgICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJAb25rZXk6IG11c3Qgc3VwcGx5IGEgZnVuY3Rpb24gdG8gY2FsbCB3aGVuIHRoZSBrZXkgaXMgZW50ZXJlZFwiKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gb25rZXkobm9kZSkge1xuICAgICAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIG9ua2V5TGlzdGVuZXIsIGZhbHNlKTtcbiAgICAgICAgUy5jbGVhbnVwKGZ1bmN0aW9uICgpIHsgbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LCBvbmtleUxpc3RlbmVyKTsgfSk7XG4gICAgfTtcbiAgICBmdW5jdGlvbiBvbmtleUxpc3RlbmVyKGUpIHtcbiAgICAgICAgaWYgKGUua2V5Q29kZSA9PT0ga2V5Q29kZSAmJiAoIW1vZCB8fCBlW21vZF0pKVxuICAgICAgICAgICAgZm4oZSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbn1cbjtcbnZhciBrZXlDb2RlcyA9IHtcbiAgICBiYWNrc3BhY2U6IDgsXG4gICAgdGFiOiA5LFxuICAgIGVudGVyOiAxMyxcbiAgICBzaGlmdDogMTYsXG4gICAgY3RybDogMTcsXG4gICAgYWx0OiAxOCxcbiAgICBwYXVzZTogMTksXG4gICAgYnJlYWs6IDE5LFxuICAgIGNhcHNsb2NrOiAyMCxcbiAgICBlc2M6IDI3LFxuICAgIGVzY2FwZTogMjcsXG4gICAgc3BhY2U6IDMyLFxuICAgIHBhZ2V1cDogMzMsXG4gICAgcGFnZWRvd246IDM0LFxuICAgIGVuZDogMzUsXG4gICAgaG9tZTogMzYsXG4gICAgbGVmdGFycm93OiAzNyxcbiAgICB1cGFycm93OiAzOCxcbiAgICByaWdodGFycm93OiAzOSxcbiAgICBkb3duYXJyb3c6IDQwLFxuICAgIHBybnRzY3JuOiA0NCxcbiAgICBpbnNlcnQ6IDQ1LFxuICAgIGRlbGV0ZTogNDYsXG4gICAgXCIwXCI6IDQ4LFxuICAgIFwiMVwiOiA0OSxcbiAgICBcIjJcIjogNTAsXG4gICAgXCIzXCI6IDUxLFxuICAgIFwiNFwiOiA1MixcbiAgICBcIjVcIjogNTMsXG4gICAgXCI2XCI6IDU0LFxuICAgIFwiN1wiOiA1NSxcbiAgICBcIjhcIjogNTYsXG4gICAgXCI5XCI6IDU3LFxuICAgIGE6IDY1LFxuICAgIGI6IDY2LFxuICAgIGM6IDY3LFxuICAgIGQ6IDY4LFxuICAgIGU6IDY5LFxuICAgIGY6IDcwLFxuICAgIGc6IDcxLFxuICAgIGg6IDcyLFxuICAgIGk6IDczLFxuICAgIGo6IDc0LFxuICAgIGs6IDc1LFxuICAgIGw6IDc2LFxuICAgIG06IDc3LFxuICAgIG46IDc4LFxuICAgIG86IDc5LFxuICAgIHA6IDgwLFxuICAgIHE6IDgxLFxuICAgIHI6IDgyLFxuICAgIHM6IDgzLFxuICAgIHQ6IDg0LFxuICAgIHU6IDg1LFxuICAgIHY6IDg2LFxuICAgIHc6IDg3LFxuICAgIHg6IDg4LFxuICAgIHk6IDg5LFxuICAgIHo6IDkwLFxuICAgIHdpbmtleTogOTEsXG4gICAgd2lubWVudTogOTMsXG4gICAgZjE6IDExMixcbiAgICBmMjogMTEzLFxuICAgIGYzOiAxMTQsXG4gICAgZjQ6IDExNSxcbiAgICBmNTogMTE2LFxuICAgIGY2OiAxMTcsXG4gICAgZjc6IDExOCxcbiAgICBmODogMTE5LFxuICAgIGY5OiAxMjAsXG4gICAgZjEwOiAxMjEsXG4gICAgZjExOiAxMjIsXG4gICAgZjEyOiAxMjMsXG4gICAgbnVtbG9jazogMTQ0LFxuICAgIHNjcm9sbGxvY2s6IDE0NSxcbiAgICBcIixcIjogMTg4LFxuICAgIFwiPFwiOiAxODgsXG4gICAgXCIuXCI6IDE5MCxcbiAgICBcIj5cIjogMTkwLFxuICAgIFwiL1wiOiAxOTEsXG4gICAgXCI/XCI6IDE5MSxcbiAgICBcImBcIjogMTkyLFxuICAgIFwiflwiOiAxOTIsXG4gICAgXCJbXCI6IDIxOSxcbiAgICBcIntcIjogMjE5LFxuICAgIFwiXFxcXFwiOiAyMjAsXG4gICAgXCJ8XCI6IDIyMCxcbiAgICBcIl1cIjogMjIxLFxuICAgIFwifVwiOiAyMjEsXG4gICAgXCInXCI6IDIyMixcbiAgICBcIlxcXCJcIjogMjIyXG59O1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9+L3N1cnBsdXMtbWl4aW4tb25rZXkvaW5kZXguZXMuanNcbi8vIG1vZHVsZSBpZCA9IDEyXG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsInZhciBzdmdOUyA9IFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIjtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbGVtZW50KHRhZywgY2xhc3NOYW1lLCBwYXJlbnQpIHtcbiAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZyk7XG4gICAgaWYgKGNsYXNzTmFtZSlcbiAgICAgICAgZWwuY2xhc3NOYW1lID0gY2xhc3NOYW1lO1xuICAgIGlmIChwYXJlbnQpXG4gICAgICAgIHBhcmVudC5hcHBlbmRDaGlsZChlbCk7XG4gICAgcmV0dXJuIGVsO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVN2Z0VsZW1lbnQodGFnLCBjbGFzc05hbWUsIHBhcmVudCkge1xuICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhzdmdOUywgdGFnKTtcbiAgICBpZiAoY2xhc3NOYW1lKVxuICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBjbGFzc05hbWUpO1xuICAgIGlmIChwYXJlbnQpXG4gICAgICAgIHBhcmVudC5hcHBlbmRDaGlsZChlbCk7XG4gICAgcmV0dXJuIGVsO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUNvbW1lbnQodGV4dCwgcGFyZW50KSB7XG4gICAgdmFyIGNvbW1lbnQgPSBkb2N1bWVudC5jcmVhdGVDb21tZW50KHRleHQpO1xuICAgIHBhcmVudC5hcHBlbmRDaGlsZChjb21tZW50KTtcbiAgICByZXR1cm4gY29tbWVudDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUZXh0Tm9kZSh0ZXh0LCBwYXJlbnQpIHtcbiAgICB2YXIgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRleHQpO1xuICAgIHBhcmVudC5hcHBlbmRDaGlsZChub2RlKTtcbiAgICByZXR1cm4gbm9kZTtcbn1cblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vfi9zdXJwbHVzL2VzL2RvbS5qc1xuLy8gbW9kdWxlIGlkID0gMTNcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwiaW1wb3J0IHsgUyB9IGZyb20gJy4vaW5kZXgnO1xudmFyIERPQ1VNRU5UX0ZSQUdNRU5UX05PREUgPSAxMSwgVEVYVF9OT0RFID0gMztcbmV4cG9ydCBmdW5jdGlvbiBpbnNlcnQocmFuZ2UsIHZhbHVlKSB7XG4gICAgdmFyIHBhcmVudCA9IHJhbmdlLnN0YXJ0LnBhcmVudE5vZGUsIHRlc3QgPSByYW5nZS5zdGFydCwgZ29vZCA9IG51bGwsIHQgPSB0eXBlb2YgdmFsdWU7XG4gICAgLy9pZiAocGFyZW50ID09PSBudWxsKSB7XG4gICAgLy8gICAgdGhyb3cgbmV3IEVycm9yKFwiU3VycGx1cy5pbnNlcnQoKSBjYW4gb25seSBiZSB1c2VkIG9uIGEgbm9kZSB0aGF0IGhhcyBhIHBhcmVudCBub2RlLiBcXG5cIlxuICAgIC8vICAgICAgICArIFwiTm9kZSBgYFwiICsgcmFuZ2Uuc3RhcnQgKyBcIicnIGlzIGN1cnJlbnRseSB1bmF0dGFjaGVkIHRvIGEgcGFyZW50LlwiKTtcbiAgICAvL31cbiAgICAvL2lmIChyYW5nZS5lbmQucGFyZW50Tm9kZSAhPT0gcGFyZW50KSB7XG4gICAgLy8gICAgdGhyb3cgbmV3IEVycm9yKFwiU3VycGx1cy5pbnNlcnQoKSByZXF1aXJlcyB0aGF0IHRoZSBpbnNlcnRlZCBub2RlcyByZW1haW4gc2liaWxpbmdzIFxcblwiXG4gICAgLy8gICAgICAgICsgXCJvZiB0aGUgb3JpZ2luYWwgbm9kZS4gIFRoZSBET00gaGFzIGJlZW4gbW9kaWZpZWQgc3VjaCB0aGF0IHRoaXMgaXMgXFxuXCJcbiAgICAvLyAgICAgICAgKyBcIm5vIGxvbmdlciB0aGUgY2FzZS5cIik7XG4gICAgLy99XG4gICAgaWYgKHQgPT09ICdzdHJpbmcnIHx8IHQgPT09ICdudW1iZXInIHx8IHQgPT09ICdib29sZWFuJykge1xuICAgICAgICB2YWx1ZSA9IHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgICAgIGlmICh0ZXN0Lm5vZGVUeXBlID09PSBURVhUX05PREUpIHtcbiAgICAgICAgICAgIHRlc3QuZGF0YSA9IHZhbHVlO1xuICAgICAgICAgICAgZ29vZCA9IHRlc3Q7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHZhbHVlKTtcbiAgICAgICAgICAgIHBhcmVudC5yZXBsYWNlQ2hpbGQodmFsdWUsIHRlc3QpO1xuICAgICAgICAgICAgaWYgKHJhbmdlLmVuZCA9PT0gdGVzdClcbiAgICAgICAgICAgICAgICByYW5nZS5lbmQgPSB2YWx1ZTtcbiAgICAgICAgICAgIHJhbmdlLnN0YXJ0ID0gZ29vZCA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKHZhbHVlIGluc3RhbmNlb2YgTm9kZSkge1xuICAgICAgICBpZiAodGVzdCAhPT0gdmFsdWUpIHtcbiAgICAgICAgICAgIHBhcmVudC5yZXBsYWNlQ2hpbGQodmFsdWUsIHRlc3QpO1xuICAgICAgICAgICAgaWYgKHJhbmdlLmVuZCA9PT0gdGVzdClcbiAgICAgICAgICAgICAgICByYW5nZS5lbmQgPSB2YWx1ZTtcbiAgICAgICAgICAgIHJhbmdlLnN0YXJ0ID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgZ29vZCA9IHZhbHVlO1xuICAgIH1cbiAgICBlbHNlIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgIGluc2VydEFycmF5KHZhbHVlKTtcbiAgICB9XG4gICAgZWxzZSBpZiAodmFsdWUgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgICAgICBTKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGluc2VydChyYW5nZSwgdmFsdWUoKSk7XG4gICAgICAgIH0pO1xuICAgICAgICBnb29kID0gcmFuZ2UuZW5kO1xuICAgIH1cbiAgICBlbHNlIGlmICh2YWx1ZSAhPT0gbnVsbCAmJiB2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHZhbHVlID0gdmFsdWUudG9TdHJpbmcoKTtcbiAgICAgICAgaWYgKHRlc3Qubm9kZVR5cGUgPT09IFRFWFRfTk9ERSkge1xuICAgICAgICAgICAgdGVzdC5kYXRhID0gdmFsdWU7XG4gICAgICAgICAgICBnb29kID0gdGVzdDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhbHVlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodmFsdWUpO1xuICAgICAgICAgICAgcGFyZW50LnJlcGxhY2VDaGlsZCh2YWx1ZSwgdGVzdCk7XG4gICAgICAgICAgICBpZiAocmFuZ2UuZW5kID09PSB0ZXN0KVxuICAgICAgICAgICAgICAgIHJhbmdlLmVuZCA9IHZhbHVlO1xuICAgICAgICAgICAgcmFuZ2Uuc3RhcnQgPSBnb29kID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGdvb2QgPT09IG51bGwpIHtcbiAgICAgICAgaWYgKHJhbmdlLnN0YXJ0ID09PSBwYXJlbnQuZmlyc3RDaGlsZCAmJiByYW5nZS5lbmQgPT09IHBhcmVudC5sYXN0Q2hpbGQgJiYgcmFuZ2Uuc3RhcnQgIT09IHJhbmdlLmVuZCkge1xuICAgICAgICAgICAgLy8gZmFzdCBkZWxldGUgZW50aXJlIGNvbnRlbnRzXG4gICAgICAgICAgICBwYXJlbnQudGV4dENvbnRlbnQgPSBcIlwiO1xuICAgICAgICAgICAgdmFsdWUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIlwiKTtcbiAgICAgICAgICAgIHBhcmVudC5hcHBlbmRDaGlsZCh2YWx1ZSk7XG4gICAgICAgICAgICBnb29kID0gcmFuZ2Uuc3RhcnQgPSByYW5nZS5lbmQgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0ZXN0Lm5vZGVUeXBlID09PSBURVhUX05PREUpIHtcbiAgICAgICAgICAgIHRlc3QuZGF0YSA9IFwiXCI7XG4gICAgICAgICAgICBnb29kID0gdGVzdDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhbHVlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJcIik7XG4gICAgICAgICAgICBwYXJlbnQucmVwbGFjZUNoaWxkKHZhbHVlLCB0ZXN0KTtcbiAgICAgICAgICAgIGlmIChyYW5nZS5lbmQgPT09IHRlc3QpXG4gICAgICAgICAgICAgICAgcmFuZ2UuZW5kID0gdmFsdWU7XG4gICAgICAgICAgICByYW5nZS5zdGFydCA9IGdvb2QgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyByZW1vdmUgYW55dGhpbmcgbGVmdCBhZnRlciB0aGUgZ29vZCBjdXJzb3IgZnJvbSB0aGUgaW5zZXJ0IHJhbmdlXG4gICAgd2hpbGUgKGdvb2QgIT09IHJhbmdlLmVuZCkge1xuICAgICAgICB0ZXN0ID0gcmFuZ2UuZW5kO1xuICAgICAgICByYW5nZS5lbmQgPSB0ZXN0LnByZXZpb3VzU2libGluZztcbiAgICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKHRlc3QpO1xuICAgIH1cbiAgICByZXR1cm4gcmFuZ2U7XG4gICAgZnVuY3Rpb24gaW5zZXJ0QXJyYXkoYXJyYXkpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGFycmF5Lmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBhcnJheVtpXTtcbiAgICAgICAgICAgIGlmIChnb29kID09PSByYW5nZS5lbmQpIHtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBOb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIGdvb2QgPSByYW5nZS5lbmQgPSAoZ29vZC5uZXh0U2libGluZyA/IHBhcmVudC5pbnNlcnRCZWZvcmUodmFsdWUsIGdvb2QubmV4dFNpYmxpbmcpIDogcGFyZW50LmFwcGVuZENoaWxkKHZhbHVlKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHZhbHVlIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0QXJyYXkodmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSAhPT0gbnVsbCAmJiB2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodmFsdWUudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgICAgIGdvb2QgPSByYW5nZS5lbmQgPSAoZ29vZC5uZXh0U2libGluZyA/IHBhcmVudC5pbnNlcnRCZWZvcmUodmFsdWUsIGdvb2QubmV4dFNpYmxpbmcpIDogcGFyZW50LmFwcGVuZENoaWxkKHZhbHVlKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgTm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodGVzdCAhPT0gdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChnb29kID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJhbmdlLmVuZCA9PT0gdmFsdWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhbmdlLmVuZCA9IHZhbHVlLnByZXZpb3VzU2libGluZztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQucmVwbGFjZUNoaWxkKHZhbHVlLCB0ZXN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByYW5nZS5zdGFydCA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyYW5nZS5lbmQgPT09IHRlc3QpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhbmdlLmVuZCA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlc3QgPSB2YWx1ZS5uZXh0U2libGluZztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0ZXN0Lm5leHRTaWJsaW5nID09PSB2YWx1ZSAmJiB0ZXN0ICE9PSB2YWx1ZS5uZXh0U2libGluZyAmJiB0ZXN0ICE9PSByYW5nZS5lbmQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKHRlc3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXN0ID0gdmFsdWUubmV4dFNpYmxpbmc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmFuZ2UuZW5kID09PSB2YWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhbmdlLmVuZCA9IHZhbHVlLnByZXZpb3VzU2libGluZztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZSh2YWx1ZSwgdGVzdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGVzdCA9IHRlc3QubmV4dFNpYmxpbmc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZ29vZCA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgIGluc2VydEFycmF5KHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgIT09IG51bGwgJiYgdmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0ZXN0Lm5vZGVUeXBlID09PSBURVhUX05PREUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlc3QuZGF0YSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdvb2QgPT09IG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmFuZ2Uuc3RhcnQgPSB0ZXN0O1xuICAgICAgICAgICAgICAgICAgICAgICAgZ29vZCA9IHRlc3QsIHRlc3QgPSBnb29kLm5leHRTaWJsaW5nO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKHZhbHVlLCB0ZXN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChnb29kID09PSBudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhbmdlLnN0YXJ0ID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBnb29kID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL34vc3VycGx1cy9lcy9pbnNlcnQuanNcbi8vIG1vZHVsZSBpZCA9IDE0XG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsInZhciBhc3NpZ24gPSAnYXNzaWduJyBpbiBPYmplY3QgPyBPYmplY3QuYXNzaWduIDpcbiAgICBmdW5jdGlvbiBhc3NpZ24oYSwgYikge1xuICAgICAgICB2YXIgcHJvcHMgPSBPYmplY3Qua2V5cyhiKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHByb3BzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbmFtZSA9IHByb3BzW2ldO1xuICAgICAgICAgICAgYVtuYW1lXSA9IGJbbmFtZV07XG4gICAgICAgIH1cbiAgICB9O1xuZXhwb3J0IGZ1bmN0aW9uIHN0YXRpY1NwcmVhZChub2RlLCBvYmosIHN2Zykge1xuICAgIHZhciBwcm9wcyA9IE9iamVjdC5rZXlzKG9iaik7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHByb3BzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIHZhciByYXdOYW1lID0gcHJvcHNbaV07XG4gICAgICAgIGlmIChyYXdOYW1lID09PSAnc3R5bGUnKSB7XG4gICAgICAgICAgICBhc3NpZ24obm9kZS5zdHlsZSwgb2JqLnN0eWxlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBwcm9wTmFtZSA9IHRyYW5zbGF0ZUpTWFByb3BlcnR5TmFtZShyYXdOYW1lKTtcbiAgICAgICAgICAgIHNldEZpZWxkKG5vZGUsIHByb3BOYW1lLCBvYmpbcmF3TmFtZV0sIHN2Zyk7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnQgZnVuY3Rpb24gc3RhdGljU3R5bGUobm9kZSwgc3R5bGUpIHtcbiAgICBhc3NpZ24obm9kZS5zdHlsZSwgc3R5bGUpO1xufVxudmFyIFNpbmdsZVNwcmVhZFN0YXRlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBTaW5nbGVTcHJlYWRTdGF0ZShuYW1lZFByb3BzKSB7XG4gICAgICAgIHRoaXMubmFtZWRQcm9wcyA9IG5hbWVkUHJvcHM7XG4gICAgICAgIHRoaXMub2xkUHJvcHMgPSBudWxsO1xuICAgICAgICB0aGlzLm9sZFN0eWxlcyA9IG51bGw7XG4gICAgfVxuICAgIFNpbmdsZVNwcmVhZFN0YXRlLnByb3RvdHlwZS5hcHBseSA9IGZ1bmN0aW9uIChub2RlLCBwcm9wcywgc3ZnKSB7XG4gICAgICAgIHZhciBvbGRQcm9wcyA9IHRoaXMub2xkUHJvcHMsIG5ld1Byb3BzID0gT2JqZWN0LmtleXMocHJvcHMpLCBuZXdMZW4gPSBuZXdQcm9wcy5sZW5ndGgsIGkgPSAwO1xuICAgICAgICBpZiAob2xkUHJvcHMgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGZvciAoOyBpIDwgbmV3TGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldEZpZWxkKG5vZGUsIG5ld1Byb3BzW2ldLCBwcm9wcywgc3ZnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBvbGRMZW4gPSBvbGRQcm9wcy5sZW5ndGgsIGxlbiA9IG9sZExlbiA8IG5ld0xlbiA/IG9sZExlbiA6IG5ld0xlbjtcbiAgICAgICAgICAgIGZvciAoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcHJvcE5hbWUgPSBuZXdQcm9wc1tpXSwgb2xkUHJvcE5hbWUgPSBvbGRQcm9wc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAob2xkUHJvcE5hbWUgIT09IHByb3BOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2hlY2sobm9kZSwgb2xkUHJvcE5hbWUsIHByb3BzLCBzdmcpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnNldEZpZWxkKG5vZGUsIHByb3BOYW1lLCBwcm9wcywgc3ZnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoOyBpIDwgbmV3TGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldEZpZWxkKG5vZGUsIG5ld1Byb3BzW2ldLCBwcm9wcywgc3ZnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoOyBpIDwgb2xkTGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNoZWNrKG5vZGUsIG9sZFByb3BzW2ldLCBwcm9wcywgc3ZnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICB0aGlzLm9sZFByb3BzID0gbmV3UHJvcHM7XG4gICAgfTtcbiAgICBTaW5nbGVTcHJlYWRTdGF0ZS5wcm90b3R5cGUuYXBwbHlTdHlsZSA9IGZ1bmN0aW9uIChub2RlLCBzdHlsZSkge1xuICAgICAgICB2YXIgb2xkU3R5bGVzID0gdGhpcy5vbGRTdHlsZXMsIG5ld1N0eWxlcyA9IE9iamVjdC5rZXlzKHN0eWxlKSwgbmV3TGVuID0gbmV3U3R5bGVzLmxlbmd0aCwgaSA9IDA7XG4gICAgICAgIGlmIChvbGRTdHlsZXMgPT09IG51bGwpIHtcbiAgICAgICAgICAgIGZvciAoOyBpIDwgbmV3TGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICBzZXRTdHlsZShub2RlLCBuZXdTdHlsZXNbaV0sIHN0eWxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBvbGRMZW4gPSBvbGRTdHlsZXMubGVuZ3RoLCBsZW4gPSBvbGRMZW4gPCBuZXdMZW4gPyBvbGRMZW4gOiBuZXdMZW47XG4gICAgICAgICAgICBmb3IgKDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIHByb3BOYW1lID0gbmV3U3R5bGVzW2ldLCBvbGRQcm9wTmFtZSA9IG9sZFN0eWxlc1tpXTtcbiAgICAgICAgICAgICAgICBpZiAob2xkUHJvcE5hbWUgIT09IHByb3BOYW1lICYmICFzdHlsZS5oYXNPd25Qcm9wZXJ0eShvbGRQcm9wTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJTdHlsZShub2RlLCBvbGRQcm9wTmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNldFN0eWxlKG5vZGUsIHByb3BOYW1lLCBzdHlsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKDsgaSA8IG5ld0xlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgc2V0U3R5bGUobm9kZSwgbmV3U3R5bGVzW2ldLCBzdHlsZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IgKDsgaSA8IG9sZExlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgb2xkUHJvcE5hbWUgPSBvbGRTdHlsZXNbaV07XG4gICAgICAgICAgICAgICAgaWYgKCFzdHlsZS5oYXNPd25Qcm9wZXJ0eShvbGRQcm9wTmFtZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJTdHlsZShub2RlLCBvbGRQcm9wTmFtZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHRoaXMub2xkU3R5bGVzID0gbmV3U3R5bGVzO1xuICAgIH07XG4gICAgU2luZ2xlU3ByZWFkU3RhdGUucHJvdG90eXBlLmNoZWNrID0gZnVuY3Rpb24gKG5vZGUsIHJhd05hbWUsIHByb3BzLCBzdmcpIHtcbiAgICAgICAgaWYgKCFwcm9wcy5oYXNPd25Qcm9wZXJ0eShyYXdOYW1lKSkge1xuICAgICAgICAgICAgdmFyIHByb3BOYW1lID0gdHJhbnNsYXRlSlNYUHJvcGVydHlOYW1lKHJhd05hbWUpO1xuICAgICAgICAgICAgaWYgKCF0aGlzLm5hbWVkUHJvcHMuaGFzT3duUHJvcGVydHkocHJvcE5hbWUpKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJGaWVsZChub2RlLCBwcm9wTmFtZSwgc3ZnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG4gICAgU2luZ2xlU3ByZWFkU3RhdGUucHJvdG90eXBlLnNldEZpZWxkID0gZnVuY3Rpb24gKG5vZGUsIHJhd05hbWUsIHByb3BzLCBzdmcpIHtcbiAgICAgICAgdmFyIHZhbHVlID0gcHJvcHNbcmF3TmFtZV07XG4gICAgICAgIGlmIChyYXdOYW1lID09PSAnc3R5bGUnKSB7XG4gICAgICAgICAgICB0aGlzLmFwcGx5U3R5bGUobm9kZSwgdmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIHByb3BOYW1lID0gdHJhbnNsYXRlSlNYUHJvcGVydHlOYW1lKHJhd05hbWUpO1xuICAgICAgICAgICAgc2V0RmllbGQobm9kZSwgcHJvcE5hbWUsIHZhbHVlLCBzdmcpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICByZXR1cm4gU2luZ2xlU3ByZWFkU3RhdGU7XG59KCkpO1xuZXhwb3J0IHsgU2luZ2xlU3ByZWFkU3RhdGUgfTtcbnZhciBNdWx0aVNwcmVhZFN0YXRlID0gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBNdWx0aVNwcmVhZFN0YXRlKG5hbWVkUHJvcHMpIHtcbiAgICAgICAgdGhpcy5uYW1lZFByb3BzID0gbmFtZWRQcm9wcztcbiAgICAgICAgdGhpcy5jdXJyZW50ID0gMTtcbiAgICAgICAgdGhpcy5wcm9wQWdlcyA9IHt9O1xuICAgICAgICB0aGlzLm9sZFByb3BzID0gW107XG4gICAgICAgIHRoaXMuY2hlY2tQcm9wcyA9IFtdO1xuICAgICAgICB0aGlzLnN0eWxlQWdlcyA9IHt9O1xuICAgICAgICB0aGlzLm9sZFN0eWxlcyA9IG51bGw7XG4gICAgICAgIHRoaXMuY2hlY2tTdHlsZXMgPSBudWxsO1xuICAgIH1cbiAgICBNdWx0aVNwcmVhZFN0YXRlLnByb3RvdHlwZS5hcHBseSA9IGZ1bmN0aW9uIChub2RlLCBwcm9wcywgbiwgbGFzdCwgc3ZnKSB7XG4gICAgICAgIHZhciBvbGRQcm9wcyA9IHRoaXMub2xkUHJvcHNbbl0sIG5ld1Byb3BzID0gT2JqZWN0LmtleXMocHJvcHMpLCBuZXdMZW4gPSBuZXdQcm9wcy5sZW5ndGgsIGkgPSAwO1xuICAgICAgICBpZiAob2xkUHJvcHMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgZm9yICg7IGkgPCBuZXdMZW47IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0RmllbGQobm9kZSwgbmV3UHJvcHNbaV0sIHByb3BzLCBuLCBsYXN0LCBzdmcpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIG9sZExlbiA9IG9sZFByb3BzLmxlbmd0aCwgbGVuID0gb2xkTGVuIDwgbmV3TGVuID8gb2xkTGVuIDogbmV3TGVuO1xuICAgICAgICAgICAgZm9yICg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBwcm9wTmFtZSA9IG5ld1Byb3BzW2ldLCBvbGRQcm9wTmFtZSA9IG9sZFByb3BzW2ldO1xuICAgICAgICAgICAgICAgIGlmIChvbGRQcm9wTmFtZSAhPT0gcHJvcE5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jaGVjayhvbGRQcm9wTmFtZSwgcHJvcHMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLnNldEZpZWxkKG5vZGUsIHByb3BOYW1lLCBwcm9wcywgbiwgbGFzdCwgc3ZnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoOyBpIDwgbmV3TGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldEZpZWxkKG5vZGUsIG5ld1Byb3BzW2ldLCBwcm9wcywgbiwgbGFzdCwgc3ZnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoOyBpIDwgb2xkTGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNoZWNrKG9sZFByb3BzW2ldLCBwcm9wcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5vbGRQcm9wc1tuXSA9IG5ld1Byb3BzO1xuICAgICAgICBpZiAobGFzdCkge1xuICAgICAgICAgICAgZm9yIChpID0gMCwgbGVuID0gdGhpcy5jaGVja1Byb3BzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgcHJvcE5hbWUgPSB0aGlzLmNoZWNrUHJvcHMucG9wKCk7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMucHJvcEFnZXNbcHJvcE5hbWVdICE9PSB0aGlzLmN1cnJlbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJGaWVsZChub2RlLCBwcm9wTmFtZSwgc3ZnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnQrKztcbiAgICAgICAgfVxuICAgIH07XG4gICAgTXVsdGlTcHJlYWRTdGF0ZS5wcm90b3R5cGUuYXBwbHlTdHlsZSA9IGZ1bmN0aW9uIChub2RlLCBzdHlsZSwgbiwgbGFzdCkge1xuICAgICAgICB2YXIgb2xkU3R5bGVzID0gdGhpcy5vbGRTdHlsZXMgJiYgdGhpcy5vbGRTdHlsZXNbbl0sIG5ld1N0eWxlcyA9IE9iamVjdC5rZXlzKHN0eWxlKSwgc3R5bGVBZ2VzID0gdGhpcy5zdHlsZUFnZXMsIGN1cnJlbnQgPSB0aGlzLmN1cnJlbnQsIHN0eWxlQWdlcyA9IHRoaXMuc3R5bGVBZ2VzLCBjaGVja1N0eWxlcyA9IHRoaXMuY2hlY2tTdHlsZXMsIG5ld0xlbiA9IG5ld1N0eWxlcy5sZW5ndGgsIGkgPSAwO1xuICAgICAgICBpZiAoIW9sZFN0eWxlcykge1xuICAgICAgICAgICAgZm9yICg7IGkgPCBuZXdMZW47IGkrKykge1xuICAgICAgICAgICAgICAgIHNldFN0eWxlKG5vZGUsIG5ld1N0eWxlc1tpXSwgc3R5bGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIG9sZExlbiA9IG9sZFN0eWxlcy5sZW5ndGgsIGxlbiA9IG9sZExlbiA8IG5ld0xlbiA/IG9sZExlbiA6IG5ld0xlbjtcbiAgICAgICAgICAgIGZvciAoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgcHJvcE5hbWUgPSBuZXdTdHlsZXNbaV0sIG9sZFByb3BOYW1lID0gb2xkU3R5bGVzW2ldO1xuICAgICAgICAgICAgICAgIGlmIChvbGRQcm9wTmFtZSAhPT0gcHJvcE5hbWUgJiYgIXN0eWxlLmhhc093blByb3BlcnR5KG9sZFByb3BOYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY2hlY2tTdHlsZXMgPT09IG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGVja1N0eWxlcyA9IHRoaXMuY2hlY2tTdHlsZXMgPSBbb2xkUHJvcE5hbWVdO1xuICAgICAgICAgICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGVja1N0eWxlcy5wdXNoKG9sZFByb3BOYW1lKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc3R5bGVBZ2VzW3Byb3BOYW1lXSA9IGN1cnJlbnQ7XG4gICAgICAgICAgICAgICAgc2V0U3R5bGUobm9kZSwgcHJvcE5hbWUsIHN0eWxlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvciAoOyBpIDwgbmV3TGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICBwcm9wTmFtZSA9IG5ld1N0eWxlc1tpXTtcbiAgICAgICAgICAgICAgICBzdHlsZUFnZXNbcHJvcE5hbWVdID0gY3VycmVudDtcbiAgICAgICAgICAgICAgICBzZXRTdHlsZShub2RlLCBwcm9wTmFtZSwgc3R5bGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yICg7IGkgPCBvbGRMZW47IGkrKykge1xuICAgICAgICAgICAgICAgIG9sZFByb3BOYW1lID0gb2xkU3R5bGVzW2ldO1xuICAgICAgICAgICAgICAgIGlmICghc3R5bGUuaGFzT3duUHJvcGVydHkob2xkUHJvcE5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjaGVja1N0eWxlcyA9PT0gbnVsbClcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrU3R5bGVzID0gdGhpcy5jaGVja1N0eWxlcyA9IFtvbGRQcm9wTmFtZV07XG4gICAgICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoZWNrU3R5bGVzLnB1c2gob2xkUHJvcE5hbWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAodGhpcy5vbGRTdHlsZXMgPT09IG51bGwpXG4gICAgICAgICAgICB0aGlzLm9sZFN0eWxlcyA9IFtdO1xuICAgICAgICB0aGlzLm9sZFN0eWxlc1tuXSA9IG5ld1N0eWxlcztcbiAgICAgICAgaWYgKGxhc3QpIHtcbiAgICAgICAgICAgIGlmIChjaGVja1N0eWxlcyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGZvciAoaSA9IDAsIGxlbiA9IGNoZWNrU3R5bGVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHByb3BOYW1lID0gY2hlY2tTdHlsZXMucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChzdHlsZUFnZXNbcHJvcE5hbWVdICE9PSBjdXJyZW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhclN0eWxlKG5vZGUsIHByb3BOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuY3VycmVudCsrO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBNdWx0aVNwcmVhZFN0YXRlLnByb3RvdHlwZS5jaGVjayA9IGZ1bmN0aW9uIChyYXdOYW1lLCBwcm9wcykge1xuICAgICAgICBpZiAoIXByb3BzLmhhc093blByb3BlcnR5KHJhd05hbWUpKSB7XG4gICAgICAgICAgICB2YXIgcHJvcE5hbWUgPSB0cmFuc2xhdGVKU1hQcm9wZXJ0eU5hbWUocmF3TmFtZSk7XG4gICAgICAgICAgICBpZiAoIXRoaXMubmFtZWRQcm9wcy5oYXNPd25Qcm9wZXJ0eShwcm9wTmFtZSkpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNoZWNrUHJvcHMucHVzaChwcm9wTmFtZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuICAgIE11bHRpU3ByZWFkU3RhdGUucHJvdG90eXBlLnNldEZpZWxkID0gZnVuY3Rpb24gKG5vZGUsIHJhd05hbWUsIHByb3BzLCBuLCBsYXN0LCBzdmcpIHtcbiAgICAgICAgdmFyIHZhbHVlID0gcHJvcHNbcmF3TmFtZV07XG4gICAgICAgIGlmIChyYXdOYW1lID09PSAnc3R5bGUnKSB7XG4gICAgICAgICAgICB0aGlzLmFwcGx5U3R5bGUobm9kZSwgdmFsdWUsIG4sIGxhc3QpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIHByb3BOYW1lID0gdHJhbnNsYXRlSlNYUHJvcGVydHlOYW1lKHJhd05hbWUpO1xuICAgICAgICAgICAgdGhpcy5wcm9wQWdlc1twcm9wTmFtZV0gPSB0aGlzLmN1cnJlbnQ7XG4gICAgICAgICAgICBzZXRGaWVsZChub2RlLCBwcm9wTmFtZSwgdmFsdWUsIHN2Zyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHJldHVybiBNdWx0aVNwcmVhZFN0YXRlO1xufSgpKTtcbmV4cG9ydCB7IE11bHRpU3ByZWFkU3RhdGUgfTtcbmZ1bmN0aW9uIHNldEZpZWxkKG5vZGUsIG5hbWUsIHZhbHVlLCBzdmcpIHtcbiAgICBpZiAobmFtZSBpbiBub2RlICYmICFzdmcpXG4gICAgICAgIG5vZGVbbmFtZV0gPSB2YWx1ZTtcbiAgICBlbHNlIGlmICh2YWx1ZSA9PT0gZmFsc2UgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZClcbiAgICAgICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gICAgZWxzZVxuICAgICAgICBub2RlLnNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSk7XG59XG5mdW5jdGlvbiBjbGVhckZpZWxkKG5vZGUsIG5hbWUsIHN2Zykge1xuICAgIGlmIChuYW1lIGluIG5vZGUgJiYgIXN2ZylcbiAgICAgICAgbm9kZVtuYW1lXSA9IGRlZmF1bHRWYWx1ZShub2RlLnRhZ05hbWUsIG5hbWUpO1xuICAgIGVsc2VcbiAgICAgICAgbm9kZS5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG59XG5mdW5jdGlvbiBzZXRTdHlsZShub2RlLCBuYW1lLCBzdHlsZSkge1xuICAgIG5vZGUuc3R5bGVbbmFtZV0gPSBzdHlsZVtuYW1lXTtcbn1cbmZ1bmN0aW9uIGNsZWFyU3R5bGUobm9kZSwgbmFtZSkge1xuICAgIG5vZGUuc3R5bGVbbmFtZV0gPSAnJztcbn1cbnZhciBkZWZhdWx0VmFsdWVzID0ge307XG5mdW5jdGlvbiBkZWZhdWx0VmFsdWUodGFnLCBuYW1lKSB7XG4gICAgdmFyIGVtcHR5Tm9kZSA9IGRlZmF1bHRWYWx1ZXNbdGFnXSB8fCAoZGVmYXVsdFZhbHVlc1t0YWddID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWcpKTtcbiAgICByZXR1cm4gZW1wdHlOb2RlW25hbWVdO1xufVxudmFyIGpzeEV2ZW50UHJvcGVydHkgPSAvXm9uW0EtWl0vO1xuZnVuY3Rpb24gdHJhbnNsYXRlSlNYUHJvcGVydHlOYW1lKG5hbWUpIHtcbiAgICByZXR1cm4ganN4RXZlbnRQcm9wZXJ0eS50ZXN0KG5hbWUpXG4gICAgICAgID8gKG5hbWUgPT09IFwib25Eb3VibGVDbGlja1wiID8gXCJvbmRibGNsaWNrXCIgOiBuYW1lLnRvTG93ZXJDYXNlKCkpXG4gICAgICAgIDogbmFtZTtcbn1cblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vfi9zdXJwbHVzL2VzL3NwcmVhZC5qc1xuLy8gbW9kdWxlIGlkID0gMTVcbi8vIG1vZHVsZSBjaHVua3MgPSAwIl0sInNvdXJjZVJvb3QiOiIifQ==