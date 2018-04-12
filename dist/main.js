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
/******/ 	return __webpack_require__(__webpack_require__.s = 10);
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
    var data = S.data(current), age = -1;
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
var Clock = /** @class */ (function () {
    function Clock() {
        this.time = 0;
        this.changes = new Queue(); // batched changes to data nodes
        this.updates = new Queue(); // computations to update
        this.disposes = new Queue(); // disposals to run after current batch of updates finishes
    }
    return Clock;
}());
var DataNode = /** @class */ (function () {
    function DataNode(value) {
        this.value = value;
        this.pending = NOTPENDING;
        this.log = null;
    }
    return DataNode;
}());
var ComputationNode = /** @class */ (function () {
    function ComputationNode(fn, value) {
        this.fn = fn;
        this.value = value;
        this.state = CURRENT;
        this.source1 = null;
        this.source1slot = 0;
        this.sources = null;
        this.sourceslots = null;
        this.log = null;
        this.owned = null;
        this.cleanups = null;
        this.age = RootClock.time;
    }
    return ComputationNode;
}());
var Log = /** @class */ (function () {
    function Log() {
        this.node1 = null;
        this.node1slot = 0;
        this.nodes = null;
        this.nodeslots = null;
    }
    return Log;
}());
var Queue = /** @class */ (function () {
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
    var fromslot, toslot = to.source1 === null ? -1 : to.sources === null ? 0 : to.sources.length;
    if (from.node1 === null) {
        from.node1 = to;
        from.node1slot = toslot;
        fromslot = -1;
    }
    else if (from.nodes === null) {
        from.nodes = [to];
        from.nodeslots = [toslot];
        fromslot = 0;
    }
    else {
        fromslot = from.nodes.length;
        from.nodes.push(to);
        from.nodeslots.push(toslot);
    }
    if (to.source1 === null) {
        to.source1 = from;
        to.source1slot = fromslot;
    }
    else if (to.sources === null) {
        to.sources = [from];
        to.sourceslots = [fromslot];
    }
    else {
        to.sources.push(from);
        to.sourceslots.push(fromslot);
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
    var node1 = log.node1, nodes = log.nodes;
    // mark all downstream nodes stale which haven't been already
    if (node1 !== null)
        markNodeStale(node1);
    if (nodes !== null) {
        for (var i = 0, len = nodes.length; i < len; i++) {
            markNodeStale(nodes[i]);
        }
    }
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
    var source1 = node.source1, sources = node.sources, sourceslots = node.sourceslots, cleanups = node.cleanups, owned = node.owned, i, len;
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
    if (sources !== null) {
        for (i = 0, len = sources.length; i < len; i++) {
            cleanupSource(sources.pop(), sourceslots.pop());
        }
    }
}
function cleanupSource(source, slot) {
    var nodes = source.nodes, nodeslots = source.nodeslots, last, lastslot;
    if (slot === -1) {
        source.node1 = null;
    }
    else {
        last = nodes.pop();
        lastslot = nodeslots.pop();
        if (slot !== nodes.length) {
            nodes[slot] = last;
            nodeslots[slot] = lastslot;
            if (lastslot === -1) {
                last.source1slot = slot;
            }
            else {
                last.sourceslots[lastslot] = slot;
            }
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
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__insert__ = __webpack_require__(16);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "insert", function() { return __WEBPACK_IMPORTED_MODULE_0__insert__["a"]; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__content__ = __webpack_require__(14);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "content", function() { return __WEBPACK_IMPORTED_MODULE_1__content__["a"]; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__dom__ = __webpack_require__(4);
/* harmony namespace reexport (by provided) */ __webpack_require__.d(__webpack_exports__, "createElement", function() { return __WEBPACK_IMPORTED_MODULE_2__dom__["a"]; });
/* harmony namespace reexport (by provided) */ __webpack_require__.d(__webpack_exports__, "createSvgElement", function() { return __WEBPACK_IMPORTED_MODULE_2__dom__["b"]; });
/* harmony namespace reexport (by provided) */ __webpack_require__.d(__webpack_exports__, "createComment", function() { return __WEBPACK_IMPORTED_MODULE_2__dom__["c"]; });
/* harmony namespace reexport (by provided) */ __webpack_require__.d(__webpack_exports__, "createTextNode", function() { return __WEBPACK_IMPORTED_MODULE_2__dom__["d"]; });
/* harmony namespace reexport (by provided) */ __webpack_require__.d(__webpack_exports__, "setAttribute", function() { return __WEBPACK_IMPORTED_MODULE_2__dom__["e"]; });
/* harmony namespace reexport (by provided) */ __webpack_require__.d(__webpack_exports__, "setAttributeNS", function() { return __WEBPACK_IMPORTED_MODULE_2__dom__["f"]; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__spread__ = __webpack_require__(17);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "spread", function() { return __WEBPACK_IMPORTED_MODULE_3__spread__["a"]; });
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "assign", function() { return __WEBPACK_IMPORTED_MODULE_3__spread__["b"]; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_s_js__ = __webpack_require__(0);
/* harmony reexport (binding) */ __webpack_require__.d(__webpack_exports__, "S", function() { return __WEBPACK_IMPORTED_MODULE_4_s_js__["a"]; });







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
    title: jsonable(__WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].value(title)),
    completed: jsonable(__WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].value(completed))
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
/* unused harmony export mapSequentially */
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
    _seq.mapSequentially = chainMapSequentially;
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
        var new_items = seq(), new_len = new_items.length, new_indices, item_indices, temp, tempdisposers, from = null, to = null, i, j, start, end, new_end, item;
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
            for (j = 0; j < new_len; j++) {
                items[j] = new_items[j];
                mapped[j] = __WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].root(mapper);
            }
            len = new_len;
        }
        else {
            new_indices = new Map();
            temp = new Array(new_len);
            tempdisposers = new Array(new_len);
            if (move)
                from = [], to = [];
            // skip common prefix and suffix
            for (start = 0, end = Math.min(len, new_len); start < end && items[start] === new_items[start]; start++)
                ;
            for (end = len - 1, new_end = new_len - 1; end >= 0 && new_end >= 0 && items[end] === new_items[new_end]; end--, new_end--) {
                temp[new_end] = mapped[end];
                tempdisposers[new_end] = disposers[end];
            }
            // 0) prepare a map of all indices in new_items, scanning backwards so we can pop them off in natural order
            for (j = new_end; j >= start; j--) {
                item = new_items[j];
                item_indices = new_indices.get(item);
                if (item_indices === undefined) {
                    new_indices.set(item, [j]);
                }
                else {
                    item_indices.push(j);
                }
            }
            // 1) step through all old items and see if they can be found in the new set; if so, save them in a temp array and mark them moved; if not, exit them
            for (i = start; i <= end; i++) {
                item = items[i];
                item_indices = new_indices.get(item);
                if (item_indices !== undefined && item_indices.length > 0) {
                    j = item_indices.pop();
                    temp[j] = mapped[i];
                    tempdisposers[j] = disposers[i];
                    if (move && i !== j) {
                        from.push(i);
                        to.push(j);
                    }
                }
                else {
                    if (exit)
                        exit(item, mapped[i], i);
                    disposers[i]();
                }
            }
            if (move && (from.length !== 0 || end !== len - 1)) {
                end++, new_end++;
                while (end < len) {
                    from.push(end++);
                    to.push(new_end++);
                }
                move(items, mapped, from, to);
            }
            // 2) set all the new values, pulling from the temp array if copied, otherwise entering the new value
            for (j = start; j < new_len; j++) {
                if (temp.hasOwnProperty(j)) {
                    mapped[j] = temp[j];
                    disposers[j] = tempdisposers[j];
                }
                else {
                    mapped[j] = __WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].root(mapper);
                }
            }
            // 3) in case the new set is shorter than the old, set the length of the mapped array
            len = mapped.length = new_len;
            // 4) save a copy of the mapped items for the next update
            items = new_items.slice();
        }
        return mapped;
        function mapper(disposer) {
            disposers[j] = disposer;
            return enter(new_items[j], mapped[j], j);
        }
    });
}
function chainMapSample(enter, exit, move) {
    return lift(mapSample(this, enter, exit, move));
}
function mapSequentially(seq, update) {
    var mapped = [];
    return __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */])(function mapSequentially() {
        var s = seq();
        for (var i = 0; i < s.length; i++) {
            mapped[i] = update(s[i], mapped[i], i);
        }
        if (mapped.length > s.length)
            mapped.length = s.length;
        return mapped;
    });
}
function chainMapSequentially(enter) {
    return lift(mapSequentially(this, enter));
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
/* harmony export (immutable) */ __webpack_exports__["a"] = createElement;
/* harmony export (immutable) */ __webpack_exports__["b"] = createSvgElement;
/* harmony export (immutable) */ __webpack_exports__["c"] = createComment;
/* harmony export (immutable) */ __webpack_exports__["d"] = createTextNode;
/* harmony export (immutable) */ __webpack_exports__["e"] = setAttribute;
/* harmony export (immutable) */ __webpack_exports__["f"] = setAttributeNS;
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
function setAttribute(node, name, value) {
    if (value === false || value === null || value === undefined)
        node.removeAttribute(name);
    else
        node.setAttribute(name, value);
}
function setAttributeNS(node, namespace, name, value) {
    if (value === false || value === null || value === undefined)
        node.removeAttributeNS(namespace, name);
    else
        node.setAttributeNS(namespace, name, value);
}


/***/ }),
/* 5 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = ToDosCtrl;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_s_js__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__models__ = __webpack_require__(2);


var toDosCtrlType = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__models__["c" /* returnType */])(ToDosCtrl);
function ToDosCtrl(_a) {
    var todos = _a.todos;
    var editing = __WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].value(null), // the todo selected for editing, or null if none selected
    filter = __WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].value(null), // null = no filtering, true = only completed, false = only incomplete
    newTitle = __WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].value(''), all = todos.map(ToDoCtrl), completed = all.filter(function (t) { return t.completed(); }), remaining = all.filter(function (t) { return !t.completed(); }), displayed = function () { return filter() === null ? all() : filter() ? completed() : remaining(); };
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
        var title = __WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].value(__WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].sample(todo.title));
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
/* 6 */
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
/* 7 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = ToDosRouter;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_s_js__ = __webpack_require__(0);

// with such a simple router scenario, no need for a lib, just hand-write it
function ToDosRouter(ctrl) {
    // browser hash -> filter()
    window.addEventListener('hashchange', setStateFromHash, false);
    __WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].cleanup(function () { window.removeEventListener('hashchange', setStateFromHash); });
    function setStateFromHash() {
        var hash = window.location.hash, filter = hash === "#/completed" ? true :
            hash === "#/active" ? false :
                null;
        ctrl.filter(filter);
    }
    // init from browser hash
    setStateFromHash();
    // filter() -> browser hash
    __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */])(function () {
        var filter = ctrl.filter(), hash = filter === true ? "/completed" :
            filter === false ? "/active" :
                "/";
        window.location.hash = hash;
    });
}


/***/ }),
/* 8 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return AppView; });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_surplus__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1_s_array__ = __webpack_require__(3);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_classnames__ = __webpack_require__(9);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2_classnames___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_2_classnames__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3_surplus_mixin_data__ = __webpack_require__(11);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4_surplus_mixin_onkey__ = __webpack_require__(13);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5_surplus_mixin_focus__ = __webpack_require__(12);

__WEBPACK_IMPORTED_MODULE_0_surplus__;





var AppView = function (ctrl) {
    return (function () {
    var __, __section1, __section1_header1, __section1_header1_h11, __section1_header1_input2, __section1_section2, __section1_section2_input1, __section1_section2_label2, __section1_section2_ul3, __section1_footer3, __section1_footer3_span1, __section1_footer3_span1_strong1, __section1_footer3_span1_insert3, __section1_footer3_ul2, __section1_footer3_ul2_li1, __section1_footer3_ul2_li1_a1, __section1_footer3_ul2_li2, __section1_footer3_ul2_li2_a1, __section1_footer3_ul2_li3, __section1_footer3_ul2_li3_a1, __section1_footer3_button3, __footer2, __footer2_p1, __footer2_p2, __footer2_p2_a2, __footer2_p3, __footer2_p3_a2, __footer2_p4, __footer2_p4_a2;
    __ = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('section', null, null);
    __section1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('section', "todoapp", __);
    __section1_header1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('header', "header", __section1);
    __section1_header1_h11 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('h1', null, __section1_header1);
    __section1_header1_h11.textContent = "todos";
    __section1_header1_input2 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('input', "new-todo", __section1_header1);
    __section1_header1_input2.placeholder = "What needs to be done?";
    __section1_header1_input2.autofocus = true;
    __section1_section2 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('section', "main", __section1);
    __section1_section2_input1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('input', "toggle-all", __section1_section2);
    __section1_section2_label2 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('label', null, __section1_section2);
    __section1_section2_ul3 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('ul', "todo-list", __section1_section2);
    __section1_footer3 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('footer', "footer", __section1);
    __section1_footer3_span1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('span', "todo-count", __section1_footer3);
    __section1_footer3_span1_strong1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('strong', null, __section1_footer3_span1);
    __WEBPACK_IMPORTED_MODULE_0_surplus__["createTextNode"](" item", __section1_footer3_span1)
    __section1_footer3_span1_insert3 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createTextNode"]('', __section1_footer3_span1)
    __WEBPACK_IMPORTED_MODULE_0_surplus__["createTextNode"](" left", __section1_footer3_span1)
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
    __footer2_p1.textContent = "Double-click to edit a todo";
    __footer2_p2 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('p', null, __footer2);
    __WEBPACK_IMPORTED_MODULE_0_surplus__["createTextNode"]("Template by ", __footer2_p2)
    __footer2_p2_a2 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('a', null, __footer2_p2);
    __footer2_p2_a2.href = "http://sindresorhus.com";
    __footer2_p2_a2.textContent = "Sindre Sorhus";
    __footer2_p3 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('p', null, __footer2);
    __WEBPACK_IMPORTED_MODULE_0_surplus__["createTextNode"]("Created by ", __footer2_p3)
    __footer2_p3_a2 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('a', null, __footer2_p3);
    __footer2_p3_a2.href = "https://github.com/adamhaile";
    __footer2_p3_a2.textContent = "Adam Haile";
    __footer2_p4 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('p', null, __footer2);
    __WEBPACK_IMPORTED_MODULE_0_surplus__["createTextNode"]("Part of ", __footer2_p4)
    __footer2_p4_a2 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('a', null, __footer2_p4);
    __footer2_p4_a2.href = "http://todomvc.com";
    __footer2_p4_a2.textContent = "TodoMVC";
    __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function (__state) { return (__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3_surplus_mixin_data__["a" /* default */])(ctrl.newTitle, 'keydown'))(__section1_header1_input2, __state); });
    __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function (__state) { return (__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_4_surplus_mixin_onkey__["a" /* default */])('enter', ctrl.create))(__section1_header1_input2, __state); });
    __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function (__state) { return (__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_4_surplus_mixin_onkey__["a" /* default */])('esc', function () { return ctrl.newTitle(''); }))(__section1_header1_input2, __state); });
    __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function () {
        __section1_section2_input1.type = "checkbox";
        __section1_section2_input1.checked = ctrl.allCompleted();
    });
    __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function () {
        __section1_section2_label2.htmlFor = "toggle-all";
        __section1_section2_label2.onclick = function () { return ctrl.setAll(!ctrl.allCompleted()); };
        __section1_section2_label2.textContent = "Mark all as complete";
    });
    __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function (__current) { return __WEBPACK_IMPORTED_MODULE_0_surplus__["content"](__section1_section2_ul3, __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1_s_array__["a" /* mapSample */])(ctrl.displayed, function (todo) {
        return (function () {
    var __, __div1, __div1_input1, __div1_label2, __div1_button3, __input2;
    __ = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('li', null, null);
    __div1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('div', "view", __);
    __div1_input1 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('input', "toggle", __div1);
    __div1_input1.type = "checkbox";
    __div1_label2 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('label', null, __div1);
    __div1_label2.ondblclick = todo.startEditing;
    __div1_button3 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('button', "destroy", __div1);
    __div1_button3.onclick = todo.remove;
    __input2 = __WEBPACK_IMPORTED_MODULE_0_surplus__["createElement"]('input', "edit", __);
    __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function (__state) { return (__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3_surplus_mixin_data__["a" /* default */])(todo.completed))(__div1_input1, __state); });
    __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function (__current) { return __WEBPACK_IMPORTED_MODULE_0_surplus__["content"](__div1_label2, todo.title(), __current); }, '');
    __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function () { __input2.onblur = function () { return todo.endEditing(true); }; });
    __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function (__state) { return (__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3_surplus_mixin_data__["a" /* default */])(todo.title, 'keyup'))(__input2, __state); });
    __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function (__state) { return (__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_4_surplus_mixin_onkey__["a" /* default */])('enter', function () { return todo.endEditing(true); }))(__input2, __state); });
    __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function (__state) { return (__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_4_surplus_mixin_onkey__["a" /* default */])('esc', function () { return todo.endEditing(false); }))(__input2, __state); });
    __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function (__state) { return (__webpack_require__.i(__WEBPACK_IMPORTED_MODULE_5_surplus_mixin_focus__["a" /* default */])(todo.editing()))(__input2, __state); });
    __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function () { __.className = __WEBPACK_IMPORTED_MODULE_2_classnames__({ completed: todo.completed(), editing: todo.editing() }); });
    return __;
})();
    }), __current); }, '');
    __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function () { __section1_section2.hidden = ctrl.all().length === 0; });
    __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function (__current) { return __WEBPACK_IMPORTED_MODULE_0_surplus__["content"](__section1_footer3_span1_strong1, ctrl.remaining().length, __current); }, '');
    __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function (__range) { return __WEBPACK_IMPORTED_MODULE_0_surplus__["insert"](__range, ctrl.remaining().length === 1 ? '' : 's'); }, { start: __section1_footer3_span1_insert3, end: __section1_footer3_span1_insert3 });
    __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function () {
        __section1_footer3_ul2_li1_a1.className = __WEBPACK_IMPORTED_MODULE_2_classnames__({ selected: ctrl.filter() === null });
        __section1_footer3_ul2_li1_a1.href = "#/";
        __section1_footer3_ul2_li1_a1.textContent = "All";
    });
    __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function () {
        __section1_footer3_ul2_li2_a1.className = __WEBPACK_IMPORTED_MODULE_2_classnames__({ selected: ctrl.filter() === false });
        __section1_footer3_ul2_li2_a1.href = "#/active";
        __section1_footer3_ul2_li2_a1.textContent = "Active";
    });
    __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function () {
        __section1_footer3_ul2_li3_a1.className = __WEBPACK_IMPORTED_MODULE_2_classnames__({ selected: ctrl.filter() === true });
        __section1_footer3_ul2_li3_a1.href = "#/completed";
        __section1_footer3_ul2_li3_a1.textContent = "Completed";
    });
    __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function () {
        __section1_footer3_button3.onclick = ctrl.clearCompleted;
        __section1_footer3_button3.hidden = ctrl.completed().length === 0;
        __section1_footer3_button3.textContent = "Clear completed";
    });
    __WEBPACK_IMPORTED_MODULE_0_surplus__["S"](function () { __section1_footer3.hidden = ctrl.all().length === 0; });
    return __;
})();
};


/***/ }),
/* 9 */
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
/* 10 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_s_js__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__models__ = __webpack_require__(2);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__controllers__ = __webpack_require__(5);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__router__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__persistence__ = __webpack_require__(6);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__views__ = __webpack_require__(8);






__WEBPACK_IMPORTED_MODULE_0_s_js__["a" /* default */].root(function () {
    var model = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__models__["a" /* ToDosModel */])([]), ctrl = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__controllers__["a" /* ToDosCtrl */])(model), router = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_3__router__["a" /* ToDosRouter */])(ctrl), storage = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_4__persistence__["a" /* LocalStoragePersistence */])(model), view = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_5__views__["a" /* AppView */])(ctrl);
    document.body.appendChild(view);
});


/***/ }),
/* 11 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = data;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0_surplus__ = __webpack_require__(1);

function data(signal, arg1, arg2) {
    var event = arg1 || 'input', on = arg1 === undefined ? true : arg1, off = arg2 === undefined ? (on === true ? false : null) : arg2;
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
/* 12 */
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
/* 13 */
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
/* 14 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = content;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__index__ = __webpack_require__(1);

function content(parent, value, current) {
    var t = typeof value;
    if (current === value) {
        // nothing to do
    }
    else if (t === 'string') {
        // if a Text node already exists, it's faster to set its .data than set the parent.textContent
        if (current !== "" && typeof current === 'string') {
            current = parent.firstChild.data = value;
        }
        else {
            current = parent.textContent = value;
        }
    }
    else if (t === 'number') {
        value = value.toString();
        if (current !== "" && typeof current === 'string') {
            current = parent.firstChild.data = value;
        }
        else {
            current = parent.textContent = value;
        }
    }
    else if (value == null || t === 'boolean') {
        clear(parent);
        current = "";
    }
    else if (t === 'function') {
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__index__["S"])(function () {
            current = content(parent, value(), current);
        });
    }
    else if (value instanceof Node) {
        if (Array.isArray(current)) {
            if (current.length === 0) {
                parent.appendChild(value);
            }
            else if (current.length === 1) {
                parent.replaceChild(value, current[0]);
            }
            else {
                clear(parent);
                parent.appendChild(value);
            }
        }
        else if (current === "") {
            parent.appendChild(value);
        }
        else {
            parent.replaceChild(value, parent.firstChild);
        }
        current = value;
    }
    else if (Array.isArray(value)) {
        var array = normalizeIncomingArray([], value);
        if (array.length === 0) {
            clear(parent);
        }
        else {
            if (Array.isArray(current)) {
                if (current.length === 0) {
                    appendNodes(parent, array, 0, array.length);
                }
                else {
                    reconcileArrays(parent, current, array);
                }
            }
            else if (current === "") {
                appendNodes(parent, array, 0, array.length);
            }
            else {
                reconcileArrays(parent, [parent.firstChild], array);
            }
        }
        current = array;
    }
    else {
        throw new Error("content must be Node, stringable, or array of same");
    }
    return current;
}
var NOMATCH = -1, NOINSERT = -2;
var RECONCILE_ARRAY_BATCH = 0;
var RECONCILE_ARRAY_BITS = 16, RECONCILE_ARRAY_INC = 1 << RECONCILE_ARRAY_BITS, RECONCILE_ARRAY_MASK = RECONCILE_ARRAY_INC - 1;
// reconcile the content of parent from ns to us
// see ivi's excellent writeup of diffing arrays in a vdom library: 
// https://github.com/ivijs/ivi/blob/2c81ead934b9128e092cc2a5ef2d3cabc73cb5dd/packages/ivi/src/vdom/implementation.ts#L1187
// this code isn't identical, since we're diffing real dom nodes to nodes-or-strings, 
// but the core methodology of trimming ends and reversals, matching nodes, then using
// the longest increasing subsequence to minimize DOM ops is inspired by ivi.
function reconcileArrays(parent, ns, us) {
    var ulen = us.length, 
    // n = nodes, u = updates
    // ranges defined by min and max indices
    nmin = 0, nmax = ns.length - 1, umin = 0, umax = ulen - 1, 
    // start nodes of ranges
    n = ns[nmin], u = us[umin], 
    // end nodes of ranges
    nx = ns[nmax], ux = us[umax], 
    // node, if any, just after ux, used for doing .insertBefore() to put nodes at end
    ul = nx.nextSibling, i, j, k, loop = true;
    // scan over common prefixes, suffixes, and simple reversals
    fixes: while (loop) {
        loop = false;
        // common prefix, u === n
        while (equable(u, n, umin, us)) {
            umin++;
            nmin++;
            if (umin > umax || nmin > nmax)
                break fixes;
            u = us[umin];
            n = ns[nmin];
        }
        // common suffix, ux === nx
        while (equable(ux, nx, umax, us)) {
            ul = nx;
            umax--;
            nmax--;
            if (umin > umax || nmin > nmax)
                break fixes;
            ux = us[umax];
            nx = ns[nmax];
        }
        // reversal u === nx, have to swap node forward
        while (equable(u, nx, umin, us)) {
            loop = true;
            parent.insertBefore(nx, n);
            umin++;
            nmax--;
            if (umin > umax || nmin > nmax)
                break fixes;
            u = us[umin];
            nx = ns[nmax];
        }
        // reversal ux === n, have to swap node back
        while (equable(ux, n, umax, us)) {
            loop = true;
            if (ul === null)
                parent.appendChild(n);
            else
                parent.insertBefore(n, ul);
            ul = n;
            umax--;
            nmin++;
            if (umin > umax || nmin > nmax)
                break fixes;
            ux = us[umax];
            n = ns[nmin];
        }
    }
    // if that covered all updates, just need to remove any remaining nodes and we're done
    if (umin > umax) {
        // remove any remaining nodes
        while (nmin <= nmax) {
            parent.removeChild(ns[nmax]);
            nmax--;
        }
        return;
    }
    // if that covered all current nodes, just need to insert any remaining updates and we're done
    if (nmin > nmax) {
        // insert any remaining nodes
        while (umin <= umax) {
            insertOrAppend(parent, us[umin], ul, umin, us);
            umin++;
        }
        return;
    }
    // simple cases don't apply, have to actually match up nodes and figure out minimum DOM ops
    // loop through nodes and mark them with a special property indicating their order
    // we'll then go through the updates and look for those properties
    // in case any of the updates have order properties left over from earlier runs, we 
    // use the low bits of the order prop to record a batch identifier.
    // I'd much rather use a Map than a special property, but Maps of objects are really
    // slow currently, like only 100k get/set ops / second
    // for Text nodes, all that matters is their order, as they're easily, interchangeable
    // so we record their positions in ntext[]
    var ntext = [];
    // update global batch identifer
    RECONCILE_ARRAY_BATCH = (RECONCILE_ARRAY_BATCH + 1) % RECONCILE_ARRAY_INC;
    for (i = nmin, j = (nmin << RECONCILE_ARRAY_BITS) + RECONCILE_ARRAY_BATCH; i <= nmax; i++, j += RECONCILE_ARRAY_INC) {
        n = ns[i];
        // add or update special order property
        if (n.__surplus_order === undefined) {
            Object.defineProperty(n, '__surplus_order', { value: j, writable: true });
        }
        else {
            n.__surplus_order = j;
        }
        if (n instanceof Text) {
            ntext.push(i);
        }
    }
    // now loop through us, looking for the order property, otherwise recording NOMATCH
    var src = new Array(umax - umin + 1), utext = [], preserved = 0;
    for (i = umin; i <= umax; i++) {
        u = us[i];
        if (typeof u === 'string') {
            utext.push(i);
            src[i - umin] = NOMATCH;
        }
        else if ((j = u.__surplus_order) !== undefined && (j & RECONCILE_ARRAY_MASK) === RECONCILE_ARRAY_BATCH) {
            j >>= RECONCILE_ARRAY_BITS;
            src[i - umin] = j;
            ns[j] = null;
            preserved++;
        }
        else {
            src[i - umin] = NOMATCH;
        }
    }
    if (preserved === 0 && nmin === 0 && nmax === ns.length - 1) {
        // no nodes preserved, use fast clear and append
        clear(parent);
        while (umin <= umax) {
            insertOrAppend(parent, us[umin], null, umin, us);
            umin++;
        }
        return;
    }
    // find longest common sequence between ns and us, represented as the indices 
    // of the longest increasing subsequence in src
    var lcs = longestPositiveIncreasingSubsequence(src);
    // we know we can preserve their order, so march them as NOINSERT
    for (i = 0; i < lcs.length; i++) {
        src[lcs[i]] = NOINSERT;
    }
    /*
              0   1   2   3   4   5   6   7
    ns    = [ n,  n,  t,  n,  n,  n,  t,  n ]
                  |          /   /       /
                  |        /   /       /
                  +------/---/-------/----+
                       /   /       /      |
    us    = [ n,  s,  n,  n,  s,  n,  s,  n ]
    src   = [-1, -1,  4,  5, -1,  7, -1,  1 ]
    lis   = [         2,  3,      5]
                      j
    utext = [     1,          4,      6 ]
                  i
    ntext = [         2,              6 ]
                      k
    */
    // replace strings in us with Text nodes, reusing Text nodes from ns when we can do so without moving them
    var utexti = 0, lcsj = 0, ntextk = 0;
    for (i = 0, j = 0, k = 0; i < utext.length; i++) {
        utexti = utext[i];
        // need to answer qeustion "if utext[i] falls between two lcs nodes, is there an ntext between them which we can reuse?"
        // first, find j such that lcs[j] is the first lcs node *after* utext[i]
        while (j < lcs.length && (lcsj = lcs[j]) < utexti - umin)
            j++;
        // now, find k such that ntext[k] is the first ntext *after* lcs[j-1] (or after start, if j === 0)
        while (k < ntext.length && (ntextk = ntext[k], j !== 0) && ntextk < src[lcs[j - 1]])
            k++;
        // if ntext[k] < lcs[j], then we know ntext[k] falls between lcs[j-1] (or start) and lcs[j] (or end)
        // that means we can re-use it without moving it
        if (k < ntext.length && (j === lcs.length || ntextk < src[lcsj])) {
            n = ns[ntextk];
            u = us[utexti];
            if (n.data !== u)
                n.data = u;
            ns[ntextk] = null;
            us[utexti] = n;
            src[utexti] = NOINSERT;
            k++;
        }
        else {
            // if we didn't find one to re-use, make a new Text node
            us[utexti] = document.createTextNode(us[utexti]);
        }
    }
    // remove stale nodes in ns
    while (nmin <= nmax) {
        n = ns[nmin];
        if (n !== null) {
            parent.removeChild(n);
        }
        nmin++;
    }
    // insert new nodes
    while (umin <= umax) {
        ux = us[umax];
        if (src[umax - umin] !== NOINSERT) {
            if (ul === null)
                parent.appendChild(ux);
            else
                parent.insertBefore(ux, ul);
        }
        ul = ux;
        umax--;
    }
}
// two nodes are "equable" if they are identical (===) or if we can make them the same, i.e. they're 
// Text nodes, which we can reuse with the new text
function equable(u, n, i, us) {
    if (u === n) {
        return true;
    }
    else if (typeof u === 'string' && n instanceof Text) {
        if (n.data !== u)
            n.data = u;
        us[i] = n;
        return true;
    }
    else {
        return false;
    }
}
function appendNodes(parent, array, i, end) {
    var node;
    for (; i < end; i++) {
        node = array[i];
        if (node instanceof Node) {
            parent.appendChild(node);
        }
        else {
            node = array[i] = document.createTextNode(node);
            parent.appendChild(node);
        }
    }
}
function insertOrAppend(parent, node, marker, i, us) {
    if (typeof node === 'string') {
        node = us[i] = document.createTextNode(node);
    }
    if (marker === null)
        parent.appendChild(node);
    else
        parent.insertBefore(node, marker);
}
function normalizeIncomingArray(normalized, array) {
    for (var i = 0, len = array.length; i < len; i++) {
        var item = array[i];
        if (item instanceof Node) {
            normalized.push(item);
        }
        else if (item == null || item === true || item === false) {
            // skip
        }
        else if (Array.isArray(item)) {
            normalizeIncomingArray(normalized, item);
        }
        else if (typeof item === 'string') {
            normalized.push(item);
        }
        else {
            normalized.push(item.toString());
        }
    }
    return normalized;
}
function clear(node) {
    node.textContent = "";
}
// return an array of the indices of ns that comprise the longest increasing subsequence within ns
function longestPositiveIncreasingSubsequence(ns) {
    var seq = [], is = [], l = -1, pre = new Array(ns.length);
    for (var i = 0, len = ns.length; i < len; i++) {
        var n = ns[i];
        if (n < 0)
            continue;
        var j = findGreatestIndexLEQ(seq, n);
        if (j !== -1)
            pre[i] = is[j];
        if (j === l) {
            l++;
            seq[l] = n;
            is[l] = i;
        }
        else if (n < seq[j + 1]) {
            seq[j + 1] = n;
            is[j + 1] = i;
        }
    }
    for (i = is[l]; l >= 0; i = pre[i], l--) {
        seq[l] = i;
    }
    return seq;
}
function findGreatestIndexLEQ(seq, n) {
    // invariant: lo is guaranteed to be index of a value <= n, hi to be >
    // therefore, they actually start out of range: (-1, last + 1)
    var lo = -1, hi = seq.length;
    // fast path for simple increasing sequences
    if (hi > 0 && seq[hi - 1] <= n)
        return hi - 1;
    while (hi - lo > 1) {
        var mid = Math.floor((lo + hi) / 2);
        if (seq[mid] > n) {
            hi = mid;
        }
        else {
            lo = mid;
        }
    }
    return lo;
}


/***/ }),
/* 15 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return getFieldData; });
var 
// pre-seed the caches with a few special cases, so we don't need to check for them in the common cases
htmlFieldCache = {
    // special props
    style: ['style', null, 3 /* Assign */],
    ref: ['ref', null, 2 /* Ignore */],
    fn: ['fn', null, 2 /* Ignore */],
    // attr compat
    class: ['className', null, 0 /* Property */],
    for: ['htmlFor', null, 0 /* Property */],
    "accept-charset": ['acceptCharset', null, 0 /* Property */],
    "http-equiv": ['httpEquiv', null, 0 /* Property */],
    // a few React oddities, mostly disagreeing about casing
    onDoubleClick: ['ondblclick', null, 0 /* Property */],
    spellCheck: ['spellcheck', null, 0 /* Property */],
    allowFullScreen: ['allowFullscreen', null, 0 /* Property */],
    autoCapitalize: ['autocapitalize', null, 0 /* Property */],
    autoFocus: ['autofocus', null, 0 /* Property */],
    autoPlay: ['autoplay', null, 0 /* Property */],
    // other
    // role is part of the ARIA spec but not caught by the aria- attr filter
    role: ['role', null, 1 /* Attribute */]
}, svgFieldCache = {
    // special props
    style: ['style', null, 3 /* Assign */],
    ref: ['ref', null, 2 /* Ignore */],
    fn: ['fn', null, 2 /* Ignore */],
    // property compat
    className: ['class', null, 1 /* Attribute */],
    htmlFor: ['for', null, 1 /* Attribute */],
    tabIndex: ['tabindex', null, 1 /* Attribute */],
    // React compat
    onDoubleClick: ['ondblclick', null, 0 /* Property */],
    // attributes with eccentric casing - some SVG attrs are snake-cased, some camelCased
    allowReorder: ['allowReorder', null, 1 /* Attribute */],
    attributeName: ['attributeName', null, 1 /* Attribute */],
    attributeType: ['attributeType', null, 1 /* Attribute */],
    autoReverse: ['autoReverse', null, 1 /* Attribute */],
    baseFrequency: ['baseFrequency', null, 1 /* Attribute */],
    calcMode: ['calcMode', null, 1 /* Attribute */],
    clipPathUnits: ['clipPathUnits', null, 1 /* Attribute */],
    contentScriptType: ['contentScriptType', null, 1 /* Attribute */],
    contentStyleType: ['contentStyleType', null, 1 /* Attribute */],
    diffuseConstant: ['diffuseConstant', null, 1 /* Attribute */],
    edgeMode: ['edgeMode', null, 1 /* Attribute */],
    externalResourcesRequired: ['externalResourcesRequired', null, 1 /* Attribute */],
    filterRes: ['filterRes', null, 1 /* Attribute */],
    filterUnits: ['filterUnits', null, 1 /* Attribute */],
    gradientTransform: ['gradientTransform', null, 1 /* Attribute */],
    gradientUnits: ['gradientUnits', null, 1 /* Attribute */],
    kernelMatrix: ['kernelMatrix', null, 1 /* Attribute */],
    kernelUnitLength: ['kernelUnitLength', null, 1 /* Attribute */],
    keyPoints: ['keyPoints', null, 1 /* Attribute */],
    keySplines: ['keySplines', null, 1 /* Attribute */],
    keyTimes: ['keyTimes', null, 1 /* Attribute */],
    lengthAdjust: ['lengthAdjust', null, 1 /* Attribute */],
    limitingConeAngle: ['limitingConeAngle', null, 1 /* Attribute */],
    markerHeight: ['markerHeight', null, 1 /* Attribute */],
    markerUnits: ['markerUnits', null, 1 /* Attribute */],
    maskContentUnits: ['maskContentUnits', null, 1 /* Attribute */],
    maskUnits: ['maskUnits', null, 1 /* Attribute */],
    numOctaves: ['numOctaves', null, 1 /* Attribute */],
    pathLength: ['pathLength', null, 1 /* Attribute */],
    patternContentUnits: ['patternContentUnits', null, 1 /* Attribute */],
    patternTransform: ['patternTransform', null, 1 /* Attribute */],
    patternUnits: ['patternUnits', null, 1 /* Attribute */],
    pointsAtX: ['pointsAtX', null, 1 /* Attribute */],
    pointsAtY: ['pointsAtY', null, 1 /* Attribute */],
    pointsAtZ: ['pointsAtZ', null, 1 /* Attribute */],
    preserveAlpha: ['preserveAlpha', null, 1 /* Attribute */],
    preserveAspectRatio: ['preserveAspectRatio', null, 1 /* Attribute */],
    primitiveUnits: ['primitiveUnits', null, 1 /* Attribute */],
    refX: ['refX', null, 1 /* Attribute */],
    refY: ['refY', null, 1 /* Attribute */],
    repeatCount: ['repeatCount', null, 1 /* Attribute */],
    repeatDur: ['repeatDur', null, 1 /* Attribute */],
    requiredExtensions: ['requiredExtensions', null, 1 /* Attribute */],
    requiredFeatures: ['requiredFeatures', null, 1 /* Attribute */],
    specularConstant: ['specularConstant', null, 1 /* Attribute */],
    specularExponent: ['specularExponent', null, 1 /* Attribute */],
    spreadMethod: ['spreadMethod', null, 1 /* Attribute */],
    startOffset: ['startOffset', null, 1 /* Attribute */],
    stdDeviation: ['stdDeviation', null, 1 /* Attribute */],
    stitchTiles: ['stitchTiles', null, 1 /* Attribute */],
    surfaceScale: ['surfaceScale', null, 1 /* Attribute */],
    systemLanguage: ['systemLanguage', null, 1 /* Attribute */],
    tableValues: ['tableValues', null, 1 /* Attribute */],
    targetX: ['targetX', null, 1 /* Attribute */],
    targetY: ['targetY', null, 1 /* Attribute */],
    textLength: ['textLength', null, 1 /* Attribute */],
    viewBox: ['viewBox', null, 1 /* Attribute */],
    viewTarget: ['viewTarget', null, 1 /* Attribute */],
    xChannelSelector: ['xChannelSelector', null, 1 /* Attribute */],
    yChannelSelector: ['yChannelSelector', null, 1 /* Attribute */],
    zoomAndPan: ['zoomAndPan', null, 1 /* Attribute */],
};
var attributeOnlyRx = /-/, deepAttrRx = /^style-/, isAttrOnlyField = function (field) { return attributeOnlyRx.test(field) && !deepAttrRx.test(field); }, propOnlyRx = /^(on|style)/, isPropOnlyField = function (field) { return propOnlyRx.test(field); }, propPartRx = /[a-z][A-Z]/g, getAttrName = function (field) { return field.replace(propPartRx, function (m) { return m[0] + '-' + m[1]; }).toLowerCase(); }, jsxEventPropRx = /^on[A-Z]/, attrPartRx = /\-(?:[a-z]|$)/g, getPropName = function (field) {
    var prop = field.replace(attrPartRx, function (m) { return m.length === 1 ? '' : m[1].toUpperCase(); });
    return jsxEventPropRx.test(prop) ? prop.toLowerCase() : prop;
}, deepPropRx = /^(style)([A-Z])/, buildPropData = function (prop) {
    var m = deepPropRx.exec(prop);
    return m ? [m[2].toLowerCase() + prop.substr(m[0].length), m[1], 0 /* Property */] : [prop, null, 0 /* Property */];
}, attrNamespaces = {
    xlink: "http://www.w3.org/1999/xlink",
    xml: "http://www.w3.org/XML/1998/namespace",
}, attrNamespaceRx = new RegExp("^(" + Object.keys(attrNamespaces).join('|') + ")-(.*)"), buildAttrData = function (attr) {
    var m = attrNamespaceRx.exec(attr);
    return m ? [m[2], attrNamespaces[m[1]], 1 /* Attribute */] : [attr, null, 1 /* Attribute */];
};
var getFieldData = function (field, svg) {
    var cache = svg ? svgFieldCache : htmlFieldCache, cached = cache[field];
    if (cached)
        return cached;
    var attr = svg && !isPropOnlyField(field)
        || !svg && isAttrOnlyField(field), name = attr ? getAttrName(field) : getPropName(field);
    if (name !== field && (cached = cache[name]))
        return cached;
    var data = attr ? buildAttrData(name) : buildPropData(name);
    return cache[field] = data;
};


/***/ }),
/* 16 */
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
    if (t === 'string' || t === 'number') {
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
    else if (Array.isArray(value)) {
        insertArray(value);
    }
    else if (value instanceof Function) {
        __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__index__["S"])(function () {
            insert(range, value());
        });
        good = range.end;
    }
    else if (value !== null && value !== undefined && value !== true && value !== false) {
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
                else if (value !== null && value !== undefined && value !== false && value !== true) {
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
                else if (value !== null && value !== undefined && value !== true && value !== false) {
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
/* 17 */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["b"] = assign;
/* harmony export (immutable) */ __webpack_exports__["a"] = spread;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__dom__ = __webpack_require__(4);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__fieldData__ = __webpack_require__(15);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__index__ = __webpack_require__(1);



function assign(a, b) {
    var props = Object.keys(b);
    for (var i = 0, len = props.length; i < len; i++) {
        var name = props[i];
        a[name] = b[name];
    }
}
function spread(node, obj, svg) {
    var props = Object.keys(obj);
    for (var i = 0, len = props.length; i < len; i++) {
        var name = props[i];
        setField(node, name, obj[name], svg);
    }
}
function setField(node, field, value, svg) {
    var _a = __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_1__fieldData__["a" /* getFieldData */])(field, svg), name = _a[0], namespace = _a[1], flags = _a[2], type = flags & 3 /* Type */;
    if (type === 0 /* Property */) {
        if (namespace)
            node = node[namespace];
        node[name] = value;
    }
    else if (type === 1 /* Attribute */) {
        if (namespace)
            __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_2__index__["setAttributeNS"])(node, namespace, name, value);
        else
            __webpack_require__.i(__WEBPACK_IMPORTED_MODULE_0__dom__["e" /* setAttribute */])(node, name, value);
    }
    else if (type === 3 /* Assign */) {
        if (value && typeof value === 'object')
            assign(node.style, value);
    }
}


/***/ })
/******/ ]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgYmQwM2MxZjdmZjkyMTE0MzhmNTkiLCJ3ZWJwYWNrOi8vLy4vfi9zLWpzL2Rpc3QvZXMvUy5qcyIsIndlYnBhY2s6Ly8vLi9+L3N1cnBsdXMvZXMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL21vZGVscy50cyIsIndlYnBhY2s6Ly8vLi9+L3MtYXJyYXkvZXMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vfi9zdXJwbHVzL2VzL2RvbS5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvY29udHJvbGxlcnMudHMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3BlcnNpc3RlbmNlLnRzIiwid2VicGFjazovLy8uL3NyYy9yb3V0ZXIudHMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3ZpZXdzLnRzeCIsIndlYnBhY2s6Ly8vLi9+L2NsYXNzbmFtZXMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL21haW4udHMiLCJ3ZWJwYWNrOi8vLy4vfi9zdXJwbHVzLW1peGluLWRhdGEvaW5kZXguZXMuanMiLCJ3ZWJwYWNrOi8vLy4vfi9zdXJwbHVzLW1peGluLWZvY3VzL2luZGV4LmVzLmpzIiwid2VicGFjazovLy8uL34vc3VycGx1cy1taXhpbi1vbmtleS9pbmRleC5lcy5qcyIsIndlYnBhY2s6Ly8vLi9+L3N1cnBsdXMvZXMvY29udGVudC5qcyIsIndlYnBhY2s6Ly8vLi9+L3N1cnBsdXMvZXMvZmllbGREYXRhLmpzIiwid2VicGFjazovLy8uL34vc3VycGx1cy9lcy9pbnNlcnQuanMiLCJ3ZWJwYWNrOi8vLy4vfi9zdXJwbHVzL2VzL3NwcmVhZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBLG1EQUEyQyxjQUFjOztBQUV6RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLG1DQUEyQiwwQkFBMEIsRUFBRTtBQUN2RCx5Q0FBaUMsZUFBZTtBQUNoRDtBQUNBO0FBQ0E7O0FBRUE7QUFDQSw4REFBc0QsK0RBQStEOztBQUVySDtBQUNBOztBQUVBO0FBQ0E7Ozs7Ozs7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFDQUFxQztBQUNyQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFDQUFxQyxXQUFXO0FBQ2hEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVCQUF1QixlQUFlO0FBQ3RDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBbUM7QUFDbkMsbUNBQW1DO0FBQ25DLG9DQUFvQztBQUNwQztBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCLGdCQUFnQjtBQUN2QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0Q7QUFDQSxtQkFBbUI7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTs7Ozs7Ozs7OztBQy9HWTtBQUNaO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsOEVBQThFLFdBQVc7QUFDekY7QUFDQTtBQUNBO0FBQ0EseURBQXlELDJCQUEyQjtBQUNwRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQixXQUFXO0FBQzdCO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsZUFBZSxnQkFBZ0I7QUFDL0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDZCQUE2QixrQkFBa0I7QUFDL0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxVQUFVLFNBQVM7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVDQUF1QyxTQUFTO0FBQ2hEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esb0NBQW9DLFNBQVM7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQkFBbUIsUUFBUTtBQUMzQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7QUM3WUE7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVGQUF1RiwrREFBK0QsRUFBRSxrRUFBa0UsK0JBQStCLEVBQUUsOERBQThELGdEQUFnRCwwQkFBMEIsRUFBRSxnQkFBZ0IsRUFBRTtBQUN2Wix1REFBdUQsaURBQWlELEVBQUU7QUFDMUc7QUFDQSxDQUFDO0FBQ0Q7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7QUN2SFk7QUFDWjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSwyQ0FBMkMsU0FBUztBQUNwRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7O0FDeEp1QjtBQUNBO0FBQ0U7QUFDekI7QUFDQTtBQUNBLHVDQUF1QyxTQUFTO0FBQ2hEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVDQUF1QyxTQUFTO0FBQ2hEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Ii4vZGlzdC9tYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gaWRlbnRpdHkgZnVuY3Rpb24gZm9yIGNhbGxpbmcgaGFybW9ueSBpbXBvcnRzIHdpdGggdGhlIGNvcnJlY3QgY29udGV4dFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5pID0gZnVuY3Rpb24odmFsdWUpIHsgcmV0dXJuIHZhbHVlOyB9O1xuXG4gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIGdldHRlcikge1xuIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHtcbiBcdFx0XHRcdGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gXHRcdFx0XHRlbnVtZXJhYmxlOiB0cnVlLFxuIFx0XHRcdFx0Z2V0OiBnZXR0ZXJcbiBcdFx0XHR9KTtcbiBcdFx0fVxuIFx0fTtcblxuIFx0Ly8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubiA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuIFx0XHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cbiBcdFx0XHRmdW5jdGlvbiBnZXREZWZhdWx0KCkgeyByZXR1cm4gbW9kdWxlWydkZWZhdWx0J107IH0gOlxuIFx0XHRcdGZ1bmN0aW9uIGdldE1vZHVsZUV4cG9ydHMoKSB7IHJldHVybiBtb2R1bGU7IH07XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsICdhJywgZ2V0dGVyKTtcbiBcdFx0cmV0dXJuIGdldHRlcjtcbiBcdH07XG5cbiBcdC8vIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpOyB9O1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXyhfX3dlYnBhY2tfcmVxdWlyZV9fLnMgPSAxMCk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gd2VicGFjay9ib290c3RyYXAgYmQwM2MxZjdmZjkyMTE0MzhmNTkiLCIvLyBQdWJsaWMgaW50ZXJmYWNlXG52YXIgUyA9IGZ1bmN0aW9uIFMoZm4sIHZhbHVlKSB7XG4gICAgdmFyIG93bmVyID0gT3duZXIsIHJ1bm5pbmcgPSBSdW5uaW5nTm9kZTtcbiAgICBpZiAob3duZXIgPT09IG51bGwpXG4gICAgICAgIGNvbnNvbGUud2FybihcImNvbXB1dGF0aW9ucyBjcmVhdGVkIHdpdGhvdXQgYSByb290IG9yIHBhcmVudCB3aWxsIG5ldmVyIGJlIGRpc3Bvc2VkXCIpO1xuICAgIHZhciBub2RlID0gbmV3IENvbXB1dGF0aW9uTm9kZShmbiwgdmFsdWUpO1xuICAgIE93bmVyID0gUnVubmluZ05vZGUgPSBub2RlO1xuICAgIGlmIChSdW5uaW5nQ2xvY2sgPT09IG51bGwpIHtcbiAgICAgICAgdG9wbGV2ZWxDb21wdXRhdGlvbihub2RlKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIG5vZGUudmFsdWUgPSBub2RlLmZuKG5vZGUudmFsdWUpO1xuICAgIH1cbiAgICBpZiAob3duZXIgJiYgb3duZXIgIT09IFVOT1dORUQpIHtcbiAgICAgICAgaWYgKG93bmVyLm93bmVkID09PSBudWxsKVxuICAgICAgICAgICAgb3duZXIub3duZWQgPSBbbm9kZV07XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIG93bmVyLm93bmVkLnB1c2gobm9kZSk7XG4gICAgfVxuICAgIE93bmVyID0gb3duZXI7XG4gICAgUnVubmluZ05vZGUgPSBydW5uaW5nO1xuICAgIHJldHVybiBmdW5jdGlvbiBjb21wdXRhdGlvbigpIHtcbiAgICAgICAgaWYgKFJ1bm5pbmdOb2RlICE9PSBudWxsKSB7XG4gICAgICAgICAgICBpZiAobm9kZS5hZ2UgPT09IFJvb3RDbG9jay50aW1lKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5vZGUuc3RhdGUgPT09IFJVTk5JTkcpXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImNpcmN1bGFyIGRlcGVuZGVuY3lcIik7XG4gICAgICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgICAgICB1cGRhdGVOb2RlKG5vZGUpOyAvLyBjaGVja3MgZm9yIHN0YXRlID09PSBTVEFMRSBpbnRlcm5hbGx5LCBzbyBkb24ndCBuZWVkIHRvIGNoZWNrIGhlcmVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxvZ0NvbXB1dGF0aW9uUmVhZChub2RlLCBSdW5uaW5nTm9kZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5vZGUudmFsdWU7XG4gICAgfTtcbn07XG4vLyBjb21wYXRpYmlsaXR5IHdpdGggY29tbW9uanMgc3lzdGVtcyB0aGF0IGV4cGVjdCBkZWZhdWx0IGV4cG9ydCB0byBiZSBhdCByZXF1aXJlKCdzLmpzJykuZGVmYXVsdCByYXRoZXIgdGhhbiBqdXN0IHJlcXVpcmUoJ3MtanMnKVxuT2JqZWN0LmRlZmluZVByb3BlcnR5KFMsICdkZWZhdWx0JywgeyB2YWx1ZTogUyB9KTtcbmV4cG9ydCBkZWZhdWx0IFM7XG5TLnJvb3QgPSBmdW5jdGlvbiByb290KGZuKSB7XG4gICAgdmFyIG93bmVyID0gT3duZXIsIHJvb3QgPSBmbi5sZW5ndGggPT09IDAgPyBVTk9XTkVEIDogbmV3IENvbXB1dGF0aW9uTm9kZShudWxsLCBudWxsKSwgcmVzdWx0ID0gdW5kZWZpbmVkLCBkaXNwb3NlciA9IGZuLmxlbmd0aCA9PT0gMCA/IG51bGwgOiBmdW5jdGlvbiBfZGlzcG9zZSgpIHtcbiAgICAgICAgaWYgKFJ1bm5pbmdDbG9jayAhPT0gbnVsbCkge1xuICAgICAgICAgICAgUm9vdENsb2NrLmRpc3Bvc2VzLmFkZChyb290KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGRpc3Bvc2Uocm9vdCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIE93bmVyID0gcm9vdDtcbiAgICBpZiAoUnVubmluZ0Nsb2NrID09PSBudWxsKSB7XG4gICAgICAgIHJlc3VsdCA9IHRvcExldmVsUm9vdChmbiwgZGlzcG9zZXIsIG93bmVyKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJlc3VsdCA9IGRpc3Bvc2VyID09PSBudWxsID8gZm4oKSA6IGZuKGRpc3Bvc2VyKTtcbiAgICAgICAgT3duZXIgPSBvd25lcjtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5mdW5jdGlvbiB0b3BMZXZlbFJvb3QoZm4sIGRpc3Bvc2VyLCBvd25lcikge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBkaXNwb3NlciA9PT0gbnVsbCA/IGZuKCkgOiBmbihkaXNwb3Nlcik7XG4gICAgfVxuICAgIGZpbmFsbHkge1xuICAgICAgICBPd25lciA9IG93bmVyO1xuICAgIH1cbn1cblMub24gPSBmdW5jdGlvbiBvbihldiwgZm4sIHNlZWQsIG9uY2hhbmdlcykge1xuICAgIGlmIChBcnJheS5pc0FycmF5KGV2KSlcbiAgICAgICAgZXYgPSBjYWxsQWxsKGV2KTtcbiAgICBvbmNoYW5nZXMgPSAhIW9uY2hhbmdlcztcbiAgICByZXR1cm4gUyhvbiwgc2VlZCk7XG4gICAgZnVuY3Rpb24gb24odmFsdWUpIHtcbiAgICAgICAgdmFyIHJ1bm5pbmcgPSBSdW5uaW5nTm9kZTtcbiAgICAgICAgZXYoKTtcbiAgICAgICAgaWYgKG9uY2hhbmdlcylcbiAgICAgICAgICAgIG9uY2hhbmdlcyA9IGZhbHNlO1xuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIFJ1bm5pbmdOb2RlID0gbnVsbDtcbiAgICAgICAgICAgIHZhbHVlID0gZm4odmFsdWUpO1xuICAgICAgICAgICAgUnVubmluZ05vZGUgPSBydW5uaW5nO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG59O1xuZnVuY3Rpb24gY2FsbEFsbChzcykge1xuICAgIHJldHVybiBmdW5jdGlvbiBhbGwoKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3MubGVuZ3RoOyBpKyspXG4gICAgICAgICAgICBzc1tpXSgpO1xuICAgIH07XG59XG5TLmRhdGEgPSBmdW5jdGlvbiBkYXRhKHZhbHVlKSB7XG4gICAgdmFyIG5vZGUgPSBuZXcgRGF0YU5vZGUodmFsdWUpO1xuICAgIHJldHVybiBmdW5jdGlvbiBkYXRhKHZhbHVlKSB7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgaWYgKFJ1bm5pbmdDbG9jayAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGlmIChub2RlLnBlbmRpbmcgIT09IE5PVFBFTkRJTkcpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlICE9PSBub2RlLnBlbmRpbmcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImNvbmZsaWN0aW5nIGNoYW5nZXM6IFwiICsgdmFsdWUgKyBcIiAhPT0gXCIgKyBub2RlLnBlbmRpbmcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBub2RlLnBlbmRpbmcgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgUm9vdENsb2NrLmNoYW5nZXMuYWRkKG5vZGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChub2RlLmxvZyAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICBub2RlLnBlbmRpbmcgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgUm9vdENsb2NrLmNoYW5nZXMuYWRkKG5vZGUpO1xuICAgICAgICAgICAgICAgICAgICBldmVudCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS52YWx1ZSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGlmIChSdW5uaW5nTm9kZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIGxvZ0RhdGFSZWFkKG5vZGUsIFJ1bm5pbmdOb2RlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBub2RlLnZhbHVlO1xuICAgICAgICB9XG4gICAgfTtcbn07XG5TLnZhbHVlID0gZnVuY3Rpb24gdmFsdWUoY3VycmVudCwgZXEpIHtcbiAgICB2YXIgZGF0YSA9IFMuZGF0YShjdXJyZW50KSwgYWdlID0gLTE7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIHZhbHVlKHVwZGF0ZSkge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIGRhdGEoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhciBzYW1lID0gZXEgPyBlcShjdXJyZW50LCB1cGRhdGUpIDogY3VycmVudCA9PT0gdXBkYXRlO1xuICAgICAgICAgICAgaWYgKCFzYW1lKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRpbWUgPSBSb290Q2xvY2sudGltZTtcbiAgICAgICAgICAgICAgICBpZiAoYWdlID09PSB0aW1lKVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJjb25mbGljdGluZyB2YWx1ZXM6IFwiICsgdXBkYXRlICsgXCIgaXMgbm90IHRoZSBzYW1lIGFzIFwiICsgY3VycmVudCk7XG4gICAgICAgICAgICAgICAgYWdlID0gdGltZTtcbiAgICAgICAgICAgICAgICBjdXJyZW50ID0gdXBkYXRlO1xuICAgICAgICAgICAgICAgIGRhdGEodXBkYXRlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB1cGRhdGU7XG4gICAgICAgIH1cbiAgICB9O1xufTtcblMuZnJlZXplID0gZnVuY3Rpb24gZnJlZXplKGZuKSB7XG4gICAgdmFyIHJlc3VsdCA9IHVuZGVmaW5lZDtcbiAgICBpZiAoUnVubmluZ0Nsb2NrICE9PSBudWxsKSB7XG4gICAgICAgIHJlc3VsdCA9IGZuKCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBSdW5uaW5nQ2xvY2sgPSBSb290Q2xvY2s7XG4gICAgICAgIFJ1bm5pbmdDbG9jay5jaGFuZ2VzLnJlc2V0KCk7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXN1bHQgPSBmbigpO1xuICAgICAgICAgICAgZXZlbnQoKTtcbiAgICAgICAgfVxuICAgICAgICBmaW5hbGx5IHtcbiAgICAgICAgICAgIFJ1bm5pbmdDbG9jayA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn07XG5TLnNhbXBsZSA9IGZ1bmN0aW9uIHNhbXBsZShmbikge1xuICAgIHZhciByZXN1bHQsIHJ1bm5pbmcgPSBSdW5uaW5nTm9kZTtcbiAgICBpZiAocnVubmluZyAhPT0gbnVsbCkge1xuICAgICAgICBSdW5uaW5nTm9kZSA9IG51bGw7XG4gICAgICAgIHJlc3VsdCA9IGZuKCk7XG4gICAgICAgIFJ1bm5pbmdOb2RlID0gcnVubmluZztcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHJlc3VsdCA9IGZuKCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59O1xuUy5jbGVhbnVwID0gZnVuY3Rpb24gY2xlYW51cChmbikge1xuICAgIGlmIChPd25lciAhPT0gbnVsbCkge1xuICAgICAgICBpZiAoT3duZXIuY2xlYW51cHMgPT09IG51bGwpXG4gICAgICAgICAgICBPd25lci5jbGVhbnVwcyA9IFtmbl07XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIE93bmVyLmNsZWFudXBzLnB1c2goZm4pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgY29uc29sZS53YXJuKFwiY2xlYW51cHMgY3JlYXRlZCB3aXRob3V0IGEgcm9vdCBvciBwYXJlbnQgd2lsbCBuZXZlciBiZSBydW5cIik7XG4gICAgfVxufTtcbi8vIEludGVybmFsIGltcGxlbWVudGF0aW9uXG4vLy8gR3JhcGggY2xhc3NlcyBhbmQgb3BlcmF0aW9uc1xudmFyIENsb2NrID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIENsb2NrKCkge1xuICAgICAgICB0aGlzLnRpbWUgPSAwO1xuICAgICAgICB0aGlzLmNoYW5nZXMgPSBuZXcgUXVldWUoKTsgLy8gYmF0Y2hlZCBjaGFuZ2VzIHRvIGRhdGEgbm9kZXNcbiAgICAgICAgdGhpcy51cGRhdGVzID0gbmV3IFF1ZXVlKCk7IC8vIGNvbXB1dGF0aW9ucyB0byB1cGRhdGVcbiAgICAgICAgdGhpcy5kaXNwb3NlcyA9IG5ldyBRdWV1ZSgpOyAvLyBkaXNwb3NhbHMgdG8gcnVuIGFmdGVyIGN1cnJlbnQgYmF0Y2ggb2YgdXBkYXRlcyBmaW5pc2hlc1xuICAgIH1cbiAgICByZXR1cm4gQ2xvY2s7XG59KCkpO1xudmFyIERhdGFOb2RlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIERhdGFOb2RlKHZhbHVlKSB7XG4gICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5wZW5kaW5nID0gTk9UUEVORElORztcbiAgICAgICAgdGhpcy5sb2cgPSBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gRGF0YU5vZGU7XG59KCkpO1xudmFyIENvbXB1dGF0aW9uTm9kZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBDb21wdXRhdGlvbk5vZGUoZm4sIHZhbHVlKSB7XG4gICAgICAgIHRoaXMuZm4gPSBmbjtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHZhbHVlO1xuICAgICAgICB0aGlzLnN0YXRlID0gQ1VSUkVOVDtcbiAgICAgICAgdGhpcy5zb3VyY2UxID0gbnVsbDtcbiAgICAgICAgdGhpcy5zb3VyY2Uxc2xvdCA9IDA7XG4gICAgICAgIHRoaXMuc291cmNlcyA9IG51bGw7XG4gICAgICAgIHRoaXMuc291cmNlc2xvdHMgPSBudWxsO1xuICAgICAgICB0aGlzLmxvZyA9IG51bGw7XG4gICAgICAgIHRoaXMub3duZWQgPSBudWxsO1xuICAgICAgICB0aGlzLmNsZWFudXBzID0gbnVsbDtcbiAgICAgICAgdGhpcy5hZ2UgPSBSb290Q2xvY2sudGltZTtcbiAgICB9XG4gICAgcmV0dXJuIENvbXB1dGF0aW9uTm9kZTtcbn0oKSk7XG52YXIgTG9nID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIExvZygpIHtcbiAgICAgICAgdGhpcy5ub2RlMSA9IG51bGw7XG4gICAgICAgIHRoaXMubm9kZTFzbG90ID0gMDtcbiAgICAgICAgdGhpcy5ub2RlcyA9IG51bGw7XG4gICAgICAgIHRoaXMubm9kZXNsb3RzID0gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIExvZztcbn0oKSk7XG52YXIgUXVldWUgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gUXVldWUoKSB7XG4gICAgICAgIHRoaXMuaXRlbXMgPSBbXTtcbiAgICAgICAgdGhpcy5jb3VudCA9IDA7XG4gICAgfVxuICAgIFF1ZXVlLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5jb3VudCA9IDA7XG4gICAgfTtcbiAgICBRdWV1ZS5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICAgICAgdGhpcy5pdGVtc1t0aGlzLmNvdW50KytdID0gaXRlbTtcbiAgICB9O1xuICAgIFF1ZXVlLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgdmFyIGl0ZW1zID0gdGhpcy5pdGVtcztcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNvdW50OyBpKyspIHtcbiAgICAgICAgICAgIGZuKGl0ZW1zW2ldKTtcbiAgICAgICAgICAgIGl0ZW1zW2ldID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNvdW50ID0gMDtcbiAgICB9O1xuICAgIHJldHVybiBRdWV1ZTtcbn0oKSk7XG4vLyBDb25zdGFudHNcbnZhciBOT1RQRU5ESU5HID0ge30sIENVUlJFTlQgPSAwLCBTVEFMRSA9IDEsIFJVTk5JTkcgPSAyO1xuLy8gXCJHbG9iYWxzXCIgdXNlZCB0byBrZWVwIHRyYWNrIG9mIGN1cnJlbnQgc3lzdGVtIHN0YXRlXG52YXIgUm9vdENsb2NrID0gbmV3IENsb2NrKCksIFJ1bm5pbmdDbG9jayA9IG51bGwsIC8vIGN1cnJlbnRseSBydW5uaW5nIGNsb2NrIFxuUnVubmluZ05vZGUgPSBudWxsLCAvLyBjdXJyZW50bHkgcnVubmluZyBjb21wdXRhdGlvblxuT3duZXIgPSBudWxsLCAvLyBvd25lciBmb3IgbmV3IGNvbXB1dGF0aW9uc1xuVU5PV05FRCA9IG5ldyBDb21wdXRhdGlvbk5vZGUobnVsbCwgbnVsbCk7XG4vLyBGdW5jdGlvbnNcbmZ1bmN0aW9uIGxvZ1JlYWQoZnJvbSwgdG8pIHtcbiAgICB2YXIgZnJvbXNsb3QsIHRvc2xvdCA9IHRvLnNvdXJjZTEgPT09IG51bGwgPyAtMSA6IHRvLnNvdXJjZXMgPT09IG51bGwgPyAwIDogdG8uc291cmNlcy5sZW5ndGg7XG4gICAgaWYgKGZyb20ubm9kZTEgPT09IG51bGwpIHtcbiAgICAgICAgZnJvbS5ub2RlMSA9IHRvO1xuICAgICAgICBmcm9tLm5vZGUxc2xvdCA9IHRvc2xvdDtcbiAgICAgICAgZnJvbXNsb3QgPSAtMTtcbiAgICB9XG4gICAgZWxzZSBpZiAoZnJvbS5ub2RlcyA9PT0gbnVsbCkge1xuICAgICAgICBmcm9tLm5vZGVzID0gW3RvXTtcbiAgICAgICAgZnJvbS5ub2Rlc2xvdHMgPSBbdG9zbG90XTtcbiAgICAgICAgZnJvbXNsb3QgPSAwO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZnJvbXNsb3QgPSBmcm9tLm5vZGVzLmxlbmd0aDtcbiAgICAgICAgZnJvbS5ub2Rlcy5wdXNoKHRvKTtcbiAgICAgICAgZnJvbS5ub2Rlc2xvdHMucHVzaCh0b3Nsb3QpO1xuICAgIH1cbiAgICBpZiAodG8uc291cmNlMSA9PT0gbnVsbCkge1xuICAgICAgICB0by5zb3VyY2UxID0gZnJvbTtcbiAgICAgICAgdG8uc291cmNlMXNsb3QgPSBmcm9tc2xvdDtcbiAgICB9XG4gICAgZWxzZSBpZiAodG8uc291cmNlcyA9PT0gbnVsbCkge1xuICAgICAgICB0by5zb3VyY2VzID0gW2Zyb21dO1xuICAgICAgICB0by5zb3VyY2VzbG90cyA9IFtmcm9tc2xvdF07XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB0by5zb3VyY2VzLnB1c2goZnJvbSk7XG4gICAgICAgIHRvLnNvdXJjZXNsb3RzLnB1c2goZnJvbXNsb3QpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGxvZ0RhdGFSZWFkKGRhdGEsIHRvKSB7XG4gICAgaWYgKGRhdGEubG9nID09PSBudWxsKVxuICAgICAgICBkYXRhLmxvZyA9IG5ldyBMb2coKTtcbiAgICBsb2dSZWFkKGRhdGEubG9nLCB0byk7XG59XG5mdW5jdGlvbiBsb2dDb21wdXRhdGlvblJlYWQobm9kZSwgdG8pIHtcbiAgICBpZiAobm9kZS5sb2cgPT09IG51bGwpXG4gICAgICAgIG5vZGUubG9nID0gbmV3IExvZygpO1xuICAgIGxvZ1JlYWQobm9kZS5sb2csIHRvKTtcbn1cbmZ1bmN0aW9uIGV2ZW50KCkge1xuICAgIC8vIGIvYyB3ZSBtaWdodCBiZSB1bmRlciBhIHRvcCBsZXZlbCBTLnJvb3QoKSwgaGF2ZSB0byBwcmVzZXJ2ZSBjdXJyZW50IHJvb3RcbiAgICB2YXIgb3duZXIgPSBPd25lcjtcbiAgICBSb290Q2xvY2sudXBkYXRlcy5yZXNldCgpO1xuICAgIFJvb3RDbG9jay50aW1lKys7XG4gICAgdHJ5IHtcbiAgICAgICAgcnVuKFJvb3RDbG9jayk7XG4gICAgfVxuICAgIGZpbmFsbHkge1xuICAgICAgICBSdW5uaW5nQ2xvY2sgPSBSdW5uaW5nTm9kZSA9IG51bGw7XG4gICAgICAgIE93bmVyID0gb3duZXI7XG4gICAgfVxufVxuZnVuY3Rpb24gdG9wbGV2ZWxDb21wdXRhdGlvbihub2RlKSB7XG4gICAgUnVubmluZ0Nsb2NrID0gUm9vdENsb2NrO1xuICAgIFJvb3RDbG9jay5jaGFuZ2VzLnJlc2V0KCk7XG4gICAgUm9vdENsb2NrLnVwZGF0ZXMucmVzZXQoKTtcbiAgICB0cnkge1xuICAgICAgICBub2RlLnZhbHVlID0gbm9kZS5mbihub2RlLnZhbHVlKTtcbiAgICAgICAgaWYgKFJvb3RDbG9jay5jaGFuZ2VzLmNvdW50ID4gMCB8fCBSb290Q2xvY2sudXBkYXRlcy5jb3VudCA+IDApIHtcbiAgICAgICAgICAgIFJvb3RDbG9jay50aW1lKys7XG4gICAgICAgICAgICBydW4oUm9vdENsb2NrKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmaW5hbGx5IHtcbiAgICAgICAgUnVubmluZ0Nsb2NrID0gT3duZXIgPSBSdW5uaW5nTm9kZSA9IG51bGw7XG4gICAgfVxufVxuZnVuY3Rpb24gcnVuKGNsb2NrKSB7XG4gICAgdmFyIHJ1bm5pbmcgPSBSdW5uaW5nQ2xvY2ssIGNvdW50ID0gMDtcbiAgICBSdW5uaW5nQ2xvY2sgPSBjbG9jaztcbiAgICBjbG9jay5kaXNwb3Nlcy5yZXNldCgpO1xuICAgIC8vIGZvciBlYWNoIGJhdGNoIC4uLlxuICAgIHdoaWxlIChjbG9jay5jaGFuZ2VzLmNvdW50ICE9PSAwIHx8IGNsb2NrLnVwZGF0ZXMuY291bnQgIT09IDAgfHwgY2xvY2suZGlzcG9zZXMuY291bnQgIT09IDApIHtcbiAgICAgICAgaWYgKGNvdW50ID4gMClcbiAgICAgICAgICAgIGNsb2NrLnRpbWUrKztcbiAgICAgICAgY2xvY2suY2hhbmdlcy5ydW4oYXBwbHlEYXRhQ2hhbmdlKTtcbiAgICAgICAgY2xvY2sudXBkYXRlcy5ydW4odXBkYXRlTm9kZSk7XG4gICAgICAgIGNsb2NrLmRpc3Bvc2VzLnJ1bihkaXNwb3NlKTtcbiAgICAgICAgLy8gaWYgdGhlcmUgYXJlIHN0aWxsIGNoYW5nZXMgYWZ0ZXIgZXhjZXNzaXZlIGJhdGNoZXMsIGFzc3VtZSBydW5hd2F5ICAgICAgICAgICAgXG4gICAgICAgIGlmIChjb3VudCsrID4gMWU1KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJSdW5hd2F5IGNsb2NrIGRldGVjdGVkXCIpO1xuICAgICAgICB9XG4gICAgfVxuICAgIFJ1bm5pbmdDbG9jayA9IHJ1bm5pbmc7XG59XG5mdW5jdGlvbiBhcHBseURhdGFDaGFuZ2UoZGF0YSkge1xuICAgIGRhdGEudmFsdWUgPSBkYXRhLnBlbmRpbmc7XG4gICAgZGF0YS5wZW5kaW5nID0gTk9UUEVORElORztcbiAgICBpZiAoZGF0YS5sb2cpXG4gICAgICAgIG1hcmtDb21wdXRhdGlvbnNTdGFsZShkYXRhLmxvZyk7XG59XG5mdW5jdGlvbiBtYXJrQ29tcHV0YXRpb25zU3RhbGUobG9nKSB7XG4gICAgdmFyIG5vZGUxID0gbG9nLm5vZGUxLCBub2RlcyA9IGxvZy5ub2RlcztcbiAgICAvLyBtYXJrIGFsbCBkb3duc3RyZWFtIG5vZGVzIHN0YWxlIHdoaWNoIGhhdmVuJ3QgYmVlbiBhbHJlYWR5XG4gICAgaWYgKG5vZGUxICE9PSBudWxsKVxuICAgICAgICBtYXJrTm9kZVN0YWxlKG5vZGUxKTtcbiAgICBpZiAobm9kZXMgIT09IG51bGwpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IG5vZGVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBtYXJrTm9kZVN0YWxlKG5vZGVzW2ldKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIG1hcmtOb2RlU3RhbGUobm9kZSkge1xuICAgIHZhciB0aW1lID0gUm9vdENsb2NrLnRpbWU7XG4gICAgaWYgKG5vZGUuYWdlIDwgdGltZSkge1xuICAgICAgICBub2RlLmFnZSA9IHRpbWU7XG4gICAgICAgIG5vZGUuc3RhdGUgPSBTVEFMRTtcbiAgICAgICAgUm9vdENsb2NrLnVwZGF0ZXMuYWRkKG5vZGUpO1xuICAgICAgICBpZiAobm9kZS5vd25lZCAhPT0gbnVsbClcbiAgICAgICAgICAgIG1hcmtPd25lZE5vZGVzRm9yRGlzcG9zYWwobm9kZS5vd25lZCk7XG4gICAgICAgIGlmIChub2RlLmxvZyAhPT0gbnVsbClcbiAgICAgICAgICAgIG1hcmtDb21wdXRhdGlvbnNTdGFsZShub2RlLmxvZyk7XG4gICAgfVxufVxuZnVuY3Rpb24gbWFya093bmVkTm9kZXNGb3JEaXNwb3NhbChvd25lZCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3duZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGNoaWxkID0gb3duZWRbaV07XG4gICAgICAgIGNoaWxkLmFnZSA9IFJvb3RDbG9jay50aW1lO1xuICAgICAgICBjaGlsZC5zdGF0ZSA9IENVUlJFTlQ7XG4gICAgICAgIGlmIChjaGlsZC5vd25lZCAhPT0gbnVsbClcbiAgICAgICAgICAgIG1hcmtPd25lZE5vZGVzRm9yRGlzcG9zYWwoY2hpbGQub3duZWQpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHVwZGF0ZU5vZGUobm9kZSkge1xuICAgIGlmIChub2RlLnN0YXRlID09PSBTVEFMRSkge1xuICAgICAgICB2YXIgb3duZXIgPSBPd25lciwgcnVubmluZyA9IFJ1bm5pbmdOb2RlO1xuICAgICAgICBPd25lciA9IFJ1bm5pbmdOb2RlID0gbm9kZTtcbiAgICAgICAgbm9kZS5zdGF0ZSA9IFJVTk5JTkc7XG4gICAgICAgIGNsZWFudXAobm9kZSwgZmFsc2UpO1xuICAgICAgICBub2RlLnZhbHVlID0gbm9kZS5mbihub2RlLnZhbHVlKTtcbiAgICAgICAgbm9kZS5zdGF0ZSA9IENVUlJFTlQ7XG4gICAgICAgIE93bmVyID0gb3duZXI7XG4gICAgICAgIFJ1bm5pbmdOb2RlID0gcnVubmluZztcbiAgICB9XG59XG5mdW5jdGlvbiBjbGVhbnVwKG5vZGUsIGZpbmFsKSB7XG4gICAgdmFyIHNvdXJjZTEgPSBub2RlLnNvdXJjZTEsIHNvdXJjZXMgPSBub2RlLnNvdXJjZXMsIHNvdXJjZXNsb3RzID0gbm9kZS5zb3VyY2VzbG90cywgY2xlYW51cHMgPSBub2RlLmNsZWFudXBzLCBvd25lZCA9IG5vZGUub3duZWQsIGksIGxlbjtcbiAgICBpZiAoY2xlYW51cHMgIT09IG51bGwpIHtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IGNsZWFudXBzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjbGVhbnVwc1tpXShmaW5hbCk7XG4gICAgICAgIH1cbiAgICAgICAgbm9kZS5jbGVhbnVwcyA9IG51bGw7XG4gICAgfVxuICAgIGlmIChvd25lZCAhPT0gbnVsbCkge1xuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgb3duZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGRpc3Bvc2Uob3duZWRbaV0pO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUub3duZWQgPSBudWxsO1xuICAgIH1cbiAgICBpZiAoc291cmNlMSAhPT0gbnVsbCkge1xuICAgICAgICBjbGVhbnVwU291cmNlKHNvdXJjZTEsIG5vZGUuc291cmNlMXNsb3QpO1xuICAgICAgICBub2RlLnNvdXJjZTEgPSBudWxsO1xuICAgIH1cbiAgICBpZiAoc291cmNlcyAhPT0gbnVsbCkge1xuICAgICAgICBmb3IgKGkgPSAwLCBsZW4gPSBzb3VyY2VzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBjbGVhbnVwU291cmNlKHNvdXJjZXMucG9wKCksIHNvdXJjZXNsb3RzLnBvcCgpKTtcbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIGNsZWFudXBTb3VyY2Uoc291cmNlLCBzbG90KSB7XG4gICAgdmFyIG5vZGVzID0gc291cmNlLm5vZGVzLCBub2Rlc2xvdHMgPSBzb3VyY2Uubm9kZXNsb3RzLCBsYXN0LCBsYXN0c2xvdDtcbiAgICBpZiAoc2xvdCA9PT0gLTEpIHtcbiAgICAgICAgc291cmNlLm5vZGUxID0gbnVsbDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGxhc3QgPSBub2Rlcy5wb3AoKTtcbiAgICAgICAgbGFzdHNsb3QgPSBub2Rlc2xvdHMucG9wKCk7XG4gICAgICAgIGlmIChzbG90ICE9PSBub2Rlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIG5vZGVzW3Nsb3RdID0gbGFzdDtcbiAgICAgICAgICAgIG5vZGVzbG90c1tzbG90XSA9IGxhc3RzbG90O1xuICAgICAgICAgICAgaWYgKGxhc3RzbG90ID09PSAtMSkge1xuICAgICAgICAgICAgICAgIGxhc3Quc291cmNlMXNsb3QgPSBzbG90O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbGFzdC5zb3VyY2VzbG90c1tsYXN0c2xvdF0gPSBzbG90O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gZGlzcG9zZShub2RlKSB7XG4gICAgbm9kZS5mbiA9IG51bGw7XG4gICAgbm9kZS5sb2cgPSBudWxsO1xuICAgIGNsZWFudXAobm9kZSwgdHJ1ZSk7XG59XG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL34vcy1qcy9kaXN0L2VzL1MuanNcbi8vIG1vZHVsZSBpZCA9IDBcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwiZXhwb3J0IHsgaW5zZXJ0IH0gZnJvbSAnLi9pbnNlcnQnO1xuZXhwb3J0IHsgY29udGVudCB9IGZyb20gJy4vY29udGVudCc7XG5leHBvcnQgKiBmcm9tICcuL2RvbSc7XG5leHBvcnQgeyBzcHJlYWQsIGFzc2lnbiB9IGZyb20gJy4vc3ByZWFkJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgUyB9IGZyb20gJ3MtanMnO1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9+L3N1cnBsdXMvZXMvaW5kZXguanNcbi8vIG1vZHVsZSBpZCA9IDFcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwiaW1wb3J0IFMsIHsgRGF0YVNpZ25hbCB9IGZyb20gJ3MtanMnO1xyXG5pbXBvcnQgU0FycmF5IGZyb20gJ3MtYXJyYXknO1xyXG5cclxuLy8gb3VyIFRvRG8gbW9kZWxcclxuZXhwb3J0IGNvbnN0IFRvRG8gPSAodGl0bGUgOiBzdHJpbmcsIGNvbXBsZXRlZCA6IGJvb2xlYW4pID0+ICh7XHJcbiAgICB0aXRsZToganNvbmFibGUoUy52YWx1ZSh0aXRsZSkpLFxyXG4gICAgY29tcGxldGVkOiBqc29uYWJsZShTLnZhbHVlKGNvbXBsZXRlZCkpXHJcbn0pO1xyXG5cclxuZXhwb3J0IHR5cGUgVG9EbyA9IHR5cGVvZiB0b0RvVHlwZTsgY29uc3QgdG9Eb1R5cGUgPSByZXR1cm5UeXBlKFRvRG8pO1xyXG5cclxuLy8gb3VyIG1haW4gbW9kZWxcclxuZXhwb3J0IGNvbnN0IFRvRG9zTW9kZWwgPSAodG9kb3M6IFRvRG9bXSkgPT4gKHtcclxuICAgIHRvZG9zOiBqc29uYWJsZShTQXJyYXkodG9kb3MpKVxyXG59KTtcclxuXHJcbmV4cG9ydCB0eXBlIFRvRG9zTW9kZWwgPSB0eXBlb2YgdG9Eb3NNb2RlbFR5cGU7IGNvbnN0IHRvRG9zTW9kZWxUeXBlID0gcmV0dXJuVHlwZShUb0Rvc01vZGVsKTtcclxuXHJcbi8vIEEgY291cGxlIHNtYWxsIHV0aWxpdGllc1xyXG5cclxuLy8gVHlwZVNjcmlwdCB1dGlsaXR5OiBkbyBhIGxpdHRsZSBnZW5lcmljIHBhdHRlcm4gbWF0Y2hpbmcgdG8gZXh0cmFjdCB0aGUgcmV0dXJuIHR5cGUgb2YgYW55IGZ1bmN0aW9uLlxyXG4vLyBMZXRzIHVzIG5hbWUgdGhhdCByZXR1cm4gdHlwZSBmb3IgdXNhZ2UgaW4gb3RoZXIgZnVuY3Rpb24ncyBzaWduYXR1cmVzLlxyXG4vLyAgICAgY29uc3QgZm9vUmV0dXJuVHlwZSA9IHJldHVyblR5cGUoRm9vKTtcclxuLy8gICAgIHR5cGUgRm9vID0gdHlwZW9mIGZvb1JldHVyblR5cGU7XHJcbmV4cG9ydCBmdW5jdGlvbiByZXR1cm5UeXBlPFQ+KGZuIDogKC4uLmFyZ3M6IGFueVtdKSA9PiBUKSA6IFQgeyBcclxuICAgIHJldHVybiBudWxsISBhcyBUOyBcclxufVxyXG5cclxuLy8gTWFrZSBhbnkgc2lnbmFsIGpzb25hYmxlIGJ5IGFkZGluZyBhIHRvSlNPTiBtZXRob2QgdGhhdCBleHRyYWN0cyBpdHMgdmFsdWUgZHVyaW5nIEpTT05pemF0aW9uXHJcbmZ1bmN0aW9uIGpzb25hYmxlPFQgZXh0ZW5kcyAoKSA9PiBhbnk+KHMgOiBUKSA6IFQgIHsgXHJcbiAgICAocyBhcyBhbnkpLnRvSlNPTiA9IHRvSlNPTjtcclxuICAgIHJldHVybiBzOyBcclxufVxyXG5cclxuZnVuY3Rpb24gdG9KU09OKHRoaXMgOiAoKSA9PiBhbnkpIHtcclxuICAgIHZhciBqc29uID0gdGhpcygpO1xyXG4gICAgLy8gaWYgdGhlIHZhbHVlIGhhcyBpdCdzIG93biB0b0pTT04sIGNhbGwgaXQgbm93XHJcbiAgICBpZiAoanNvbiAmJiBqc29uLnRvSlNPTikganNvbiA9IGpzb24udG9KU09OKCk7XHJcbiAgICByZXR1cm4ganNvbjtcclxufVxyXG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvbW9kZWxzLnRzIiwiLy8gc3luY2hyb25vdXMgYXJyYXkgc2lnbmFscyBmb3IgUy5qc1xuaW1wb3J0IFMgZnJvbSBcInMtanNcIjtcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIFNBcnJheSh2YWx1ZXMpIHtcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkodmFsdWVzKSlcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiU0FycmF5IG11c3QgYmUgaW5pdGlhbGl6ZWQgd2l0aCBhbiBhcnJheVwiKTtcbiAgICB2YXIgZGlydHkgPSBTLmRhdGEoZmFsc2UpLCBtdXRhdGlvbnMgPSBbXSwgbXV0Y291bnQgPSAwLCBwb3BzID0gMCwgc2hpZnRzID0gMCwgZGF0YSA9IFMucm9vdChmdW5jdGlvbiAoKSB7IHJldHVybiBTLm9uKGRpcnR5LCB1cGRhdGUsIHZhbHVlcywgdHJ1ZSk7IH0pO1xuICAgIC8vIGFkZCBtdXRhdG9yc1xuICAgIHZhciBhcnJheSA9IGZ1bmN0aW9uIGFycmF5KG5ld3ZhbHVlcykge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIG11dGF0aW9uKGZ1bmN0aW9uIGFycmF5KCkgeyB2YWx1ZXMgPSBuZXd2YWx1ZXM7IH0pO1xuICAgICAgICAgICAgcmV0dXJuIG5ld3ZhbHVlcztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBkYXRhKCk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIGFycmF5LnB1c2ggPSBwdXNoO1xuICAgIGFycmF5LnBvcCA9IHBvcDtcbiAgICBhcnJheS51bnNoaWZ0ID0gdW5zaGlmdDtcbiAgICBhcnJheS5zaGlmdCA9IHNoaWZ0O1xuICAgIGFycmF5LnNwbGljZSA9IHNwbGljZTtcbiAgICAvLyBub3QgRVM1XG4gICAgYXJyYXkucmVtb3ZlID0gcmVtb3ZlO1xuICAgIGFycmF5LnJlbW92ZUFsbCA9IHJlbW92ZUFsbDtcbiAgICBsaWZ0KGFycmF5KTtcbiAgICByZXR1cm4gYXJyYXk7XG4gICAgZnVuY3Rpb24gbXV0YXRpb24obSkge1xuICAgICAgICBtdXRhdGlvbnNbbXV0Y291bnQrK10gPSBtO1xuICAgICAgICBkaXJ0eSh0cnVlKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gdXBkYXRlKCkge1xuICAgICAgICBpZiAocG9wcylcbiAgICAgICAgICAgIHZhbHVlcy5zcGxpY2UodmFsdWVzLmxlbmd0aCAtIHBvcHMsIHBvcHMpO1xuICAgICAgICBpZiAoc2hpZnRzKVxuICAgICAgICAgICAgdmFsdWVzLnNwbGljZSgwLCBzaGlmdHMpO1xuICAgICAgICBwb3BzID0gMDtcbiAgICAgICAgc2hpZnRzID0gMDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtdXRjb3VudDsgaSsrKSB7XG4gICAgICAgICAgICBtdXRhdGlvbnNbaV0oKTtcbiAgICAgICAgICAgIG11dGF0aW9uc1tpXSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgbXV0Y291bnQgPSAwO1xuICAgICAgICByZXR1cm4gdmFsdWVzO1xuICAgIH1cbiAgICAvLyBtdXRhdG9yc1xuICAgIGZ1bmN0aW9uIHB1c2goaXRlbSkge1xuICAgICAgICBtdXRhdGlvbihmdW5jdGlvbiBwdXNoKCkgeyB2YWx1ZXMucHVzaChpdGVtKTsgfSk7XG4gICAgICAgIHJldHVybiBhcnJheTtcbiAgICB9XG4gICAgZnVuY3Rpb24gcG9wKCkge1xuICAgICAgICBhcnJheSgpO1xuICAgICAgICBpZiAoKHBvcHMgKyBzaGlmdHMpIDwgdmFsdWVzLmxlbmd0aCkge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gdmFsdWVzW3ZhbHVlcy5sZW5ndGggLSArK3BvcHNdO1xuICAgICAgICAgICAgZGlydHkodHJ1ZSk7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gdW5zaGlmdChpdGVtKSB7XG4gICAgICAgIG11dGF0aW9uKGZ1bmN0aW9uIHVuc2hpZnQoKSB7IHZhbHVlcy51bnNoaWZ0KGl0ZW0pOyB9KTtcbiAgICAgICAgcmV0dXJuIGFycmF5O1xuICAgIH1cbiAgICBmdW5jdGlvbiBzaGlmdCgpIHtcbiAgICAgICAgYXJyYXkoKTtcbiAgICAgICAgaWYgKChwb3BzICsgc2hpZnRzKSA8IHZhbHVlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHZhbHVlc1tzaGlmdHMrK107XG4gICAgICAgICAgICBkaXJ0eSh0cnVlKTtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBzcGxpY2UoKSB7XG4gICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgbXV0YXRpb24oZnVuY3Rpb24gc3BsaWNlKCkgeyBBcnJheS5wcm90b3R5cGUuc3BsaWNlLmFwcGx5KHZhbHVlcywgYXJncyk7IH0pO1xuICAgICAgICByZXR1cm4gYXJyYXk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJlbW92ZShpdGVtKSB7XG4gICAgICAgIG11dGF0aW9uKGZ1bmN0aW9uIHJlbW92ZSgpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmFsdWVzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlc1tpXSA9PT0gaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZXMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gYXJyYXk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHJlbW92ZUFsbChpdGVtKSB7XG4gICAgICAgIG11dGF0aW9uKGZ1bmN0aW9uIHJlbW92ZUFsbCgpIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmFsdWVzLmxlbmd0aDspIHtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWVzW2ldID09PSBpdGVtKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlcy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpKys7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGFycmF5O1xuICAgIH1cbn1cbi8vIHV0aWwgdG8gYWRkIHRyYW5zZm9ybWVyIG1ldGhvZHNcbmV4cG9ydCBmdW5jdGlvbiBsaWZ0KHNlcSkge1xuICAgIHZhciBfc2VxID0gc2VxO1xuICAgIF9zZXEuY29uY2F0ID0gY2hhaW5Db25jYXQ7XG4gICAgX3NlcS5ldmVyeSA9IGNoYWluRXZlcnk7XG4gICAgX3NlcS5maWx0ZXIgPSBjaGFpbkZpbHRlcjtcbiAgICBfc2VxLmZpbmQgPSBjaGFpbkZpbmQ7XG4gICAgLy9zLmZpbmRJbmRleCA9IGZpbmRJbmRleDtcbiAgICBfc2VxLmZvckVhY2ggPSBjaGFpbkZvckVhY2g7XG4gICAgX3NlcS5pbmNsdWRlcyA9IGNoYWluSW5jbHVkZXM7XG4gICAgLy9zLmluZGV4T2YgICA9IGluZGV4T2Y7XG4gICAgLy9zLmpvaW4gICAgICA9IGpvaW47XG4gICAgLy9zLmxhc3RJbmRleE9mID0gbGFzdEluZGV4T2Y7XG4gICAgX3NlcS5tYXAgPSBjaGFpbk1hcDtcbiAgICBfc2VxLnNvcnQgPSBjaGFpblNvcnQ7XG4gICAgX3NlcS5yZWR1Y2UgPSBjaGFpblJlZHVjZTtcbiAgICBfc2VxLnJlZHVjZVJpZ2h0ID0gY2hhaW5SZWR1Y2VSaWdodDtcbiAgICBfc2VxLnJldmVyc2UgPSBjaGFpblJldmVyc2U7XG4gICAgX3NlcS5zbGljZSA9IGNoYWluU2xpY2U7XG4gICAgX3NlcS5zb21lID0gY2hhaW5Tb21lO1xuICAgIC8vIG5vbi1FUzUgdHJhbnNmb3JtZXJzXG4gICAgX3NlcS5tYXBTID0gY2hhaW5NYXBTO1xuICAgIF9zZXEubWFwU2FtcGxlID0gY2hhaW5NYXBTYW1wbGU7XG4gICAgX3NlcS5tYXBTZXF1ZW50aWFsbHkgPSBjaGFpbk1hcFNlcXVlbnRpYWxseTtcbiAgICBfc2VxLm9yZGVyQnkgPSBjaGFpbk9yZGVyQnk7XG4gICAgcmV0dXJuIF9zZXE7XG59XG5leHBvcnQgZnVuY3Rpb24gbWFwUyhzZXEsIGVudGVyLCBleGl0LCBtb3ZlKSB7XG4gICAgdmFyIGl0ZW1zID0gW10sIG1hcHBlZCA9IFtdLCBkaXNwb3NlcnMgPSBbXSwgbGVuID0gMDtcbiAgICBTKGZ1bmN0aW9uICgpIHsgUy5jbGVhbnVwKGZ1bmN0aW9uICgpIHsgZGlzcG9zZXJzLmZvckVhY2goZnVuY3Rpb24gKGQpIHsgZCgpOyB9KTsgfSk7IH0pO1xuICAgIHJldHVybiBTLm9uKHNlcSwgZnVuY3Rpb24gbWFwUygpIHtcbiAgICAgICAgdmFyIG5ld19pdGVtcyA9IHNlcSgpLCBuZXdfbGVuID0gbmV3X2l0ZW1zLmxlbmd0aCwgdGVtcCA9IG5ldyBBcnJheShuZXdfbGVuKSwgdGVtcGRpc3Bvc2VycyA9IG5ldyBBcnJheShuZXdfbGVuKSwgZnJvbSA9IG51bGwsIHRvID0gbnVsbCwgaSwgaiwgaywgaXRlbTtcbiAgICAgICAgaWYgKG1vdmUpXG4gICAgICAgICAgICBmcm9tID0gW10sIHRvID0gW107XG4gICAgICAgIC8vIDEpIHN0ZXAgdGhyb3VnaCBhbGwgb2xkIGl0ZW1zIGFuZCBzZWUgaWYgdGhleSBjYW4gYmUgZm91bmQgaW4gdGhlIG5ldyBzZXQ7IGlmIHNvLCBzYXZlIHRoZW0gaW4gYSB0ZW1wIGFycmF5IGFuZCBtYXJrIHRoZW0gbW92ZWQ7IGlmIG5vdCwgZXhpdCB0aGVtXG4gICAgICAgIE5FWFQ6IGZvciAoaSA9IDAsIGsgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGl0ZW0gPSBpdGVtc1tpXTtcbiAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBuZXdfbGVuOyBqKyssIGsgPSAoayArIDEpICUgbmV3X2xlbikge1xuICAgICAgICAgICAgICAgIGlmIChpdGVtID09PSBuZXdfaXRlbXNba10gJiYgIXRlbXAuaGFzT3duUHJvcGVydHkoay50b1N0cmluZygpKSkge1xuICAgICAgICAgICAgICAgICAgICB0ZW1wW2tdID0gbWFwcGVkW2ldO1xuICAgICAgICAgICAgICAgICAgICB0ZW1wZGlzcG9zZXJzW2tdID0gZGlzcG9zZXJzW2ldO1xuICAgICAgICAgICAgICAgICAgICBpZiAobW92ZSAmJiBpICE9PSBrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmcm9tLnB1c2goaSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0by5wdXNoKGspO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGsgPSAoayArIDEpICUgbmV3X2xlbjtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWUgTkVYVDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZXhpdClcbiAgICAgICAgICAgICAgICBleGl0KGl0ZW0sIG1hcHBlZFtpXSgpLCBpKTtcbiAgICAgICAgICAgIGRpc3Bvc2Vyc1tpXSgpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtb3ZlICYmIGZyb20ubGVuZ3RoKVxuICAgICAgICAgICAgbW92ZShpdGVtcywgbWFwcGVkLCBmcm9tLCB0byk7XG4gICAgICAgIC8vIDIpIHNldCBhbGwgdGhlIG5ldyB2YWx1ZXMsIHB1bGxpbmcgZnJvbSB0aGUgdGVtcCBhcnJheSBpZiBjb3BpZWQsIG90aGVyd2lzZSBlbnRlcmluZyB0aGUgbmV3IHZhbHVlXG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBuZXdfbGVuOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0ZW1wLmhhc093blByb3BlcnR5KGkudG9TdHJpbmcoKSkpIHtcbiAgICAgICAgICAgICAgICBtYXBwZWRbaV0gPSB0ZW1wW2ldO1xuICAgICAgICAgICAgICAgIGRpc3Bvc2Vyc1tpXSA9IHRlbXBkaXNwb3NlcnNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBtYXBwZWRbaV0gPSBTLnJvb3QobWFwcGVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyAzKSBpbiBjYXNlIHRoZSBuZXcgc2V0IGlzIHNob3J0ZXIgdGhhbiB0aGUgb2xkLCBzZXQgdGhlIGxlbmd0aCBvZiB0aGUgbWFwcGVkIGFycmF5XG4gICAgICAgIGxlbiA9IG1hcHBlZC5sZW5ndGggPSBuZXdfbGVuO1xuICAgICAgICAvLyA0KSBzYXZlIGEgY29weSBvZiB0aGUgbWFwcGVkIGl0ZW1zIGZvciB0aGUgbmV4dCB1cGRhdGVcbiAgICAgICAgaXRlbXMgPSBuZXdfaXRlbXMuc2xpY2UoKTtcbiAgICAgICAgcmV0dXJuIG1hcHBlZDtcbiAgICAgICAgZnVuY3Rpb24gbWFwcGVyKGRpc3Bvc2VyKSB7XG4gICAgICAgICAgICBkaXNwb3NlcnNbaV0gPSBkaXNwb3NlcjtcbiAgICAgICAgICAgIHZhciBfaXRlbSA9IG5ld19pdGVtc1tpXSwgX2kgPSBpO1xuICAgICAgICAgICAgcmV0dXJuIFMoZnVuY3Rpb24gKHZhbHVlKSB7IHJldHVybiBlbnRlcihfaXRlbSwgdmFsdWUsIF9pKTsgfSwgdW5kZWZpbmVkKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuZnVuY3Rpb24gY2hhaW5NYXBTKGVudGVyLCBleGl0LCBtb3ZlKSB7XG4gICAgdmFyIHIgPSBsaWZ0KG1hcFModGhpcywgZW50ZXIsIGV4aXQsIG1vdmUpKTtcbiAgICByLmNvbWJpbmUgPSBjaGFpbkNvbWJpbmU7XG4gICAgcmV0dXJuIHI7XG59XG5leHBvcnQgZnVuY3Rpb24gbWFwU2FtcGxlKHNlcSwgZW50ZXIsIGV4aXQsIG1vdmUpIHtcbiAgICB2YXIgaXRlbXMgPSBbXSwgbWFwcGVkID0gW10sIGRpc3Bvc2VycyA9IFtdLCBsZW4gPSAwO1xuICAgIFMoZnVuY3Rpb24gKCkgeyBTLmNsZWFudXAoZnVuY3Rpb24gKCkgeyBkaXNwb3NlcnMuZm9yRWFjaChmdW5jdGlvbiAoZCkgeyBkKCk7IH0pOyB9KTsgfSk7XG4gICAgcmV0dXJuIFMub24oc2VxLCBmdW5jdGlvbiBtYXBTYW1wbGUoKSB7XG4gICAgICAgIHZhciBuZXdfaXRlbXMgPSBzZXEoKSwgbmV3X2xlbiA9IG5ld19pdGVtcy5sZW5ndGgsIG5ld19pbmRpY2VzLCBpdGVtX2luZGljZXMsIHRlbXAsIHRlbXBkaXNwb3NlcnMsIGZyb20gPSBudWxsLCB0byA9IG51bGwsIGksIGosIHN0YXJ0LCBlbmQsIG5ld19lbmQsIGl0ZW07XG4gICAgICAgIC8vIGZhc3QgcGF0aCBmb3IgZW1wdHkgYXJyYXlzXG4gICAgICAgIGlmIChuZXdfbGVuID09PSAwKSB7XG4gICAgICAgICAgICBpZiAobGVuICE9PSAwKSB7XG4gICAgICAgICAgICAgICAgaWYgKGV4aXQgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGl0ZW0gPSBpdGVtc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4aXQoaXRlbSwgbWFwcGVkW2ldLCBpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3Bvc2Vyc1tpXSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRpc3Bvc2Vyc1tpXSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGl0ZW1zID0gW107XG4gICAgICAgICAgICAgICAgbWFwcGVkID0gW107XG4gICAgICAgICAgICAgICAgZGlzcG9zZXJzID0gW107XG4gICAgICAgICAgICAgICAgbGVuID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChsZW4gPT09IDApIHtcbiAgICAgICAgICAgIGZvciAoaiA9IDA7IGogPCBuZXdfbGVuOyBqKyspIHtcbiAgICAgICAgICAgICAgICBpdGVtc1tqXSA9IG5ld19pdGVtc1tqXTtcbiAgICAgICAgICAgICAgICBtYXBwZWRbal0gPSBTLnJvb3QobWFwcGVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGxlbiA9IG5ld19sZW47XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBuZXdfaW5kaWNlcyA9IG5ldyBNYXAoKTtcbiAgICAgICAgICAgIHRlbXAgPSBuZXcgQXJyYXkobmV3X2xlbik7XG4gICAgICAgICAgICB0ZW1wZGlzcG9zZXJzID0gbmV3IEFycmF5KG5ld19sZW4pO1xuICAgICAgICAgICAgaWYgKG1vdmUpXG4gICAgICAgICAgICAgICAgZnJvbSA9IFtdLCB0byA9IFtdO1xuICAgICAgICAgICAgLy8gc2tpcCBjb21tb24gcHJlZml4IGFuZCBzdWZmaXhcbiAgICAgICAgICAgIGZvciAoc3RhcnQgPSAwLCBlbmQgPSBNYXRoLm1pbihsZW4sIG5ld19sZW4pOyBzdGFydCA8IGVuZCAmJiBpdGVtc1tzdGFydF0gPT09IG5ld19pdGVtc1tzdGFydF07IHN0YXJ0KyspXG4gICAgICAgICAgICAgICAgO1xuICAgICAgICAgICAgZm9yIChlbmQgPSBsZW4gLSAxLCBuZXdfZW5kID0gbmV3X2xlbiAtIDE7IGVuZCA+PSAwICYmIG5ld19lbmQgPj0gMCAmJiBpdGVtc1tlbmRdID09PSBuZXdfaXRlbXNbbmV3X2VuZF07IGVuZC0tLCBuZXdfZW5kLS0pIHtcbiAgICAgICAgICAgICAgICB0ZW1wW25ld19lbmRdID0gbWFwcGVkW2VuZF07XG4gICAgICAgICAgICAgICAgdGVtcGRpc3Bvc2Vyc1tuZXdfZW5kXSA9IGRpc3Bvc2Vyc1tlbmRdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gMCkgcHJlcGFyZSBhIG1hcCBvZiBhbGwgaW5kaWNlcyBpbiBuZXdfaXRlbXMsIHNjYW5uaW5nIGJhY2t3YXJkcyBzbyB3ZSBjYW4gcG9wIHRoZW0gb2ZmIGluIG5hdHVyYWwgb3JkZXJcbiAgICAgICAgICAgIGZvciAoaiA9IG5ld19lbmQ7IGogPj0gc3RhcnQ7IGotLSkge1xuICAgICAgICAgICAgICAgIGl0ZW0gPSBuZXdfaXRlbXNbal07XG4gICAgICAgICAgICAgICAgaXRlbV9pbmRpY2VzID0gbmV3X2luZGljZXMuZ2V0KGl0ZW0pO1xuICAgICAgICAgICAgICAgIGlmIChpdGVtX2luZGljZXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBuZXdfaW5kaWNlcy5zZXQoaXRlbSwgW2pdKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW1faW5kaWNlcy5wdXNoKGopO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIDEpIHN0ZXAgdGhyb3VnaCBhbGwgb2xkIGl0ZW1zIGFuZCBzZWUgaWYgdGhleSBjYW4gYmUgZm91bmQgaW4gdGhlIG5ldyBzZXQ7IGlmIHNvLCBzYXZlIHRoZW0gaW4gYSB0ZW1wIGFycmF5IGFuZCBtYXJrIHRoZW0gbW92ZWQ7IGlmIG5vdCwgZXhpdCB0aGVtXG4gICAgICAgICAgICBmb3IgKGkgPSBzdGFydDsgaSA8PSBlbmQ7IGkrKykge1xuICAgICAgICAgICAgICAgIGl0ZW0gPSBpdGVtc1tpXTtcbiAgICAgICAgICAgICAgICBpdGVtX2luZGljZXMgPSBuZXdfaW5kaWNlcy5nZXQoaXRlbSk7XG4gICAgICAgICAgICAgICAgaWYgKGl0ZW1faW5kaWNlcyAhPT0gdW5kZWZpbmVkICYmIGl0ZW1faW5kaWNlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGogPSBpdGVtX2luZGljZXMucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIHRlbXBbal0gPSBtYXBwZWRbaV07XG4gICAgICAgICAgICAgICAgICAgIHRlbXBkaXNwb3NlcnNbal0gPSBkaXNwb3NlcnNbaV07XG4gICAgICAgICAgICAgICAgICAgIGlmIChtb3ZlICYmIGkgIT09IGopIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZyb20ucHVzaChpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvLnB1c2goaik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChleGl0KVxuICAgICAgICAgICAgICAgICAgICAgICAgZXhpdChpdGVtLCBtYXBwZWRbaV0sIGkpO1xuICAgICAgICAgICAgICAgICAgICBkaXNwb3NlcnNbaV0oKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAobW92ZSAmJiAoZnJvbS5sZW5ndGggIT09IDAgfHwgZW5kICE9PSBsZW4gLSAxKSkge1xuICAgICAgICAgICAgICAgIGVuZCsrLCBuZXdfZW5kKys7XG4gICAgICAgICAgICAgICAgd2hpbGUgKGVuZCA8IGxlbikge1xuICAgICAgICAgICAgICAgICAgICBmcm9tLnB1c2goZW5kKyspO1xuICAgICAgICAgICAgICAgICAgICB0by5wdXNoKG5ld19lbmQrKyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG1vdmUoaXRlbXMsIG1hcHBlZCwgZnJvbSwgdG8pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gMikgc2V0IGFsbCB0aGUgbmV3IHZhbHVlcywgcHVsbGluZyBmcm9tIHRoZSB0ZW1wIGFycmF5IGlmIGNvcGllZCwgb3RoZXJ3aXNlIGVudGVyaW5nIHRoZSBuZXcgdmFsdWVcbiAgICAgICAgICAgIGZvciAoaiA9IHN0YXJ0OyBqIDwgbmV3X2xlbjsgaisrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRlbXAuaGFzT3duUHJvcGVydHkoaikpIHtcbiAgICAgICAgICAgICAgICAgICAgbWFwcGVkW2pdID0gdGVtcFtqXTtcbiAgICAgICAgICAgICAgICAgICAgZGlzcG9zZXJzW2pdID0gdGVtcGRpc3Bvc2Vyc1tqXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG1hcHBlZFtqXSA9IFMucm9vdChtYXBwZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIDMpIGluIGNhc2UgdGhlIG5ldyBzZXQgaXMgc2hvcnRlciB0aGFuIHRoZSBvbGQsIHNldCB0aGUgbGVuZ3RoIG9mIHRoZSBtYXBwZWQgYXJyYXlcbiAgICAgICAgICAgIGxlbiA9IG1hcHBlZC5sZW5ndGggPSBuZXdfbGVuO1xuICAgICAgICAgICAgLy8gNCkgc2F2ZSBhIGNvcHkgb2YgdGhlIG1hcHBlZCBpdGVtcyBmb3IgdGhlIG5leHQgdXBkYXRlXG4gICAgICAgICAgICBpdGVtcyA9IG5ld19pdGVtcy5zbGljZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBtYXBwZWQ7XG4gICAgICAgIGZ1bmN0aW9uIG1hcHBlcihkaXNwb3Nlcikge1xuICAgICAgICAgICAgZGlzcG9zZXJzW2pdID0gZGlzcG9zZXI7XG4gICAgICAgICAgICByZXR1cm4gZW50ZXIobmV3X2l0ZW1zW2pdLCBtYXBwZWRbal0sIGopO1xuICAgICAgICB9XG4gICAgfSk7XG59XG5mdW5jdGlvbiBjaGFpbk1hcFNhbXBsZShlbnRlciwgZXhpdCwgbW92ZSkge1xuICAgIHJldHVybiBsaWZ0KG1hcFNhbXBsZSh0aGlzLCBlbnRlciwgZXhpdCwgbW92ZSkpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIG1hcFNlcXVlbnRpYWxseShzZXEsIHVwZGF0ZSkge1xuICAgIHZhciBtYXBwZWQgPSBbXTtcbiAgICByZXR1cm4gUyhmdW5jdGlvbiBtYXBTZXF1ZW50aWFsbHkoKSB7XG4gICAgICAgIHZhciBzID0gc2VxKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgbWFwcGVkW2ldID0gdXBkYXRlKHNbaV0sIG1hcHBlZFtpXSwgaSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG1hcHBlZC5sZW5ndGggPiBzLmxlbmd0aClcbiAgICAgICAgICAgIG1hcHBlZC5sZW5ndGggPSBzLmxlbmd0aDtcbiAgICAgICAgcmV0dXJuIG1hcHBlZDtcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGNoYWluTWFwU2VxdWVudGlhbGx5KGVudGVyKSB7XG4gICAgcmV0dXJuIGxpZnQobWFwU2VxdWVudGlhbGx5KHRoaXMsIGVudGVyKSk7XG59XG5leHBvcnQgZnVuY3Rpb24gZm9yRWFjaChzZXEsIGVudGVyLCBleGl0LCBtb3ZlKSB7XG4gICAgdmFyIGl0ZW1zID0gW10sIGxlbiA9IDA7XG4gICAgcmV0dXJuIFMub24oc2VxLCBmdW5jdGlvbiBmb3JFYWNoKCkge1xuICAgICAgICB2YXIgbmV3X2l0ZW1zID0gc2VxKCksIG5ld19sZW4gPSBuZXdfaXRlbXMubGVuZ3RoLCBmb3VuZCA9IG5ldyBBcnJheShuZXdfbGVuKSwgZnJvbSA9IFtdLCB0byA9IFtdLCBpLCBqLCBrLCBpdGVtO1xuICAgICAgICAvLyAxKSBzdGVwIHRocm91Z2ggYWxsIG9sZCBpdGVtcyBhbmQgc2VlIGlmIHRoZXkgY2FuIGJlIGZvdW5kIGluIHRoZSBuZXcgc2V0OyBpZiBzbywgc2F2ZSB0aGVtIGluIGEgdGVtcCBhcnJheSBhbmQgbWFyayB0aGVtIG1vdmVkOyBpZiBub3QsIGV4aXQgdGhlbVxuICAgICAgICBORVhUOiBmb3IgKGkgPSAwLCBrID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBpdGVtID0gaXRlbXNbaV07XG4gICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgbmV3X2xlbjsgaisrLCBrID0gKGsgKyAxKSAlIG5ld19sZW4pIHtcbiAgICAgICAgICAgICAgICBpZiAoaXRlbSA9PT0gbmV3X2l0ZW1zW2tdICYmICFmb3VuZFtrXSkge1xuICAgICAgICAgICAgICAgICAgICBmb3VuZFtrXSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIGlmIChpICE9PSBrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmcm9tLnB1c2goaSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0by5wdXNoKGspO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGsgPSAoayArIDEpICUgbmV3X2xlbjtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWUgTkVYVDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZXhpdClcbiAgICAgICAgICAgICAgICBleGl0KGl0ZW0sIGkpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtb3ZlICYmIGZyb20ubGVuZ3RoKVxuICAgICAgICAgICAgbW92ZShmcm9tLCB0byk7XG4gICAgICAgIC8vIDIpIHNldCBhbGwgdGhlIG5ldyB2YWx1ZXMsIHB1bGxpbmcgZnJvbSB0aGUgdGVtcCBhcnJheSBpZiBjb3BpZWQsIG90aGVyd2lzZSBlbnRlcmluZyB0aGUgbmV3IHZhbHVlXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbmV3X2xlbjsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoIWZvdW5kW2ldKVxuICAgICAgICAgICAgICAgIGVudGVyKG5ld19pdGVtc1tpXSwgaSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gMykgaW4gY2FzZSB0aGUgbmV3IHNldCBpcyBzaG9ydGVyIHRoYW4gdGhlIG9sZCwgc2V0IHRoZSBsZW5ndGggb2YgdGhlIG1hcHBlZCBhcnJheVxuICAgICAgICBsZW4gPSBuZXdfbGVuO1xuICAgICAgICAvLyA0KSBzYXZlIGEgY29weSBvZiB0aGUgbWFwcGVkIGl0ZW1zIGZvciB0aGUgbmV4dCB1cGRhdGVcbiAgICAgICAgaXRlbXMgPSBuZXdfaXRlbXMuc2xpY2UoKTtcbiAgICAgICAgcmV0dXJuIGl0ZW1zO1xuICAgIH0pO1xufVxuZnVuY3Rpb24gY2hhaW5Gb3JFYWNoKGVudGVyLCBleGl0LCBtb3ZlKSB7XG4gICAgcmV0dXJuIGxpZnQoZm9yRWFjaCh0aGlzLCBlbnRlciwgZXhpdCwgbW92ZSkpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGNvbWJpbmUoc2VxKSB7XG4gICAgcmV0dXJuIFMoZnVuY3Rpb24gY29tYmluZSgpIHtcbiAgICAgICAgdmFyIHMgPSBzZXEoKSwgcmVzdWx0ID0gbmV3IEFycmF5KHMubGVuZ3RoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICByZXN1bHRbaV0gPSBzW2ldKCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGNoYWluQ29tYmluZSgpIHtcbiAgICByZXR1cm4gbGlmdChjb21iaW5lKHRoaXMpKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBtYXAoc2VxLCBlbnRlciwgZXhpdCwgbW92ZSkge1xuICAgIHJldHVybiBjb21iaW5lKG1hcFMoc2VxLCBlbnRlciwgZXhpdCwgbW92ZSA9PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOlxuICAgICAgICBmdW5jdGlvbiAoaXRlbXMsIG1hcHBlZCwgZnJvbSwgdG8pIHsgbW92ZShpdGVtcywgbWFwcGVkLm1hcChmdW5jdGlvbiAocykgeyByZXR1cm4gcygpOyB9KSwgZnJvbSwgdG8pOyB9KSk7XG59XG5mdW5jdGlvbiBjaGFpbk1hcChlbnRlciwgZXhpdCwgbW92ZSkge1xuICAgIHJldHVybiBsaWZ0KG1hcCh0aGlzLCBlbnRlciwgZXhpdCwgbW92ZSkpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGZpbmQoc2VxLCBwcmVkKSB7XG4gICAgcmV0dXJuIFMoZnVuY3Rpb24gZmluZCgpIHtcbiAgICAgICAgdmFyIHMgPSBzZXEoKSwgaSwgaXRlbTtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGl0ZW0gPSBzW2ldO1xuICAgICAgICAgICAgaWYgKHByZWQoaXRlbSkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGNoYWluRmluZChwcmVkKSB7XG4gICAgcmV0dXJuIGZpbmQodGhpcywgcHJlZCk7XG59XG5leHBvcnQgZnVuY3Rpb24gaW5jbHVkZXMoc2VxLCBvKSB7XG4gICAgcmV0dXJuIFMoZnVuY3Rpb24gZmluZCgpIHtcbiAgICAgICAgdmFyIHMgPSBzZXEoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoc1tpXSA9PT0gbylcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBjaGFpbkluY2x1ZGVzKG8pIHtcbiAgICByZXR1cm4gaW5jbHVkZXModGhpcywgbyk7XG59XG5leHBvcnQgZnVuY3Rpb24gc29ydChzZXEsIGZuKSB7XG4gICAgcmV0dXJuIFMoZnVuY3Rpb24gc29ydCgpIHtcbiAgICAgICAgdmFyIGNvcHkgPSBzZXEoKS5zbGljZSgwKTtcbiAgICAgICAgaWYgKGZuKVxuICAgICAgICAgICAgY29weS5zb3J0KGZuKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgY29weS5zb3J0KCk7XG4gICAgICAgIHJldHVybiBjb3B5O1xuICAgIH0pO1xufVxuZnVuY3Rpb24gY2hhaW5Tb3J0KGZuKSB7XG4gICAgcmV0dXJuIGxpZnQoc29ydCh0aGlzLCBmbikpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIG9yZGVyQnkoc2VxLCBieSkge1xuICAgIHZhciBrZXksIGZuO1xuICAgIGlmICh0eXBlb2YgYnkgIT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAga2V5ID0gYnk7XG4gICAgICAgIGZuID0gZnVuY3Rpb24gKG8pIHsgcmV0dXJuIG9ba2V5XTsgfTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGZuID0gYnk7XG4gICAgfVxuICAgIHJldHVybiBTKGZ1bmN0aW9uIG9yZGVyQnkoKSB7XG4gICAgICAgIHZhciBjb3B5ID0gc2VxKCkuc2xpY2UoMCk7XG4gICAgICAgIGNvcHkuc29ydChmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICAgICAgYSA9IGZuKGEpO1xuICAgICAgICAgICAgYiA9IGZuKGIpO1xuICAgICAgICAgICAgcmV0dXJuIGEgPCBiID8gLTEgOiBhID4gYiA/IDEgOiAwO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGNvcHk7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBjaGFpbk9yZGVyQnkoYnkpIHtcbiAgICByZXR1cm4gbGlmdChvcmRlckJ5KHRoaXMsIGJ5KSk7XG59XG5leHBvcnQgZnVuY3Rpb24gZmlsdGVyKHNlcSwgcHJlZGljYXRlKSB7XG4gICAgcmV0dXJuIFMoZnVuY3Rpb24gZmlsdGVyKCkge1xuICAgICAgICB2YXIgcyA9IHNlcSgpLCByZXN1bHQgPSBbXSwgaSwgdjtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHYgPSBzW2ldO1xuICAgICAgICAgICAgaWYgKHByZWRpY2F0ZSh2KSlcbiAgICAgICAgICAgICAgICByZXN1bHQucHVzaCh2KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0pO1xufVxuZnVuY3Rpb24gY2hhaW5GaWx0ZXIocHJlZGljYXRlKSB7XG4gICAgcmV0dXJuIGxpZnQoZmlsdGVyKHRoaXMsIHByZWRpY2F0ZSkpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGNvbmNhdChzZXEpIHtcbiAgICB2YXIgb3RoZXJzID0gW107XG4gICAgZm9yICh2YXIgX2EgPSAxOyBfYSA8IGFyZ3VtZW50cy5sZW5ndGg7IF9hKyspIHtcbiAgICAgICAgb3RoZXJzW19hIC0gMV0gPSBhcmd1bWVudHNbX2FdO1xuICAgIH1cbiAgICByZXR1cm4gUyhmdW5jdGlvbiBjb25jYXQoKSB7XG4gICAgICAgIHZhciBzID0gc2VxKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb3RoZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBzID0gcy5jb25jYXQob3RoZXJzW2ldKCkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzO1xuICAgIH0pO1xufVxuZnVuY3Rpb24gY2hhaW5Db25jYXQoKSB7XG4gICAgdmFyIG90aGVycyA9IFtdO1xuICAgIGZvciAodmFyIF9hID0gMDsgX2EgPCBhcmd1bWVudHMubGVuZ3RoOyBfYSsrKSB7XG4gICAgICAgIG90aGVyc1tfYV0gPSBhcmd1bWVudHNbX2FdO1xuICAgIH1cbiAgICByZXR1cm4gbGlmdChjb25jYXQuYXBwbHkodm9pZCAwLCBbdGhpc10uY29uY2F0KG90aGVycykpKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiByZWR1Y2Uoc2VxLCBmbiwgc2VlZCkge1xuICAgIHJldHVybiBTKGZ1bmN0aW9uIHJlZHVjZSgpIHtcbiAgICAgICAgdmFyIHMgPSBzZXEoKSwgcmVzdWx0ID0gc2VlZCBpbnN0YW5jZW9mIEZ1bmN0aW9uID8gc2VlZCgpIDogc2VlZDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICByZXN1bHQgPSBmbihyZXN1bHQsIHNbaV0sIGksIHMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBjaGFpblJlZHVjZShmbiwgc2VlZCkge1xuICAgIHJldHVybiByZWR1Y2UodGhpcywgZm4sIHNlZWQpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHJlZHVjZVJpZ2h0KHNlcSwgZm4sIHNlZWQpIHtcbiAgICByZXR1cm4gUyhmdW5jdGlvbiByZWR1Y2VSaWdodCgpIHtcbiAgICAgICAgdmFyIHMgPSBzZXEoKSwgcmVzdWx0ID0gc2VlZCBpbnN0YW5jZW9mIEZ1bmN0aW9uID8gc2VlZCgpIDogc2VlZDtcbiAgICAgICAgZm9yICh2YXIgaSA9IHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIHJlc3VsdCA9IGZuKHJlc3VsdCwgc1tpXSwgaSwgcyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGNoYWluUmVkdWNlUmlnaHQoZm4sIHNlZWQpIHtcbiAgICByZXR1cm4gcmVkdWNlUmlnaHQodGhpcywgZm4sIHNlZWQpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGV2ZXJ5KHNlcSwgZm4pIHtcbiAgICByZXR1cm4gUyhmdW5jdGlvbiBldmVyeSgpIHtcbiAgICAgICAgdmFyIHMgPSBzZXEoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoIWZuKHNbaV0pKVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGNoYWluRXZlcnkoZm4pIHtcbiAgICByZXR1cm4gZXZlcnkodGhpcywgZm4pO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHNvbWUoc2VxLCBmbikge1xuICAgIHJldHVybiBTKGZ1bmN0aW9uIHNvbWUoKSB7XG4gICAgICAgIHZhciBzID0gc2VxKCk7XG4gICAgICAgIGlmIChmbiA9PT0gdW5kZWZpbmVkKVxuICAgICAgICAgICAgcmV0dXJuIHMubGVuZ3RoICE9PSAwO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChmbihzW2ldKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBjaGFpblNvbWUoZm4pIHtcbiAgICByZXR1cm4gc29tZSh0aGlzLCBmbik7XG59XG5leHBvcnQgZnVuY3Rpb24gcmV2ZXJzZShzZXEpIHtcbiAgICByZXR1cm4gUyhmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBjb3B5ID0gc2VxKCkuc2xpY2UoMCk7XG4gICAgICAgIGNvcHkucmV2ZXJzZSgpO1xuICAgICAgICByZXR1cm4gY29weTtcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGNoYWluUmV2ZXJzZSgpIHtcbiAgICByZXR1cm4gbGlmdChyZXZlcnNlKHRoaXMpKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBzbGljZShzZXEsIHMsIGUpIHtcbiAgICByZXR1cm4gUyhmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBzZXEoKS5zbGljZShzLCBlKTtcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGNoYWluU2xpY2UocywgZSkge1xuICAgIHJldHVybiBsaWZ0KHNsaWNlKHRoaXMsIHMsIGUpKTtcbn1cblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vfi9zLWFycmF5L2VzL2luZGV4LmpzXG4vLyBtb2R1bGUgaWQgPSAzXG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsInZhciBzdmdOUyA9IFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIjtcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbGVtZW50KHRhZywgY2xhc3NOYW1lLCBwYXJlbnQpIHtcbiAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZyk7XG4gICAgaWYgKGNsYXNzTmFtZSlcbiAgICAgICAgZWwuY2xhc3NOYW1lID0gY2xhc3NOYW1lO1xuICAgIGlmIChwYXJlbnQpXG4gICAgICAgIHBhcmVudC5hcHBlbmRDaGlsZChlbCk7XG4gICAgcmV0dXJuIGVsO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVN2Z0VsZW1lbnQodGFnLCBjbGFzc05hbWUsIHBhcmVudCkge1xuICAgIHZhciBlbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhzdmdOUywgdGFnKTtcbiAgICBpZiAoY2xhc3NOYW1lKVxuICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCBjbGFzc05hbWUpO1xuICAgIGlmIChwYXJlbnQpXG4gICAgICAgIHBhcmVudC5hcHBlbmRDaGlsZChlbCk7XG4gICAgcmV0dXJuIGVsO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUNvbW1lbnQodGV4dCwgcGFyZW50KSB7XG4gICAgdmFyIGNvbW1lbnQgPSBkb2N1bWVudC5jcmVhdGVDb21tZW50KHRleHQpO1xuICAgIHBhcmVudC5hcHBlbmRDaGlsZChjb21tZW50KTtcbiAgICByZXR1cm4gY29tbWVudDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUZXh0Tm9kZSh0ZXh0LCBwYXJlbnQpIHtcbiAgICB2YXIgbm9kZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRleHQpO1xuICAgIHBhcmVudC5hcHBlbmRDaGlsZChub2RlKTtcbiAgICByZXR1cm4gbm9kZTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBzZXRBdHRyaWJ1dGUobm9kZSwgbmFtZSwgdmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT09IGZhbHNlIHx8IHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpXG4gICAgICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlKG5hbWUpO1xuICAgIGVsc2VcbiAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHNldEF0dHJpYnV0ZU5TKG5vZGUsIG5hbWVzcGFjZSwgbmFtZSwgdmFsdWUpIHtcbiAgICBpZiAodmFsdWUgPT09IGZhbHNlIHx8IHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSB1bmRlZmluZWQpXG4gICAgICAgIG5vZGUucmVtb3ZlQXR0cmlidXRlTlMobmFtZXNwYWNlLCBuYW1lKTtcbiAgICBlbHNlXG4gICAgICAgIG5vZGUuc2V0QXR0cmlidXRlTlMobmFtZXNwYWNlLCBuYW1lLCB2YWx1ZSk7XG59XG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL34vc3VycGx1cy9lcy9kb20uanNcbi8vIG1vZHVsZSBpZCA9IDRcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwiaW1wb3J0IFMgZnJvbSAncy1qcyc7XHJcbmltcG9ydCB7IFRvRG8sIFRvRG9zTW9kZWwsIHJldHVyblR5cGUgfSBmcm9tICcuL21vZGVscyc7XHJcblxyXG5leHBvcnQgdHlwZSBUb0Rvc0N0cmwgPSB0eXBlb2YgdG9Eb3NDdHJsVHlwZTsgY29uc3QgdG9Eb3NDdHJsVHlwZSA9IHJldHVyblR5cGUoVG9Eb3NDdHJsKTtcclxuZXhwb3J0IGZ1bmN0aW9uIFRvRG9zQ3RybCh7IHRvZG9zIH0gOiBUb0Rvc01vZGVsKSB7XHJcbiAgICBjb25zdCBlZGl0aW5nID0gUy52YWx1ZShudWxsIGFzIG51bGwgfCBUb0RvKSwgLy8gdGhlIHRvZG8gc2VsZWN0ZWQgZm9yIGVkaXRpbmcsIG9yIG51bGwgaWYgbm9uZSBzZWxlY3RlZFxyXG4gICAgICAgIGZpbHRlciAgICA9IFMudmFsdWUobnVsbCBhcyBudWxsIHwgYm9vbGVhbiksIC8vIG51bGwgPSBubyBmaWx0ZXJpbmcsIHRydWUgPSBvbmx5IGNvbXBsZXRlZCwgZmFsc2UgPSBvbmx5IGluY29tcGxldGVcclxuICAgICAgICBuZXdUaXRsZSAgPSBTLnZhbHVlKCcnKSxcclxuICAgICAgICBhbGwgICAgICAgPSB0b2Rvcy5tYXAoVG9Eb0N0cmwpLFxyXG4gICAgICAgIGNvbXBsZXRlZCA9IGFsbC5maWx0ZXIodCA9PiB0LmNvbXBsZXRlZCgpKSxcclxuICAgICAgICByZW1haW5pbmcgPSBhbGwuZmlsdGVyKHQgPT4gIXQuY29tcGxldGVkKCkpLFxyXG4gICAgICAgIGRpc3BsYXllZCA9ICgpID0+IGZpbHRlcigpID09PSBudWxsID8gYWxsKCkgOiBmaWx0ZXIoKSA/IGNvbXBsZXRlZCgpIDogcmVtYWluaW5nKCk7XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBmaWx0ZXIsXHJcbiAgICAgICAgbmV3VGl0bGUsXHJcbiAgICAgICAgYWxsLFxyXG4gICAgICAgIGNvbXBsZXRlZCxcclxuICAgICAgICByZW1haW5pbmcsXHJcbiAgICAgICAgZGlzcGxheWVkLFxyXG4gICAgICAgIGFsbENvbXBsZXRlZCAgOiAoKSA9PiBhbGwoKS5sZW5ndGggPiAwICYmIHJlbWFpbmluZygpLmxlbmd0aCA9PT0gMCxcclxuICAgICAgICBzZXRBbGwgICAgICAgIDogKGMgOiBib29sZWFuKSA9PiBTLmZyZWV6ZSgoKSA9PiB0b2RvcygpLmZvckVhY2godCA9PiB0LmNvbXBsZXRlZChjKSkpLFxyXG4gICAgICAgIGNsZWFyQ29tcGxldGVkOiAoKSA9PiB0b2Rvcyh0b2RvcygpLmZpbHRlcih0ID0+ICF0LmNvbXBsZXRlZCgpKSksXHJcbiAgICAgICAgY3JlYXRlICAgICAgICA6ICgpID0+IHtcclxuICAgICAgICAgICAgdmFyIHRpdGxlID0gbmV3VGl0bGUoKS50cmltKCk7XHJcbiAgICAgICAgICAgIGlmICh0aXRsZSkge1xyXG4gICAgICAgICAgICAgICAgbmV3VGl0bGUoXCJcIik7XHJcbiAgICAgICAgICAgICAgICB0b2Rvcy51bnNoaWZ0KFRvRG8odGl0bGUsIGZhbHNlKSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG5cclxuICAgIGZ1bmN0aW9uIFRvRG9DdHJsKHRvZG8gOiBUb0RvKSB7XHJcbiAgICAgICAgY29uc3QgdGl0bGUgPSBTLnZhbHVlKFMuc2FtcGxlKHRvZG8udGl0bGUpKTtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICB0aXRsZSxcclxuICAgICAgICAgICAgY29tcGxldGVkICAgOiB0b2RvLmNvbXBsZXRlZCxcclxuICAgICAgICAgICAgcmVtb3ZlICAgICAgOiAoKSA9PiB0b2Rvcy5yZW1vdmUodG9kbyksXHJcbiAgICAgICAgICAgIHN0YXJ0RWRpdGluZzogKCkgPT4gZWRpdGluZyh0b2RvKSxcclxuICAgICAgICAgICAgZWRpdGluZyAgICAgOiAoKSA9PiBlZGl0aW5nKCkgPT09IHRvZG8sXHJcbiAgICAgICAgICAgIGVuZEVkaXRpbmcgIDogKGNvbW1pdCA6IGJvb2xlYW4pID0+IHtcclxuICAgICAgICAgICAgICAgIGlmIChjb21taXQpIHtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgdHJpbW1lZCA9IHRpdGxlKCkudHJpbSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGlmICh0cmltbWVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvZG8udGl0bGUodGl0bGUodHJpbW1lZCkpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvZG9zLnJlbW92ZSh0b2RvKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlKHRvZG8udGl0bGUoKSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlZGl0aW5nKG51bGwpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxufVxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9jb250cm9sbGVycy50cyIsImltcG9ydCBTIGZyb20gJ3MtanMnO1xyXG5pbXBvcnQgeyBUb0RvLCBUb0Rvc01vZGVsIH0gZnJvbSAnLi9tb2RlbHMnO1xyXG5cclxuY29uc3QgTE9DQUxfU1RPUkFHRV9LRVkgPSAndG9kb3Mtc3VycGx1cyc7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gTG9jYWxTdG9yYWdlUGVyc2lzdGVuY2UobW9kZWwgOiBUb0Rvc01vZGVsKSB7XHJcbiAgICAvLyBsb2FkIHN0b3JlZCB0b2RvcyBvbiBpbml0XHJcbiAgICBjb25zdCBzdG9yZWQgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShMT0NBTF9TVE9SQUdFX0tFWSk7XHJcbiAgICBpZiAoc3RvcmVkKSBtb2RlbC50b2RvcyhKU09OLnBhcnNlKHN0b3JlZCkudG9kb3MubWFwKCh0IDogYW55KSA9PiBUb0RvKHQudGl0bGUsIHQuY29tcGxldGVkKSkpO1xyXG5cclxuICAgIC8vIHN0b3JlIEpTT05pemVkIHRvZG9zIHdoZW5ldmVyIHRoZXkgY2hhbmdlXHJcbiAgICBTKCgpID0+IHtcclxuICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbShMT0NBTF9TVE9SQUdFX0tFWSwgSlNPTi5zdHJpbmdpZnkobW9kZWwpKTtcclxuICAgIH0pO1xyXG59XG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL3BlcnNpc3RlbmNlLnRzIiwiaW1wb3J0IFMgZnJvbSAncy1qcyc7XHJcbmltcG9ydCB7IFRvRG9zQ3RybCB9IGZyb20gJy4vY29udHJvbGxlcnMnO1xyXG5cclxuLy8gd2l0aCBzdWNoIGEgc2ltcGxlIHJvdXRlciBzY2VuYXJpbywgbm8gbmVlZCBmb3IgYSBsaWIsIGp1c3QgaGFuZC13cml0ZSBpdFxyXG5leHBvcnQgZnVuY3Rpb24gVG9Eb3NSb3V0ZXIoY3RybCA6IFRvRG9zQ3RybCkge1xyXG4gICAgLy8gYnJvd3NlciBoYXNoIC0+IGZpbHRlcigpXHJcbiAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignaGFzaGNoYW5nZScsIHNldFN0YXRlRnJvbUhhc2gsIGZhbHNlKTtcclxuICAgIFMuY2xlYW51cChmdW5jdGlvbiAoKSB7IHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKCdoYXNoY2hhbmdlJywgc2V0U3RhdGVGcm9tSGFzaCk7IH0pO1xyXG4gICAgZnVuY3Rpb24gc2V0U3RhdGVGcm9tSGFzaCgpIHtcclxuICAgICAgICB2YXIgaGFzaCAgID0gd2luZG93LmxvY2F0aW9uLmhhc2gsXHJcbiAgICAgICAgICAgIGZpbHRlciA9IGhhc2ggPT09IFwiIy9jb21wbGV0ZWRcIiA/IHRydWUgIDpcclxuICAgICAgICAgICAgICAgICAgICAgaGFzaCA9PT0gXCIjL2FjdGl2ZVwiICAgID8gZmFsc2UgOlxyXG4gICAgICAgICAgICAgICAgICAgICBudWxsO1xyXG5cclxuICAgICAgICBjdHJsLmZpbHRlcihmaWx0ZXIpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGluaXQgZnJvbSBicm93c2VyIGhhc2hcclxuICAgIHNldFN0YXRlRnJvbUhhc2goKTtcclxuXHJcbiAgICAvLyBmaWx0ZXIoKSAtPiBicm93c2VyIGhhc2hcclxuICAgIFMoKCkgPT4ge1xyXG4gICAgICAgIHZhciBmaWx0ZXIgPSBjdHJsLmZpbHRlcigpLFxyXG4gICAgICAgICAgICBoYXNoICAgPSBmaWx0ZXIgPT09IHRydWUgID8gXCIvY29tcGxldGVkXCIgOlxyXG4gICAgICAgICAgICAgICAgICAgICBmaWx0ZXIgPT09IGZhbHNlID8gXCIvYWN0aXZlXCIgICAgOlxyXG4gICAgICAgICAgICAgICAgICAgICBcIi9cIjtcclxuXHJcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLmhhc2ggPSBoYXNoO1xyXG4gICAgfSk7XHJcbn1cclxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL3JvdXRlci50cyIsImltcG9ydCAqIGFzIFN1cnBsdXMgZnJvbSAnc3VycGx1cyc7IFN1cnBsdXM7XHJcbmltcG9ydCB7IG1hcFNhbXBsZSB9IGZyb20gJ3MtYXJyYXknO1xyXG5pbXBvcnQgKiBhcyBjeCBmcm9tICdjbGFzc25hbWVzJztcclxuaW1wb3J0IGRhdGEgZnJvbSAnc3VycGx1cy1taXhpbi1kYXRhJztcclxuaW1wb3J0IG9ua2V5IGZyb20gJ3N1cnBsdXMtbWl4aW4tb25rZXknO1xyXG5pbXBvcnQgZm9jdXMgZnJvbSAnc3VycGx1cy1taXhpbi1mb2N1cyc7XHJcblxyXG5pbXBvcnQgeyBUb0Rvc0N0cmwgfSBmcm9tICcuL2NvbnRyb2xsZXJzJztcclxuXHJcbmV4cG9ydCBjb25zdCBBcHBWaWV3ID0gKGN0cmwgOiBUb0Rvc0N0cmwpID0+XHJcbiAgICA8c2VjdGlvbj5cclxuICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJ0b2RvYXBwXCI+XHJcbiAgICAgICAgICAgIDxoZWFkZXIgY2xhc3NOYW1lPVwiaGVhZGVyXCI+XHJcbiAgICAgICAgICAgICAgICA8aDE+dG9kb3M8L2gxPlxyXG4gICAgICAgICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT1cIm5ldy10b2RvXCIgcGxhY2Vob2xkZXI9XCJXaGF0IG5lZWRzIHRvIGJlIGRvbmU/XCIgYXV0b0ZvY3VzPXt0cnVlfSBcclxuICAgICAgICAgICAgICAgICAgICBmbjE9e2RhdGEoY3RybC5uZXdUaXRsZSwgJ2tleWRvd24nKX0gXHJcbiAgICAgICAgICAgICAgICAgICAgZm4yPXtvbmtleSgnZW50ZXInLCBjdHJsLmNyZWF0ZSl9XHJcblx0XHRcdFx0XHRmbjM9e29ua2V5KCdlc2MnLCAoKSA9PiBjdHJsLm5ld1RpdGxlKCcnKSl9IC8+XHJcbiAgICAgICAgICAgIDwvaGVhZGVyPlxyXG4gICAgICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJtYWluXCIgaGlkZGVuPXtjdHJsLmFsbCgpLmxlbmd0aCA9PT0gMH0+XHJcbiAgICAgICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPVwidG9nZ2xlLWFsbFwiIHR5cGU9XCJjaGVja2JveFwiIFxyXG4gICAgICAgICAgICAgICAgICAgIGNoZWNrZWQ9e2N0cmwuYWxsQ29tcGxldGVkKCl9IC8+XHJcbiAgICAgICAgICAgICAgICA8bGFiZWwgaHRtbEZvcj1cInRvZ2dsZS1hbGxcIiBvbkNsaWNrPXsoKSA9PiBjdHJsLnNldEFsbCghY3RybC5hbGxDb21wbGV0ZWQoKSl9Pk1hcmsgYWxsIGFzIGNvbXBsZXRlPC9sYWJlbD5cclxuICAgICAgICAgICAgICAgIDx1bCBjbGFzc05hbWU9XCJ0b2RvLWxpc3RcIj5cclxuICAgICAgICAgICAgICAgICAgICB7bWFwU2FtcGxlKGN0cmwuZGlzcGxheWVkLCB0b2RvID0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxsaSBjbGFzc05hbWU9e2N4KHsgY29tcGxldGVkOiB0b2RvLmNvbXBsZXRlZCgpLCBlZGl0aW5nOiB0b2RvLmVkaXRpbmcoKSB9KX0+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInZpZXdcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPVwidG9nZ2xlXCIgdHlwZT1cImNoZWNrYm94XCIgZm49e2RhdGEodG9kby5jb21wbGV0ZWQpfSAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxsYWJlbCBvbkRvdWJsZUNsaWNrPXt0b2RvLnN0YXJ0RWRpdGluZ30+e3RvZG8udGl0bGUoKX08L2xhYmVsPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwiZGVzdHJveVwiIG9uQ2xpY2s9e3RvZG8ucmVtb3ZlfT48L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPGlucHV0IGNsYXNzTmFtZT1cImVkaXRcIiBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmbjE9e2RhdGEodG9kby50aXRsZSwgJ2tleXVwJyl9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb25CbHVyPXsoKSA9PiB0b2RvLmVuZEVkaXRpbmcodHJ1ZSl9XHJcblx0XHRcdFx0XHRcdFx0ICAgIGZuMj17b25rZXkoJ2VudGVyJywgKCkgPT4gdG9kby5lbmRFZGl0aW5nKHRydWUpKX1cclxuXHRcdFx0XHRcdFx0XHQgICAgZm4zPXtvbmtleSgnZXNjJywgKCkgPT4gdG9kby5lbmRFZGl0aW5nKGZhbHNlKSl9XHJcblx0XHRcdFx0XHRcdFx0ICAgIGZuND17Zm9jdXModG9kby5lZGl0aW5nKCkpfSAvPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L2xpPlxyXG4gICAgICAgICAgICAgICAgICAgICl9XHJcbiAgICAgICAgICAgICAgICA8L3VsPlxyXG4gICAgICAgICAgICA8L3NlY3Rpb24+XHJcbiAgICAgICAgICAgIDxmb290ZXIgY2xhc3NOYW1lPVwiZm9vdGVyXCIgaGlkZGVuPXtjdHJsLmFsbCgpLmxlbmd0aCA9PT0gMH0+XHJcbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0b2RvLWNvdW50XCI+PHN0cm9uZz57Y3RybC5yZW1haW5pbmcoKS5sZW5ndGh9PC9zdHJvbmc+IGl0ZW17Y3RybC5yZW1haW5pbmcoKS5sZW5ndGggPT09IDEgPyAnJyA6ICdzJ30gbGVmdDwvc3Bhbj5cclxuICAgICAgICAgICAgICAgIDx1bCBjbGFzc05hbWU9XCJmaWx0ZXJzXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPGxpPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9e2N4KHsgc2VsZWN0ZWQ6IGN0cmwuZmlsdGVyKCkgPT09IG51bGwgfSl9IGhyZWY9XCIjL1wiPkFsbDwvYT5cclxuICAgICAgICAgICAgICAgICAgICA8L2xpPlxyXG4gICAgICAgICAgICAgICAgICAgIDxsaT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGEgY2xhc3NOYW1lPXtjeCh7IHNlbGVjdGVkOiBjdHJsLmZpbHRlcigpID09PSBmYWxzZSB9KX0gaHJlZj1cIiMvYWN0aXZlXCI+QWN0aXZlPC9hPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvbGk+XHJcbiAgICAgICAgICAgICAgICAgICAgPGxpPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9e2N4KHsgc2VsZWN0ZWQ6IGN0cmwuZmlsdGVyKCkgPT09IHRydWUgfSl9IGhyZWY9XCIjL2NvbXBsZXRlZFwiPkNvbXBsZXRlZDwvYT5cclxuICAgICAgICAgICAgICAgICAgICA8L2xpPlxyXG4gICAgICAgICAgICAgICAgPC91bD5cclxuICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPVwiY2xlYXItY29tcGxldGVkXCIgb25DbGljaz17Y3RybC5jbGVhckNvbXBsZXRlZH0gaGlkZGVuPXtjdHJsLmNvbXBsZXRlZCgpLmxlbmd0aCA9PT0gMH0+Q2xlYXIgY29tcGxldGVkPC9idXR0b24+XHJcbiAgICAgICAgICAgIDwvZm9vdGVyPlxyXG4gICAgICAgIDwvc2VjdGlvbj5cclxuICAgICAgICA8Zm9vdGVyIGNsYXNzTmFtZT1cImluZm9cIj5cclxuICAgICAgICAgICAgPHA+RG91YmxlLWNsaWNrIHRvIGVkaXQgYSB0b2RvPC9wPlxyXG4gICAgICAgICAgICA8cD5UZW1wbGF0ZSBieSA8YSBocmVmPVwiaHR0cDovL3NpbmRyZXNvcmh1cy5jb21cIj5TaW5kcmUgU29yaHVzPC9hPjwvcD5cclxuICAgICAgICAgICAgPHA+Q3JlYXRlZCBieSA8YSBocmVmPVwiaHR0cHM6Ly9naXRodWIuY29tL2FkYW1oYWlsZVwiPkFkYW0gSGFpbGU8L2E+PC9wPlxyXG4gICAgICAgICAgICA8cD5QYXJ0IG9mIDxhIGhyZWY9XCJodHRwOi8vdG9kb212Yy5jb21cIj5Ub2RvTVZDPC9hPjwvcD5cclxuICAgICAgICA8L2Zvb3Rlcj5cclxuICAgIDwvc2VjdGlvbj47XHJcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy92aWV3cy50c3giLCIvKiFcbiAgQ29weXJpZ2h0IChjKSAyMDE2IEplZCBXYXRzb24uXG4gIExpY2Vuc2VkIHVuZGVyIHRoZSBNSVQgTGljZW5zZSAoTUlUKSwgc2VlXG4gIGh0dHA6Ly9qZWR3YXRzb24uZ2l0aHViLmlvL2NsYXNzbmFtZXNcbiovXG4vKiBnbG9iYWwgZGVmaW5lICovXG5cbihmdW5jdGlvbiAoKSB7XG5cdCd1c2Ugc3RyaWN0JztcblxuXHR2YXIgaGFzT3duID0ge30uaGFzT3duUHJvcGVydHk7XG5cblx0ZnVuY3Rpb24gY2xhc3NOYW1lcyAoKSB7XG5cdFx0dmFyIGNsYXNzZXMgPSBbXTtcblxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR2YXIgYXJnID0gYXJndW1lbnRzW2ldO1xuXHRcdFx0aWYgKCFhcmcpIGNvbnRpbnVlO1xuXG5cdFx0XHR2YXIgYXJnVHlwZSA9IHR5cGVvZiBhcmc7XG5cblx0XHRcdGlmIChhcmdUeXBlID09PSAnc3RyaW5nJyB8fCBhcmdUeXBlID09PSAnbnVtYmVyJykge1xuXHRcdFx0XHRjbGFzc2VzLnB1c2goYXJnKTtcblx0XHRcdH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShhcmcpKSB7XG5cdFx0XHRcdGNsYXNzZXMucHVzaChjbGFzc05hbWVzLmFwcGx5KG51bGwsIGFyZykpO1xuXHRcdFx0fSBlbHNlIGlmIChhcmdUeXBlID09PSAnb2JqZWN0Jykge1xuXHRcdFx0XHRmb3IgKHZhciBrZXkgaW4gYXJnKSB7XG5cdFx0XHRcdFx0aWYgKGhhc093bi5jYWxsKGFyZywga2V5KSAmJiBhcmdba2V5XSkge1xuXHRcdFx0XHRcdFx0Y2xhc3Nlcy5wdXNoKGtleSk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGNsYXNzZXMuam9pbignICcpO1xuXHR9XG5cblx0aWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIG1vZHVsZS5leHBvcnRzKSB7XG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBjbGFzc05hbWVzO1xuXHR9IGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgdHlwZW9mIGRlZmluZS5hbWQgPT09ICdvYmplY3QnICYmIGRlZmluZS5hbWQpIHtcblx0XHQvLyByZWdpc3RlciBhcyAnY2xhc3NuYW1lcycsIGNvbnNpc3RlbnQgd2l0aCBucG0gcGFja2FnZSBuYW1lXG5cdFx0ZGVmaW5lKCdjbGFzc25hbWVzJywgW10sIGZ1bmN0aW9uICgpIHtcblx0XHRcdHJldHVybiBjbGFzc05hbWVzO1xuXHRcdH0pO1xuXHR9IGVsc2Uge1xuXHRcdHdpbmRvdy5jbGFzc05hbWVzID0gY2xhc3NOYW1lcztcblx0fVxufSgpKTtcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vfi9jbGFzc25hbWVzL2luZGV4LmpzXG4vLyBtb2R1bGUgaWQgPSA5XG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsImltcG9ydCBTIGZyb20gJ3MtanMnO1xyXG5cclxuaW1wb3J0IHsgVG9Eb3NNb2RlbH0gZnJvbSAnLi9tb2RlbHMnO1xyXG5pbXBvcnQgeyBUb0Rvc0N0cmwgfSBmcm9tICcuL2NvbnRyb2xsZXJzJztcclxuaW1wb3J0IHsgVG9Eb3NSb3V0ZXIgfSBmcm9tICcuL3JvdXRlcic7XHJcbmltcG9ydCB7IExvY2FsU3RvcmFnZVBlcnNpc3RlbmNlIH0gZnJvbSAnLi9wZXJzaXN0ZW5jZSc7XHJcbmltcG9ydCB7IEFwcFZpZXcgfSBmcm9tICcuL3ZpZXdzJztcclxuXHJcblMucm9vdCgoKSA9PiB7XHJcbiAgICBjb25zdCBtb2RlbCA9IFRvRG9zTW9kZWwoW10pLFxyXG4gICAgICAgIGN0cmwgPSBUb0Rvc0N0cmwobW9kZWwpLFxyXG4gICAgICAgIHJvdXRlciA9IFRvRG9zUm91dGVyKGN0cmwpLFxyXG4gICAgICAgIHN0b3JhZ2UgPSBMb2NhbFN0b3JhZ2VQZXJzaXN0ZW5jZShtb2RlbCksXHJcbiAgICAgICAgdmlldyA9IEFwcFZpZXcoY3RybCk7XHJcblxyXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZCh2aWV3KTtcclxufSk7XG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL21haW4udHMiLCJpbXBvcnQgeyBTIH0gZnJvbSAnc3VycGx1cyc7XG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBkYXRhKHNpZ25hbCwgYXJnMSwgYXJnMikge1xuICAgIHZhciBldmVudCA9IGFyZzEgfHwgJ2lucHV0Jywgb24gPSBhcmcxID09PSB1bmRlZmluZWQgPyB0cnVlIDogYXJnMSwgb2ZmID0gYXJnMiA9PT0gdW5kZWZpbmVkID8gKG9uID09PSB0cnVlID8gZmFsc2UgOiBudWxsKSA6IGFyZzI7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgIGlmIChub2RlIGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCkge1xuICAgICAgICAgICAgdmFyIHR5cGUgPSBub2RlLnR5cGUudG9VcHBlckNhc2UoKTtcbiAgICAgICAgICAgIGlmICh0eXBlID09PSAnQ0hFQ0tCT1gnKSB7XG4gICAgICAgICAgICAgICAgY2hlY2tib3hEYXRhKG5vZGUsIHNpZ25hbCwgb24sIG9mZik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmICh0eXBlID09PSAnUkFESU8nKSB7XG4gICAgICAgICAgICAgICAgcmFkaW9EYXRhKG5vZGUsIHNpZ25hbCwgb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFsdWVEYXRhKG5vZGUsIHNpZ25hbCwgZXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG5vZGUgaW5zdGFuY2VvZiBIVE1MU2VsZWN0RWxlbWVudCB8fCBub2RlIGluc3RhbmNlb2YgSFRNTFRleHRBcmVhRWxlbWVudCkge1xuICAgICAgICAgICAgdmFsdWVEYXRhKG5vZGUsIHNpZ25hbCwgZXZlbnQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG5vZGUuaXNDb250ZW50RWRpdGFibGUpIHtcbiAgICAgICAgICAgIHRleHRDb250ZW50RGF0YShub2RlLCBzaWduYWwsIGV2ZW50KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkBkYXRhIGNhbiBvbmx5IGJlIGFwcGxpZWQgdG8gYSBmb3JtIGNvbnRyb2wgZWxlbWVudCwgXFxuXCJcbiAgICAgICAgICAgICAgICArIFwic3VjaCBhcyA8aW5wdXQvPiwgPHRleHRhcmVhLz4gb3IgPHNlbGVjdC8+LCBvciB0byBhbiBlbGVtZW50IHdpdGggXCJcbiAgICAgICAgICAgICAgICArIFwiJ2NvbnRlbnRFZGl0YWJsZScgc2V0LiAgRWxlbWVudCBgYFwiICsgbm9kZS5ub2RlTmFtZSArIFwiJycgaXMgXFxuXCJcbiAgICAgICAgICAgICAgICArIFwibm90IHN1Y2ggYW4gZWxlbWVudC4gIFBlcmhhcHMgeW91IGFwcGxpZWQgaXQgdG8gdGhlIHdyb25nIG5vZGU/XCIpO1xuICAgICAgICB9XG4gICAgfTtcbn1cbmZ1bmN0aW9uIHZhbHVlRGF0YShub2RlLCBzaWduYWwsIGV2ZW50KSB7XG4gICAgUyhmdW5jdGlvbiB1cGRhdGVWYWx1ZSgpIHtcbiAgICAgICAgbm9kZS52YWx1ZSA9IHRvU3RyaW5nKHNpZ25hbCgpKTtcbiAgICB9KTtcbiAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIHZhbHVlTGlzdGVuZXIsIGZhbHNlKTtcbiAgICBTLmNsZWFudXAoZnVuY3Rpb24gKCkgeyBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnQsIHZhbHVlTGlzdGVuZXIpOyB9KTtcbiAgICBmdW5jdGlvbiB2YWx1ZUxpc3RlbmVyKCkge1xuICAgICAgICB2YXIgY3VyID0gdG9TdHJpbmcoUy5zYW1wbGUoc2lnbmFsKSksIHVwZGF0ZSA9IG5vZGUudmFsdWU7XG4gICAgICAgIGlmIChjdXIgIT09IHVwZGF0ZSlcbiAgICAgICAgICAgIHNpZ25hbCh1cGRhdGUpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG59XG5mdW5jdGlvbiBjaGVja2JveERhdGEobm9kZSwgc2lnbmFsLCBvbiwgb2ZmKSB7XG4gICAgUyhmdW5jdGlvbiB1cGRhdGVDaGVja2JveCgpIHtcbiAgICAgICAgbm9kZS5jaGVja2VkID0gc2lnbmFsKCkgPT09IG9uO1xuICAgIH0pO1xuICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCBjaGVja2JveExpc3RlbmVyLCBmYWxzZSk7XG4gICAgUy5jbGVhbnVwKGZ1bmN0aW9uICgpIHsgbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIGNoZWNrYm94TGlzdGVuZXIpOyB9KTtcbiAgICBmdW5jdGlvbiBjaGVja2JveExpc3RlbmVyKCkge1xuICAgICAgICBzaWduYWwobm9kZS5jaGVja2VkID8gb24gOiBvZmYpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG59XG5mdW5jdGlvbiByYWRpb0RhdGEobm9kZSwgc2lnbmFsLCBvbikge1xuICAgIFMoZnVuY3Rpb24gdXBkYXRlUmFkaW8oKSB7XG4gICAgICAgIG5vZGUuY2hlY2tlZCA9IChzaWduYWwoKSA9PT0gb24pO1xuICAgIH0pO1xuICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCByYWRpb0xpc3RlbmVyLCBmYWxzZSk7XG4gICAgUy5jbGVhbnVwKGZ1bmN0aW9uICgpIHsgbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHJhZGlvTGlzdGVuZXIpOyB9KTtcbiAgICBmdW5jdGlvbiByYWRpb0xpc3RlbmVyKCkge1xuICAgICAgICBpZiAobm9kZS5jaGVja2VkKVxuICAgICAgICAgICAgc2lnbmFsKG9uKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxufVxuZnVuY3Rpb24gdGV4dENvbnRlbnREYXRhKG5vZGUsIHNpZ25hbCwgZXZlbnQpIHtcbiAgICBTKGZ1bmN0aW9uIHVwZGF0ZVRleHRDb250ZW50KCkge1xuICAgICAgICBub2RlLnRleHRDb250ZW50ID0gdG9TdHJpbmcoc2lnbmFsKCkpO1xuICAgIH0pO1xuICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgdGV4dENvbnRlbnRMaXN0ZW5lciwgZmFsc2UpO1xuICAgIFMuY2xlYW51cChmdW5jdGlvbiAoKSB7IG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgdGV4dENvbnRlbnRMaXN0ZW5lcik7IH0pO1xuICAgIGZ1bmN0aW9uIHRleHRDb250ZW50TGlzdGVuZXIoKSB7XG4gICAgICAgIHZhciBjdXIgPSB0b1N0cmluZyhTLnNhbXBsZShzaWduYWwpKSwgdXBkYXRlID0gbm9kZS50ZXh0Q29udGVudDtcbiAgICAgICAgaWYgKGN1ciAhPT0gdXBkYXRlKVxuICAgICAgICAgICAgc2lnbmFsKHVwZGF0ZSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHRvU3RyaW5nKHYpIHtcbiAgICByZXR1cm4gdiA9PSBudWxsID8gJycgOiB2LnRvU3RyaW5nKCk7XG59XG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL34vc3VycGx1cy1taXhpbi1kYXRhL2luZGV4LmVzLmpzXG4vLyBtb2R1bGUgaWQgPSAxMVxuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCIvKipcclxuICogSW4gc3VycGx1cywgZGlyZWN0aXZlcyBydW4gd2hlbiBhIG5vZGUgaXMgY3JlYXRlZCwgbWVhbmluZyBiZWZvcmUgaXQgaGFzIHVzdWFsbHlcclxuICogYmVlbiBpbnNlcnRlZCBpbnRvIHRoZSBkb2N1bWVudC4gIFRoaXMgY2F1c2VzIGEgcHJvYmxlbSBmb3IgdGhlIEBmb2N1cyBkaXJlY3RpdmUsIGFzIG9ubHlcclxuICogZWxlbWVudHMgdGhhdCBhcmUgaW4gdGhlIGRvY3VtZW50IChhbmQgdmlzaWJsZSkgYXJlIGZvY3VzYWJsZS4gIEFzIGEgaGFjaywgd2UgZGVsYXlcclxuICogdGhlIGZvY3VzIGV2ZW50IHVudGlsIHRoZSBuZXh0IGFuaW1hdGlvbiBmcmFtZSwgdGhlcmVieSBnaXZpbmcgaHRtbGxpdGVyYWxzIGEgY2hhbmNlXHJcbiAqIHRvIGdldCB0aGUgbm9kZSBpbnRvIHRoZSBkb2N1bWVudC4gIElmIGl0IGlzbid0IGluIGJ5IHRoZW4gKG9yIGlmIHRoZSB1c2VyIHRyaWVkIHRvIGZvY3VzXHJcbiAqIGEgaGlkZGVuIG5vZGUpIHRoZW4gd2UgZ2l2ZSB1cC5cclxuICovXHJcbnZhciBub2RlVG9Gb2N1cyA9IG51bGwsIHN0YXJ0UG9zID0gTmFOLCBlbmRQb3MgPSBOYU4sIHNjaGVkdWxlZCA9IGZhbHNlO1xyXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBmb2N1cyhmbGFnLCBzdGFydCwgZW5kKSB7XHJcbiAgICB2YXIgX3N0YXJ0ID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgPyBzdGFydCA6IE5hTiwgX2VuZCA9IGFyZ3VtZW50cy5sZW5ndGggPiAyID8gZW5kIDogX3N0YXJ0LCBsZW5ndGg7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gZm9jdXMobm9kZSkge1xyXG4gICAgICAgIGlmICghbm9kZS5mb2N1cykge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJAZm9jdXMgY2FuIG9ubHkgYmUgYXBwbGllZCB0byBhbiBlbGVtZW50IHRoYXQgaGFzIGEgLmZvY3VzKCkgbWV0aG9kLCBsaWtlIDxpbnB1dD4sIDxzZWxlY3Q+LCA8dGV4dGFyZWE+LCBldGMuXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAoZmxhZykge1xyXG4gICAgICAgICAgICBsZW5ndGggPSBub2RlLnRleHRDb250ZW50ID8gbm9kZS50ZXh0Q29udGVudC5sZW5ndGggOiAwO1xyXG4gICAgICAgICAgICBub2RlVG9Gb2N1cyA9IG5vZGU7XHJcbiAgICAgICAgICAgIHN0YXJ0UG9zID0gX3N0YXJ0IDwgMCA/IE1hdGgubWF4KDAsIGxlbmd0aCArIF9zdGFydCkgOiBNYXRoLm1pbihsZW5ndGgsIF9zdGFydCk7XHJcbiAgICAgICAgICAgIGVuZFBvcyA9IF9lbmQgPCAwID8gTWF0aC5tYXgoc3RhcnRQb3MsIGxlbmd0aCArIF9lbmQpIDogTWF0aC5taW4obGVuZ3RoLCBfZW5kKTtcclxuICAgICAgICAgICAgaWYgKCFzY2hlZHVsZWQpIHtcclxuICAgICAgICAgICAgICAgIHNjaGVkdWxlZCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKGZvY3VzZXIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICBub2RlLmJsdXIoKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59XHJcbjtcclxuZnVuY3Rpb24gZm9jdXNlcigpIHtcclxuICAgIHNjaGVkdWxlZCA9IGZhbHNlO1xyXG4gICAgaWYgKG5vZGVUb0ZvY3VzID09PSBudWxsKVxyXG4gICAgICAgIHJldHVybjtcclxuICAgIHZhciB0cmFuZ2UsIHJhbmdlLCBzZWw7XHJcbiAgICBub2RlVG9Gb2N1cy5mb2N1cygpO1xyXG4gICAgaWYgKCFpc05hTihzdGFydFBvcykpIHtcclxuICAgICAgICBpZiAoaGFzU2V0U2VsZWN0aW9uUmFuZ2Uobm9kZVRvRm9jdXMpKSB7XHJcbiAgICAgICAgICAgIG5vZGVUb0ZvY3VzLnNldFNlbGVjdGlvblJhbmdlKHN0YXJ0UG9zLCBlbmRQb3MpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmIChoYXNDcmVhdGVUZXh0Um5hZ2Uobm9kZVRvRm9jdXMpKSB7XHJcbiAgICAgICAgICAgIHRyYW5nZSA9IG5vZGVUb0ZvY3VzLmNyZWF0ZVRleHRSYW5nZSgpO1xyXG4gICAgICAgICAgICB0cmFuZ2UubW92ZUVuZCgnY2hhcmFjdGVyJywgZW5kUG9zKTtcclxuICAgICAgICAgICAgdHJhbmdlLm1vdmVTdGFydCgnY2hhcmFjdGVyJywgc3RhcnRQb3MpO1xyXG4gICAgICAgICAgICB0cmFuZ2Uuc2VsZWN0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKG5vZGVUb0ZvY3VzLmlzQ29udGVudEVkaXRhYmxlICYmIG5vZGVUb0ZvY3VzLmNoaWxkTm9kZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgICAgICByYW5nZSA9IGRvY3VtZW50LmNyZWF0ZVJhbmdlKCk7XHJcbiAgICAgICAgICAgIHJhbmdlLnNldFN0YXJ0KG5vZGVUb0ZvY3VzLmNoaWxkTm9kZXNbMF0sIHN0YXJ0UG9zKTtcclxuICAgICAgICAgICAgcmFuZ2Uuc2V0RW5kKG5vZGVUb0ZvY3VzLmNoaWxkTm9kZXNbMF0sIGVuZFBvcyk7XHJcbiAgICAgICAgICAgIHNlbCA9IHdpbmRvdy5nZXRTZWxlY3Rpb24oKTtcclxuICAgICAgICAgICAgc2VsLnJlbW92ZUFsbFJhbmdlcygpO1xyXG4gICAgICAgICAgICBzZWwuYWRkUmFuZ2UocmFuZ2UpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5mdW5jdGlvbiBoYXNTZXRTZWxlY3Rpb25SYW5nZShub2RlKSB7XHJcbiAgICByZXR1cm4gISFub2RlLnNldFNlbGVjdGlvblJhbmdlO1xyXG59XHJcbmZ1bmN0aW9uIGhhc0NyZWF0ZVRleHRSbmFnZShub2RlKSB7XHJcbiAgICByZXR1cm4gISFub2RlLmNyZWF0ZVRleHRSYW5nZTtcclxufVxyXG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL34vc3VycGx1cy1taXhpbi1mb2N1cy9pbmRleC5lcy5qc1xuLy8gbW9kdWxlIGlkID0gMTJcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwiaW1wb3J0IHsgUyB9IGZyb20gJ3N1cnBsdXMnO1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gb25rZXkoa2V5LCBhcmcxLCBhcmcyKSB7XG4gICAgdmFyIGV2ZW50ID0gYXJndW1lbnRzLmxlbmd0aCA8IDMgPyAna2V5ZG93bicgOiAna2V5JyArIGFyZzEsIGZuID0gYXJndW1lbnRzLmxlbmd0aCA8IDMgPyBhcmcxIDogYXJnMjtcbiAgICB2YXIgcGFydHMgPSBrZXkudG9Mb3dlckNhc2UoKS5zcGxpdCgnLScsIDIpLCBrZXlDb2RlID0ga2V5Q29kZXNbcGFydHNbcGFydHMubGVuZ3RoIC0gMV1dLCBtb2QgPSBwYXJ0cy5sZW5ndGggPiAxID8gcGFydHNbMF0gKyBcIktleVwiIDogbnVsbDtcbiAgICBpZiAoa2V5Q29kZSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJAb25rZXk6IHVucmVjb2duaXplZCBrZXkgaWRlbnRpZmllciAnXCIgKyBrZXkgKyBcIidcIik7XG4gICAgaWYgKHR5cGVvZiBmbiAhPT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQG9ua2V5OiBtdXN0IHN1cHBseSBhIGZ1bmN0aW9uIHRvIGNhbGwgd2hlbiB0aGUga2V5IGlzIGVudGVyZWRcIik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIG9ua2V5KG5vZGUpIHtcbiAgICAgICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCBvbmtleUxpc3RlbmVyLCBmYWxzZSk7XG4gICAgICAgIFMuY2xlYW51cChmdW5jdGlvbiAoKSB7IG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgb25rZXlMaXN0ZW5lcik7IH0pO1xuICAgIH07XG4gICAgZnVuY3Rpb24gb25rZXlMaXN0ZW5lcihlKSB7XG4gICAgICAgIGlmIChlLmtleUNvZGUgPT09IGtleUNvZGUgJiYgKCFtb2QgfHwgZVttb2RdKSlcbiAgICAgICAgICAgIGZuKGUpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG59XG47XG52YXIga2V5Q29kZXMgPSB7XG4gICAgYmFja3NwYWNlOiA4LFxuICAgIHRhYjogOSxcbiAgICBlbnRlcjogMTMsXG4gICAgc2hpZnQ6IDE2LFxuICAgIGN0cmw6IDE3LFxuICAgIGFsdDogMTgsXG4gICAgcGF1c2U6IDE5LFxuICAgIGJyZWFrOiAxOSxcbiAgICBjYXBzbG9jazogMjAsXG4gICAgZXNjOiAyNyxcbiAgICBlc2NhcGU6IDI3LFxuICAgIHNwYWNlOiAzMixcbiAgICBwYWdldXA6IDMzLFxuICAgIHBhZ2Vkb3duOiAzNCxcbiAgICBlbmQ6IDM1LFxuICAgIGhvbWU6IDM2LFxuICAgIGxlZnRhcnJvdzogMzcsXG4gICAgdXBhcnJvdzogMzgsXG4gICAgcmlnaHRhcnJvdzogMzksXG4gICAgZG93bmFycm93OiA0MCxcbiAgICBwcm50c2NybjogNDQsXG4gICAgaW5zZXJ0OiA0NSxcbiAgICBkZWxldGU6IDQ2LFxuICAgIFwiMFwiOiA0OCxcbiAgICBcIjFcIjogNDksXG4gICAgXCIyXCI6IDUwLFxuICAgIFwiM1wiOiA1MSxcbiAgICBcIjRcIjogNTIsXG4gICAgXCI1XCI6IDUzLFxuICAgIFwiNlwiOiA1NCxcbiAgICBcIjdcIjogNTUsXG4gICAgXCI4XCI6IDU2LFxuICAgIFwiOVwiOiA1NyxcbiAgICBhOiA2NSxcbiAgICBiOiA2NixcbiAgICBjOiA2NyxcbiAgICBkOiA2OCxcbiAgICBlOiA2OSxcbiAgICBmOiA3MCxcbiAgICBnOiA3MSxcbiAgICBoOiA3MixcbiAgICBpOiA3MyxcbiAgICBqOiA3NCxcbiAgICBrOiA3NSxcbiAgICBsOiA3NixcbiAgICBtOiA3NyxcbiAgICBuOiA3OCxcbiAgICBvOiA3OSxcbiAgICBwOiA4MCxcbiAgICBxOiA4MSxcbiAgICByOiA4MixcbiAgICBzOiA4MyxcbiAgICB0OiA4NCxcbiAgICB1OiA4NSxcbiAgICB2OiA4NixcbiAgICB3OiA4NyxcbiAgICB4OiA4OCxcbiAgICB5OiA4OSxcbiAgICB6OiA5MCxcbiAgICB3aW5rZXk6IDkxLFxuICAgIHdpbm1lbnU6IDkzLFxuICAgIGYxOiAxMTIsXG4gICAgZjI6IDExMyxcbiAgICBmMzogMTE0LFxuICAgIGY0OiAxMTUsXG4gICAgZjU6IDExNixcbiAgICBmNjogMTE3LFxuICAgIGY3OiAxMTgsXG4gICAgZjg6IDExOSxcbiAgICBmOTogMTIwLFxuICAgIGYxMDogMTIxLFxuICAgIGYxMTogMTIyLFxuICAgIGYxMjogMTIzLFxuICAgIG51bWxvY2s6IDE0NCxcbiAgICBzY3JvbGxsb2NrOiAxNDUsXG4gICAgXCIsXCI6IDE4OCxcbiAgICBcIjxcIjogMTg4LFxuICAgIFwiLlwiOiAxOTAsXG4gICAgXCI+XCI6IDE5MCxcbiAgICBcIi9cIjogMTkxLFxuICAgIFwiP1wiOiAxOTEsXG4gICAgXCJgXCI6IDE5MixcbiAgICBcIn5cIjogMTkyLFxuICAgIFwiW1wiOiAyMTksXG4gICAgXCJ7XCI6IDIxOSxcbiAgICBcIlxcXFxcIjogMjIwLFxuICAgIFwifFwiOiAyMjAsXG4gICAgXCJdXCI6IDIyMSxcbiAgICBcIn1cIjogMjIxLFxuICAgIFwiJ1wiOiAyMjIsXG4gICAgXCJcXFwiXCI6IDIyMlxufTtcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vfi9zdXJwbHVzLW1peGluLW9ua2V5L2luZGV4LmVzLmpzXG4vLyBtb2R1bGUgaWQgPSAxM1xuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCJpbXBvcnQgeyBTIH0gZnJvbSAnLi9pbmRleCc7XG5leHBvcnQgZnVuY3Rpb24gY29udGVudChwYXJlbnQsIHZhbHVlLCBjdXJyZW50KSB7XG4gICAgdmFyIHQgPSB0eXBlb2YgdmFsdWU7XG4gICAgaWYgKGN1cnJlbnQgPT09IHZhbHVlKSB7XG4gICAgICAgIC8vIG5vdGhpbmcgdG8gZG9cbiAgICB9XG4gICAgZWxzZSBpZiAodCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgLy8gaWYgYSBUZXh0IG5vZGUgYWxyZWFkeSBleGlzdHMsIGl0J3MgZmFzdGVyIHRvIHNldCBpdHMgLmRhdGEgdGhhbiBzZXQgdGhlIHBhcmVudC50ZXh0Q29udGVudFxuICAgICAgICBpZiAoY3VycmVudCAhPT0gXCJcIiAmJiB0eXBlb2YgY3VycmVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGN1cnJlbnQgPSBwYXJlbnQuZmlyc3RDaGlsZC5kYXRhID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjdXJyZW50ID0gcGFyZW50LnRleHRDb250ZW50ID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAodCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgdmFsdWUgPSB2YWx1ZS50b1N0cmluZygpO1xuICAgICAgICBpZiAoY3VycmVudCAhPT0gXCJcIiAmJiB0eXBlb2YgY3VycmVudCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIGN1cnJlbnQgPSBwYXJlbnQuZmlyc3RDaGlsZC5kYXRhID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjdXJyZW50ID0gcGFyZW50LnRleHRDb250ZW50ID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAodmFsdWUgPT0gbnVsbCB8fCB0ID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgY2xlYXIocGFyZW50KTtcbiAgICAgICAgY3VycmVudCA9IFwiXCI7XG4gICAgfVxuICAgIGVsc2UgaWYgKHQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgUyhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBjdXJyZW50ID0gY29udGVudChwYXJlbnQsIHZhbHVlKCksIGN1cnJlbnQpO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgZWxzZSBpZiAodmFsdWUgaW5zdGFuY2VvZiBOb2RlKSB7XG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KGN1cnJlbnQpKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICBwYXJlbnQuYXBwZW5kQ2hpbGQodmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoY3VycmVudC5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICBwYXJlbnQucmVwbGFjZUNoaWxkKHZhbHVlLCBjdXJyZW50WzBdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGNsZWFyKHBhcmVudCk7XG4gICAgICAgICAgICAgICAgcGFyZW50LmFwcGVuZENoaWxkKHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChjdXJyZW50ID09PSBcIlwiKSB7XG4gICAgICAgICAgICBwYXJlbnQuYXBwZW5kQ2hpbGQodmFsdWUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcGFyZW50LnJlcGxhY2VDaGlsZCh2YWx1ZSwgcGFyZW50LmZpcnN0Q2hpbGQpO1xuICAgICAgICB9XG4gICAgICAgIGN1cnJlbnQgPSB2YWx1ZTtcbiAgICB9XG4gICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgdmFyIGFycmF5ID0gbm9ybWFsaXplSW5jb21pbmdBcnJheShbXSwgdmFsdWUpO1xuICAgICAgICBpZiAoYXJyYXkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBjbGVhcihwYXJlbnQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY3VycmVudCkpIHtcbiAgICAgICAgICAgICAgICBpZiAoY3VycmVudC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgYXBwZW5kTm9kZXMocGFyZW50LCBhcnJheSwgMCwgYXJyYXkubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlY29uY2lsZUFycmF5cyhwYXJlbnQsIGN1cnJlbnQsIGFycmF5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChjdXJyZW50ID09PSBcIlwiKSB7XG4gICAgICAgICAgICAgICAgYXBwZW5kTm9kZXMocGFyZW50LCBhcnJheSwgMCwgYXJyYXkubGVuZ3RoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHJlY29uY2lsZUFycmF5cyhwYXJlbnQsIFtwYXJlbnQuZmlyc3RDaGlsZF0sIGFycmF5KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjdXJyZW50ID0gYXJyYXk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJjb250ZW50IG11c3QgYmUgTm9kZSwgc3RyaW5nYWJsZSwgb3IgYXJyYXkgb2Ygc2FtZVwiKTtcbiAgICB9XG4gICAgcmV0dXJuIGN1cnJlbnQ7XG59XG52YXIgTk9NQVRDSCA9IC0xLCBOT0lOU0VSVCA9IC0yO1xudmFyIFJFQ09OQ0lMRV9BUlJBWV9CQVRDSCA9IDA7XG52YXIgUkVDT05DSUxFX0FSUkFZX0JJVFMgPSAxNiwgUkVDT05DSUxFX0FSUkFZX0lOQyA9IDEgPDwgUkVDT05DSUxFX0FSUkFZX0JJVFMsIFJFQ09OQ0lMRV9BUlJBWV9NQVNLID0gUkVDT05DSUxFX0FSUkFZX0lOQyAtIDE7XG4vLyByZWNvbmNpbGUgdGhlIGNvbnRlbnQgb2YgcGFyZW50IGZyb20gbnMgdG8gdXNcbi8vIHNlZSBpdmkncyBleGNlbGxlbnQgd3JpdGV1cCBvZiBkaWZmaW5nIGFycmF5cyBpbiBhIHZkb20gbGlicmFyeTogXG4vLyBodHRwczovL2dpdGh1Yi5jb20vaXZpanMvaXZpL2Jsb2IvMmM4MWVhZDkzNGI5MTI4ZTA5MmNjMmE1ZWYyZDNjYWJjNzNjYjVkZC9wYWNrYWdlcy9pdmkvc3JjL3Zkb20vaW1wbGVtZW50YXRpb24udHMjTDExODdcbi8vIHRoaXMgY29kZSBpc24ndCBpZGVudGljYWwsIHNpbmNlIHdlJ3JlIGRpZmZpbmcgcmVhbCBkb20gbm9kZXMgdG8gbm9kZXMtb3Itc3RyaW5ncywgXG4vLyBidXQgdGhlIGNvcmUgbWV0aG9kb2xvZ3kgb2YgdHJpbW1pbmcgZW5kcyBhbmQgcmV2ZXJzYWxzLCBtYXRjaGluZyBub2RlcywgdGhlbiB1c2luZ1xuLy8gdGhlIGxvbmdlc3QgaW5jcmVhc2luZyBzdWJzZXF1ZW5jZSB0byBtaW5pbWl6ZSBET00gb3BzIGlzIGluc3BpcmVkIGJ5IGl2aS5cbmZ1bmN0aW9uIHJlY29uY2lsZUFycmF5cyhwYXJlbnQsIG5zLCB1cykge1xuICAgIHZhciB1bGVuID0gdXMubGVuZ3RoLCBcbiAgICAvLyBuID0gbm9kZXMsIHUgPSB1cGRhdGVzXG4gICAgLy8gcmFuZ2VzIGRlZmluZWQgYnkgbWluIGFuZCBtYXggaW5kaWNlc1xuICAgIG5taW4gPSAwLCBubWF4ID0gbnMubGVuZ3RoIC0gMSwgdW1pbiA9IDAsIHVtYXggPSB1bGVuIC0gMSwgXG4gICAgLy8gc3RhcnQgbm9kZXMgb2YgcmFuZ2VzXG4gICAgbiA9IG5zW25taW5dLCB1ID0gdXNbdW1pbl0sIFxuICAgIC8vIGVuZCBub2RlcyBvZiByYW5nZXNcbiAgICBueCA9IG5zW25tYXhdLCB1eCA9IHVzW3VtYXhdLCBcbiAgICAvLyBub2RlLCBpZiBhbnksIGp1c3QgYWZ0ZXIgdXgsIHVzZWQgZm9yIGRvaW5nIC5pbnNlcnRCZWZvcmUoKSB0byBwdXQgbm9kZXMgYXQgZW5kXG4gICAgdWwgPSBueC5uZXh0U2libGluZywgaSwgaiwgaywgbG9vcCA9IHRydWU7XG4gICAgLy8gc2NhbiBvdmVyIGNvbW1vbiBwcmVmaXhlcywgc3VmZml4ZXMsIGFuZCBzaW1wbGUgcmV2ZXJzYWxzXG4gICAgZml4ZXM6IHdoaWxlIChsb29wKSB7XG4gICAgICAgIGxvb3AgPSBmYWxzZTtcbiAgICAgICAgLy8gY29tbW9uIHByZWZpeCwgdSA9PT0gblxuICAgICAgICB3aGlsZSAoZXF1YWJsZSh1LCBuLCB1bWluLCB1cykpIHtcbiAgICAgICAgICAgIHVtaW4rKztcbiAgICAgICAgICAgIG5taW4rKztcbiAgICAgICAgICAgIGlmICh1bWluID4gdW1heCB8fCBubWluID4gbm1heClcbiAgICAgICAgICAgICAgICBicmVhayBmaXhlcztcbiAgICAgICAgICAgIHUgPSB1c1t1bWluXTtcbiAgICAgICAgICAgIG4gPSBuc1tubWluXTtcbiAgICAgICAgfVxuICAgICAgICAvLyBjb21tb24gc3VmZml4LCB1eCA9PT0gbnhcbiAgICAgICAgd2hpbGUgKGVxdWFibGUodXgsIG54LCB1bWF4LCB1cykpIHtcbiAgICAgICAgICAgIHVsID0gbng7XG4gICAgICAgICAgICB1bWF4LS07XG4gICAgICAgICAgICBubWF4LS07XG4gICAgICAgICAgICBpZiAodW1pbiA+IHVtYXggfHwgbm1pbiA+IG5tYXgpXG4gICAgICAgICAgICAgICAgYnJlYWsgZml4ZXM7XG4gICAgICAgICAgICB1eCA9IHVzW3VtYXhdO1xuICAgICAgICAgICAgbnggPSBuc1tubWF4XTtcbiAgICAgICAgfVxuICAgICAgICAvLyByZXZlcnNhbCB1ID09PSBueCwgaGF2ZSB0byBzd2FwIG5vZGUgZm9yd2FyZFxuICAgICAgICB3aGlsZSAoZXF1YWJsZSh1LCBueCwgdW1pbiwgdXMpKSB7XG4gICAgICAgICAgICBsb29wID0gdHJ1ZTtcbiAgICAgICAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUobngsIG4pO1xuICAgICAgICAgICAgdW1pbisrO1xuICAgICAgICAgICAgbm1heC0tO1xuICAgICAgICAgICAgaWYgKHVtaW4gPiB1bWF4IHx8IG5taW4gPiBubWF4KVxuICAgICAgICAgICAgICAgIGJyZWFrIGZpeGVzO1xuICAgICAgICAgICAgdSA9IHVzW3VtaW5dO1xuICAgICAgICAgICAgbnggPSBuc1tubWF4XTtcbiAgICAgICAgfVxuICAgICAgICAvLyByZXZlcnNhbCB1eCA9PT0gbiwgaGF2ZSB0byBzd2FwIG5vZGUgYmFja1xuICAgICAgICB3aGlsZSAoZXF1YWJsZSh1eCwgbiwgdW1heCwgdXMpKSB7XG4gICAgICAgICAgICBsb29wID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmICh1bCA9PT0gbnVsbClcbiAgICAgICAgICAgICAgICBwYXJlbnQuYXBwZW5kQ2hpbGQobik7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZShuLCB1bCk7XG4gICAgICAgICAgICB1bCA9IG47XG4gICAgICAgICAgICB1bWF4LS07XG4gICAgICAgICAgICBubWluKys7XG4gICAgICAgICAgICBpZiAodW1pbiA+IHVtYXggfHwgbm1pbiA+IG5tYXgpXG4gICAgICAgICAgICAgICAgYnJlYWsgZml4ZXM7XG4gICAgICAgICAgICB1eCA9IHVzW3VtYXhdO1xuICAgICAgICAgICAgbiA9IG5zW25taW5dO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIGlmIHRoYXQgY292ZXJlZCBhbGwgdXBkYXRlcywganVzdCBuZWVkIHRvIHJlbW92ZSBhbnkgcmVtYWluaW5nIG5vZGVzIGFuZCB3ZSdyZSBkb25lXG4gICAgaWYgKHVtaW4gPiB1bWF4KSB7XG4gICAgICAgIC8vIHJlbW92ZSBhbnkgcmVtYWluaW5nIG5vZGVzXG4gICAgICAgIHdoaWxlIChubWluIDw9IG5tYXgpIHtcbiAgICAgICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChuc1tubWF4XSk7XG4gICAgICAgICAgICBubWF4LS07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBpZiB0aGF0IGNvdmVyZWQgYWxsIGN1cnJlbnQgbm9kZXMsIGp1c3QgbmVlZCB0byBpbnNlcnQgYW55IHJlbWFpbmluZyB1cGRhdGVzIGFuZCB3ZSdyZSBkb25lXG4gICAgaWYgKG5taW4gPiBubWF4KSB7XG4gICAgICAgIC8vIGluc2VydCBhbnkgcmVtYWluaW5nIG5vZGVzXG4gICAgICAgIHdoaWxlICh1bWluIDw9IHVtYXgpIHtcbiAgICAgICAgICAgIGluc2VydE9yQXBwZW5kKHBhcmVudCwgdXNbdW1pbl0sIHVsLCB1bWluLCB1cyk7XG4gICAgICAgICAgICB1bWluKys7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBzaW1wbGUgY2FzZXMgZG9uJ3QgYXBwbHksIGhhdmUgdG8gYWN0dWFsbHkgbWF0Y2ggdXAgbm9kZXMgYW5kIGZpZ3VyZSBvdXQgbWluaW11bSBET00gb3BzXG4gICAgLy8gbG9vcCB0aHJvdWdoIG5vZGVzIGFuZCBtYXJrIHRoZW0gd2l0aCBhIHNwZWNpYWwgcHJvcGVydHkgaW5kaWNhdGluZyB0aGVpciBvcmRlclxuICAgIC8vIHdlJ2xsIHRoZW4gZ28gdGhyb3VnaCB0aGUgdXBkYXRlcyBhbmQgbG9vayBmb3IgdGhvc2UgcHJvcGVydGllc1xuICAgIC8vIGluIGNhc2UgYW55IG9mIHRoZSB1cGRhdGVzIGhhdmUgb3JkZXIgcHJvcGVydGllcyBsZWZ0IG92ZXIgZnJvbSBlYXJsaWVyIHJ1bnMsIHdlIFxuICAgIC8vIHVzZSB0aGUgbG93IGJpdHMgb2YgdGhlIG9yZGVyIHByb3AgdG8gcmVjb3JkIGEgYmF0Y2ggaWRlbnRpZmllci5cbiAgICAvLyBJJ2QgbXVjaCByYXRoZXIgdXNlIGEgTWFwIHRoYW4gYSBzcGVjaWFsIHByb3BlcnR5LCBidXQgTWFwcyBvZiBvYmplY3RzIGFyZSByZWFsbHlcbiAgICAvLyBzbG93IGN1cnJlbnRseSwgbGlrZSBvbmx5IDEwMGsgZ2V0L3NldCBvcHMgLyBzZWNvbmRcbiAgICAvLyBmb3IgVGV4dCBub2RlcywgYWxsIHRoYXQgbWF0dGVycyBpcyB0aGVpciBvcmRlciwgYXMgdGhleSdyZSBlYXNpbHksIGludGVyY2hhbmdlYWJsZVxuICAgIC8vIHNvIHdlIHJlY29yZCB0aGVpciBwb3NpdGlvbnMgaW4gbnRleHRbXVxuICAgIHZhciBudGV4dCA9IFtdO1xuICAgIC8vIHVwZGF0ZSBnbG9iYWwgYmF0Y2ggaWRlbnRpZmVyXG4gICAgUkVDT05DSUxFX0FSUkFZX0JBVENIID0gKFJFQ09OQ0lMRV9BUlJBWV9CQVRDSCArIDEpICUgUkVDT05DSUxFX0FSUkFZX0lOQztcbiAgICBmb3IgKGkgPSBubWluLCBqID0gKG5taW4gPDwgUkVDT05DSUxFX0FSUkFZX0JJVFMpICsgUkVDT05DSUxFX0FSUkFZX0JBVENIOyBpIDw9IG5tYXg7IGkrKywgaiArPSBSRUNPTkNJTEVfQVJSQVlfSU5DKSB7XG4gICAgICAgIG4gPSBuc1tpXTtcbiAgICAgICAgLy8gYWRkIG9yIHVwZGF0ZSBzcGVjaWFsIG9yZGVyIHByb3BlcnR5XG4gICAgICAgIGlmIChuLl9fc3VycGx1c19vcmRlciA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobiwgJ19fc3VycGx1c19vcmRlcicsIHsgdmFsdWU6IGosIHdyaXRhYmxlOiB0cnVlIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbi5fX3N1cnBsdXNfb3JkZXIgPSBqO1xuICAgICAgICB9XG4gICAgICAgIGlmIChuIGluc3RhbmNlb2YgVGV4dCkge1xuICAgICAgICAgICAgbnRleHQucHVzaChpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBub3cgbG9vcCB0aHJvdWdoIHVzLCBsb29raW5nIGZvciB0aGUgb3JkZXIgcHJvcGVydHksIG90aGVyd2lzZSByZWNvcmRpbmcgTk9NQVRDSFxuICAgIHZhciBzcmMgPSBuZXcgQXJyYXkodW1heCAtIHVtaW4gKyAxKSwgdXRleHQgPSBbXSwgcHJlc2VydmVkID0gMDtcbiAgICBmb3IgKGkgPSB1bWluOyBpIDw9IHVtYXg7IGkrKykge1xuICAgICAgICB1ID0gdXNbaV07XG4gICAgICAgIGlmICh0eXBlb2YgdSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHV0ZXh0LnB1c2goaSk7XG4gICAgICAgICAgICBzcmNbaSAtIHVtaW5dID0gTk9NQVRDSDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICgoaiA9IHUuX19zdXJwbHVzX29yZGVyKSAhPT0gdW5kZWZpbmVkICYmIChqICYgUkVDT05DSUxFX0FSUkFZX01BU0spID09PSBSRUNPTkNJTEVfQVJSQVlfQkFUQ0gpIHtcbiAgICAgICAgICAgIGogPj49IFJFQ09OQ0lMRV9BUlJBWV9CSVRTO1xuICAgICAgICAgICAgc3JjW2kgLSB1bWluXSA9IGo7XG4gICAgICAgICAgICBuc1tqXSA9IG51bGw7XG4gICAgICAgICAgICBwcmVzZXJ2ZWQrKztcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHNyY1tpIC0gdW1pbl0gPSBOT01BVENIO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChwcmVzZXJ2ZWQgPT09IDAgJiYgbm1pbiA9PT0gMCAmJiBubWF4ID09PSBucy5sZW5ndGggLSAxKSB7XG4gICAgICAgIC8vIG5vIG5vZGVzIHByZXNlcnZlZCwgdXNlIGZhc3QgY2xlYXIgYW5kIGFwcGVuZFxuICAgICAgICBjbGVhcihwYXJlbnQpO1xuICAgICAgICB3aGlsZSAodW1pbiA8PSB1bWF4KSB7XG4gICAgICAgICAgICBpbnNlcnRPckFwcGVuZChwYXJlbnQsIHVzW3VtaW5dLCBudWxsLCB1bWluLCB1cyk7XG4gICAgICAgICAgICB1bWluKys7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICAvLyBmaW5kIGxvbmdlc3QgY29tbW9uIHNlcXVlbmNlIGJldHdlZW4gbnMgYW5kIHVzLCByZXByZXNlbnRlZCBhcyB0aGUgaW5kaWNlcyBcbiAgICAvLyBvZiB0aGUgbG9uZ2VzdCBpbmNyZWFzaW5nIHN1YnNlcXVlbmNlIGluIHNyY1xuICAgIHZhciBsY3MgPSBsb25nZXN0UG9zaXRpdmVJbmNyZWFzaW5nU3Vic2VxdWVuY2Uoc3JjKTtcbiAgICAvLyB3ZSBrbm93IHdlIGNhbiBwcmVzZXJ2ZSB0aGVpciBvcmRlciwgc28gbWFyY2ggdGhlbSBhcyBOT0lOU0VSVFxuICAgIGZvciAoaSA9IDA7IGkgPCBsY3MubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgc3JjW2xjc1tpXV0gPSBOT0lOU0VSVDtcbiAgICB9XG4gICAgLypcbiAgICAgICAgICAgICAgMCAgIDEgICAyICAgMyAgIDQgICA1ICAgNiAgIDdcbiAgICBucyAgICA9IFsgbiwgIG4sICB0LCAgbiwgIG4sICBuLCAgdCwgIG4gXVxuICAgICAgICAgICAgICAgICAgfCAgICAgICAgICAvICAgLyAgICAgICAvXG4gICAgICAgICAgICAgICAgICB8ICAgICAgICAvICAgLyAgICAgICAvXG4gICAgICAgICAgICAgICAgICArLS0tLS0tLy0tLS8tLS0tLS0tLy0tLS0rXG4gICAgICAgICAgICAgICAgICAgICAgIC8gICAvICAgICAgIC8gICAgICB8XG4gICAgdXMgICAgPSBbIG4sICBzLCAgbiwgIG4sICBzLCAgbiwgIHMsICBuIF1cbiAgICBzcmMgICA9IFstMSwgLTEsICA0LCAgNSwgLTEsICA3LCAtMSwgIDEgXVxuICAgIGxpcyAgID0gWyAgICAgICAgIDIsICAzLCAgICAgIDVdXG4gICAgICAgICAgICAgICAgICAgICAgalxuICAgIHV0ZXh0ID0gWyAgICAgMSwgICAgICAgICAgNCwgICAgICA2IF1cbiAgICAgICAgICAgICAgICAgIGlcbiAgICBudGV4dCA9IFsgICAgICAgICAyLCAgICAgICAgICAgICAgNiBdXG4gICAgICAgICAgICAgICAgICAgICAga1xuICAgICovXG4gICAgLy8gcmVwbGFjZSBzdHJpbmdzIGluIHVzIHdpdGggVGV4dCBub2RlcywgcmV1c2luZyBUZXh0IG5vZGVzIGZyb20gbnMgd2hlbiB3ZSBjYW4gZG8gc28gd2l0aG91dCBtb3ZpbmcgdGhlbVxuICAgIHZhciB1dGV4dGkgPSAwLCBsY3NqID0gMCwgbnRleHRrID0gMDtcbiAgICBmb3IgKGkgPSAwLCBqID0gMCwgayA9IDA7IGkgPCB1dGV4dC5sZW5ndGg7IGkrKykge1xuICAgICAgICB1dGV4dGkgPSB1dGV4dFtpXTtcbiAgICAgICAgLy8gbmVlZCB0byBhbnN3ZXIgcWV1c3Rpb24gXCJpZiB1dGV4dFtpXSBmYWxscyBiZXR3ZWVuIHR3byBsY3Mgbm9kZXMsIGlzIHRoZXJlIGFuIG50ZXh0IGJldHdlZW4gdGhlbSB3aGljaCB3ZSBjYW4gcmV1c2U/XCJcbiAgICAgICAgLy8gZmlyc3QsIGZpbmQgaiBzdWNoIHRoYXQgbGNzW2pdIGlzIHRoZSBmaXJzdCBsY3Mgbm9kZSAqYWZ0ZXIqIHV0ZXh0W2ldXG4gICAgICAgIHdoaWxlIChqIDwgbGNzLmxlbmd0aCAmJiAobGNzaiA9IGxjc1tqXSkgPCB1dGV4dGkgLSB1bWluKVxuICAgICAgICAgICAgaisrO1xuICAgICAgICAvLyBub3csIGZpbmQgayBzdWNoIHRoYXQgbnRleHRba10gaXMgdGhlIGZpcnN0IG50ZXh0ICphZnRlciogbGNzW2otMV0gKG9yIGFmdGVyIHN0YXJ0LCBpZiBqID09PSAwKVxuICAgICAgICB3aGlsZSAoayA8IG50ZXh0Lmxlbmd0aCAmJiAobnRleHRrID0gbnRleHRba10sIGogIT09IDApICYmIG50ZXh0ayA8IHNyY1tsY3NbaiAtIDFdXSlcbiAgICAgICAgICAgIGsrKztcbiAgICAgICAgLy8gaWYgbnRleHRba10gPCBsY3Nbal0sIHRoZW4gd2Uga25vdyBudGV4dFtrXSBmYWxscyBiZXR3ZWVuIGxjc1tqLTFdIChvciBzdGFydCkgYW5kIGxjc1tqXSAob3IgZW5kKVxuICAgICAgICAvLyB0aGF0IG1lYW5zIHdlIGNhbiByZS11c2UgaXQgd2l0aG91dCBtb3ZpbmcgaXRcbiAgICAgICAgaWYgKGsgPCBudGV4dC5sZW5ndGggJiYgKGogPT09IGxjcy5sZW5ndGggfHwgbnRleHRrIDwgc3JjW2xjc2pdKSkge1xuICAgICAgICAgICAgbiA9IG5zW250ZXh0a107XG4gICAgICAgICAgICB1ID0gdXNbdXRleHRpXTtcbiAgICAgICAgICAgIGlmIChuLmRhdGEgIT09IHUpXG4gICAgICAgICAgICAgICAgbi5kYXRhID0gdTtcbiAgICAgICAgICAgIG5zW250ZXh0a10gPSBudWxsO1xuICAgICAgICAgICAgdXNbdXRleHRpXSA9IG47XG4gICAgICAgICAgICBzcmNbdXRleHRpXSA9IE5PSU5TRVJUO1xuICAgICAgICAgICAgaysrO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgLy8gaWYgd2UgZGlkbid0IGZpbmQgb25lIHRvIHJlLXVzZSwgbWFrZSBhIG5ldyBUZXh0IG5vZGVcbiAgICAgICAgICAgIHVzW3V0ZXh0aV0gPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh1c1t1dGV4dGldKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyByZW1vdmUgc3RhbGUgbm9kZXMgaW4gbnNcbiAgICB3aGlsZSAobm1pbiA8PSBubWF4KSB7XG4gICAgICAgIG4gPSBuc1tubWluXTtcbiAgICAgICAgaWYgKG4gIT09IG51bGwpIHtcbiAgICAgICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZChuKTtcbiAgICAgICAgfVxuICAgICAgICBubWluKys7XG4gICAgfVxuICAgIC8vIGluc2VydCBuZXcgbm9kZXNcbiAgICB3aGlsZSAodW1pbiA8PSB1bWF4KSB7XG4gICAgICAgIHV4ID0gdXNbdW1heF07XG4gICAgICAgIGlmIChzcmNbdW1heCAtIHVtaW5dICE9PSBOT0lOU0VSVCkge1xuICAgICAgICAgICAgaWYgKHVsID09PSBudWxsKVxuICAgICAgICAgICAgICAgIHBhcmVudC5hcHBlbmRDaGlsZCh1eCk7XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZSh1eCwgdWwpO1xuICAgICAgICB9XG4gICAgICAgIHVsID0gdXg7XG4gICAgICAgIHVtYXgtLTtcbiAgICB9XG59XG4vLyB0d28gbm9kZXMgYXJlIFwiZXF1YWJsZVwiIGlmIHRoZXkgYXJlIGlkZW50aWNhbCAoPT09KSBvciBpZiB3ZSBjYW4gbWFrZSB0aGVtIHRoZSBzYW1lLCBpLmUuIHRoZXkncmUgXG4vLyBUZXh0IG5vZGVzLCB3aGljaCB3ZSBjYW4gcmV1c2Ugd2l0aCB0aGUgbmV3IHRleHRcbmZ1bmN0aW9uIGVxdWFibGUodSwgbiwgaSwgdXMpIHtcbiAgICBpZiAodSA9PT0gbikge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZW9mIHUgPT09ICdzdHJpbmcnICYmIG4gaW5zdGFuY2VvZiBUZXh0KSB7XG4gICAgICAgIGlmIChuLmRhdGEgIT09IHUpXG4gICAgICAgICAgICBuLmRhdGEgPSB1O1xuICAgICAgICB1c1tpXSA9IG47XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGFwcGVuZE5vZGVzKHBhcmVudCwgYXJyYXksIGksIGVuZCkge1xuICAgIHZhciBub2RlO1xuICAgIGZvciAoOyBpIDwgZW5kOyBpKyspIHtcbiAgICAgICAgbm9kZSA9IGFycmF5W2ldO1xuICAgICAgICBpZiAobm9kZSBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICAgICAgICAgIHBhcmVudC5hcHBlbmRDaGlsZChub2RlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG5vZGUgPSBhcnJheVtpXSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKG5vZGUpO1xuICAgICAgICAgICAgcGFyZW50LmFwcGVuZENoaWxkKG5vZGUpO1xuICAgICAgICB9XG4gICAgfVxufVxuZnVuY3Rpb24gaW5zZXJ0T3JBcHBlbmQocGFyZW50LCBub2RlLCBtYXJrZXIsIGksIHVzKSB7XG4gICAgaWYgKHR5cGVvZiBub2RlID09PSAnc3RyaW5nJykge1xuICAgICAgICBub2RlID0gdXNbaV0gPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShub2RlKTtcbiAgICB9XG4gICAgaWYgKG1hcmtlciA9PT0gbnVsbClcbiAgICAgICAgcGFyZW50LmFwcGVuZENoaWxkKG5vZGUpO1xuICAgIGVsc2VcbiAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZShub2RlLCBtYXJrZXIpO1xufVxuZnVuY3Rpb24gbm9ybWFsaXplSW5jb21pbmdBcnJheShub3JtYWxpemVkLCBhcnJheSkge1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhcnJheS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICB2YXIgaXRlbSA9IGFycmF5W2ldO1xuICAgICAgICBpZiAoaXRlbSBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICAgICAgICAgIG5vcm1hbGl6ZWQucHVzaChpdGVtKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChpdGVtID09IG51bGwgfHwgaXRlbSA9PT0gdHJ1ZSB8fCBpdGVtID09PSBmYWxzZSkge1xuICAgICAgICAgICAgLy8gc2tpcFxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoaXRlbSkpIHtcbiAgICAgICAgICAgIG5vcm1hbGl6ZUluY29taW5nQXJyYXkobm9ybWFsaXplZCwgaXRlbSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodHlwZW9mIGl0ZW0gPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBub3JtYWxpemVkLnB1c2goaXRlbSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBub3JtYWxpemVkLnB1c2goaXRlbS50b1N0cmluZygpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbm9ybWFsaXplZDtcbn1cbmZ1bmN0aW9uIGNsZWFyKG5vZGUpIHtcbiAgICBub2RlLnRleHRDb250ZW50ID0gXCJcIjtcbn1cbi8vIHJldHVybiBhbiBhcnJheSBvZiB0aGUgaW5kaWNlcyBvZiBucyB0aGF0IGNvbXByaXNlIHRoZSBsb25nZXN0IGluY3JlYXNpbmcgc3Vic2VxdWVuY2Ugd2l0aGluIG5zXG5mdW5jdGlvbiBsb25nZXN0UG9zaXRpdmVJbmNyZWFzaW5nU3Vic2VxdWVuY2UobnMpIHtcbiAgICB2YXIgc2VxID0gW10sIGlzID0gW10sIGwgPSAtMSwgcHJlID0gbmV3IEFycmF5KG5zLmxlbmd0aCk7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IG5zLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIHZhciBuID0gbnNbaV07XG4gICAgICAgIGlmIChuIDwgMClcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB2YXIgaiA9IGZpbmRHcmVhdGVzdEluZGV4TEVRKHNlcSwgbik7XG4gICAgICAgIGlmIChqICE9PSAtMSlcbiAgICAgICAgICAgIHByZVtpXSA9IGlzW2pdO1xuICAgICAgICBpZiAoaiA9PT0gbCkge1xuICAgICAgICAgICAgbCsrO1xuICAgICAgICAgICAgc2VxW2xdID0gbjtcbiAgICAgICAgICAgIGlzW2xdID0gaTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChuIDwgc2VxW2ogKyAxXSkge1xuICAgICAgICAgICAgc2VxW2ogKyAxXSA9IG47XG4gICAgICAgICAgICBpc1tqICsgMV0gPSBpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAoaSA9IGlzW2xdOyBsID49IDA7IGkgPSBwcmVbaV0sIGwtLSkge1xuICAgICAgICBzZXFbbF0gPSBpO1xuICAgIH1cbiAgICByZXR1cm4gc2VxO1xufVxuZnVuY3Rpb24gZmluZEdyZWF0ZXN0SW5kZXhMRVEoc2VxLCBuKSB7XG4gICAgLy8gaW52YXJpYW50OiBsbyBpcyBndWFyYW50ZWVkIHRvIGJlIGluZGV4IG9mIGEgdmFsdWUgPD0gbiwgaGkgdG8gYmUgPlxuICAgIC8vIHRoZXJlZm9yZSwgdGhleSBhY3R1YWxseSBzdGFydCBvdXQgb2YgcmFuZ2U6ICgtMSwgbGFzdCArIDEpXG4gICAgdmFyIGxvID0gLTEsIGhpID0gc2VxLmxlbmd0aDtcbiAgICAvLyBmYXN0IHBhdGggZm9yIHNpbXBsZSBpbmNyZWFzaW5nIHNlcXVlbmNlc1xuICAgIGlmIChoaSA+IDAgJiYgc2VxW2hpIC0gMV0gPD0gbilcbiAgICAgICAgcmV0dXJuIGhpIC0gMTtcbiAgICB3aGlsZSAoaGkgLSBsbyA+IDEpIHtcbiAgICAgICAgdmFyIG1pZCA9IE1hdGguZmxvb3IoKGxvICsgaGkpIC8gMik7XG4gICAgICAgIGlmIChzZXFbbWlkXSA+IG4pIHtcbiAgICAgICAgICAgIGhpID0gbWlkO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbG8gPSBtaWQ7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGxvO1xufVxuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9+L3N1cnBsdXMvZXMvY29udGVudC5qc1xuLy8gbW9kdWxlIGlkID0gMTRcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwidmFyIFxuLy8gcHJlLXNlZWQgdGhlIGNhY2hlcyB3aXRoIGEgZmV3IHNwZWNpYWwgY2FzZXMsIHNvIHdlIGRvbid0IG5lZWQgdG8gY2hlY2sgZm9yIHRoZW0gaW4gdGhlIGNvbW1vbiBjYXNlc1xuaHRtbEZpZWxkQ2FjaGUgPSB7XG4gICAgLy8gc3BlY2lhbCBwcm9wc1xuICAgIHN0eWxlOiBbJ3N0eWxlJywgbnVsbCwgMyAvKiBBc3NpZ24gKi9dLFxuICAgIHJlZjogWydyZWYnLCBudWxsLCAyIC8qIElnbm9yZSAqL10sXG4gICAgZm46IFsnZm4nLCBudWxsLCAyIC8qIElnbm9yZSAqL10sXG4gICAgLy8gYXR0ciBjb21wYXRcbiAgICBjbGFzczogWydjbGFzc05hbWUnLCBudWxsLCAwIC8qIFByb3BlcnR5ICovXSxcbiAgICBmb3I6IFsnaHRtbEZvcicsIG51bGwsIDAgLyogUHJvcGVydHkgKi9dLFxuICAgIFwiYWNjZXB0LWNoYXJzZXRcIjogWydhY2NlcHRDaGFyc2V0JywgbnVsbCwgMCAvKiBQcm9wZXJ0eSAqL10sXG4gICAgXCJodHRwLWVxdWl2XCI6IFsnaHR0cEVxdWl2JywgbnVsbCwgMCAvKiBQcm9wZXJ0eSAqL10sXG4gICAgLy8gYSBmZXcgUmVhY3Qgb2RkaXRpZXMsIG1vc3RseSBkaXNhZ3JlZWluZyBhYm91dCBjYXNpbmdcbiAgICBvbkRvdWJsZUNsaWNrOiBbJ29uZGJsY2xpY2snLCBudWxsLCAwIC8qIFByb3BlcnR5ICovXSxcbiAgICBzcGVsbENoZWNrOiBbJ3NwZWxsY2hlY2snLCBudWxsLCAwIC8qIFByb3BlcnR5ICovXSxcbiAgICBhbGxvd0Z1bGxTY3JlZW46IFsnYWxsb3dGdWxsc2NyZWVuJywgbnVsbCwgMCAvKiBQcm9wZXJ0eSAqL10sXG4gICAgYXV0b0NhcGl0YWxpemU6IFsnYXV0b2NhcGl0YWxpemUnLCBudWxsLCAwIC8qIFByb3BlcnR5ICovXSxcbiAgICBhdXRvRm9jdXM6IFsnYXV0b2ZvY3VzJywgbnVsbCwgMCAvKiBQcm9wZXJ0eSAqL10sXG4gICAgYXV0b1BsYXk6IFsnYXV0b3BsYXknLCBudWxsLCAwIC8qIFByb3BlcnR5ICovXSxcbiAgICAvLyBvdGhlclxuICAgIC8vIHJvbGUgaXMgcGFydCBvZiB0aGUgQVJJQSBzcGVjIGJ1dCBub3QgY2F1Z2h0IGJ5IHRoZSBhcmlhLSBhdHRyIGZpbHRlclxuICAgIHJvbGU6IFsncm9sZScsIG51bGwsIDEgLyogQXR0cmlidXRlICovXVxufSwgc3ZnRmllbGRDYWNoZSA9IHtcbiAgICAvLyBzcGVjaWFsIHByb3BzXG4gICAgc3R5bGU6IFsnc3R5bGUnLCBudWxsLCAzIC8qIEFzc2lnbiAqL10sXG4gICAgcmVmOiBbJ3JlZicsIG51bGwsIDIgLyogSWdub3JlICovXSxcbiAgICBmbjogWydmbicsIG51bGwsIDIgLyogSWdub3JlICovXSxcbiAgICAvLyBwcm9wZXJ0eSBjb21wYXRcbiAgICBjbGFzc05hbWU6IFsnY2xhc3MnLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgaHRtbEZvcjogWydmb3InLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgdGFiSW5kZXg6IFsndGFiaW5kZXgnLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgLy8gUmVhY3QgY29tcGF0XG4gICAgb25Eb3VibGVDbGljazogWydvbmRibGNsaWNrJywgbnVsbCwgMCAvKiBQcm9wZXJ0eSAqL10sXG4gICAgLy8gYXR0cmlidXRlcyB3aXRoIGVjY2VudHJpYyBjYXNpbmcgLSBzb21lIFNWRyBhdHRycyBhcmUgc25ha2UtY2FzZWQsIHNvbWUgY2FtZWxDYXNlZFxuICAgIGFsbG93UmVvcmRlcjogWydhbGxvd1Jlb3JkZXInLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgYXR0cmlidXRlTmFtZTogWydhdHRyaWJ1dGVOYW1lJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIGF0dHJpYnV0ZVR5cGU6IFsnYXR0cmlidXRlVHlwZScsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICBhdXRvUmV2ZXJzZTogWydhdXRvUmV2ZXJzZScsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICBiYXNlRnJlcXVlbmN5OiBbJ2Jhc2VGcmVxdWVuY3knLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgY2FsY01vZGU6IFsnY2FsY01vZGUnLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgY2xpcFBhdGhVbml0czogWydjbGlwUGF0aFVuaXRzJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIGNvbnRlbnRTY3JpcHRUeXBlOiBbJ2NvbnRlbnRTY3JpcHRUeXBlJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIGNvbnRlbnRTdHlsZVR5cGU6IFsnY29udGVudFN0eWxlVHlwZScsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICBkaWZmdXNlQ29uc3RhbnQ6IFsnZGlmZnVzZUNvbnN0YW50JywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIGVkZ2VNb2RlOiBbJ2VkZ2VNb2RlJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIGV4dGVybmFsUmVzb3VyY2VzUmVxdWlyZWQ6IFsnZXh0ZXJuYWxSZXNvdXJjZXNSZXF1aXJlZCcsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICBmaWx0ZXJSZXM6IFsnZmlsdGVyUmVzJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIGZpbHRlclVuaXRzOiBbJ2ZpbHRlclVuaXRzJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIGdyYWRpZW50VHJhbnNmb3JtOiBbJ2dyYWRpZW50VHJhbnNmb3JtJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIGdyYWRpZW50VW5pdHM6IFsnZ3JhZGllbnRVbml0cycsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICBrZXJuZWxNYXRyaXg6IFsna2VybmVsTWF0cml4JywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIGtlcm5lbFVuaXRMZW5ndGg6IFsna2VybmVsVW5pdExlbmd0aCcsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICBrZXlQb2ludHM6IFsna2V5UG9pbnRzJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIGtleVNwbGluZXM6IFsna2V5U3BsaW5lcycsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICBrZXlUaW1lczogWydrZXlUaW1lcycsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICBsZW5ndGhBZGp1c3Q6IFsnbGVuZ3RoQWRqdXN0JywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIGxpbWl0aW5nQ29uZUFuZ2xlOiBbJ2xpbWl0aW5nQ29uZUFuZ2xlJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIG1hcmtlckhlaWdodDogWydtYXJrZXJIZWlnaHQnLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgbWFya2VyVW5pdHM6IFsnbWFya2VyVW5pdHMnLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgbWFza0NvbnRlbnRVbml0czogWydtYXNrQ29udGVudFVuaXRzJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIG1hc2tVbml0czogWydtYXNrVW5pdHMnLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgbnVtT2N0YXZlczogWydudW1PY3RhdmVzJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIHBhdGhMZW5ndGg6IFsncGF0aExlbmd0aCcsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICBwYXR0ZXJuQ29udGVudFVuaXRzOiBbJ3BhdHRlcm5Db250ZW50VW5pdHMnLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgcGF0dGVyblRyYW5zZm9ybTogWydwYXR0ZXJuVHJhbnNmb3JtJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIHBhdHRlcm5Vbml0czogWydwYXR0ZXJuVW5pdHMnLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgcG9pbnRzQXRYOiBbJ3BvaW50c0F0WCcsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICBwb2ludHNBdFk6IFsncG9pbnRzQXRZJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIHBvaW50c0F0WjogWydwb2ludHNBdFonLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgcHJlc2VydmVBbHBoYTogWydwcmVzZXJ2ZUFscGhhJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIHByZXNlcnZlQXNwZWN0UmF0aW86IFsncHJlc2VydmVBc3BlY3RSYXRpbycsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICBwcmltaXRpdmVVbml0czogWydwcmltaXRpdmVVbml0cycsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICByZWZYOiBbJ3JlZlgnLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgcmVmWTogWydyZWZZJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIHJlcGVhdENvdW50OiBbJ3JlcGVhdENvdW50JywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIHJlcGVhdER1cjogWydyZXBlYXREdXInLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgcmVxdWlyZWRFeHRlbnNpb25zOiBbJ3JlcXVpcmVkRXh0ZW5zaW9ucycsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICByZXF1aXJlZEZlYXR1cmVzOiBbJ3JlcXVpcmVkRmVhdHVyZXMnLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgc3BlY3VsYXJDb25zdGFudDogWydzcGVjdWxhckNvbnN0YW50JywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIHNwZWN1bGFyRXhwb25lbnQ6IFsnc3BlY3VsYXJFeHBvbmVudCcsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICBzcHJlYWRNZXRob2Q6IFsnc3ByZWFkTWV0aG9kJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIHN0YXJ0T2Zmc2V0OiBbJ3N0YXJ0T2Zmc2V0JywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIHN0ZERldmlhdGlvbjogWydzdGREZXZpYXRpb24nLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgc3RpdGNoVGlsZXM6IFsnc3RpdGNoVGlsZXMnLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgc3VyZmFjZVNjYWxlOiBbJ3N1cmZhY2VTY2FsZScsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICBzeXN0ZW1MYW5ndWFnZTogWydzeXN0ZW1MYW5ndWFnZScsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICB0YWJsZVZhbHVlczogWyd0YWJsZVZhbHVlcycsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICB0YXJnZXRYOiBbJ3RhcmdldFgnLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgdGFyZ2V0WTogWyd0YXJnZXRZJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIHRleHRMZW5ndGg6IFsndGV4dExlbmd0aCcsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICB2aWV3Qm94OiBbJ3ZpZXdCb3gnLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgdmlld1RhcmdldDogWyd2aWV3VGFyZ2V0JywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIHhDaGFubmVsU2VsZWN0b3I6IFsneENoYW5uZWxTZWxlY3RvcicsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICB5Q2hhbm5lbFNlbGVjdG9yOiBbJ3lDaGFubmVsU2VsZWN0b3InLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgem9vbUFuZFBhbjogWyd6b29tQW5kUGFuJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxufTtcbnZhciBhdHRyaWJ1dGVPbmx5UnggPSAvLS8sIGRlZXBBdHRyUnggPSAvXnN0eWxlLS8sIGlzQXR0ck9ubHlGaWVsZCA9IGZ1bmN0aW9uIChmaWVsZCkgeyByZXR1cm4gYXR0cmlidXRlT25seVJ4LnRlc3QoZmllbGQpICYmICFkZWVwQXR0clJ4LnRlc3QoZmllbGQpOyB9LCBwcm9wT25seVJ4ID0gL14ob258c3R5bGUpLywgaXNQcm9wT25seUZpZWxkID0gZnVuY3Rpb24gKGZpZWxkKSB7IHJldHVybiBwcm9wT25seVJ4LnRlc3QoZmllbGQpOyB9LCBwcm9wUGFydFJ4ID0gL1thLXpdW0EtWl0vZywgZ2V0QXR0ck5hbWUgPSBmdW5jdGlvbiAoZmllbGQpIHsgcmV0dXJuIGZpZWxkLnJlcGxhY2UocHJvcFBhcnRSeCwgZnVuY3Rpb24gKG0pIHsgcmV0dXJuIG1bMF0gKyAnLScgKyBtWzFdOyB9KS50b0xvd2VyQ2FzZSgpOyB9LCBqc3hFdmVudFByb3BSeCA9IC9eb25bQS1aXS8sIGF0dHJQYXJ0UnggPSAvXFwtKD86W2Etel18JCkvZywgZ2V0UHJvcE5hbWUgPSBmdW5jdGlvbiAoZmllbGQpIHtcbiAgICB2YXIgcHJvcCA9IGZpZWxkLnJlcGxhY2UoYXR0clBhcnRSeCwgZnVuY3Rpb24gKG0pIHsgcmV0dXJuIG0ubGVuZ3RoID09PSAxID8gJycgOiBtWzFdLnRvVXBwZXJDYXNlKCk7IH0pO1xuICAgIHJldHVybiBqc3hFdmVudFByb3BSeC50ZXN0KHByb3ApID8gcHJvcC50b0xvd2VyQ2FzZSgpIDogcHJvcDtcbn0sIGRlZXBQcm9wUnggPSAvXihzdHlsZSkoW0EtWl0pLywgYnVpbGRQcm9wRGF0YSA9IGZ1bmN0aW9uIChwcm9wKSB7XG4gICAgdmFyIG0gPSBkZWVwUHJvcFJ4LmV4ZWMocHJvcCk7XG4gICAgcmV0dXJuIG0gPyBbbVsyXS50b0xvd2VyQ2FzZSgpICsgcHJvcC5zdWJzdHIobVswXS5sZW5ndGgpLCBtWzFdLCAwIC8qIFByb3BlcnR5ICovXSA6IFtwcm9wLCBudWxsLCAwIC8qIFByb3BlcnR5ICovXTtcbn0sIGF0dHJOYW1lc3BhY2VzID0ge1xuICAgIHhsaW5rOiBcImh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmtcIixcbiAgICB4bWw6IFwiaHR0cDovL3d3dy53My5vcmcvWE1MLzE5OTgvbmFtZXNwYWNlXCIsXG59LCBhdHRyTmFtZXNwYWNlUnggPSBuZXcgUmVnRXhwKFwiXihcIiArIE9iamVjdC5rZXlzKGF0dHJOYW1lc3BhY2VzKS5qb2luKCd8JykgKyBcIiktKC4qKVwiKSwgYnVpbGRBdHRyRGF0YSA9IGZ1bmN0aW9uIChhdHRyKSB7XG4gICAgdmFyIG0gPSBhdHRyTmFtZXNwYWNlUnguZXhlYyhhdHRyKTtcbiAgICByZXR1cm4gbSA/IFttWzJdLCBhdHRyTmFtZXNwYWNlc1ttWzFdXSwgMSAvKiBBdHRyaWJ1dGUgKi9dIDogW2F0dHIsIG51bGwsIDEgLyogQXR0cmlidXRlICovXTtcbn07XG5leHBvcnQgdmFyIGdldEZpZWxkRGF0YSA9IGZ1bmN0aW9uIChmaWVsZCwgc3ZnKSB7XG4gICAgdmFyIGNhY2hlID0gc3ZnID8gc3ZnRmllbGRDYWNoZSA6IGh0bWxGaWVsZENhY2hlLCBjYWNoZWQgPSBjYWNoZVtmaWVsZF07XG4gICAgaWYgKGNhY2hlZClcbiAgICAgICAgcmV0dXJuIGNhY2hlZDtcbiAgICB2YXIgYXR0ciA9IHN2ZyAmJiAhaXNQcm9wT25seUZpZWxkKGZpZWxkKVxuICAgICAgICB8fCAhc3ZnICYmIGlzQXR0ck9ubHlGaWVsZChmaWVsZCksIG5hbWUgPSBhdHRyID8gZ2V0QXR0ck5hbWUoZmllbGQpIDogZ2V0UHJvcE5hbWUoZmllbGQpO1xuICAgIGlmIChuYW1lICE9PSBmaWVsZCAmJiAoY2FjaGVkID0gY2FjaGVbbmFtZV0pKVxuICAgICAgICByZXR1cm4gY2FjaGVkO1xuICAgIHZhciBkYXRhID0gYXR0ciA/IGJ1aWxkQXR0ckRhdGEobmFtZSkgOiBidWlsZFByb3BEYXRhKG5hbWUpO1xuICAgIHJldHVybiBjYWNoZVtmaWVsZF0gPSBkYXRhO1xufTtcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vfi9zdXJwbHVzL2VzL2ZpZWxkRGF0YS5qc1xuLy8gbW9kdWxlIGlkID0gMTVcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwiaW1wb3J0IHsgUyB9IGZyb20gJy4vaW5kZXgnO1xudmFyIERPQ1VNRU5UX0ZSQUdNRU5UX05PREUgPSAxMSwgVEVYVF9OT0RFID0gMztcbmV4cG9ydCBmdW5jdGlvbiBpbnNlcnQocmFuZ2UsIHZhbHVlKSB7XG4gICAgdmFyIHBhcmVudCA9IHJhbmdlLnN0YXJ0LnBhcmVudE5vZGUsIHRlc3QgPSByYW5nZS5zdGFydCwgZ29vZCA9IG51bGwsIHQgPSB0eXBlb2YgdmFsdWU7XG4gICAgLy9pZiAocGFyZW50ID09PSBudWxsKSB7XG4gICAgLy8gICAgdGhyb3cgbmV3IEVycm9yKFwiU3VycGx1cy5pbnNlcnQoKSBjYW4gb25seSBiZSB1c2VkIG9uIGEgbm9kZSB0aGF0IGhhcyBhIHBhcmVudCBub2RlLiBcXG5cIlxuICAgIC8vICAgICAgICArIFwiTm9kZSBgYFwiICsgcmFuZ2Uuc3RhcnQgKyBcIicnIGlzIGN1cnJlbnRseSB1bmF0dGFjaGVkIHRvIGEgcGFyZW50LlwiKTtcbiAgICAvL31cbiAgICAvL2lmIChyYW5nZS5lbmQucGFyZW50Tm9kZSAhPT0gcGFyZW50KSB7XG4gICAgLy8gICAgdGhyb3cgbmV3IEVycm9yKFwiU3VycGx1cy5pbnNlcnQoKSByZXF1aXJlcyB0aGF0IHRoZSBpbnNlcnRlZCBub2RlcyByZW1haW4gc2liaWxpbmdzIFxcblwiXG4gICAgLy8gICAgICAgICsgXCJvZiB0aGUgb3JpZ2luYWwgbm9kZS4gIFRoZSBET00gaGFzIGJlZW4gbW9kaWZpZWQgc3VjaCB0aGF0IHRoaXMgaXMgXFxuXCJcbiAgICAvLyAgICAgICAgKyBcIm5vIGxvbmdlciB0aGUgY2FzZS5cIik7XG4gICAgLy99XG4gICAgaWYgKHQgPT09ICdzdHJpbmcnIHx8IHQgPT09ICdudW1iZXInKSB7XG4gICAgICAgIHZhbHVlID0gdmFsdWUudG9TdHJpbmcoKTtcbiAgICAgICAgaWYgKHRlc3Qubm9kZVR5cGUgPT09IFRFWFRfTk9ERSkge1xuICAgICAgICAgICAgdGVzdC5kYXRhID0gdmFsdWU7XG4gICAgICAgICAgICBnb29kID0gdGVzdDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhbHVlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodmFsdWUpO1xuICAgICAgICAgICAgcGFyZW50LnJlcGxhY2VDaGlsZCh2YWx1ZSwgdGVzdCk7XG4gICAgICAgICAgICBpZiAocmFuZ2UuZW5kID09PSB0ZXN0KVxuICAgICAgICAgICAgICAgIHJhbmdlLmVuZCA9IHZhbHVlO1xuICAgICAgICAgICAgcmFuZ2Uuc3RhcnQgPSBnb29kID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZiAodmFsdWUgaW5zdGFuY2VvZiBOb2RlKSB7XG4gICAgICAgIGlmICh0ZXN0ICE9PSB2YWx1ZSkge1xuICAgICAgICAgICAgcGFyZW50LnJlcGxhY2VDaGlsZCh2YWx1ZSwgdGVzdCk7XG4gICAgICAgICAgICBpZiAocmFuZ2UuZW5kID09PSB0ZXN0KVxuICAgICAgICAgICAgICAgIHJhbmdlLmVuZCA9IHZhbHVlO1xuICAgICAgICAgICAgcmFuZ2Uuc3RhcnQgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBnb29kID0gdmFsdWU7XG4gICAgfVxuICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgIGluc2VydEFycmF5KHZhbHVlKTtcbiAgICB9XG4gICAgZWxzZSBpZiAodmFsdWUgaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgICAgICBTKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGluc2VydChyYW5nZSwgdmFsdWUoKSk7XG4gICAgICAgIH0pO1xuICAgICAgICBnb29kID0gcmFuZ2UuZW5kO1xuICAgIH1cbiAgICBlbHNlIGlmICh2YWx1ZSAhPT0gbnVsbCAmJiB2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSB0cnVlICYmIHZhbHVlICE9PSBmYWxzZSkge1xuICAgICAgICB2YWx1ZSA9IHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgICAgIGlmICh0ZXN0Lm5vZGVUeXBlID09PSBURVhUX05PREUpIHtcbiAgICAgICAgICAgIHRlc3QuZGF0YSA9IHZhbHVlO1xuICAgICAgICAgICAgZ29vZCA9IHRlc3Q7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHZhbHVlKTtcbiAgICAgICAgICAgIHBhcmVudC5yZXBsYWNlQ2hpbGQodmFsdWUsIHRlc3QpO1xuICAgICAgICAgICAgaWYgKHJhbmdlLmVuZCA9PT0gdGVzdClcbiAgICAgICAgICAgICAgICByYW5nZS5lbmQgPSB2YWx1ZTtcbiAgICAgICAgICAgIHJhbmdlLnN0YXJ0ID0gZ29vZCA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChnb29kID09PSBudWxsKSB7XG4gICAgICAgIGlmIChyYW5nZS5zdGFydCA9PT0gcGFyZW50LmZpcnN0Q2hpbGQgJiYgcmFuZ2UuZW5kID09PSBwYXJlbnQubGFzdENoaWxkICYmIHJhbmdlLnN0YXJ0ICE9PSByYW5nZS5lbmQpIHtcbiAgICAgICAgICAgIC8vIGZhc3QgZGVsZXRlIGVudGlyZSBjb250ZW50c1xuICAgICAgICAgICAgcGFyZW50LnRleHRDb250ZW50ID0gXCJcIjtcbiAgICAgICAgICAgIHZhbHVlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJcIik7XG4gICAgICAgICAgICBwYXJlbnQuYXBwZW5kQ2hpbGQodmFsdWUpO1xuICAgICAgICAgICAgZ29vZCA9IHJhbmdlLnN0YXJ0ID0gcmFuZ2UuZW5kID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAodGVzdC5ub2RlVHlwZSA9PT0gVEVYVF9OT0RFKSB7XG4gICAgICAgICAgICB0ZXN0LmRhdGEgPSBcIlwiO1xuICAgICAgICAgICAgZ29vZCA9IHRlc3Q7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFwiXCIpO1xuICAgICAgICAgICAgcGFyZW50LnJlcGxhY2VDaGlsZCh2YWx1ZSwgdGVzdCk7XG4gICAgICAgICAgICBpZiAocmFuZ2UuZW5kID09PSB0ZXN0KVxuICAgICAgICAgICAgICAgIHJhbmdlLmVuZCA9IHZhbHVlO1xuICAgICAgICAgICAgcmFuZ2Uuc3RhcnQgPSBnb29kID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gcmVtb3ZlIGFueXRoaW5nIGxlZnQgYWZ0ZXIgdGhlIGdvb2QgY3Vyc29yIGZyb20gdGhlIGluc2VydCByYW5nZVxuICAgIHdoaWxlIChnb29kICE9PSByYW5nZS5lbmQpIHtcbiAgICAgICAgdGVzdCA9IHJhbmdlLmVuZDtcbiAgICAgICAgcmFuZ2UuZW5kID0gdGVzdC5wcmV2aW91c1NpYmxpbmc7XG4gICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZCh0ZXN0KTtcbiAgICB9XG4gICAgcmV0dXJuIHJhbmdlO1xuICAgIGZ1bmN0aW9uIGluc2VydEFycmF5KGFycmF5KSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBhcnJheS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gYXJyYXlbaV07XG4gICAgICAgICAgICBpZiAoZ29vZCA9PT0gcmFuZ2UuZW5kKSB7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlIGluc3RhbmNlb2YgTm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBnb29kID0gcmFuZ2UuZW5kID0gKGdvb2QubmV4dFNpYmxpbmcgPyBwYXJlbnQuaW5zZXJ0QmVmb3JlKHZhbHVlLCBnb29kLm5leHRTaWJsaW5nKSA6IHBhcmVudC5hcHBlbmRDaGlsZCh2YWx1ZSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgIGluc2VydEFycmF5KHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgIT09IG51bGwgJiYgdmFsdWUgIT09IHVuZGVmaW5lZCAmJiB2YWx1ZSAhPT0gZmFsc2UgJiYgdmFsdWUgIT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh2YWx1ZS50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICAgICAgZ29vZCA9IHJhbmdlLmVuZCA9IChnb29kLm5leHRTaWJsaW5nID8gcGFyZW50Lmluc2VydEJlZm9yZSh2YWx1ZSwgZ29vZC5uZXh0U2libGluZykgOiBwYXJlbnQuYXBwZW5kQ2hpbGQodmFsdWUpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBOb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0ZXN0ICE9PSB2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdvb2QgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmFuZ2UuZW5kID09PSB2YWx1ZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmFuZ2UuZW5kID0gdmFsdWUucHJldmlvdXNTaWJsaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudC5yZXBsYWNlQ2hpbGQodmFsdWUsIHRlc3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhbmdlLnN0YXJ0ID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJhbmdlLmVuZCA9PT0gdGVzdClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmFuZ2UuZW5kID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVzdCA9IHZhbHVlLm5leHRTaWJsaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRlc3QubmV4dFNpYmxpbmcgPT09IHZhbHVlICYmIHRlc3QgIT09IHZhbHVlLm5leHRTaWJsaW5nICYmIHRlc3QgIT09IHJhbmdlLmVuZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQodGVzdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlc3QgPSB2YWx1ZS5uZXh0U2libGluZztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyYW5nZS5lbmQgPT09IHZhbHVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmFuZ2UuZW5kID0gdmFsdWUucHJldmlvdXNTaWJsaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKHZhbHVlLCB0ZXN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXN0ID0gdGVzdC5uZXh0U2libGluZztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBnb29kID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHZhbHVlIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0QXJyYXkodmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSAhPT0gbnVsbCAmJiB2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSB0cnVlICYmIHZhbHVlICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0ZXN0Lm5vZGVUeXBlID09PSBURVhUX05PREUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlc3QuZGF0YSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdvb2QgPT09IG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmFuZ2Uuc3RhcnQgPSB0ZXN0O1xuICAgICAgICAgICAgICAgICAgICAgICAgZ29vZCA9IHRlc3QsIHRlc3QgPSBnb29kLm5leHRTaWJsaW5nO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKHZhbHVlLCB0ZXN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChnb29kID09PSBudWxsKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJhbmdlLnN0YXJ0ID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBnb29kID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL34vc3VycGx1cy9lcy9pbnNlcnQuanNcbi8vIG1vZHVsZSBpZCA9IDE2XG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsImltcG9ydCB7IHNldEF0dHJpYnV0ZSB9IGZyb20gJy4vZG9tJztcbmltcG9ydCB7IGdldEZpZWxkRGF0YSB9IGZyb20gJy4vZmllbGREYXRhJztcbmltcG9ydCB7IHNldEF0dHJpYnV0ZU5TIH0gZnJvbSAnLi9pbmRleCc7XG5leHBvcnQgZnVuY3Rpb24gYXNzaWduKGEsIGIpIHtcbiAgICB2YXIgcHJvcHMgPSBPYmplY3Qua2V5cyhiKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gcHJvcHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgdmFyIG5hbWUgPSBwcm9wc1tpXTtcbiAgICAgICAgYVtuYW1lXSA9IGJbbmFtZV07XG4gICAgfVxufVxuZXhwb3J0IGZ1bmN0aW9uIHNwcmVhZChub2RlLCBvYmosIHN2Zykge1xuICAgIHZhciBwcm9wcyA9IE9iamVjdC5rZXlzKG9iaik7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IHByb3BzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIHZhciBuYW1lID0gcHJvcHNbaV07XG4gICAgICAgIHNldEZpZWxkKG5vZGUsIG5hbWUsIG9ialtuYW1lXSwgc3ZnKTtcbiAgICB9XG59XG5mdW5jdGlvbiBzZXRGaWVsZChub2RlLCBmaWVsZCwgdmFsdWUsIHN2Zykge1xuICAgIHZhciBfYSA9IGdldEZpZWxkRGF0YShmaWVsZCwgc3ZnKSwgbmFtZSA9IF9hWzBdLCBuYW1lc3BhY2UgPSBfYVsxXSwgZmxhZ3MgPSBfYVsyXSwgdHlwZSA9IGZsYWdzICYgMyAvKiBUeXBlICovO1xuICAgIGlmICh0eXBlID09PSAwIC8qIFByb3BlcnR5ICovKSB7XG4gICAgICAgIGlmIChuYW1lc3BhY2UpXG4gICAgICAgICAgICBub2RlID0gbm9kZVtuYW1lc3BhY2VdO1xuICAgICAgICBub2RlW25hbWVdID0gdmFsdWU7XG4gICAgfVxuICAgIGVsc2UgaWYgKHR5cGUgPT09IDEgLyogQXR0cmlidXRlICovKSB7XG4gICAgICAgIGlmIChuYW1lc3BhY2UpXG4gICAgICAgICAgICBzZXRBdHRyaWJ1dGVOUyhub2RlLCBuYW1lc3BhY2UsIG5hbWUsIHZhbHVlKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgc2V0QXR0cmlidXRlKG5vZGUsIG5hbWUsIHZhbHVlKTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZSA9PT0gMyAvKiBBc3NpZ24gKi8pIHtcbiAgICAgICAgaWYgKHZhbHVlICYmIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcpXG4gICAgICAgICAgICBhc3NpZ24obm9kZS5zdHlsZSwgdmFsdWUpO1xuICAgIH1cbn1cblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vfi9zdXJwbHVzL2VzL3NwcmVhZC5qc1xuLy8gbW9kdWxlIGlkID0gMTdcbi8vIG1vZHVsZSBjaHVua3MgPSAwIl0sInNvdXJjZVJvb3QiOiIifQ==