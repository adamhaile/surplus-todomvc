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
        console.warn("computations created without a root or parent cannot be disposed");
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
        throw new Error("S.cleanup() must be called from within an S() computation.  Cannot call it at toplevel.");
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
    var log = node.log;
    node.fn = null;
    if (log !== null) {
        node.log = null;
        log.node1 = null;
        log.nodes = null;
    }
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
/* harmony namespace reexport (by provided) */ __webpack_require__.d(__webpack_exports__, "createComment", function() { return __WEBPACK_IMPORTED_MODULE_1__dom__["b"]; });
/* harmony namespace reexport (by provided) */ __webpack_require__.d(__webpack_exports__, "createTextNode", function() { return __WEBPACK_IMPORTED_MODULE_1__dom__["c"]; });
/* harmony namespace reexport (by provided) */ __webpack_require__.d(__webpack_exports__, "appendChild", function() { return __WEBPACK_IMPORTED_MODULE_1__dom__["d"]; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_s_js__ = __webpack_require__(0);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "S", function() { return __WEBPACK_IMPORTED_MODULE_2_s_js__["a"]; });





/***/ }),
/* 2 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "b", function() { return ToDo; });
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return ToDosModel; });
/* harmony export (immutable) */ __webpack_exports__["c"] = returnType;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_s_js__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_s_array__ = __webpack_require__(3);


// our ToDo model
var ToDo = function (title, completed) { return ({
    title: jsonable(__WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].data(title)),
    completed: jsonable(__WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].data(completed))
}); };
var toDoType = returnType(ToDo);
// our main model
var ToDosModel = function (todos) { return ({
    todos: jsonable(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1_s_array__["b" /* default */])(todos))
}); };
var toDosModelType = returnType(ToDosModel);
// A couple small utilities
// TypeScript utility: do a little generic pattern matching to extract the return type of any function.
// Lets us name that return type for usage in other function's signatures.
//     const fooReturnType = returnType(Foo);
//     type Foo = typeof fooReturnType;
function returnType(fn) {
    return null;
}
// Make any signal jsonable by adding a toJSON method that extracts its value during JSONization
function jsonable(s) {
    s.toJSON = toJSON;
    return s;
}
function toJSON() {
    var json = this();
    // if the value has it's own toJSON, call it now
    if (json && json.toJSON)
        json = json.toJSON();
    return json;
}


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


var toDosCtrlType = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__models__["c" /* returnType */])(ToDosCtrl);
function ToDosCtrl(_a) {
    var todos = _a.todos;
    var editing = __WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].data(null), // the todo selected for editing, or null if none selected
    filter = __WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].data(null), // null = no filtering, true = only completed, false = only incomplete
    newTitle = __WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].data(''), all = todos.map(ToDoCtrl), completed = all.filter(function (t) { return t.completed(); }), remaining = all.filter(function (t) { return !t.completed(); }), displayed = function () { return filter() === null ? all() : filter() ? completed() : remaining(); };
    return {
        filter: filter,
        newTitle: newTitle,
        all: all,
        completed: completed,
        remaining: remaining,
        displayed: displayed,
        allCompleted: function () { return all().length > 0 && remaining().length === 0; },
        setAll: function (c) { return __WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].freeze(function () { return todos().forEach(function (t) { return t.completed(c); }); }); },
        clearCompleted: function () { return todos(todos().filter(function (t) { return !t.completed(); })); },
        create: function () {
            var title = newTitle().trim();
            if (title) {
                newTitle("");
                todos.unshift(__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__models__["b" /* ToDo */])(title, false));
            }
        }
    };
    function ToDoCtrl(todo) {
        var title = __WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].data(__WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].sample(todo.title));
        return {
            title: title,
            completed: todo.completed,
            remove: function () { return todos.remove(todo); },
            startEditing: function () { return editing(todo); },
            editing: function () { return editing() === todo; },
            endEditing: function (commit) {
                if (commit) {
                    var trimmed = title().trim();
                    if (trimmed) {
                        todo.title(title(trimmed));
                    }
                    else {
                        todos.remove(todo);
                    }
                }
                else {
                    title(todo.title());
                }
                editing(null);
            }
        };
    }
}


/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = LocalStoragePersistence;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_s_js__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__models__ = __webpack_require__(2);


var LOCAL_STORAGE_KEY = 'todos-surplus';
function LocalStoragePersistence(model) {
    // load stored todos on init
    var stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored)
        model.todos(JSON.parse(stored).todos.map(function (t) { return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__models__["b" /* ToDo */])(t.title, t.completed); }));
    // store JSONized todos whenever they change
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */])(function () {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(model));
    });
}


/***/ }),
/* 6 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = ToDosRouter;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_s_js__ = __webpack_require__(0);

// with such a simple router scenario, no need for a lib, just hand-write it
function ToDosRouter(ctrl) {
    // filter() -> browser hash
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */])(function () {
        var filter = ctrl.filter(), hash = filter === true ? "/completed" :
            filter === false ? "/active" :
                "/";
        if (window.location.hash !== hash)
            window.location.hash = hash;
    });
    // browser hash -> filter()
    window.addEventListener('hashchange', setStateFromHash, false);
    __WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].cleanup(function () { window.removeEventListener('hashchange', setStateFromHash); });
    function setStateFromHash() {
        var hash = window.location.hash, filter = hash === "#/completed" ? true :
            hash === "#/active" ? false :
                null;
        if (ctrl.filter() !== filter)
            ctrl.filter(filter);
    }
    // init from browser hash
    __WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].sample(setStateFromHash);
}


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

__WEBPACK_IMPORTED_MODULE_0_surplus__;





var AppView = function (ctrl) {
    return (function () {
            var __, __section1, __section1_header1, __section1_header1_h11, __section1_header1_input2, __section1_section2, __section1_section2_input1, __section1_section2_label2, __section1_section2_ul3, __section1_section2_ul3_insert1, __section1_footer3, __section1_footer3_span1, __section1_footer3_span1_strong1, __section1_footer3_span1_strong1_insert1, __section1_footer3_span1_insert3, __section1_footer3_ul2, __section1_footer3_ul2_li1, __section1_footer3_ul2_li1_a1, __section1_footer3_ul2_li2, __section1_footer3_ul2_li2_a1, __section1_footer3_ul2_li3, __section1_footer3_ul2_li3_a1, __section1_footer3_button3, __footer3, __footer3_p1, __footer3_p2, __footer3_p2_a2, __footer3_p3, __footer3_p3_a2, __footer3_p4, __footer3_p4_a2;
            __ = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('section');
            __section1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('section');
            __section1.className = "todoapp";
            __section1_header1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('header');
            __section1_header1.className = "header";
            __section1_header1_h11 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('h1');
            __section1_header1_h11.innerText = 'todos'
            __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__section1_header1, __section1_header1_h11);
            __section1_header1_input2 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('input');
            __section1_header1_input2.className = "new-todo";
            __section1_header1_input2.placeholder = "What needs to be done?";
            __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__section1_header1, __section1_header1_input2);
            __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__section1, __section1_header1);
            __section1_section2 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('section');
            __section1_section2.className = "main";
            __section1_section2_input1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('input');
            __section1_section2_input1.className = "toggle-all";
            __section1_section2_input1.type = "checkbox";
            __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__section1_section2, __section1_section2_input1);
            __section1_section2_label2 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('label');
            __section1_section2_label2.htmlFor = "toggle-all";
            __section1_section2_label2.innerText = 'Mark all as complete'
            __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__section1_section2, __section1_section2_label2);
            __section1_section2_ul3 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('ul');
            __section1_section2_ul3.className = "todo-list";
            __section1_section2_ul3_insert1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createTextNode"]('');
            __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__section1_section2_ul3, __section1_section2_ul3_insert1);
            __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__section1_section2, __section1_section2_ul3);
            __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__section1, __section1_section2);
            __section1_footer3 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('footer');
            __section1_footer3.className = "footer";
            __section1_footer3_span1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('span');
            __section1_footer3_span1.className = "todo-count";
            __section1_footer3_span1_strong1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('strong');
            __section1_footer3_span1_strong1_insert1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createTextNode"]('');
            __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__section1_footer3_span1_strong1, __section1_footer3_span1_strong1_insert1);
            __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__section1_footer3_span1, __section1_footer3_span1_strong1);
            __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__section1_footer3_span1, __WEBPACK_IMPORTED_MODULE_0_surplus__["createTextNode"](' item'));
            __section1_footer3_span1_insert3 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createTextNode"]('');
            __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__section1_footer3_span1, __section1_footer3_span1_insert3);
            __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__section1_footer3_span1, __WEBPACK_IMPORTED_MODULE_0_surplus__["createTextNode"](' left'));
            __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__section1_footer3, __section1_footer3_span1);
            __section1_footer3_ul2 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('ul');
            __section1_footer3_ul2.className = "filters";
            __section1_footer3_ul2_li1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('li');
            __section1_footer3_ul2_li1_a1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('a');
            __section1_footer3_ul2_li1_a1.href = "#/";
            __section1_footer3_ul2_li1_a1.innerText = 'All'
            __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__section1_footer3_ul2_li1, __section1_footer3_ul2_li1_a1);
            __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__section1_footer3_ul2, __section1_footer3_ul2_li1);
            __section1_footer3_ul2_li2 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('li');
            __section1_footer3_ul2_li2_a1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('a');
            __section1_footer3_ul2_li2_a1.href = "#/active";
            __section1_footer3_ul2_li2_a1.innerText = 'Active'
            __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__section1_footer3_ul2_li2, __section1_footer3_ul2_li2_a1);
            __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__section1_footer3_ul2, __section1_footer3_ul2_li2);
            __section1_footer3_ul2_li3 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('li');
            __section1_footer3_ul2_li3_a1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('a');
            __section1_footer3_ul2_li3_a1.href = "#/completed";
            __section1_footer3_ul2_li3_a1.innerText = 'Completed'
            __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__section1_footer3_ul2_li3, __section1_footer3_ul2_li3_a1);
            __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__section1_footer3_ul2, __section1_footer3_ul2_li3);
            __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__section1_footer3, __section1_footer3_ul2);
            __section1_footer3_button3 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('button');
            __section1_footer3_button3.className = "clear-completed";
            __section1_footer3_button3.innerText = 'Clear completed'
            __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__section1_footer3, __section1_footer3_button3);
            __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__section1, __section1_footer3);
            __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__, __section1);
            __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__, __WEBPACK_IMPORTED_MODULE_0_surplus__["createTextNode"](',\
        '));
            __footer3 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('footer');
            __footer3.className = "info";
            __footer3_p1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('p');
            __footer3_p1.innerText = 'Double-click to edit a todo'
            __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__footer3, __footer3_p1);
            __footer3_p2 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('p');
            __footer3_p2.innerText = 'Template by '
            __footer3_p2_a2 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('a');
            __footer3_p2_a2.href = "http://sindresorhus.com";
            __footer3_p2_a2.innerText = 'Sindre Sorhus'
            __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__footer3_p2, __footer3_p2_a2);
            __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__footer3, __footer3_p2);
            __footer3_p3 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('p');
            __footer3_p3.innerText = 'Created by '
            __footer3_p3_a2 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('a');
            __footer3_p3_a2.href = "https://github.com/adamhaile";
            __footer3_p3_a2.innerText = 'Adam Haile'
            __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__footer3_p3, __footer3_p3_a2);
            __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__footer3, __footer3_p3);
            __footer3_p4 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('p');
            __footer3_p4.innerText = 'Part of '
            __footer3_p4_a2 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('a');
            __footer3_p4_a2.href = "http://todomvc.com";
            __footer3_p4_a2.innerText = 'TodoMVC'
            __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__footer3_p4, __footer3_p4_a2);
            __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__footer3, __footer3_p4);
            __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__, __footer3);
            __section1_header1_input2.autoFocus = true;
            __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function (__state) { return (__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3_surplus_mixin_data__["a" /* default */])(ctrl.newTitle, 'keydown'))(__section1_header1_input2, __state); });
            __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function (__state) { return (__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_4_surplus_mixin_onkey__["a" /* default */])('enter', ctrl.create))(__section1_header1_input2, __state); });
            __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function (__state) { return (__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_4_surplus_mixin_onkey__["a" /* default */])('esc', function () { return ctrl.newTitle(''); }))(__section1_header1_input2, __state); });
            __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function () { __section1_section2_input1.checked = ctrl.allCompleted(); });
            __section1_section2_label2.onclick = function () { return ctrl.setAll(!ctrl.allCompleted()); };
            __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function (range) { return __WEBPACK_IMPORTED_MODULE_0_surplus__["insert"](range, __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1_s_array__["a" /* mapSample */])(ctrl.displayed, function (todo) {
        return (function () {
                var __, __div1, __div1_input1, __div1_label2, __div1_label2_insert1, __div1_button3, __input2;
                __ = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('li');
                __div1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('div');
                __div1.className = "view";
                __div1_input1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('input');
                __div1_input1.className = "toggle";
                __div1_input1.type = "checkbox";
                __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__div1, __div1_input1);
                __div1_label2 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('label');
                __div1_label2_insert1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createTextNode"]('');
                __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__div1_label2, __div1_label2_insert1);
                __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__div1, __div1_label2);
                __div1_button3 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('button');
                __div1_button3.className = "destroy";
                __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__div1, __div1_button3);
                __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__, __div1);
                __input2 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('input');
                __input2.className = "edit";
                __WEBPACK_IMPORTED_MODULE_0_surplus__["appendChild"](__, __input2);
                __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function (__state) { return (__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3_surplus_mixin_data__["a" /* default */])(todo.completed))(__div1_input1, __state); });
                __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function (range) { return __WEBPACK_IMPORTED_MODULE_0_surplus__["insert"](range, todo.title()); }, { start: __div1_label2_insert1, end: __div1_label2_insert1 });
                __div1_label2.ondblclick = todo.startEditing;
                __div1_button3.onclick = todo.remove;
                __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function (__state) { return (__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3_surplus_mixin_data__["a" /* default */])(todo.title, 'keyup'))(__input2, __state); });
                __input2.onblur = function () { return todo.endEditing(true); };
                __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function (__state) { return (__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_4_surplus_mixin_onkey__["a" /* default */])('enter', function () { return todo.endEditing(true); }))(__input2, __state); });
                __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function (__state) { return (__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_4_surplus_mixin_onkey__["a" /* default */])('esc', function () { return todo.endEditing(false); }))(__input2, __state); });
                __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function (__state) { return (__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_5_surplus_mixin_focus__["a" /* default */])(todo.editing()))(__input2, __state); });
                __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function () { __.className = __WEBPACK_IMPORTED_MODULE_2_classnames__({ completed: todo.completed(), editing: todo.editing() }); });
                return __;
            })();
    })); }, { start: __section1_section2_ul3_insert1, end: __section1_section2_ul3_insert1 });
            __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function () { __section1_section2.hidden = ctrl.all().length === 0; });
            __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function (range) { return __WEBPACK_IMPORTED_MODULE_0_surplus__["insert"](range, ctrl.remaining().length); }, { start: __section1_footer3_span1_strong1_insert1, end: __section1_footer3_span1_strong1_insert1 });
            __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function (range) { return __WEBPACK_IMPORTED_MODULE_0_surplus__["insert"](range, ctrl.remaining().length === 1 ? '' : 's'); }, { start: __section1_footer3_span1_insert3, end: __section1_footer3_span1_insert3 });
            __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function () { __section1_footer3_ul2_li1_a1.className = __WEBPACK_IMPORTED_MODULE_2_classnames__({ selected: ctrl.filter() === null }); });
            __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function () { __section1_footer3_ul2_li2_a1.className = __WEBPACK_IMPORTED_MODULE_2_classnames__({ selected: ctrl.filter() === false }); });
            __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function () { __section1_footer3_ul2_li3_a1.className = __WEBPACK_IMPORTED_MODULE_2_classnames__({ selected: ctrl.filter() === true }); });
            __section1_footer3_button3.onclick = ctrl.clearCompleted;
            __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function () { __section1_footer3_button3.hidden = ctrl.completed().length === 0; });
            __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function () { __section1_footer3.hidden = ctrl.all().length === 0; });
            return __;
        })();
};


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






__WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].root(function () {
    var model = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__models__["a" /* ToDosModel */])([]), ctrl = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__controllers__["a" /* ToDosCtrl */])(model), router = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__router__["a" /* ToDosRouter */])(ctrl), storage = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_4__persistence__["a" /* LocalStoragePersistence */])(model), view = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_5__views__["a" /* AppView */])(ctrl);
    document.body.appendChild(view);
});


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
/* harmony export (immutable) */ __webpack_exports__["b"] = createComment;
/* harmony export (immutable) */ __webpack_exports__["c"] = createTextNode;
/* harmony export (immutable) */ __webpack_exports__["d"] = appendChild;
function createElement(tag) {
    return document.createElement(tag);
}
function createComment(text) {
    return document.createComment(text);
}
function createTextNode(text) {
    return document.createTextNode(text);
}
function appendChild(parent, child) {
    parent.appendChild(child);
}


/***/ }),
/* 14 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = insert;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__Surplus__ = __webpack_require__(1);

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
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__Surplus__["S"])(function () {
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


/***/ })
/******/ ]);