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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgYTEyNWZiMjQ3OWMxY2EyOGIzZDAiLCJ3ZWJwYWNrOi8vLy4vfi9zLWpzL2Rpc3QvZXMvUy5qcyIsIndlYnBhY2s6Ly8vLi9+L3N1cnBsdXMvZXMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL21vZGVscy50cyIsIndlYnBhY2s6Ly8vLi9+L3MtYXJyYXkvZXMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vfi9zdXJwbHVzL2VzL2RvbS5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvY29udHJvbGxlcnMudHMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3BlcnNpc3RlbmNlLnRzIiwid2VicGFjazovLy8uL3NyYy9yb3V0ZXIudHMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3ZpZXdzLnRzeCIsIndlYnBhY2s6Ly8vLi9+L2NsYXNzbmFtZXMvaW5kZXguanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL21haW4udHMiLCJ3ZWJwYWNrOi8vLy4vfi9zdXJwbHVzLW1peGluLWRhdGEvaW5kZXguZXMuanMiLCJ3ZWJwYWNrOi8vLy4vfi9zdXJwbHVzLW1peGluLWZvY3VzL2luZGV4LmVzLmpzIiwid2VicGFjazovLy8uL34vc3VycGx1cy1taXhpbi1vbmtleS9pbmRleC5lcy5qcyIsIndlYnBhY2s6Ly8vLi9+L3N1cnBsdXMvZXMvY29udGVudC5qcyIsIndlYnBhY2s6Ly8vLi9+L3N1cnBsdXMvZXMvZmllbGREYXRhLmpzIiwid2VicGFjazovLy8uL34vc3VycGx1cy9lcy9pbnNlcnQuanMiLCJ3ZWJwYWNrOi8vLy4vfi9zdXJwbHVzL2VzL3NwcmVhZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBLG1EQUEyQyxjQUFjOztBQUV6RDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLG1DQUEyQiwwQkFBMEIsRUFBRTtBQUN2RCx5Q0FBaUMsZUFBZTtBQUNoRDtBQUNBO0FBQ0E7O0FBRUE7QUFDQSw4REFBc0QsK0RBQStEOztBQUVySDtBQUNBOztBQUVBO0FBQ0E7Ozs7Ozs7O0FDaEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFDQUFxQztBQUNyQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHFDQUFxQyxXQUFXO0FBQ2hEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHVCQUF1QixlQUFlO0FBQ3RDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBbUM7QUFDbkMsbUNBQW1DO0FBQ25DLG9DQUFvQztBQUNwQztBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsdUJBQXVCLGdCQUFnQjtBQUN2QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0Q7QUFDQSxtQkFBbUI7QUFDbkI7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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O0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7Ozs7Ozs7Ozs7QUMvR1k7QUFDWjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhFQUE4RSxXQUFXO0FBQ3pGO0FBQ0E7QUFDQTtBQUNBLHlEQUF5RCwyQkFBMkI7QUFDcEY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBa0IsV0FBVztBQUM3QjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGVBQWUsZ0JBQWdCO0FBQy9CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2QkFBNkIsa0JBQWtCO0FBQy9DO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVSxTQUFTO0FBQ25CO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1Q0FBdUMsU0FBUztBQUNoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG9DQUFvQyxTQUFTO0FBQzdDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsbUJBQW1CLFFBQVE7QUFDM0I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7Ozs7O0FDN1lBO0FBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1RkFBdUYsK0RBQStELEVBQUUsa0VBQWtFLCtCQUErQixFQUFFLDhEQUE4RCxnREFBZ0QsMEJBQTBCLEVBQUUsZ0JBQWdCLEVBQUU7QUFDdlosdURBQXVELGlEQUFpRCxFQUFFO0FBQzFHO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQSxDQUFDO0FBQ0Q7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7Ozs7Ozs7O0FDdkhZO0FBQ1o7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkNBQTJDLFNBQVM7QUFDcEQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7OztBQ3hKdUI7QUFDQTtBQUNFO0FBQ3pCO0FBQ0E7QUFDQSx1Q0FBdUMsU0FBUztBQUNoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1Q0FBdUMsU0FBUztBQUNoRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiIuL2Rpc3QvbWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4gXHRcdH1cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGk6IG1vZHVsZUlkLFxuIFx0XHRcdGw6IGZhbHNlLFxuIFx0XHRcdGV4cG9ydHM6IHt9XG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmwgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIGlkZW50aXR5IGZ1bmN0aW9uIGZvciBjYWxsaW5nIGhhcm1vbnkgaW1wb3J0cyB3aXRoIHRoZSBjb3JyZWN0IGNvbnRleHRcbiBcdF9fd2VicGFja19yZXF1aXJlX18uaSA9IGZ1bmN0aW9uKHZhbHVlKSB7IHJldHVybiB2YWx1ZTsgfTtcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7XG4gXHRcdFx0XHRjb25maWd1cmFibGU6IGZhbHNlLFxuIFx0XHRcdFx0ZW51bWVyYWJsZTogdHJ1ZSxcbiBcdFx0XHRcdGdldDogZ2V0dGVyXG4gXHRcdFx0fSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gMTApO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIHdlYnBhY2svYm9vdHN0cmFwIGExMjVmYjI0NzljMWNhMjhiM2QwIiwiLy8gUHVibGljIGludGVyZmFjZVxudmFyIFMgPSBmdW5jdGlvbiBTKGZuLCB2YWx1ZSkge1xuICAgIHZhciBvd25lciA9IE93bmVyLCBydW5uaW5nID0gUnVubmluZ05vZGU7XG4gICAgaWYgKG93bmVyID09PSBudWxsKVxuICAgICAgICBjb25zb2xlLndhcm4oXCJjb21wdXRhdGlvbnMgY3JlYXRlZCB3aXRob3V0IGEgcm9vdCBvciBwYXJlbnQgd2lsbCBuZXZlciBiZSBkaXNwb3NlZFwiKTtcbiAgICB2YXIgbm9kZSA9IG5ldyBDb21wdXRhdGlvbk5vZGUoZm4sIHZhbHVlKTtcbiAgICBPd25lciA9IFJ1bm5pbmdOb2RlID0gbm9kZTtcbiAgICBpZiAoUnVubmluZ0Nsb2NrID09PSBudWxsKSB7XG4gICAgICAgIHRvcGxldmVsQ29tcHV0YXRpb24obm9kZSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBub2RlLnZhbHVlID0gbm9kZS5mbihub2RlLnZhbHVlKTtcbiAgICB9XG4gICAgaWYgKG93bmVyICYmIG93bmVyICE9PSBVTk9XTkVEKSB7XG4gICAgICAgIGlmIChvd25lci5vd25lZCA9PT0gbnVsbClcbiAgICAgICAgICAgIG93bmVyLm93bmVkID0gW25vZGVdO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBvd25lci5vd25lZC5wdXNoKG5vZGUpO1xuICAgIH1cbiAgICBPd25lciA9IG93bmVyO1xuICAgIFJ1bm5pbmdOb2RlID0gcnVubmluZztcbiAgICByZXR1cm4gZnVuY3Rpb24gY29tcHV0YXRpb24oKSB7XG4gICAgICAgIGlmIChSdW5uaW5nTm9kZSAhPT0gbnVsbCkge1xuICAgICAgICAgICAgaWYgKG5vZGUuYWdlID09PSBSb290Q2xvY2sudGltZSkge1xuICAgICAgICAgICAgICAgIGlmIChub2RlLnN0YXRlID09PSBSVU5OSU5HKVxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJjaXJjdWxhciBkZXBlbmRlbmN5XCIpO1xuICAgICAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICAgICAgdXBkYXRlTm9kZShub2RlKTsgLy8gY2hlY2tzIGZvciBzdGF0ZSA9PT0gU1RBTEUgaW50ZXJuYWxseSwgc28gZG9uJ3QgbmVlZCB0byBjaGVjayBoZXJlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsb2dDb21wdXRhdGlvblJlYWQobm9kZSwgUnVubmluZ05vZGUpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBub2RlLnZhbHVlO1xuICAgIH07XG59O1xuLy8gY29tcGF0aWJpbGl0eSB3aXRoIGNvbW1vbmpzIHN5c3RlbXMgdGhhdCBleHBlY3QgZGVmYXVsdCBleHBvcnQgdG8gYmUgYXQgcmVxdWlyZSgncy5qcycpLmRlZmF1bHQgcmF0aGVyIHRoYW4ganVzdCByZXF1aXJlKCdzLWpzJylcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShTLCAnZGVmYXVsdCcsIHsgdmFsdWU6IFMgfSk7XG5leHBvcnQgZGVmYXVsdCBTO1xuUy5yb290ID0gZnVuY3Rpb24gcm9vdChmbikge1xuICAgIHZhciBvd25lciA9IE93bmVyLCByb290ID0gZm4ubGVuZ3RoID09PSAwID8gVU5PV05FRCA6IG5ldyBDb21wdXRhdGlvbk5vZGUobnVsbCwgbnVsbCksIHJlc3VsdCA9IHVuZGVmaW5lZCwgZGlzcG9zZXIgPSBmbi5sZW5ndGggPT09IDAgPyBudWxsIDogZnVuY3Rpb24gX2Rpc3Bvc2UoKSB7XG4gICAgICAgIGlmIChSdW5uaW5nQ2xvY2sgIT09IG51bGwpIHtcbiAgICAgICAgICAgIFJvb3RDbG9jay5kaXNwb3Nlcy5hZGQocm9vdCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBkaXNwb3NlKHJvb3QpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBPd25lciA9IHJvb3Q7XG4gICAgaWYgKFJ1bm5pbmdDbG9jayA9PT0gbnVsbCkge1xuICAgICAgICByZXN1bHQgPSB0b3BMZXZlbFJvb3QoZm4sIGRpc3Bvc2VyLCBvd25lcik7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXN1bHQgPSBkaXNwb3NlciA9PT0gbnVsbCA/IGZuKCkgOiBmbihkaXNwb3Nlcik7XG4gICAgICAgIE93bmVyID0gb3duZXI7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59O1xuZnVuY3Rpb24gdG9wTGV2ZWxSb290KGZuLCBkaXNwb3Nlciwgb3duZXIpIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gZGlzcG9zZXIgPT09IG51bGwgPyBmbigpIDogZm4oZGlzcG9zZXIpO1xuICAgIH1cbiAgICBmaW5hbGx5IHtcbiAgICAgICAgT3duZXIgPSBvd25lcjtcbiAgICB9XG59XG5TLm9uID0gZnVuY3Rpb24gb24oZXYsIGZuLCBzZWVkLCBvbmNoYW5nZXMpIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheShldikpXG4gICAgICAgIGV2ID0gY2FsbEFsbChldik7XG4gICAgb25jaGFuZ2VzID0gISFvbmNoYW5nZXM7XG4gICAgcmV0dXJuIFMob24sIHNlZWQpO1xuICAgIGZ1bmN0aW9uIG9uKHZhbHVlKSB7XG4gICAgICAgIHZhciBydW5uaW5nID0gUnVubmluZ05vZGU7XG4gICAgICAgIGV2KCk7XG4gICAgICAgIGlmIChvbmNoYW5nZXMpXG4gICAgICAgICAgICBvbmNoYW5nZXMgPSBmYWxzZTtcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBSdW5uaW5nTm9kZSA9IG51bGw7XG4gICAgICAgICAgICB2YWx1ZSA9IGZuKHZhbHVlKTtcbiAgICAgICAgICAgIFJ1bm5pbmdOb2RlID0gcnVubmluZztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgfVxufTtcbmZ1bmN0aW9uIGNhbGxBbGwoc3MpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gYWxsKCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHNzLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgc3NbaV0oKTtcbiAgICB9O1xufVxuUy5kYXRhID0gZnVuY3Rpb24gZGF0YSh2YWx1ZSkge1xuICAgIHZhciBub2RlID0gbmV3IERhdGFOb2RlKHZhbHVlKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gZGF0YSh2YWx1ZSkge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGlmIChSdW5uaW5nQ2xvY2sgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5wZW5kaW5nICE9PSBOT1RQRU5ESU5HKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gbm9kZS5wZW5kaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJjb25mbGljdGluZyBjaGFuZ2VzOiBcIiArIHZhbHVlICsgXCIgIT09IFwiICsgbm9kZS5wZW5kaW5nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5wZW5kaW5nID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIFJvb3RDbG9jay5jaGFuZ2VzLmFkZChub2RlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5sb2cgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5wZW5kaW5nID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgIFJvb3RDbG9jay5jaGFuZ2VzLmFkZChub2RlKTtcbiAgICAgICAgICAgICAgICAgICAgZXZlbnQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAoUnVubmluZ05vZGUgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICBsb2dEYXRhUmVhZChub2RlLCBSdW5uaW5nTm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbm9kZS52YWx1ZTtcbiAgICAgICAgfVxuICAgIH07XG59O1xuUy52YWx1ZSA9IGZ1bmN0aW9uIHZhbHVlKGN1cnJlbnQsIGVxKSB7XG4gICAgdmFyIGRhdGEgPSBTLmRhdGEoY3VycmVudCksIGFnZSA9IC0xO1xuICAgIHJldHVybiBmdW5jdGlvbiB2YWx1ZSh1cGRhdGUpIHtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiBkYXRhKCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgc2FtZSA9IGVxID8gZXEoY3VycmVudCwgdXBkYXRlKSA6IGN1cnJlbnQgPT09IHVwZGF0ZTtcbiAgICAgICAgICAgIGlmICghc2FtZSkge1xuICAgICAgICAgICAgICAgIHZhciB0aW1lID0gUm9vdENsb2NrLnRpbWU7XG4gICAgICAgICAgICAgICAgaWYgKGFnZSA9PT0gdGltZSlcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY29uZmxpY3RpbmcgdmFsdWVzOiBcIiArIHVwZGF0ZSArIFwiIGlzIG5vdCB0aGUgc2FtZSBhcyBcIiArIGN1cnJlbnQpO1xuICAgICAgICAgICAgICAgIGFnZSA9IHRpbWU7XG4gICAgICAgICAgICAgICAgY3VycmVudCA9IHVwZGF0ZTtcbiAgICAgICAgICAgICAgICBkYXRhKHVwZGF0ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gdXBkYXRlO1xuICAgICAgICB9XG4gICAgfTtcbn07XG5TLmZyZWV6ZSA9IGZ1bmN0aW9uIGZyZWV6ZShmbikge1xuICAgIHZhciByZXN1bHQgPSB1bmRlZmluZWQ7XG4gICAgaWYgKFJ1bm5pbmdDbG9jayAhPT0gbnVsbCkge1xuICAgICAgICByZXN1bHQgPSBmbigpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgUnVubmluZ0Nsb2NrID0gUm9vdENsb2NrO1xuICAgICAgICBSdW5uaW5nQ2xvY2suY2hhbmdlcy5yZXNldCgpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVzdWx0ID0gZm4oKTtcbiAgICAgICAgICAgIGV2ZW50KCk7XG4gICAgICAgIH1cbiAgICAgICAgZmluYWxseSB7XG4gICAgICAgICAgICBSdW5uaW5nQ2xvY2sgPSBudWxsO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59O1xuUy5zYW1wbGUgPSBmdW5jdGlvbiBzYW1wbGUoZm4pIHtcbiAgICB2YXIgcmVzdWx0LCBydW5uaW5nID0gUnVubmluZ05vZGU7XG4gICAgaWYgKHJ1bm5pbmcgIT09IG51bGwpIHtcbiAgICAgICAgUnVubmluZ05vZGUgPSBudWxsO1xuICAgICAgICByZXN1bHQgPSBmbigpO1xuICAgICAgICBSdW5uaW5nTm9kZSA9IHJ1bm5pbmc7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXN1bHQgPSBmbigpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufTtcblMuY2xlYW51cCA9IGZ1bmN0aW9uIGNsZWFudXAoZm4pIHtcbiAgICBpZiAoT3duZXIgIT09IG51bGwpIHtcbiAgICAgICAgaWYgKE93bmVyLmNsZWFudXBzID09PSBudWxsKVxuICAgICAgICAgICAgT3duZXIuY2xlYW51cHMgPSBbZm5dO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBPd25lci5jbGVhbnVwcy5wdXNoKGZuKTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGNvbnNvbGUud2FybihcImNsZWFudXBzIGNyZWF0ZWQgd2l0aG91dCBhIHJvb3Qgb3IgcGFyZW50IHdpbGwgbmV2ZXIgYmUgcnVuXCIpO1xuICAgIH1cbn07XG4vLyBJbnRlcm5hbCBpbXBsZW1lbnRhdGlvblxuLy8vIEdyYXBoIGNsYXNzZXMgYW5kIG9wZXJhdGlvbnNcbnZhciBDbG9jayA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBDbG9jaygpIHtcbiAgICAgICAgdGhpcy50aW1lID0gMDtcbiAgICAgICAgdGhpcy5jaGFuZ2VzID0gbmV3IFF1ZXVlKCk7IC8vIGJhdGNoZWQgY2hhbmdlcyB0byBkYXRhIG5vZGVzXG4gICAgICAgIHRoaXMudXBkYXRlcyA9IG5ldyBRdWV1ZSgpOyAvLyBjb21wdXRhdGlvbnMgdG8gdXBkYXRlXG4gICAgICAgIHRoaXMuZGlzcG9zZXMgPSBuZXcgUXVldWUoKTsgLy8gZGlzcG9zYWxzIHRvIHJ1biBhZnRlciBjdXJyZW50IGJhdGNoIG9mIHVwZGF0ZXMgZmluaXNoZXNcbiAgICB9XG4gICAgcmV0dXJuIENsb2NrO1xufSgpKTtcbnZhciBEYXRhTm9kZSA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBEYXRhTm9kZSh2YWx1ZSkge1xuICAgICAgICB0aGlzLnZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMucGVuZGluZyA9IE5PVFBFTkRJTkc7XG4gICAgICAgIHRoaXMubG9nID0gbnVsbDtcbiAgICB9XG4gICAgcmV0dXJuIERhdGFOb2RlO1xufSgpKTtcbnZhciBDb21wdXRhdGlvbk5vZGUgPSAvKiogQGNsYXNzICovIChmdW5jdGlvbiAoKSB7XG4gICAgZnVuY3Rpb24gQ29tcHV0YXRpb25Ob2RlKGZuLCB2YWx1ZSkge1xuICAgICAgICB0aGlzLmZuID0gZm47XG4gICAgICAgIHRoaXMudmFsdWUgPSB2YWx1ZTtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IENVUlJFTlQ7XG4gICAgICAgIHRoaXMuc291cmNlMSA9IG51bGw7XG4gICAgICAgIHRoaXMuc291cmNlMXNsb3QgPSAwO1xuICAgICAgICB0aGlzLnNvdXJjZXMgPSBudWxsO1xuICAgICAgICB0aGlzLnNvdXJjZXNsb3RzID0gbnVsbDtcbiAgICAgICAgdGhpcy5sb2cgPSBudWxsO1xuICAgICAgICB0aGlzLm93bmVkID0gbnVsbDtcbiAgICAgICAgdGhpcy5jbGVhbnVwcyA9IG51bGw7XG4gICAgICAgIHRoaXMuYWdlID0gUm9vdENsb2NrLnRpbWU7XG4gICAgfVxuICAgIHJldHVybiBDb21wdXRhdGlvbk5vZGU7XG59KCkpO1xudmFyIExvZyA9IC8qKiBAY2xhc3MgKi8gKGZ1bmN0aW9uICgpIHtcbiAgICBmdW5jdGlvbiBMb2coKSB7XG4gICAgICAgIHRoaXMubm9kZTEgPSBudWxsO1xuICAgICAgICB0aGlzLm5vZGUxc2xvdCA9IDA7XG4gICAgICAgIHRoaXMubm9kZXMgPSBudWxsO1xuICAgICAgICB0aGlzLm5vZGVzbG90cyA9IG51bGw7XG4gICAgfVxuICAgIHJldHVybiBMb2c7XG59KCkpO1xudmFyIFF1ZXVlID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIFF1ZXVlKCkge1xuICAgICAgICB0aGlzLml0ZW1zID0gW107XG4gICAgICAgIHRoaXMuY291bnQgPSAwO1xuICAgIH1cbiAgICBRdWV1ZS5wcm90b3R5cGUucmVzZXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuY291bnQgPSAwO1xuICAgIH07XG4gICAgUXVldWUucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgICAgIHRoaXMuaXRlbXNbdGhpcy5jb3VudCsrXSA9IGl0ZW07XG4gICAgfTtcbiAgICBRdWV1ZS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgIHZhciBpdGVtcyA9IHRoaXMuaXRlbXM7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jb3VudDsgaSsrKSB7XG4gICAgICAgICAgICBmbihpdGVtc1tpXSk7XG4gICAgICAgICAgICBpdGVtc1tpXSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5jb3VudCA9IDA7XG4gICAgfTtcbiAgICByZXR1cm4gUXVldWU7XG59KCkpO1xuLy8gQ29uc3RhbnRzXG52YXIgTk9UUEVORElORyA9IHt9LCBDVVJSRU5UID0gMCwgU1RBTEUgPSAxLCBSVU5OSU5HID0gMjtcbi8vIFwiR2xvYmFsc1wiIHVzZWQgdG8ga2VlcCB0cmFjayBvZiBjdXJyZW50IHN5c3RlbSBzdGF0ZVxudmFyIFJvb3RDbG9jayA9IG5ldyBDbG9jaygpLCBSdW5uaW5nQ2xvY2sgPSBudWxsLCAvLyBjdXJyZW50bHkgcnVubmluZyBjbG9jayBcblJ1bm5pbmdOb2RlID0gbnVsbCwgLy8gY3VycmVudGx5IHJ1bm5pbmcgY29tcHV0YXRpb25cbk93bmVyID0gbnVsbCwgLy8gb3duZXIgZm9yIG5ldyBjb21wdXRhdGlvbnNcblVOT1dORUQgPSBuZXcgQ29tcHV0YXRpb25Ob2RlKG51bGwsIG51bGwpO1xuLy8gRnVuY3Rpb25zXG5mdW5jdGlvbiBsb2dSZWFkKGZyb20sIHRvKSB7XG4gICAgdmFyIGZyb21zbG90LCB0b3Nsb3QgPSB0by5zb3VyY2UxID09PSBudWxsID8gLTEgOiB0by5zb3VyY2VzID09PSBudWxsID8gMCA6IHRvLnNvdXJjZXMubGVuZ3RoO1xuICAgIGlmIChmcm9tLm5vZGUxID09PSBudWxsKSB7XG4gICAgICAgIGZyb20ubm9kZTEgPSB0bztcbiAgICAgICAgZnJvbS5ub2RlMXNsb3QgPSB0b3Nsb3Q7XG4gICAgICAgIGZyb21zbG90ID0gLTE7XG4gICAgfVxuICAgIGVsc2UgaWYgKGZyb20ubm9kZXMgPT09IG51bGwpIHtcbiAgICAgICAgZnJvbS5ub2RlcyA9IFt0b107XG4gICAgICAgIGZyb20ubm9kZXNsb3RzID0gW3Rvc2xvdF07XG4gICAgICAgIGZyb21zbG90ID0gMDtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGZyb21zbG90ID0gZnJvbS5ub2Rlcy5sZW5ndGg7XG4gICAgICAgIGZyb20ubm9kZXMucHVzaCh0byk7XG4gICAgICAgIGZyb20ubm9kZXNsb3RzLnB1c2godG9zbG90KTtcbiAgICB9XG4gICAgaWYgKHRvLnNvdXJjZTEgPT09IG51bGwpIHtcbiAgICAgICAgdG8uc291cmNlMSA9IGZyb207XG4gICAgICAgIHRvLnNvdXJjZTFzbG90ID0gZnJvbXNsb3Q7XG4gICAgfVxuICAgIGVsc2UgaWYgKHRvLnNvdXJjZXMgPT09IG51bGwpIHtcbiAgICAgICAgdG8uc291cmNlcyA9IFtmcm9tXTtcbiAgICAgICAgdG8uc291cmNlc2xvdHMgPSBbZnJvbXNsb3RdO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgdG8uc291cmNlcy5wdXNoKGZyb20pO1xuICAgICAgICB0by5zb3VyY2VzbG90cy5wdXNoKGZyb21zbG90KTtcbiAgICB9XG59XG5mdW5jdGlvbiBsb2dEYXRhUmVhZChkYXRhLCB0bykge1xuICAgIGlmIChkYXRhLmxvZyA9PT0gbnVsbClcbiAgICAgICAgZGF0YS5sb2cgPSBuZXcgTG9nKCk7XG4gICAgbG9nUmVhZChkYXRhLmxvZywgdG8pO1xufVxuZnVuY3Rpb24gbG9nQ29tcHV0YXRpb25SZWFkKG5vZGUsIHRvKSB7XG4gICAgaWYgKG5vZGUubG9nID09PSBudWxsKVxuICAgICAgICBub2RlLmxvZyA9IG5ldyBMb2coKTtcbiAgICBsb2dSZWFkKG5vZGUubG9nLCB0byk7XG59XG5mdW5jdGlvbiBldmVudCgpIHtcbiAgICAvLyBiL2Mgd2UgbWlnaHQgYmUgdW5kZXIgYSB0b3AgbGV2ZWwgUy5yb290KCksIGhhdmUgdG8gcHJlc2VydmUgY3VycmVudCByb290XG4gICAgdmFyIG93bmVyID0gT3duZXI7XG4gICAgUm9vdENsb2NrLnVwZGF0ZXMucmVzZXQoKTtcbiAgICBSb290Q2xvY2sudGltZSsrO1xuICAgIHRyeSB7XG4gICAgICAgIHJ1bihSb290Q2xvY2spO1xuICAgIH1cbiAgICBmaW5hbGx5IHtcbiAgICAgICAgUnVubmluZ0Nsb2NrID0gUnVubmluZ05vZGUgPSBudWxsO1xuICAgICAgICBPd25lciA9IG93bmVyO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHRvcGxldmVsQ29tcHV0YXRpb24obm9kZSkge1xuICAgIFJ1bm5pbmdDbG9jayA9IFJvb3RDbG9jaztcbiAgICBSb290Q2xvY2suY2hhbmdlcy5yZXNldCgpO1xuICAgIFJvb3RDbG9jay51cGRhdGVzLnJlc2V0KCk7XG4gICAgdHJ5IHtcbiAgICAgICAgbm9kZS52YWx1ZSA9IG5vZGUuZm4obm9kZS52YWx1ZSk7XG4gICAgICAgIGlmIChSb290Q2xvY2suY2hhbmdlcy5jb3VudCA+IDAgfHwgUm9vdENsb2NrLnVwZGF0ZXMuY291bnQgPiAwKSB7XG4gICAgICAgICAgICBSb290Q2xvY2sudGltZSsrO1xuICAgICAgICAgICAgcnVuKFJvb3RDbG9jayk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZmluYWxseSB7XG4gICAgICAgIFJ1bm5pbmdDbG9jayA9IE93bmVyID0gUnVubmluZ05vZGUgPSBudWxsO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHJ1bihjbG9jaykge1xuICAgIHZhciBydW5uaW5nID0gUnVubmluZ0Nsb2NrLCBjb3VudCA9IDA7XG4gICAgUnVubmluZ0Nsb2NrID0gY2xvY2s7XG4gICAgY2xvY2suZGlzcG9zZXMucmVzZXQoKTtcbiAgICAvLyBmb3IgZWFjaCBiYXRjaCAuLi5cbiAgICB3aGlsZSAoY2xvY2suY2hhbmdlcy5jb3VudCAhPT0gMCB8fCBjbG9jay51cGRhdGVzLmNvdW50ICE9PSAwIHx8IGNsb2NrLmRpc3Bvc2VzLmNvdW50ICE9PSAwKSB7XG4gICAgICAgIGlmIChjb3VudCA+IDApXG4gICAgICAgICAgICBjbG9jay50aW1lKys7XG4gICAgICAgIGNsb2NrLmNoYW5nZXMucnVuKGFwcGx5RGF0YUNoYW5nZSk7XG4gICAgICAgIGNsb2NrLnVwZGF0ZXMucnVuKHVwZGF0ZU5vZGUpO1xuICAgICAgICBjbG9jay5kaXNwb3Nlcy5ydW4oZGlzcG9zZSk7XG4gICAgICAgIC8vIGlmIHRoZXJlIGFyZSBzdGlsbCBjaGFuZ2VzIGFmdGVyIGV4Y2Vzc2l2ZSBiYXRjaGVzLCBhc3N1bWUgcnVuYXdheSAgICAgICAgICAgIFxuICAgICAgICBpZiAoY291bnQrKyA+IDFlNSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUnVuYXdheSBjbG9jayBkZXRlY3RlZFwiKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBSdW5uaW5nQ2xvY2sgPSBydW5uaW5nO1xufVxuZnVuY3Rpb24gYXBwbHlEYXRhQ2hhbmdlKGRhdGEpIHtcbiAgICBkYXRhLnZhbHVlID0gZGF0YS5wZW5kaW5nO1xuICAgIGRhdGEucGVuZGluZyA9IE5PVFBFTkRJTkc7XG4gICAgaWYgKGRhdGEubG9nKVxuICAgICAgICBtYXJrQ29tcHV0YXRpb25zU3RhbGUoZGF0YS5sb2cpO1xufVxuZnVuY3Rpb24gbWFya0NvbXB1dGF0aW9uc1N0YWxlKGxvZykge1xuICAgIHZhciBub2RlMSA9IGxvZy5ub2RlMSwgbm9kZXMgPSBsb2cubm9kZXM7XG4gICAgLy8gbWFyayBhbGwgZG93bnN0cmVhbSBub2RlcyBzdGFsZSB3aGljaCBoYXZlbid0IGJlZW4gYWxyZWFkeVxuICAgIGlmIChub2RlMSAhPT0gbnVsbClcbiAgICAgICAgbWFya05vZGVTdGFsZShub2RlMSk7XG4gICAgaWYgKG5vZGVzICE9PSBudWxsKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBub2Rlcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgbWFya05vZGVTdGFsZShub2Rlc1tpXSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBtYXJrTm9kZVN0YWxlKG5vZGUpIHtcbiAgICB2YXIgdGltZSA9IFJvb3RDbG9jay50aW1lO1xuICAgIGlmIChub2RlLmFnZSA8IHRpbWUpIHtcbiAgICAgICAgbm9kZS5hZ2UgPSB0aW1lO1xuICAgICAgICBub2RlLnN0YXRlID0gU1RBTEU7XG4gICAgICAgIFJvb3RDbG9jay51cGRhdGVzLmFkZChub2RlKTtcbiAgICAgICAgaWYgKG5vZGUub3duZWQgIT09IG51bGwpXG4gICAgICAgICAgICBtYXJrT3duZWROb2Rlc0ZvckRpc3Bvc2FsKG5vZGUub3duZWQpO1xuICAgICAgICBpZiAobm9kZS5sb2cgIT09IG51bGwpXG4gICAgICAgICAgICBtYXJrQ29tcHV0YXRpb25zU3RhbGUobm9kZS5sb2cpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIG1hcmtPd25lZE5vZGVzRm9yRGlzcG9zYWwob3duZWQpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IG93bmVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBjaGlsZCA9IG93bmVkW2ldO1xuICAgICAgICBjaGlsZC5hZ2UgPSBSb290Q2xvY2sudGltZTtcbiAgICAgICAgY2hpbGQuc3RhdGUgPSBDVVJSRU5UO1xuICAgICAgICBpZiAoY2hpbGQub3duZWQgIT09IG51bGwpXG4gICAgICAgICAgICBtYXJrT3duZWROb2Rlc0ZvckRpc3Bvc2FsKGNoaWxkLm93bmVkKTtcbiAgICB9XG59XG5mdW5jdGlvbiB1cGRhdGVOb2RlKG5vZGUpIHtcbiAgICBpZiAobm9kZS5zdGF0ZSA9PT0gU1RBTEUpIHtcbiAgICAgICAgdmFyIG93bmVyID0gT3duZXIsIHJ1bm5pbmcgPSBSdW5uaW5nTm9kZTtcbiAgICAgICAgT3duZXIgPSBSdW5uaW5nTm9kZSA9IG5vZGU7XG4gICAgICAgIG5vZGUuc3RhdGUgPSBSVU5OSU5HO1xuICAgICAgICBjbGVhbnVwKG5vZGUsIGZhbHNlKTtcbiAgICAgICAgbm9kZS52YWx1ZSA9IG5vZGUuZm4obm9kZS52YWx1ZSk7XG4gICAgICAgIG5vZGUuc3RhdGUgPSBDVVJSRU5UO1xuICAgICAgICBPd25lciA9IG93bmVyO1xuICAgICAgICBSdW5uaW5nTm9kZSA9IHJ1bm5pbmc7XG4gICAgfVxufVxuZnVuY3Rpb24gY2xlYW51cChub2RlLCBmaW5hbCkge1xuICAgIHZhciBzb3VyY2UxID0gbm9kZS5zb3VyY2UxLCBzb3VyY2VzID0gbm9kZS5zb3VyY2VzLCBzb3VyY2VzbG90cyA9IG5vZGUuc291cmNlc2xvdHMsIGNsZWFudXBzID0gbm9kZS5jbGVhbnVwcywgb3duZWQgPSBub2RlLm93bmVkLCBpLCBsZW47XG4gICAgaWYgKGNsZWFudXBzICE9PSBudWxsKSB7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBjbGVhbnVwcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgY2xlYW51cHNbaV0oZmluYWwpO1xuICAgICAgICB9XG4gICAgICAgIG5vZGUuY2xlYW51cHMgPSBudWxsO1xuICAgIH1cbiAgICBpZiAob3duZWQgIT09IG51bGwpIHtcbiAgICAgICAgZm9yIChpID0gMDsgaSA8IG93bmVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBkaXNwb3NlKG93bmVkW2ldKTtcbiAgICAgICAgfVxuICAgICAgICBub2RlLm93bmVkID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKHNvdXJjZTEgIT09IG51bGwpIHtcbiAgICAgICAgY2xlYW51cFNvdXJjZShzb3VyY2UxLCBub2RlLnNvdXJjZTFzbG90KTtcbiAgICAgICAgbm9kZS5zb3VyY2UxID0gbnVsbDtcbiAgICB9XG4gICAgaWYgKHNvdXJjZXMgIT09IG51bGwpIHtcbiAgICAgICAgZm9yIChpID0gMCwgbGVuID0gc291cmNlcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgY2xlYW51cFNvdXJjZShzb3VyY2VzLnBvcCgpLCBzb3VyY2VzbG90cy5wb3AoKSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBjbGVhbnVwU291cmNlKHNvdXJjZSwgc2xvdCkge1xuICAgIHZhciBub2RlcyA9IHNvdXJjZS5ub2Rlcywgbm9kZXNsb3RzID0gc291cmNlLm5vZGVzbG90cywgbGFzdCwgbGFzdHNsb3Q7XG4gICAgaWYgKHNsb3QgPT09IC0xKSB7XG4gICAgICAgIHNvdXJjZS5ub2RlMSA9IG51bGw7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBsYXN0ID0gbm9kZXMucG9wKCk7XG4gICAgICAgIGxhc3RzbG90ID0gbm9kZXNsb3RzLnBvcCgpO1xuICAgICAgICBpZiAoc2xvdCAhPT0gbm9kZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICBub2Rlc1tzbG90XSA9IGxhc3Q7XG4gICAgICAgICAgICBub2Rlc2xvdHNbc2xvdF0gPSBsYXN0c2xvdDtcbiAgICAgICAgICAgIGlmIChsYXN0c2xvdCA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICBsYXN0LnNvdXJjZTFzbG90ID0gc2xvdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGxhc3Quc291cmNlc2xvdHNbbGFzdHNsb3RdID0gc2xvdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cbmZ1bmN0aW9uIGRpc3Bvc2Uobm9kZSkge1xuICAgIG5vZGUuZm4gPSBudWxsO1xuICAgIG5vZGUubG9nID0gbnVsbDtcbiAgICBjbGVhbnVwKG5vZGUsIHRydWUpO1xufVxuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9+L3MtanMvZGlzdC9lcy9TLmpzXG4vLyBtb2R1bGUgaWQgPSAwXG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsImV4cG9ydCB7IGluc2VydCB9IGZyb20gJy4vaW5zZXJ0JztcbmV4cG9ydCB7IGNvbnRlbnQgfSBmcm9tICcuL2NvbnRlbnQnO1xuZXhwb3J0ICogZnJvbSAnLi9kb20nO1xuZXhwb3J0IHsgc3ByZWFkLCBhc3NpZ24gfSBmcm9tICcuL3NwcmVhZCc7XG5leHBvcnQgeyBkZWZhdWx0IGFzIFMgfSBmcm9tICdzLWpzJztcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vfi9zdXJwbHVzL2VzL2luZGV4LmpzXG4vLyBtb2R1bGUgaWQgPSAxXG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsImltcG9ydCBTLCB7IERhdGFTaWduYWwgfSBmcm9tICdzLWpzJztcclxuaW1wb3J0IFNBcnJheSBmcm9tICdzLWFycmF5JztcclxuXHJcbi8vIG91ciBUb0RvIG1vZGVsXHJcbmV4cG9ydCBjb25zdCBUb0RvID0gKHRpdGxlIDogc3RyaW5nLCBjb21wbGV0ZWQgOiBib29sZWFuKSA9PiAoe1xyXG4gICAgdGl0bGU6IGpzb25hYmxlKFMudmFsdWUodGl0bGUpKSxcclxuICAgIGNvbXBsZXRlZDoganNvbmFibGUoUy52YWx1ZShjb21wbGV0ZWQpKVxyXG59KTtcclxuXHJcbmV4cG9ydCB0eXBlIFRvRG8gPSB0eXBlb2YgdG9Eb1R5cGU7IGNvbnN0IHRvRG9UeXBlID0gcmV0dXJuVHlwZShUb0RvKTtcclxuXHJcbi8vIG91ciBtYWluIG1vZGVsXHJcbmV4cG9ydCBjb25zdCBUb0Rvc01vZGVsID0gKHRvZG9zOiBUb0RvW10pID0+ICh7XHJcbiAgICB0b2RvczoganNvbmFibGUoU0FycmF5KHRvZG9zKSlcclxufSk7XHJcblxyXG5leHBvcnQgdHlwZSBUb0Rvc01vZGVsID0gdHlwZW9mIHRvRG9zTW9kZWxUeXBlOyBjb25zdCB0b0Rvc01vZGVsVHlwZSA9IHJldHVyblR5cGUoVG9Eb3NNb2RlbCk7XHJcblxyXG4vLyBBIGNvdXBsZSBzbWFsbCB1dGlsaXRpZXNcclxuXHJcbi8vIFR5cGVTY3JpcHQgdXRpbGl0eTogZG8gYSBsaXR0bGUgZ2VuZXJpYyBwYXR0ZXJuIG1hdGNoaW5nIHRvIGV4dHJhY3QgdGhlIHJldHVybiB0eXBlIG9mIGFueSBmdW5jdGlvbi5cclxuLy8gTGV0cyB1cyBuYW1lIHRoYXQgcmV0dXJuIHR5cGUgZm9yIHVzYWdlIGluIG90aGVyIGZ1bmN0aW9uJ3Mgc2lnbmF0dXJlcy5cclxuLy8gICAgIGNvbnN0IGZvb1JldHVyblR5cGUgPSByZXR1cm5UeXBlKEZvbyk7XHJcbi8vICAgICB0eXBlIEZvbyA9IHR5cGVvZiBmb29SZXR1cm5UeXBlO1xyXG5leHBvcnQgZnVuY3Rpb24gcmV0dXJuVHlwZTxUPihmbiA6ICguLi5hcmdzOiBhbnlbXSkgPT4gVCkgOiBUIHsgXHJcbiAgICByZXR1cm4gbnVsbCEgYXMgVDsgXHJcbn1cclxuXHJcbi8vIE1ha2UgYW55IHNpZ25hbCBqc29uYWJsZSBieSBhZGRpbmcgYSB0b0pTT04gbWV0aG9kIHRoYXQgZXh0cmFjdHMgaXRzIHZhbHVlIGR1cmluZyBKU09OaXphdGlvblxyXG5mdW5jdGlvbiBqc29uYWJsZTxUIGV4dGVuZHMgKCkgPT4gYW55PihzIDogVCkgOiBUICB7IFxyXG4gICAgKHMgYXMgYW55KS50b0pTT04gPSB0b0pTT047XHJcbiAgICByZXR1cm4gczsgXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRvSlNPTih0aGlzIDogKCkgPT4gYW55KSB7XHJcbiAgICB2YXIganNvbiA9IHRoaXMoKTtcclxuICAgIC8vIGlmIHRoZSB2YWx1ZSBoYXMgaXQncyBvd24gdG9KU09OLCBjYWxsIGl0IG5vd1xyXG4gICAgaWYgKGpzb24gJiYganNvbi50b0pTT04pIGpzb24gPSBqc29uLnRvSlNPTigpO1xyXG4gICAgcmV0dXJuIGpzb247XHJcbn1cclxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL21vZGVscy50cyIsIi8vIHN5bmNocm9ub3VzIGFycmF5IHNpZ25hbHMgZm9yIFMuanNcbmltcG9ydCBTIGZyb20gXCJzLWpzXCI7XG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBTQXJyYXkodmFsdWVzKSB7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHZhbHVlcykpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIlNBcnJheSBtdXN0IGJlIGluaXRpYWxpemVkIHdpdGggYW4gYXJyYXlcIik7XG4gICAgdmFyIGRpcnR5ID0gUy5kYXRhKGZhbHNlKSwgbXV0YXRpb25zID0gW10sIG11dGNvdW50ID0gMCwgcG9wcyA9IDAsIHNoaWZ0cyA9IDAsIGRhdGEgPSBTLnJvb3QoZnVuY3Rpb24gKCkgeyByZXR1cm4gUy5vbihkaXJ0eSwgdXBkYXRlLCB2YWx1ZXMsIHRydWUpOyB9KTtcbiAgICAvLyBhZGQgbXV0YXRvcnNcbiAgICB2YXIgYXJyYXkgPSBmdW5jdGlvbiBhcnJheShuZXd2YWx1ZXMpIHtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBtdXRhdGlvbihmdW5jdGlvbiBhcnJheSgpIHsgdmFsdWVzID0gbmV3dmFsdWVzOyB9KTtcbiAgICAgICAgICAgIHJldHVybiBuZXd2YWx1ZXM7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZGF0YSgpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBhcnJheS5wdXNoID0gcHVzaDtcbiAgICBhcnJheS5wb3AgPSBwb3A7XG4gICAgYXJyYXkudW5zaGlmdCA9IHVuc2hpZnQ7XG4gICAgYXJyYXkuc2hpZnQgPSBzaGlmdDtcbiAgICBhcnJheS5zcGxpY2UgPSBzcGxpY2U7XG4gICAgLy8gbm90IEVTNVxuICAgIGFycmF5LnJlbW92ZSA9IHJlbW92ZTtcbiAgICBhcnJheS5yZW1vdmVBbGwgPSByZW1vdmVBbGw7XG4gICAgbGlmdChhcnJheSk7XG4gICAgcmV0dXJuIGFycmF5O1xuICAgIGZ1bmN0aW9uIG11dGF0aW9uKG0pIHtcbiAgICAgICAgbXV0YXRpb25zW211dGNvdW50KytdID0gbTtcbiAgICAgICAgZGlydHkodHJ1ZSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHVwZGF0ZSgpIHtcbiAgICAgICAgaWYgKHBvcHMpXG4gICAgICAgICAgICB2YWx1ZXMuc3BsaWNlKHZhbHVlcy5sZW5ndGggLSBwb3BzLCBwb3BzKTtcbiAgICAgICAgaWYgKHNoaWZ0cylcbiAgICAgICAgICAgIHZhbHVlcy5zcGxpY2UoMCwgc2hpZnRzKTtcbiAgICAgICAgcG9wcyA9IDA7XG4gICAgICAgIHNoaWZ0cyA9IDA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbXV0Y291bnQ7IGkrKykge1xuICAgICAgICAgICAgbXV0YXRpb25zW2ldKCk7XG4gICAgICAgICAgICBtdXRhdGlvbnNbaV0gPSBudWxsO1xuICAgICAgICB9XG4gICAgICAgIG11dGNvdW50ID0gMDtcbiAgICAgICAgcmV0dXJuIHZhbHVlcztcbiAgICB9XG4gICAgLy8gbXV0YXRvcnNcbiAgICBmdW5jdGlvbiBwdXNoKGl0ZW0pIHtcbiAgICAgICAgbXV0YXRpb24oZnVuY3Rpb24gcHVzaCgpIHsgdmFsdWVzLnB1c2goaXRlbSk7IH0pO1xuICAgICAgICByZXR1cm4gYXJyYXk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHBvcCgpIHtcbiAgICAgICAgYXJyYXkoKTtcbiAgICAgICAgaWYgKChwb3BzICsgc2hpZnRzKSA8IHZhbHVlcy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHZhbHVlc1t2YWx1ZXMubGVuZ3RoIC0gKytwb3BzXTtcbiAgICAgICAgICAgIGRpcnR5KHRydWUpO1xuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIHVuc2hpZnQoaXRlbSkge1xuICAgICAgICBtdXRhdGlvbihmdW5jdGlvbiB1bnNoaWZ0KCkgeyB2YWx1ZXMudW5zaGlmdChpdGVtKTsgfSk7XG4gICAgICAgIHJldHVybiBhcnJheTtcbiAgICB9XG4gICAgZnVuY3Rpb24gc2hpZnQoKSB7XG4gICAgICAgIGFycmF5KCk7XG4gICAgICAgIGlmICgocG9wcyArIHNoaWZ0cykgPCB2YWx1ZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSB2YWx1ZXNbc2hpZnRzKytdO1xuICAgICAgICAgICAgZGlydHkodHJ1ZSk7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZnVuY3Rpb24gc3BsaWNlKCkge1xuICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgIG11dGF0aW9uKGZ1bmN0aW9uIHNwbGljZSgpIHsgQXJyYXkucHJvdG90eXBlLnNwbGljZS5hcHBseSh2YWx1ZXMsIGFyZ3MpOyB9KTtcbiAgICAgICAgcmV0dXJuIGFycmF5O1xuICAgIH1cbiAgICBmdW5jdGlvbiByZW1vdmUoaXRlbSkge1xuICAgICAgICBtdXRhdGlvbihmdW5jdGlvbiByZW1vdmUoKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZhbHVlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZXNbaV0gPT09IGl0ZW0pIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWVzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGFycmF5O1xuICAgIH1cbiAgICBmdW5jdGlvbiByZW1vdmVBbGwoaXRlbSkge1xuICAgICAgICBtdXRhdGlvbihmdW5jdGlvbiByZW1vdmVBbGwoKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZhbHVlcy5sZW5ndGg7KSB7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlc1tpXSA9PT0gaXRlbSkge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZXMuc3BsaWNlKGksIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaSsrO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBhcnJheTtcbiAgICB9XG59XG4vLyB1dGlsIHRvIGFkZCB0cmFuc2Zvcm1lciBtZXRob2RzXG5leHBvcnQgZnVuY3Rpb24gbGlmdChzZXEpIHtcbiAgICB2YXIgX3NlcSA9IHNlcTtcbiAgICBfc2VxLmNvbmNhdCA9IGNoYWluQ29uY2F0O1xuICAgIF9zZXEuZXZlcnkgPSBjaGFpbkV2ZXJ5O1xuICAgIF9zZXEuZmlsdGVyID0gY2hhaW5GaWx0ZXI7XG4gICAgX3NlcS5maW5kID0gY2hhaW5GaW5kO1xuICAgIC8vcy5maW5kSW5kZXggPSBmaW5kSW5kZXg7XG4gICAgX3NlcS5mb3JFYWNoID0gY2hhaW5Gb3JFYWNoO1xuICAgIF9zZXEuaW5jbHVkZXMgPSBjaGFpbkluY2x1ZGVzO1xuICAgIC8vcy5pbmRleE9mICAgPSBpbmRleE9mO1xuICAgIC8vcy5qb2luICAgICAgPSBqb2luO1xuICAgIC8vcy5sYXN0SW5kZXhPZiA9IGxhc3RJbmRleE9mO1xuICAgIF9zZXEubWFwID0gY2hhaW5NYXA7XG4gICAgX3NlcS5zb3J0ID0gY2hhaW5Tb3J0O1xuICAgIF9zZXEucmVkdWNlID0gY2hhaW5SZWR1Y2U7XG4gICAgX3NlcS5yZWR1Y2VSaWdodCA9IGNoYWluUmVkdWNlUmlnaHQ7XG4gICAgX3NlcS5yZXZlcnNlID0gY2hhaW5SZXZlcnNlO1xuICAgIF9zZXEuc2xpY2UgPSBjaGFpblNsaWNlO1xuICAgIF9zZXEuc29tZSA9IGNoYWluU29tZTtcbiAgICAvLyBub24tRVM1IHRyYW5zZm9ybWVyc1xuICAgIF9zZXEubWFwUyA9IGNoYWluTWFwUztcbiAgICBfc2VxLm1hcFNhbXBsZSA9IGNoYWluTWFwU2FtcGxlO1xuICAgIF9zZXEubWFwU2VxdWVudGlhbGx5ID0gY2hhaW5NYXBTZXF1ZW50aWFsbHk7XG4gICAgX3NlcS5vcmRlckJ5ID0gY2hhaW5PcmRlckJ5O1xuICAgIHJldHVybiBfc2VxO1xufVxuZXhwb3J0IGZ1bmN0aW9uIG1hcFMoc2VxLCBlbnRlciwgZXhpdCwgbW92ZSkge1xuICAgIHZhciBpdGVtcyA9IFtdLCBtYXBwZWQgPSBbXSwgZGlzcG9zZXJzID0gW10sIGxlbiA9IDA7XG4gICAgUyhmdW5jdGlvbiAoKSB7IFMuY2xlYW51cChmdW5jdGlvbiAoKSB7IGRpc3Bvc2Vycy5mb3JFYWNoKGZ1bmN0aW9uIChkKSB7IGQoKTsgfSk7IH0pOyB9KTtcbiAgICByZXR1cm4gUy5vbihzZXEsIGZ1bmN0aW9uIG1hcFMoKSB7XG4gICAgICAgIHZhciBuZXdfaXRlbXMgPSBzZXEoKSwgbmV3X2xlbiA9IG5ld19pdGVtcy5sZW5ndGgsIHRlbXAgPSBuZXcgQXJyYXkobmV3X2xlbiksIHRlbXBkaXNwb3NlcnMgPSBuZXcgQXJyYXkobmV3X2xlbiksIGZyb20gPSBudWxsLCB0byA9IG51bGwsIGksIGosIGssIGl0ZW07XG4gICAgICAgIGlmIChtb3ZlKVxuICAgICAgICAgICAgZnJvbSA9IFtdLCB0byA9IFtdO1xuICAgICAgICAvLyAxKSBzdGVwIHRocm91Z2ggYWxsIG9sZCBpdGVtcyBhbmQgc2VlIGlmIHRoZXkgY2FuIGJlIGZvdW5kIGluIHRoZSBuZXcgc2V0OyBpZiBzbywgc2F2ZSB0aGVtIGluIGEgdGVtcCBhcnJheSBhbmQgbWFyayB0aGVtIG1vdmVkOyBpZiBub3QsIGV4aXQgdGhlbVxuICAgICAgICBORVhUOiBmb3IgKGkgPSAwLCBrID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICBpdGVtID0gaXRlbXNbaV07XG4gICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgbmV3X2xlbjsgaisrLCBrID0gKGsgKyAxKSAlIG5ld19sZW4pIHtcbiAgICAgICAgICAgICAgICBpZiAoaXRlbSA9PT0gbmV3X2l0ZW1zW2tdICYmICF0ZW1wLmhhc093blByb3BlcnR5KGsudG9TdHJpbmcoKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdGVtcFtrXSA9IG1hcHBlZFtpXTtcbiAgICAgICAgICAgICAgICAgICAgdGVtcGRpc3Bvc2Vyc1trXSA9IGRpc3Bvc2Vyc1tpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1vdmUgJiYgaSAhPT0gaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZnJvbS5wdXNoKGkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdG8ucHVzaChrKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBrID0gKGsgKyAxKSAlIG5ld19sZW47XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlIE5FWFQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGV4aXQpXG4gICAgICAgICAgICAgICAgZXhpdChpdGVtLCBtYXBwZWRbaV0oKSwgaSk7XG4gICAgICAgICAgICBkaXNwb3NlcnNbaV0oKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobW92ZSAmJiBmcm9tLmxlbmd0aClcbiAgICAgICAgICAgIG1vdmUoaXRlbXMsIG1hcHBlZCwgZnJvbSwgdG8pO1xuICAgICAgICAvLyAyKSBzZXQgYWxsIHRoZSBuZXcgdmFsdWVzLCBwdWxsaW5nIGZyb20gdGhlIHRlbXAgYXJyYXkgaWYgY29waWVkLCBvdGhlcndpc2UgZW50ZXJpbmcgdGhlIG5ldyB2YWx1ZVxuICAgICAgICBmb3IgKGkgPSAwOyBpIDwgbmV3X2xlbjsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGVtcC5oYXNPd25Qcm9wZXJ0eShpLnRvU3RyaW5nKCkpKSB7XG4gICAgICAgICAgICAgICAgbWFwcGVkW2ldID0gdGVtcFtpXTtcbiAgICAgICAgICAgICAgICBkaXNwb3NlcnNbaV0gPSB0ZW1wZGlzcG9zZXJzW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbWFwcGVkW2ldID0gUy5yb290KG1hcHBlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gMykgaW4gY2FzZSB0aGUgbmV3IHNldCBpcyBzaG9ydGVyIHRoYW4gdGhlIG9sZCwgc2V0IHRoZSBsZW5ndGggb2YgdGhlIG1hcHBlZCBhcnJheVxuICAgICAgICBsZW4gPSBtYXBwZWQubGVuZ3RoID0gbmV3X2xlbjtcbiAgICAgICAgLy8gNCkgc2F2ZSBhIGNvcHkgb2YgdGhlIG1hcHBlZCBpdGVtcyBmb3IgdGhlIG5leHQgdXBkYXRlXG4gICAgICAgIGl0ZW1zID0gbmV3X2l0ZW1zLnNsaWNlKCk7XG4gICAgICAgIHJldHVybiBtYXBwZWQ7XG4gICAgICAgIGZ1bmN0aW9uIG1hcHBlcihkaXNwb3Nlcikge1xuICAgICAgICAgICAgZGlzcG9zZXJzW2ldID0gZGlzcG9zZXI7XG4gICAgICAgICAgICB2YXIgX2l0ZW0gPSBuZXdfaXRlbXNbaV0sIF9pID0gaTtcbiAgICAgICAgICAgIHJldHVybiBTKGZ1bmN0aW9uICh2YWx1ZSkgeyByZXR1cm4gZW50ZXIoX2l0ZW0sIHZhbHVlLCBfaSk7IH0sIHVuZGVmaW5lZCk7XG4gICAgICAgIH1cbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGNoYWluTWFwUyhlbnRlciwgZXhpdCwgbW92ZSkge1xuICAgIHZhciByID0gbGlmdChtYXBTKHRoaXMsIGVudGVyLCBleGl0LCBtb3ZlKSk7XG4gICAgci5jb21iaW5lID0gY2hhaW5Db21iaW5lO1xuICAgIHJldHVybiByO1xufVxuZXhwb3J0IGZ1bmN0aW9uIG1hcFNhbXBsZShzZXEsIGVudGVyLCBleGl0LCBtb3ZlKSB7XG4gICAgdmFyIGl0ZW1zID0gW10sIG1hcHBlZCA9IFtdLCBkaXNwb3NlcnMgPSBbXSwgbGVuID0gMDtcbiAgICBTKGZ1bmN0aW9uICgpIHsgUy5jbGVhbnVwKGZ1bmN0aW9uICgpIHsgZGlzcG9zZXJzLmZvckVhY2goZnVuY3Rpb24gKGQpIHsgZCgpOyB9KTsgfSk7IH0pO1xuICAgIHJldHVybiBTLm9uKHNlcSwgZnVuY3Rpb24gbWFwU2FtcGxlKCkge1xuICAgICAgICB2YXIgbmV3X2l0ZW1zID0gc2VxKCksIG5ld19sZW4gPSBuZXdfaXRlbXMubGVuZ3RoLCBuZXdfaW5kaWNlcywgaXRlbV9pbmRpY2VzLCB0ZW1wLCB0ZW1wZGlzcG9zZXJzLCBmcm9tID0gbnVsbCwgdG8gPSBudWxsLCBpLCBqLCBzdGFydCwgZW5kLCBuZXdfZW5kLCBpdGVtO1xuICAgICAgICAvLyBmYXN0IHBhdGggZm9yIGVtcHR5IGFycmF5c1xuICAgICAgICBpZiAobmV3X2xlbiA9PT0gMCkge1xuICAgICAgICAgICAgaWYgKGxlbiAhPT0gMCkge1xuICAgICAgICAgICAgICAgIGlmIChleGl0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpdGVtID0gaXRlbXNbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICBleGl0KGl0ZW0sIG1hcHBlZFtpXSwgaSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwb3NlcnNbaV0oKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkaXNwb3NlcnNbaV0oKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpdGVtcyA9IFtdO1xuICAgICAgICAgICAgICAgIG1hcHBlZCA9IFtdO1xuICAgICAgICAgICAgICAgIGRpc3Bvc2VycyA9IFtdO1xuICAgICAgICAgICAgICAgIGxlbiA9IDA7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobGVuID09PSAwKSB7XG4gICAgICAgICAgICBmb3IgKGogPSAwOyBqIDwgbmV3X2xlbjsgaisrKSB7XG4gICAgICAgICAgICAgICAgaXRlbXNbal0gPSBuZXdfaXRlbXNbal07XG4gICAgICAgICAgICAgICAgbWFwcGVkW2pdID0gUy5yb290KG1hcHBlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBsZW4gPSBuZXdfbGVuO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbmV3X2luZGljZXMgPSBuZXcgTWFwKCk7XG4gICAgICAgICAgICB0ZW1wID0gbmV3IEFycmF5KG5ld19sZW4pO1xuICAgICAgICAgICAgdGVtcGRpc3Bvc2VycyA9IG5ldyBBcnJheShuZXdfbGVuKTtcbiAgICAgICAgICAgIGlmIChtb3ZlKVxuICAgICAgICAgICAgICAgIGZyb20gPSBbXSwgdG8gPSBbXTtcbiAgICAgICAgICAgIC8vIHNraXAgY29tbW9uIHByZWZpeCBhbmQgc3VmZml4XG4gICAgICAgICAgICBmb3IgKHN0YXJ0ID0gMCwgZW5kID0gTWF0aC5taW4obGVuLCBuZXdfbGVuKTsgc3RhcnQgPCBlbmQgJiYgaXRlbXNbc3RhcnRdID09PSBuZXdfaXRlbXNbc3RhcnRdOyBzdGFydCsrKVxuICAgICAgICAgICAgICAgIDtcbiAgICAgICAgICAgIGZvciAoZW5kID0gbGVuIC0gMSwgbmV3X2VuZCA9IG5ld19sZW4gLSAxOyBlbmQgPj0gMCAmJiBuZXdfZW5kID49IDAgJiYgaXRlbXNbZW5kXSA9PT0gbmV3X2l0ZW1zW25ld19lbmRdOyBlbmQtLSwgbmV3X2VuZC0tKSB7XG4gICAgICAgICAgICAgICAgdGVtcFtuZXdfZW5kXSA9IG1hcHBlZFtlbmRdO1xuICAgICAgICAgICAgICAgIHRlbXBkaXNwb3NlcnNbbmV3X2VuZF0gPSBkaXNwb3NlcnNbZW5kXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIDApIHByZXBhcmUgYSBtYXAgb2YgYWxsIGluZGljZXMgaW4gbmV3X2l0ZW1zLCBzY2FubmluZyBiYWNrd2FyZHMgc28gd2UgY2FuIHBvcCB0aGVtIG9mZiBpbiBuYXR1cmFsIG9yZGVyXG4gICAgICAgICAgICBmb3IgKGogPSBuZXdfZW5kOyBqID49IHN0YXJ0OyBqLS0pIHtcbiAgICAgICAgICAgICAgICBpdGVtID0gbmV3X2l0ZW1zW2pdO1xuICAgICAgICAgICAgICAgIGl0ZW1faW5kaWNlcyA9IG5ld19pbmRpY2VzLmdldChpdGVtKTtcbiAgICAgICAgICAgICAgICBpZiAoaXRlbV9pbmRpY2VzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgbmV3X2luZGljZXMuc2V0KGl0ZW0sIFtqXSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpdGVtX2luZGljZXMucHVzaChqKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyAxKSBzdGVwIHRocm91Z2ggYWxsIG9sZCBpdGVtcyBhbmQgc2VlIGlmIHRoZXkgY2FuIGJlIGZvdW5kIGluIHRoZSBuZXcgc2V0OyBpZiBzbywgc2F2ZSB0aGVtIGluIGEgdGVtcCBhcnJheSBhbmQgbWFyayB0aGVtIG1vdmVkOyBpZiBub3QsIGV4aXQgdGhlbVxuICAgICAgICAgICAgZm9yIChpID0gc3RhcnQ7IGkgPD0gZW5kOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpdGVtID0gaXRlbXNbaV07XG4gICAgICAgICAgICAgICAgaXRlbV9pbmRpY2VzID0gbmV3X2luZGljZXMuZ2V0KGl0ZW0pO1xuICAgICAgICAgICAgICAgIGlmIChpdGVtX2luZGljZXMgIT09IHVuZGVmaW5lZCAmJiBpdGVtX2luZGljZXMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICBqID0gaXRlbV9pbmRpY2VzLnBvcCgpO1xuICAgICAgICAgICAgICAgICAgICB0ZW1wW2pdID0gbWFwcGVkW2ldO1xuICAgICAgICAgICAgICAgICAgICB0ZW1wZGlzcG9zZXJzW2pdID0gZGlzcG9zZXJzW2ldO1xuICAgICAgICAgICAgICAgICAgICBpZiAobW92ZSAmJiBpICE9PSBqKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmcm9tLnB1c2goaSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0by5wdXNoKGopO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXhpdClcbiAgICAgICAgICAgICAgICAgICAgICAgIGV4aXQoaXRlbSwgbWFwcGVkW2ldLCBpKTtcbiAgICAgICAgICAgICAgICAgICAgZGlzcG9zZXJzW2ldKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKG1vdmUgJiYgKGZyb20ubGVuZ3RoICE9PSAwIHx8IGVuZCAhPT0gbGVuIC0gMSkpIHtcbiAgICAgICAgICAgICAgICBlbmQrKywgbmV3X2VuZCsrO1xuICAgICAgICAgICAgICAgIHdoaWxlIChlbmQgPCBsZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgZnJvbS5wdXNoKGVuZCsrKTtcbiAgICAgICAgICAgICAgICAgICAgdG8ucHVzaChuZXdfZW5kKyspO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBtb3ZlKGl0ZW1zLCBtYXBwZWQsIGZyb20sIHRvKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIDIpIHNldCBhbGwgdGhlIG5ldyB2YWx1ZXMsIHB1bGxpbmcgZnJvbSB0aGUgdGVtcCBhcnJheSBpZiBjb3BpZWQsIG90aGVyd2lzZSBlbnRlcmluZyB0aGUgbmV3IHZhbHVlXG4gICAgICAgICAgICBmb3IgKGogPSBzdGFydDsgaiA8IG5ld19sZW47IGorKykge1xuICAgICAgICAgICAgICAgIGlmICh0ZW1wLmhhc093blByb3BlcnR5KGopKSB7XG4gICAgICAgICAgICAgICAgICAgIG1hcHBlZFtqXSA9IHRlbXBbal07XG4gICAgICAgICAgICAgICAgICAgIGRpc3Bvc2Vyc1tqXSA9IHRlbXBkaXNwb3NlcnNbal07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBtYXBwZWRbal0gPSBTLnJvb3QobWFwcGVyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyAzKSBpbiBjYXNlIHRoZSBuZXcgc2V0IGlzIHNob3J0ZXIgdGhhbiB0aGUgb2xkLCBzZXQgdGhlIGxlbmd0aCBvZiB0aGUgbWFwcGVkIGFycmF5XG4gICAgICAgICAgICBsZW4gPSBtYXBwZWQubGVuZ3RoID0gbmV3X2xlbjtcbiAgICAgICAgICAgIC8vIDQpIHNhdmUgYSBjb3B5IG9mIHRoZSBtYXBwZWQgaXRlbXMgZm9yIHRoZSBuZXh0IHVwZGF0ZVxuICAgICAgICAgICAgaXRlbXMgPSBuZXdfaXRlbXMuc2xpY2UoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbWFwcGVkO1xuICAgICAgICBmdW5jdGlvbiBtYXBwZXIoZGlzcG9zZXIpIHtcbiAgICAgICAgICAgIGRpc3Bvc2Vyc1tqXSA9IGRpc3Bvc2VyO1xuICAgICAgICAgICAgcmV0dXJuIGVudGVyKG5ld19pdGVtc1tqXSwgbWFwcGVkW2pdLCBqKTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuZnVuY3Rpb24gY2hhaW5NYXBTYW1wbGUoZW50ZXIsIGV4aXQsIG1vdmUpIHtcbiAgICByZXR1cm4gbGlmdChtYXBTYW1wbGUodGhpcywgZW50ZXIsIGV4aXQsIG1vdmUpKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBtYXBTZXF1ZW50aWFsbHkoc2VxLCB1cGRhdGUpIHtcbiAgICB2YXIgbWFwcGVkID0gW107XG4gICAgcmV0dXJuIFMoZnVuY3Rpb24gbWFwU2VxdWVudGlhbGx5KCkge1xuICAgICAgICB2YXIgcyA9IHNlcSgpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIG1hcHBlZFtpXSA9IHVwZGF0ZShzW2ldLCBtYXBwZWRbaV0sIGkpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChtYXBwZWQubGVuZ3RoID4gcy5sZW5ndGgpXG4gICAgICAgICAgICBtYXBwZWQubGVuZ3RoID0gcy5sZW5ndGg7XG4gICAgICAgIHJldHVybiBtYXBwZWQ7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBjaGFpbk1hcFNlcXVlbnRpYWxseShlbnRlcikge1xuICAgIHJldHVybiBsaWZ0KG1hcFNlcXVlbnRpYWxseSh0aGlzLCBlbnRlcikpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGZvckVhY2goc2VxLCBlbnRlciwgZXhpdCwgbW92ZSkge1xuICAgIHZhciBpdGVtcyA9IFtdLCBsZW4gPSAwO1xuICAgIHJldHVybiBTLm9uKHNlcSwgZnVuY3Rpb24gZm9yRWFjaCgpIHtcbiAgICAgICAgdmFyIG5ld19pdGVtcyA9IHNlcSgpLCBuZXdfbGVuID0gbmV3X2l0ZW1zLmxlbmd0aCwgZm91bmQgPSBuZXcgQXJyYXkobmV3X2xlbiksIGZyb20gPSBbXSwgdG8gPSBbXSwgaSwgaiwgaywgaXRlbTtcbiAgICAgICAgLy8gMSkgc3RlcCB0aHJvdWdoIGFsbCBvbGQgaXRlbXMgYW5kIHNlZSBpZiB0aGV5IGNhbiBiZSBmb3VuZCBpbiB0aGUgbmV3IHNldDsgaWYgc28sIHNhdmUgdGhlbSBpbiBhIHRlbXAgYXJyYXkgYW5kIG1hcmsgdGhlbSBtb3ZlZDsgaWYgbm90LCBleGl0IHRoZW1cbiAgICAgICAgTkVYVDogZm9yIChpID0gMCwgayA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICAgICAgaXRlbSA9IGl0ZW1zW2ldO1xuICAgICAgICAgICAgZm9yIChqID0gMDsgaiA8IG5ld19sZW47IGorKywgayA9IChrICsgMSkgJSBuZXdfbGVuKSB7XG4gICAgICAgICAgICAgICAgaWYgKGl0ZW0gPT09IG5ld19pdGVtc1trXSAmJiAhZm91bmRba10pIHtcbiAgICAgICAgICAgICAgICAgICAgZm91bmRba10gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaSAhPT0gaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgZnJvbS5wdXNoKGkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdG8ucHVzaChrKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBrID0gKGsgKyAxKSAlIG5ld19sZW47XG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlIE5FWFQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGV4aXQpXG4gICAgICAgICAgICAgICAgZXhpdChpdGVtLCBpKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAobW92ZSAmJiBmcm9tLmxlbmd0aClcbiAgICAgICAgICAgIG1vdmUoZnJvbSwgdG8pO1xuICAgICAgICAvLyAyKSBzZXQgYWxsIHRoZSBuZXcgdmFsdWVzLCBwdWxsaW5nIGZyb20gdGhlIHRlbXAgYXJyYXkgaWYgY29waWVkLCBvdGhlcndpc2UgZW50ZXJpbmcgdGhlIG5ldyB2YWx1ZVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5ld19sZW47IGkrKykge1xuICAgICAgICAgICAgaWYgKCFmb3VuZFtpXSlcbiAgICAgICAgICAgICAgICBlbnRlcihuZXdfaXRlbXNbaV0sIGkpO1xuICAgICAgICB9XG4gICAgICAgIC8vIDMpIGluIGNhc2UgdGhlIG5ldyBzZXQgaXMgc2hvcnRlciB0aGFuIHRoZSBvbGQsIHNldCB0aGUgbGVuZ3RoIG9mIHRoZSBtYXBwZWQgYXJyYXlcbiAgICAgICAgbGVuID0gbmV3X2xlbjtcbiAgICAgICAgLy8gNCkgc2F2ZSBhIGNvcHkgb2YgdGhlIG1hcHBlZCBpdGVtcyBmb3IgdGhlIG5leHQgdXBkYXRlXG4gICAgICAgIGl0ZW1zID0gbmV3X2l0ZW1zLnNsaWNlKCk7XG4gICAgICAgIHJldHVybiBpdGVtcztcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGNoYWluRm9yRWFjaChlbnRlciwgZXhpdCwgbW92ZSkge1xuICAgIHJldHVybiBsaWZ0KGZvckVhY2godGhpcywgZW50ZXIsIGV4aXQsIG1vdmUpKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBjb21iaW5lKHNlcSkge1xuICAgIHJldHVybiBTKGZ1bmN0aW9uIGNvbWJpbmUoKSB7XG4gICAgICAgIHZhciBzID0gc2VxKCksIHJlc3VsdCA9IG5ldyBBcnJheShzLmxlbmd0aCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgcmVzdWx0W2ldID0gc1tpXSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBjaGFpbkNvbWJpbmUoKSB7XG4gICAgcmV0dXJuIGxpZnQoY29tYmluZSh0aGlzKSk7XG59XG5leHBvcnQgZnVuY3Rpb24gbWFwKHNlcSwgZW50ZXIsIGV4aXQsIG1vdmUpIHtcbiAgICByZXR1cm4gY29tYmluZShtYXBTKHNlcSwgZW50ZXIsIGV4aXQsIG1vdmUgPT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDpcbiAgICAgICAgZnVuY3Rpb24gKGl0ZW1zLCBtYXBwZWQsIGZyb20sIHRvKSB7IG1vdmUoaXRlbXMsIG1hcHBlZC5tYXAoZnVuY3Rpb24gKHMpIHsgcmV0dXJuIHMoKTsgfSksIGZyb20sIHRvKTsgfSkpO1xufVxuZnVuY3Rpb24gY2hhaW5NYXAoZW50ZXIsIGV4aXQsIG1vdmUpIHtcbiAgICByZXR1cm4gbGlmdChtYXAodGhpcywgZW50ZXIsIGV4aXQsIG1vdmUpKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBmaW5kKHNlcSwgcHJlZCkge1xuICAgIHJldHVybiBTKGZ1bmN0aW9uIGZpbmQoKSB7XG4gICAgICAgIHZhciBzID0gc2VxKCksIGksIGl0ZW07XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpdGVtID0gc1tpXTtcbiAgICAgICAgICAgIGlmIChwcmVkKGl0ZW0pKVxuICAgICAgICAgICAgICAgIHJldHVybiBpdGVtO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBjaGFpbkZpbmQocHJlZCkge1xuICAgIHJldHVybiBmaW5kKHRoaXMsIHByZWQpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGluY2x1ZGVzKHNlcSwgbykge1xuICAgIHJldHVybiBTKGZ1bmN0aW9uIGZpbmQoKSB7XG4gICAgICAgIHZhciBzID0gc2VxKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHNbaV0gPT09IG8pXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pO1xufVxuZnVuY3Rpb24gY2hhaW5JbmNsdWRlcyhvKSB7XG4gICAgcmV0dXJuIGluY2x1ZGVzKHRoaXMsIG8pO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHNvcnQoc2VxLCBmbikge1xuICAgIHJldHVybiBTKGZ1bmN0aW9uIHNvcnQoKSB7XG4gICAgICAgIHZhciBjb3B5ID0gc2VxKCkuc2xpY2UoMCk7XG4gICAgICAgIGlmIChmbilcbiAgICAgICAgICAgIGNvcHkuc29ydChmbik7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICAgIGNvcHkuc29ydCgpO1xuICAgICAgICByZXR1cm4gY29weTtcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGNoYWluU29ydChmbikge1xuICAgIHJldHVybiBsaWZ0KHNvcnQodGhpcywgZm4pKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBvcmRlckJ5KHNlcSwgYnkpIHtcbiAgICB2YXIga2V5LCBmbjtcbiAgICBpZiAodHlwZW9mIGJ5ICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGtleSA9IGJ5O1xuICAgICAgICBmbiA9IGZ1bmN0aW9uIChvKSB7IHJldHVybiBvW2tleV07IH07XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBmbiA9IGJ5O1xuICAgIH1cbiAgICByZXR1cm4gUyhmdW5jdGlvbiBvcmRlckJ5KCkge1xuICAgICAgICB2YXIgY29weSA9IHNlcSgpLnNsaWNlKDApO1xuICAgICAgICBjb3B5LnNvcnQoZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgICAgIGEgPSBmbihhKTtcbiAgICAgICAgICAgIGIgPSBmbihiKTtcbiAgICAgICAgICAgIHJldHVybiBhIDwgYiA/IC0xIDogYSA+IGIgPyAxIDogMDtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBjb3B5O1xuICAgIH0pO1xufVxuZnVuY3Rpb24gY2hhaW5PcmRlckJ5KGJ5KSB7XG4gICAgcmV0dXJuIGxpZnQob3JkZXJCeSh0aGlzLCBieSkpO1xufVxuZXhwb3J0IGZ1bmN0aW9uIGZpbHRlcihzZXEsIHByZWRpY2F0ZSkge1xuICAgIHJldHVybiBTKGZ1bmN0aW9uIGZpbHRlcigpIHtcbiAgICAgICAgdmFyIHMgPSBzZXEoKSwgcmVzdWx0ID0gW10sIGksIHY7XG4gICAgICAgIGZvciAoaSA9IDA7IGkgPCBzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2ID0gc1tpXTtcbiAgICAgICAgICAgIGlmIChwcmVkaWNhdGUodikpXG4gICAgICAgICAgICAgICAgcmVzdWx0LnB1c2godik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGNoYWluRmlsdGVyKHByZWRpY2F0ZSkge1xuICAgIHJldHVybiBsaWZ0KGZpbHRlcih0aGlzLCBwcmVkaWNhdGUpKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBjb25jYXQoc2VxKSB7XG4gICAgdmFyIG90aGVycyA9IFtdO1xuICAgIGZvciAodmFyIF9hID0gMTsgX2EgPCBhcmd1bWVudHMubGVuZ3RoOyBfYSsrKSB7XG4gICAgICAgIG90aGVyc1tfYSAtIDFdID0gYXJndW1lbnRzW19hXTtcbiAgICB9XG4gICAgcmV0dXJuIFMoZnVuY3Rpb24gY29uY2F0KCkge1xuICAgICAgICB2YXIgcyA9IHNlcSgpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG90aGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgcyA9IHMuY29uY2F0KG90aGVyc1tpXSgpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcztcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGNoYWluQ29uY2F0KCkge1xuICAgIHZhciBvdGhlcnMgPSBbXTtcbiAgICBmb3IgKHZhciBfYSA9IDA7IF9hIDwgYXJndW1lbnRzLmxlbmd0aDsgX2ErKykge1xuICAgICAgICBvdGhlcnNbX2FdID0gYXJndW1lbnRzW19hXTtcbiAgICB9XG4gICAgcmV0dXJuIGxpZnQoY29uY2F0LmFwcGx5KHZvaWQgMCwgW3RoaXNdLmNvbmNhdChvdGhlcnMpKSk7XG59XG5leHBvcnQgZnVuY3Rpb24gcmVkdWNlKHNlcSwgZm4sIHNlZWQpIHtcbiAgICByZXR1cm4gUyhmdW5jdGlvbiByZWR1Y2UoKSB7XG4gICAgICAgIHZhciBzID0gc2VxKCksIHJlc3VsdCA9IHNlZWQgaW5zdGFuY2VvZiBGdW5jdGlvbiA/IHNlZWQoKSA6IHNlZWQ7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgcmVzdWx0ID0gZm4ocmVzdWx0LCBzW2ldLCBpLCBzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0pO1xufVxuZnVuY3Rpb24gY2hhaW5SZWR1Y2UoZm4sIHNlZWQpIHtcbiAgICByZXR1cm4gcmVkdWNlKHRoaXMsIGZuLCBzZWVkKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiByZWR1Y2VSaWdodChzZXEsIGZuLCBzZWVkKSB7XG4gICAgcmV0dXJuIFMoZnVuY3Rpb24gcmVkdWNlUmlnaHQoKSB7XG4gICAgICAgIHZhciBzID0gc2VxKCksIHJlc3VsdCA9IHNlZWQgaW5zdGFuY2VvZiBGdW5jdGlvbiA/IHNlZWQoKSA6IHNlZWQ7XG4gICAgICAgIGZvciAodmFyIGkgPSBzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICByZXN1bHQgPSBmbihyZXN1bHQsIHNbaV0sIGksIHMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBjaGFpblJlZHVjZVJpZ2h0KGZuLCBzZWVkKSB7XG4gICAgcmV0dXJuIHJlZHVjZVJpZ2h0KHRoaXMsIGZuLCBzZWVkKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBldmVyeShzZXEsIGZuKSB7XG4gICAgcmV0dXJuIFMoZnVuY3Rpb24gZXZlcnkoKSB7XG4gICAgICAgIHZhciBzID0gc2VxKCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKCFmbihzW2ldKSlcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBjaGFpbkV2ZXJ5KGZuKSB7XG4gICAgcmV0dXJuIGV2ZXJ5KHRoaXMsIGZuKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBzb21lKHNlcSwgZm4pIHtcbiAgICByZXR1cm4gUyhmdW5jdGlvbiBzb21lKCkge1xuICAgICAgICB2YXIgcyA9IHNlcSgpO1xuICAgICAgICBpZiAoZm4gPT09IHVuZGVmaW5lZClcbiAgICAgICAgICAgIHJldHVybiBzLmxlbmd0aCAhPT0gMDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoZm4oc1tpXSkpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pO1xufVxuZnVuY3Rpb24gY2hhaW5Tb21lKGZuKSB7XG4gICAgcmV0dXJuIHNvbWUodGhpcywgZm4pO1xufVxuZXhwb3J0IGZ1bmN0aW9uIHJldmVyc2Uoc2VxKSB7XG4gICAgcmV0dXJuIFMoZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgY29weSA9IHNlcSgpLnNsaWNlKDApO1xuICAgICAgICBjb3B5LnJldmVyc2UoKTtcbiAgICAgICAgcmV0dXJuIGNvcHk7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBjaGFpblJldmVyc2UoKSB7XG4gICAgcmV0dXJuIGxpZnQocmV2ZXJzZSh0aGlzKSk7XG59XG5leHBvcnQgZnVuY3Rpb24gc2xpY2Uoc2VxLCBzLCBlKSB7XG4gICAgcmV0dXJuIFMoZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gc2VxKCkuc2xpY2UocywgZSk7XG4gICAgfSk7XG59XG5mdW5jdGlvbiBjaGFpblNsaWNlKHMsIGUpIHtcbiAgICByZXR1cm4gbGlmdChzbGljZSh0aGlzLCBzLCBlKSk7XG59XG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL34vcy1hcnJheS9lcy9pbmRleC5qc1xuLy8gbW9kdWxlIGlkID0gM1xuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCJ2YXIgc3ZnTlMgPSBcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCI7XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRWxlbWVudCh0YWcsIGNsYXNzTmFtZSwgcGFyZW50KSB7XG4gICAgdmFyIGVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWcpO1xuICAgIGlmIChjbGFzc05hbWUpXG4gICAgICAgIGVsLmNsYXNzTmFtZSA9IGNsYXNzTmFtZTtcbiAgICBpZiAocGFyZW50KVxuICAgICAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoZWwpO1xuICAgIHJldHVybiBlbDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTdmdFbGVtZW50KHRhZywgY2xhc3NOYW1lLCBwYXJlbnQpIHtcbiAgICB2YXIgZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoc3ZnTlMsIHRhZyk7XG4gICAgaWYgKGNsYXNzTmFtZSlcbiAgICAgICAgZWwuc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgY2xhc3NOYW1lKTtcbiAgICBpZiAocGFyZW50KVxuICAgICAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoZWwpO1xuICAgIHJldHVybiBlbDtcbn1cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVDb21tZW50KHRleHQsIHBhcmVudCkge1xuICAgIHZhciBjb21tZW50ID0gZG9jdW1lbnQuY3JlYXRlQ29tbWVudCh0ZXh0KTtcbiAgICBwYXJlbnQuYXBwZW5kQ2hpbGQoY29tbWVudCk7XG4gICAgcmV0dXJuIGNvbW1lbnQ7XG59XG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVGV4dE5vZGUodGV4dCwgcGFyZW50KSB7XG4gICAgdmFyIG5vZGUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh0ZXh0KTtcbiAgICBwYXJlbnQuYXBwZW5kQ2hpbGQobm9kZSk7XG4gICAgcmV0dXJuIG5vZGU7XG59XG5leHBvcnQgZnVuY3Rpb24gc2V0QXR0cmlidXRlKG5vZGUsIG5hbWUsIHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09PSBmYWxzZSB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgICBlbHNlXG4gICAgICAgIG5vZGUuc2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKTtcbn1cbmV4cG9ydCBmdW5jdGlvbiBzZXRBdHRyaWJ1dGVOUyhub2RlLCBuYW1lc3BhY2UsIG5hbWUsIHZhbHVlKSB7XG4gICAgaWYgKHZhbHVlID09PSBmYWxzZSB8fCB2YWx1ZSA9PT0gbnVsbCB8fCB2YWx1ZSA9PT0gdW5kZWZpbmVkKVxuICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZU5TKG5hbWVzcGFjZSwgbmFtZSk7XG4gICAgZWxzZVxuICAgICAgICBub2RlLnNldEF0dHJpYnV0ZU5TKG5hbWVzcGFjZSwgbmFtZSwgdmFsdWUpO1xufVxuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9+L3N1cnBsdXMvZXMvZG9tLmpzXG4vLyBtb2R1bGUgaWQgPSA0XG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsImltcG9ydCBTIGZyb20gJ3MtanMnO1xyXG5pbXBvcnQgeyBUb0RvLCBUb0Rvc01vZGVsLCByZXR1cm5UeXBlIH0gZnJvbSAnLi9tb2RlbHMnO1xyXG5cclxuZXhwb3J0IHR5cGUgVG9Eb3NDdHJsID0gdHlwZW9mIHRvRG9zQ3RybFR5cGU7IGNvbnN0IHRvRG9zQ3RybFR5cGUgPSByZXR1cm5UeXBlKFRvRG9zQ3RybCk7XHJcbmV4cG9ydCBmdW5jdGlvbiBUb0Rvc0N0cmwoeyB0b2RvcyB9IDogVG9Eb3NNb2RlbCkge1xyXG4gICAgY29uc3QgZWRpdGluZyA9IFMudmFsdWUobnVsbCBhcyBudWxsIHwgVG9EbyksIC8vIHRoZSB0b2RvIHNlbGVjdGVkIGZvciBlZGl0aW5nLCBvciBudWxsIGlmIG5vbmUgc2VsZWN0ZWRcclxuICAgICAgICBmaWx0ZXIgICAgPSBTLnZhbHVlKG51bGwgYXMgbnVsbCB8IGJvb2xlYW4pLCAvLyBudWxsID0gbm8gZmlsdGVyaW5nLCB0cnVlID0gb25seSBjb21wbGV0ZWQsIGZhbHNlID0gb25seSBpbmNvbXBsZXRlXHJcbiAgICAgICAgbmV3VGl0bGUgID0gUy52YWx1ZSgnJyksXHJcbiAgICAgICAgYWxsICAgICAgID0gdG9kb3MubWFwKFRvRG9DdHJsKSxcclxuICAgICAgICBjb21wbGV0ZWQgPSBhbGwuZmlsdGVyKHQgPT4gdC5jb21wbGV0ZWQoKSksXHJcbiAgICAgICAgcmVtYWluaW5nID0gYWxsLmZpbHRlcih0ID0+ICF0LmNvbXBsZXRlZCgpKSxcclxuICAgICAgICBkaXNwbGF5ZWQgPSAoKSA9PiBmaWx0ZXIoKSA9PT0gbnVsbCA/IGFsbCgpIDogZmlsdGVyKCkgPyBjb21wbGV0ZWQoKSA6IHJlbWFpbmluZygpO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgZmlsdGVyLFxyXG4gICAgICAgIG5ld1RpdGxlLFxyXG4gICAgICAgIGFsbCxcclxuICAgICAgICBjb21wbGV0ZWQsXHJcbiAgICAgICAgcmVtYWluaW5nLFxyXG4gICAgICAgIGRpc3BsYXllZCxcclxuICAgICAgICBhbGxDb21wbGV0ZWQgIDogKCkgPT4gYWxsKCkubGVuZ3RoID4gMCAmJiByZW1haW5pbmcoKS5sZW5ndGggPT09IDAsXHJcbiAgICAgICAgc2V0QWxsICAgICAgICA6IChjIDogYm9vbGVhbikgPT4gUy5mcmVlemUoKCkgPT4gdG9kb3MoKS5mb3JFYWNoKHQgPT4gdC5jb21wbGV0ZWQoYykpKSxcclxuICAgICAgICBjbGVhckNvbXBsZXRlZDogKCkgPT4gdG9kb3ModG9kb3MoKS5maWx0ZXIodCA9PiAhdC5jb21wbGV0ZWQoKSkpLFxyXG4gICAgICAgIGNyZWF0ZSAgICAgICAgOiAoKSA9PiB7XHJcbiAgICAgICAgICAgIHZhciB0aXRsZSA9IG5ld1RpdGxlKCkudHJpbSgpO1xyXG4gICAgICAgICAgICBpZiAodGl0bGUpIHtcclxuICAgICAgICAgICAgICAgIG5ld1RpdGxlKFwiXCIpO1xyXG4gICAgICAgICAgICAgICAgdG9kb3MudW5zaGlmdChUb0RvKHRpdGxlLCBmYWxzZSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICBmdW5jdGlvbiBUb0RvQ3RybCh0b2RvIDogVG9Ebykge1xyXG4gICAgICAgIGNvbnN0IHRpdGxlID0gUy52YWx1ZShTLnNhbXBsZSh0b2RvLnRpdGxlKSk7XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgdGl0bGUsXHJcbiAgICAgICAgICAgIGNvbXBsZXRlZCAgIDogdG9kby5jb21wbGV0ZWQsXHJcbiAgICAgICAgICAgIHJlbW92ZSAgICAgIDogKCkgPT4gdG9kb3MucmVtb3ZlKHRvZG8pLFxyXG4gICAgICAgICAgICBzdGFydEVkaXRpbmc6ICgpID0+IGVkaXRpbmcodG9kbyksXHJcbiAgICAgICAgICAgIGVkaXRpbmcgICAgIDogKCkgPT4gZWRpdGluZygpID09PSB0b2RvLFxyXG4gICAgICAgICAgICBlbmRFZGl0aW5nICA6IChjb21taXQgOiBib29sZWFuKSA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZiAoY29tbWl0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRyaW1tZWQgPSB0aXRsZSgpLnRyaW0oKTtcclxuICAgICAgICAgICAgICAgICAgICBpZiAodHJpbW1lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0b2RvLnRpdGxlKHRpdGxlKHRyaW1tZWQpKTtcclxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0b2Rvcy5yZW1vdmUodG9kbyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZSh0b2RvLnRpdGxlKCkpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgZWRpdGluZyhudWxsKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcbn1cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvY29udHJvbGxlcnMudHMiLCJpbXBvcnQgUyBmcm9tICdzLWpzJztcclxuaW1wb3J0IHsgVG9EbywgVG9Eb3NNb2RlbCB9IGZyb20gJy4vbW9kZWxzJztcclxuXHJcbmNvbnN0IExPQ0FMX1NUT1JBR0VfS0VZID0gJ3RvZG9zLXN1cnBsdXMnO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIExvY2FsU3RvcmFnZVBlcnNpc3RlbmNlKG1vZGVsIDogVG9Eb3NNb2RlbCkge1xyXG4gICAgLy8gbG9hZCBzdG9yZWQgdG9kb3Mgb24gaW5pdFxyXG4gICAgY29uc3Qgc3RvcmVkID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oTE9DQUxfU1RPUkFHRV9LRVkpO1xyXG4gICAgaWYgKHN0b3JlZCkgbW9kZWwudG9kb3MoSlNPTi5wYXJzZShzdG9yZWQpLnRvZG9zLm1hcCgodCA6IGFueSkgPT4gVG9Ebyh0LnRpdGxlLCB0LmNvbXBsZXRlZCkpKTtcclxuXHJcbiAgICAvLyBzdG9yZSBKU09OaXplZCB0b2RvcyB3aGVuZXZlciB0aGV5IGNoYW5nZVxyXG4gICAgUygoKSA9PiB7XHJcbiAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oTE9DQUxfU1RPUkFHRV9LRVksIEpTT04uc3RyaW5naWZ5KG1vZGVsKSk7XHJcbiAgICB9KTtcclxufVxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9wZXJzaXN0ZW5jZS50cyIsImltcG9ydCBTIGZyb20gJ3MtanMnO1xyXG5pbXBvcnQgeyBUb0Rvc0N0cmwgfSBmcm9tICcuL2NvbnRyb2xsZXJzJztcclxuXHJcbi8vIHdpdGggc3VjaCBhIHNpbXBsZSByb3V0ZXIgc2NlbmFyaW8sIG5vIG5lZWQgZm9yIGEgbGliLCBqdXN0IGhhbmQtd3JpdGUgaXRcclxuZXhwb3J0IGZ1bmN0aW9uIFRvRG9zUm91dGVyKGN0cmwgOiBUb0Rvc0N0cmwpIHtcclxuICAgIC8vIGZpbHRlcigpIC0+IGJyb3dzZXIgaGFzaFxyXG4gICAgUygoKSA9PiB7XHJcbiAgICAgICAgdmFyIGZpbHRlciA9IGN0cmwuZmlsdGVyKCksXHJcbiAgICAgICAgICAgIGhhc2ggICA9IGZpbHRlciA9PT0gdHJ1ZSAgPyBcIi9jb21wbGV0ZWRcIiA6XHJcbiAgICAgICAgICAgICAgICAgICAgIGZpbHRlciA9PT0gZmFsc2UgPyBcIi9hY3RpdmVcIiAgICA6XHJcbiAgICAgICAgICAgICAgICAgICAgIFwiL1wiO1xyXG5cclxuICAgICAgICBpZiAod2luZG93LmxvY2F0aW9uLmhhc2ggIT09IGhhc2gpIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gaGFzaDtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIGJyb3dzZXIgaGFzaCAtPiBmaWx0ZXIoKVxyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2hhc2hjaGFuZ2UnLCBzZXRTdGF0ZUZyb21IYXNoLCBmYWxzZSk7XHJcbiAgICBTLmNsZWFudXAoZnVuY3Rpb24gKCkgeyB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcignaGFzaGNoYW5nZScsIHNldFN0YXRlRnJvbUhhc2gpOyB9KTtcclxuICAgIGZ1bmN0aW9uIHNldFN0YXRlRnJvbUhhc2goKSB7XHJcbiAgICAgICAgdmFyIGhhc2ggICA9IHdpbmRvdy5sb2NhdGlvbi5oYXNoLFxyXG4gICAgICAgICAgICBmaWx0ZXIgPSBoYXNoID09PSBcIiMvY29tcGxldGVkXCIgPyB0cnVlICA6XHJcbiAgICAgICAgICAgICAgICAgICAgIGhhc2ggPT09IFwiIy9hY3RpdmVcIiAgICA/IGZhbHNlIDpcclxuICAgICAgICAgICAgICAgICAgICAgbnVsbDtcclxuXHJcbiAgICAgICAgaWYgKGN0cmwuZmlsdGVyKCkgIT09IGZpbHRlcikgY3RybC5maWx0ZXIoZmlsdGVyKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBpbml0IGZyb20gYnJvd3NlciBoYXNoXHJcbiAgICBTLnNhbXBsZShzZXRTdGF0ZUZyb21IYXNoKTtcclxufVxyXG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvcm91dGVyLnRzIiwiaW1wb3J0ICogYXMgU3VycGx1cyBmcm9tICdzdXJwbHVzJzsgU3VycGx1cztcclxuaW1wb3J0IHsgbWFwU2FtcGxlIH0gZnJvbSAncy1hcnJheSc7XHJcbmltcG9ydCAqIGFzIGN4IGZyb20gJ2NsYXNzbmFtZXMnO1xyXG5pbXBvcnQgZGF0YSBmcm9tICdzdXJwbHVzLW1peGluLWRhdGEnO1xyXG5pbXBvcnQgb25rZXkgZnJvbSAnc3VycGx1cy1taXhpbi1vbmtleSc7XHJcbmltcG9ydCBmb2N1cyBmcm9tICdzdXJwbHVzLW1peGluLWZvY3VzJztcclxuXHJcbmltcG9ydCB7IFRvRG9zQ3RybCB9IGZyb20gJy4vY29udHJvbGxlcnMnO1xyXG5cclxuZXhwb3J0IGNvbnN0IEFwcFZpZXcgPSAoY3RybCA6IFRvRG9zQ3RybCkgPT5cclxuICAgIDxzZWN0aW9uPlxyXG4gICAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cInRvZG9hcHBcIj5cclxuICAgICAgICAgICAgPGhlYWRlciBjbGFzc05hbWU9XCJoZWFkZXJcIj5cclxuICAgICAgICAgICAgICAgIDxoMT50b2RvczwvaDE+XHJcbiAgICAgICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPVwibmV3LXRvZG9cIiBwbGFjZWhvbGRlcj1cIldoYXQgbmVlZHMgdG8gYmUgZG9uZT9cIiBhdXRvRm9jdXM9e3RydWV9IFxyXG4gICAgICAgICAgICAgICAgICAgIGZuMT17ZGF0YShjdHJsLm5ld1RpdGxlLCAna2V5ZG93bicpfSBcclxuICAgICAgICAgICAgICAgICAgICBmbjI9e29ua2V5KCdlbnRlcicsIGN0cmwuY3JlYXRlKX1cclxuXHRcdFx0XHRcdGZuMz17b25rZXkoJ2VzYycsICgpID0+IGN0cmwubmV3VGl0bGUoJycpKX0gLz5cclxuICAgICAgICAgICAgPC9oZWFkZXI+XHJcbiAgICAgICAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cIm1haW5cIiBoaWRkZW49e2N0cmwuYWxsKCkubGVuZ3RoID09PSAwfT5cclxuICAgICAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9XCJ0b2dnbGUtYWxsXCIgdHlwZT1cImNoZWNrYm94XCIgXHJcbiAgICAgICAgICAgICAgICAgICAgY2hlY2tlZD17Y3RybC5hbGxDb21wbGV0ZWQoKX0gLz5cclxuICAgICAgICAgICAgICAgIDxsYWJlbCBodG1sRm9yPVwidG9nZ2xlLWFsbFwiIG9uQ2xpY2s9eygpID0+IGN0cmwuc2V0QWxsKCFjdHJsLmFsbENvbXBsZXRlZCgpKX0+TWFyayBhbGwgYXMgY29tcGxldGU8L2xhYmVsPlxyXG4gICAgICAgICAgICAgICAgPHVsIGNsYXNzTmFtZT1cInRvZG8tbGlzdFwiPlxyXG4gICAgICAgICAgICAgICAgICAgIHttYXBTYW1wbGUoY3RybC5kaXNwbGF5ZWQsIHRvZG8gPT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPGxpIGNsYXNzTmFtZT17Y3goeyBjb21wbGV0ZWQ6IHRvZG8uY29tcGxldGVkKCksIGVkaXRpbmc6IHRvZG8uZWRpdGluZygpIH0pfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidmlld1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dCBjbGFzc05hbWU9XCJ0b2dnbGVcIiB0eXBlPVwiY2hlY2tib3hcIiBmbj17ZGF0YSh0b2RvLmNvbXBsZXRlZCl9IC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGxhYmVsIG9uRG91YmxlQ2xpY2s9e3RvZG8uc3RhcnRFZGl0aW5nfT57dG9kby50aXRsZSgpfTwvbGFiZWw+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJkZXN0cm95XCIgb25DbGljaz17dG9kby5yZW1vdmV9PjwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA8aW5wdXQgY2xhc3NOYW1lPVwiZWRpdFwiIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZuMT17ZGF0YSh0b2RvLnRpdGxlLCAna2V5dXAnKX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbkJsdXI9eygpID0+IHRvZG8uZW5kRWRpdGluZyh0cnVlKX1cclxuXHRcdFx0XHRcdFx0XHQgICAgZm4yPXtvbmtleSgnZW50ZXInLCAoKSA9PiB0b2RvLmVuZEVkaXRpbmcodHJ1ZSkpfVxyXG5cdFx0XHRcdFx0XHRcdCAgICBmbjM9e29ua2V5KCdlc2MnLCAoKSA9PiB0b2RvLmVuZEVkaXRpbmcoZmFsc2UpKX1cclxuXHRcdFx0XHRcdFx0XHQgICAgZm40PXtmb2N1cyh0b2RvLmVkaXRpbmcoKSl9IC8+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvbGk+XHJcbiAgICAgICAgICAgICAgICAgICAgKX1cclxuICAgICAgICAgICAgICAgIDwvdWw+XHJcbiAgICAgICAgICAgIDwvc2VjdGlvbj5cclxuICAgICAgICAgICAgPGZvb3RlciBjbGFzc05hbWU9XCJmb290ZXJcIiBoaWRkZW49e2N0cmwuYWxsKCkubGVuZ3RoID09PSAwfT5cclxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRvZG8tY291bnRcIj48c3Ryb25nPntjdHJsLnJlbWFpbmluZygpLmxlbmd0aH08L3N0cm9uZz4gaXRlbXtjdHJsLnJlbWFpbmluZygpLmxlbmd0aCA9PT0gMSA/ICcnIDogJ3MnfSBsZWZ0PC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgPHVsIGNsYXNzTmFtZT1cImZpbHRlcnNcIj5cclxuICAgICAgICAgICAgICAgICAgICA8bGk+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT17Y3goeyBzZWxlY3RlZDogY3RybC5maWx0ZXIoKSA9PT0gbnVsbCB9KX0gaHJlZj1cIiMvXCI+QWxsPC9hPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvbGk+XHJcbiAgICAgICAgICAgICAgICAgICAgPGxpPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8YSBjbGFzc05hbWU9e2N4KHsgc2VsZWN0ZWQ6IGN0cmwuZmlsdGVyKCkgPT09IGZhbHNlIH0pfSBocmVmPVwiIy9hY3RpdmVcIj5BY3RpdmU8L2E+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9saT5cclxuICAgICAgICAgICAgICAgICAgICA8bGk+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxhIGNsYXNzTmFtZT17Y3goeyBzZWxlY3RlZDogY3RybC5maWx0ZXIoKSA9PT0gdHJ1ZSB9KX0gaHJlZj1cIiMvY29tcGxldGVkXCI+Q29tcGxldGVkPC9hPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvbGk+XHJcbiAgICAgICAgICAgICAgICA8L3VsPlxyXG4gICAgICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9XCJjbGVhci1jb21wbGV0ZWRcIiBvbkNsaWNrPXtjdHJsLmNsZWFyQ29tcGxldGVkfSBoaWRkZW49e2N0cmwuY29tcGxldGVkKCkubGVuZ3RoID09PSAwfT5DbGVhciBjb21wbGV0ZWQ8L2J1dHRvbj5cclxuICAgICAgICAgICAgPC9mb290ZXI+XHJcbiAgICAgICAgPC9zZWN0aW9uPlxyXG4gICAgICAgIDxmb290ZXIgY2xhc3NOYW1lPVwiaW5mb1wiPlxyXG4gICAgICAgICAgICA8cD5Eb3VibGUtY2xpY2sgdG8gZWRpdCBhIHRvZG88L3A+XHJcbiAgICAgICAgICAgIDxwPlRlbXBsYXRlIGJ5IDxhIGhyZWY9XCJodHRwOi8vc2luZHJlc29yaHVzLmNvbVwiPlNpbmRyZSBTb3JodXM8L2E+PC9wPlxyXG4gICAgICAgICAgICA8cD5DcmVhdGVkIGJ5IDxhIGhyZWY9XCJodHRwczovL2dpdGh1Yi5jb20vYWRhbWhhaWxlXCI+QWRhbSBIYWlsZTwvYT48L3A+XHJcbiAgICAgICAgICAgIDxwPlBhcnQgb2YgPGEgaHJlZj1cImh0dHA6Ly90b2RvbXZjLmNvbVwiPlRvZG9NVkM8L2E+PC9wPlxyXG4gICAgICAgIDwvZm9vdGVyPlxyXG4gICAgPC9zZWN0aW9uPjtcclxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL3ZpZXdzLnRzeCIsIi8qIVxuICBDb3B5cmlnaHQgKGMpIDIwMTYgSmVkIFdhdHNvbi5cbiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlIChNSVQpLCBzZWVcbiAgaHR0cDovL2plZHdhdHNvbi5naXRodWIuaW8vY2xhc3NuYW1lc1xuKi9cbi8qIGdsb2JhbCBkZWZpbmUgKi9cblxuKGZ1bmN0aW9uICgpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBoYXNPd24gPSB7fS5oYXNPd25Qcm9wZXJ0eTtcblxuXHRmdW5jdGlvbiBjbGFzc05hbWVzICgpIHtcblx0XHR2YXIgY2xhc3NlcyA9IFtdO1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBhcmcgPSBhcmd1bWVudHNbaV07XG5cdFx0XHRpZiAoIWFyZykgY29udGludWU7XG5cblx0XHRcdHZhciBhcmdUeXBlID0gdHlwZW9mIGFyZztcblxuXHRcdFx0aWYgKGFyZ1R5cGUgPT09ICdzdHJpbmcnIHx8IGFyZ1R5cGUgPT09ICdudW1iZXInKSB7XG5cdFx0XHRcdGNsYXNzZXMucHVzaChhcmcpO1xuXHRcdFx0fSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGFyZykpIHtcblx0XHRcdFx0Y2xhc3Nlcy5wdXNoKGNsYXNzTmFtZXMuYXBwbHkobnVsbCwgYXJnKSk7XG5cdFx0XHR9IGVsc2UgaWYgKGFyZ1R5cGUgPT09ICdvYmplY3QnKSB7XG5cdFx0XHRcdGZvciAodmFyIGtleSBpbiBhcmcpIHtcblx0XHRcdFx0XHRpZiAoaGFzT3duLmNhbGwoYXJnLCBrZXkpICYmIGFyZ1trZXldKSB7XG5cdFx0XHRcdFx0XHRjbGFzc2VzLnB1c2goa2V5KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gY2xhc3Nlcy5qb2luKCcgJyk7XG5cdH1cblxuXHRpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGNsYXNzTmFtZXM7XG5cdH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgZGVmaW5lLmFtZCA9PT0gJ29iamVjdCcgJiYgZGVmaW5lLmFtZCkge1xuXHRcdC8vIHJlZ2lzdGVyIGFzICdjbGFzc25hbWVzJywgY29uc2lzdGVudCB3aXRoIG5wbSBwYWNrYWdlIG5hbWVcblx0XHRkZWZpbmUoJ2NsYXNzbmFtZXMnLCBbXSwgZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIGNsYXNzTmFtZXM7XG5cdFx0fSk7XG5cdH0gZWxzZSB7XG5cdFx0d2luZG93LmNsYXNzTmFtZXMgPSBjbGFzc05hbWVzO1xuXHR9XG59KCkpO1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9+L2NsYXNzbmFtZXMvaW5kZXguanNcbi8vIG1vZHVsZSBpZCA9IDlcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwiaW1wb3J0IFMgZnJvbSAncy1qcyc7XHJcblxyXG5pbXBvcnQgeyBUb0Rvc01vZGVsfSBmcm9tICcuL21vZGVscyc7XHJcbmltcG9ydCB7IFRvRG9zQ3RybCB9IGZyb20gJy4vY29udHJvbGxlcnMnO1xyXG5pbXBvcnQgeyBUb0Rvc1JvdXRlciB9IGZyb20gJy4vcm91dGVyJztcclxuaW1wb3J0IHsgTG9jYWxTdG9yYWdlUGVyc2lzdGVuY2UgfSBmcm9tICcuL3BlcnNpc3RlbmNlJztcclxuaW1wb3J0IHsgQXBwVmlldyB9IGZyb20gJy4vdmlld3MnO1xyXG5cclxuUy5yb290KCgpID0+IHtcclxuICAgIGNvbnN0IG1vZGVsID0gVG9Eb3NNb2RlbChbXSksXHJcbiAgICAgICAgY3RybCA9IFRvRG9zQ3RybChtb2RlbCksXHJcbiAgICAgICAgcm91dGVyID0gVG9Eb3NSb3V0ZXIoY3RybCksXHJcbiAgICAgICAgc3RvcmFnZSA9IExvY2FsU3RvcmFnZVBlcnNpc3RlbmNlKG1vZGVsKSxcclxuICAgICAgICB2aWV3ID0gQXBwVmlldyhjdHJsKTtcclxuXHJcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHZpZXcpO1xyXG59KTtcblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvbWFpbi50cyIsImltcG9ydCB7IFMgfSBmcm9tICdzdXJwbHVzJztcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGRhdGEoc2lnbmFsLCBhcmcxLCBhcmcyKSB7XG4gICAgdmFyIGV2ZW50ID0gYXJnMSB8fCAnaW5wdXQnLCBvbiA9IGFyZzEgPT09IHVuZGVmaW5lZCA/IHRydWUgOiBhcmcxLCBvZmYgPSBhcmcyID09PSB1bmRlZmluZWQgPyAob24gPT09IHRydWUgPyBmYWxzZSA6IG51bGwpIDogYXJnMjtcbiAgICByZXR1cm4gZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgaWYgKG5vZGUgaW5zdGFuY2VvZiBIVE1MSW5wdXRFbGVtZW50KSB7XG4gICAgICAgICAgICB2YXIgdHlwZSA9IG5vZGUudHlwZS50b1VwcGVyQ2FzZSgpO1xuICAgICAgICAgICAgaWYgKHR5cGUgPT09ICdDSEVDS0JPWCcpIHtcbiAgICAgICAgICAgICAgICBjaGVja2JveERhdGEobm9kZSwgc2lnbmFsLCBvbiwgb2ZmKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHR5cGUgPT09ICdSQURJTycpIHtcbiAgICAgICAgICAgICAgICByYWRpb0RhdGEobm9kZSwgc2lnbmFsLCBvbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YWx1ZURhdGEobm9kZSwgc2lnbmFsLCBldmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobm9kZSBpbnN0YW5jZW9mIEhUTUxTZWxlY3RFbGVtZW50IHx8IG5vZGUgaW5zdGFuY2VvZiBIVE1MVGV4dEFyZWFFbGVtZW50KSB7XG4gICAgICAgICAgICB2YWx1ZURhdGEobm9kZSwgc2lnbmFsLCBldmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobm9kZS5pc0NvbnRlbnRFZGl0YWJsZSkge1xuICAgICAgICAgICAgdGV4dENvbnRlbnREYXRhKG5vZGUsIHNpZ25hbCwgZXZlbnQpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQGRhdGEgY2FuIG9ubHkgYmUgYXBwbGllZCB0byBhIGZvcm0gY29udHJvbCBlbGVtZW50LCBcXG5cIlxuICAgICAgICAgICAgICAgICsgXCJzdWNoIGFzIDxpbnB1dC8+LCA8dGV4dGFyZWEvPiBvciA8c2VsZWN0Lz4sIG9yIHRvIGFuIGVsZW1lbnQgd2l0aCBcIlxuICAgICAgICAgICAgICAgICsgXCInY29udGVudEVkaXRhYmxlJyBzZXQuICBFbGVtZW50IGBgXCIgKyBub2RlLm5vZGVOYW1lICsgXCInJyBpcyBcXG5cIlxuICAgICAgICAgICAgICAgICsgXCJub3Qgc3VjaCBhbiBlbGVtZW50LiAgUGVyaGFwcyB5b3UgYXBwbGllZCBpdCB0byB0aGUgd3Jvbmcgbm9kZT9cIik7XG4gICAgICAgIH1cbiAgICB9O1xufVxuZnVuY3Rpb24gdmFsdWVEYXRhKG5vZGUsIHNpZ25hbCwgZXZlbnQpIHtcbiAgICBTKGZ1bmN0aW9uIHVwZGF0ZVZhbHVlKCkge1xuICAgICAgICBub2RlLnZhbHVlID0gdG9TdHJpbmcoc2lnbmFsKCkpO1xuICAgIH0pO1xuICAgIG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihldmVudCwgdmFsdWVMaXN0ZW5lciwgZmFsc2UpO1xuICAgIFMuY2xlYW51cChmdW5jdGlvbiAoKSB7IG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudCwgdmFsdWVMaXN0ZW5lcik7IH0pO1xuICAgIGZ1bmN0aW9uIHZhbHVlTGlzdGVuZXIoKSB7XG4gICAgICAgIHZhciBjdXIgPSB0b1N0cmluZyhTLnNhbXBsZShzaWduYWwpKSwgdXBkYXRlID0gbm9kZS52YWx1ZTtcbiAgICAgICAgaWYgKGN1ciAhPT0gdXBkYXRlKVxuICAgICAgICAgICAgc2lnbmFsKHVwZGF0ZSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGNoZWNrYm94RGF0YShub2RlLCBzaWduYWwsIG9uLCBvZmYpIHtcbiAgICBTKGZ1bmN0aW9uIHVwZGF0ZUNoZWNrYm94KCkge1xuICAgICAgICBub2RlLmNoZWNrZWQgPSBzaWduYWwoKSA9PT0gb247XG4gICAgfSk7XG4gICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIGNoZWNrYm94TGlzdGVuZXIsIGZhbHNlKTtcbiAgICBTLmNsZWFudXAoZnVuY3Rpb24gKCkgeyBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgY2hlY2tib3hMaXN0ZW5lcik7IH0pO1xuICAgIGZ1bmN0aW9uIGNoZWNrYm94TGlzdGVuZXIoKSB7XG4gICAgICAgIHNpZ25hbChub2RlLmNoZWNrZWQgPyBvbiA6IG9mZik7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHJhZGlvRGF0YShub2RlLCBzaWduYWwsIG9uKSB7XG4gICAgUyhmdW5jdGlvbiB1cGRhdGVSYWRpbygpIHtcbiAgICAgICAgbm9kZS5jaGVja2VkID0gKHNpZ25hbCgpID09PSBvbik7XG4gICAgfSk7XG4gICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIHJhZGlvTGlzdGVuZXIsIGZhbHNlKTtcbiAgICBTLmNsZWFudXAoZnVuY3Rpb24gKCkgeyBub2RlLnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgcmFkaW9MaXN0ZW5lcik7IH0pO1xuICAgIGZ1bmN0aW9uIHJhZGlvTGlzdGVuZXIoKSB7XG4gICAgICAgIGlmIChub2RlLmNoZWNrZWQpXG4gICAgICAgICAgICBzaWduYWwob24pO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG59XG5mdW5jdGlvbiB0ZXh0Q29udGVudERhdGEobm9kZSwgc2lnbmFsLCBldmVudCkge1xuICAgIFMoZnVuY3Rpb24gdXBkYXRlVGV4dENvbnRlbnQoKSB7XG4gICAgICAgIG5vZGUudGV4dENvbnRlbnQgPSB0b1N0cmluZyhzaWduYWwoKSk7XG4gICAgfSk7XG4gICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKGV2ZW50LCB0ZXh0Q29udGVudExpc3RlbmVyLCBmYWxzZSk7XG4gICAgUy5jbGVhbnVwKGZ1bmN0aW9uICgpIHsgbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LCB0ZXh0Q29udGVudExpc3RlbmVyKTsgfSk7XG4gICAgZnVuY3Rpb24gdGV4dENvbnRlbnRMaXN0ZW5lcigpIHtcbiAgICAgICAgdmFyIGN1ciA9IHRvU3RyaW5nKFMuc2FtcGxlKHNpZ25hbCkpLCB1cGRhdGUgPSBub2RlLnRleHRDb250ZW50O1xuICAgICAgICBpZiAoY3VyICE9PSB1cGRhdGUpXG4gICAgICAgICAgICBzaWduYWwodXBkYXRlKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxufVxuZnVuY3Rpb24gdG9TdHJpbmcodikge1xuICAgIHJldHVybiB2ID09IG51bGwgPyAnJyA6IHYudG9TdHJpbmcoKTtcbn1cblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vfi9zdXJwbHVzLW1peGluLWRhdGEvaW5kZXguZXMuanNcbi8vIG1vZHVsZSBpZCA9IDExXG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsIi8qKlxyXG4gKiBJbiBzdXJwbHVzLCBkaXJlY3RpdmVzIHJ1biB3aGVuIGEgbm9kZSBpcyBjcmVhdGVkLCBtZWFuaW5nIGJlZm9yZSBpdCBoYXMgdXN1YWxseVxyXG4gKiBiZWVuIGluc2VydGVkIGludG8gdGhlIGRvY3VtZW50LiAgVGhpcyBjYXVzZXMgYSBwcm9ibGVtIGZvciB0aGUgQGZvY3VzIGRpcmVjdGl2ZSwgYXMgb25seVxyXG4gKiBlbGVtZW50cyB0aGF0IGFyZSBpbiB0aGUgZG9jdW1lbnQgKGFuZCB2aXNpYmxlKSBhcmUgZm9jdXNhYmxlLiAgQXMgYSBoYWNrLCB3ZSBkZWxheVxyXG4gKiB0aGUgZm9jdXMgZXZlbnQgdW50aWwgdGhlIG5leHQgYW5pbWF0aW9uIGZyYW1lLCB0aGVyZWJ5IGdpdmluZyBodG1sbGl0ZXJhbHMgYSBjaGFuY2VcclxuICogdG8gZ2V0IHRoZSBub2RlIGludG8gdGhlIGRvY3VtZW50LiAgSWYgaXQgaXNuJ3QgaW4gYnkgdGhlbiAob3IgaWYgdGhlIHVzZXIgdHJpZWQgdG8gZm9jdXNcclxuICogYSBoaWRkZW4gbm9kZSkgdGhlbiB3ZSBnaXZlIHVwLlxyXG4gKi9cclxudmFyIG5vZGVUb0ZvY3VzID0gbnVsbCwgc3RhcnRQb3MgPSBOYU4sIGVuZFBvcyA9IE5hTiwgc2NoZWR1bGVkID0gZmFsc2U7XHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGZvY3VzKGZsYWcsIHN0YXJ0LCBlbmQpIHtcclxuICAgIHZhciBfc3RhcnQgPSBhcmd1bWVudHMubGVuZ3RoID4gMSA/IHN0YXJ0IDogTmFOLCBfZW5kID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgPyBlbmQgOiBfc3RhcnQsIGxlbmd0aDtcclxuICAgIHJldHVybiBmdW5jdGlvbiBmb2N1cyhub2RlKSB7XHJcbiAgICAgICAgaWYgKCFub2RlLmZvY3VzKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkBmb2N1cyBjYW4gb25seSBiZSBhcHBsaWVkIHRvIGFuIGVsZW1lbnQgdGhhdCBoYXMgYSAuZm9jdXMoKSBtZXRob2QsIGxpa2UgPGlucHV0PiwgPHNlbGVjdD4sIDx0ZXh0YXJlYT4sIGV0Yy5cIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmIChmbGFnKSB7XHJcbiAgICAgICAgICAgIGxlbmd0aCA9IG5vZGUudGV4dENvbnRlbnQgPyBub2RlLnRleHRDb250ZW50Lmxlbmd0aCA6IDA7XHJcbiAgICAgICAgICAgIG5vZGVUb0ZvY3VzID0gbm9kZTtcclxuICAgICAgICAgICAgc3RhcnRQb3MgPSBfc3RhcnQgPCAwID8gTWF0aC5tYXgoMCwgbGVuZ3RoICsgX3N0YXJ0KSA6IE1hdGgubWluKGxlbmd0aCwgX3N0YXJ0KTtcclxuICAgICAgICAgICAgZW5kUG9zID0gX2VuZCA8IDAgPyBNYXRoLm1heChzdGFydFBvcywgbGVuZ3RoICsgX2VuZCkgOiBNYXRoLm1pbihsZW5ndGgsIF9lbmQpO1xyXG4gICAgICAgICAgICBpZiAoIXNjaGVkdWxlZCkge1xyXG4gICAgICAgICAgICAgICAgc2NoZWR1bGVkID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZm9jdXNlcik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIG5vZGUuYmx1cigpO1xyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn1cclxuO1xyXG5mdW5jdGlvbiBmb2N1c2VyKCkge1xyXG4gICAgc2NoZWR1bGVkID0gZmFsc2U7XHJcbiAgICBpZiAobm9kZVRvRm9jdXMgPT09IG51bGwpXHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgdmFyIHRyYW5nZSwgcmFuZ2UsIHNlbDtcclxuICAgIG5vZGVUb0ZvY3VzLmZvY3VzKCk7XHJcbiAgICBpZiAoIWlzTmFOKHN0YXJ0UG9zKSkge1xyXG4gICAgICAgIGlmIChoYXNTZXRTZWxlY3Rpb25SYW5nZShub2RlVG9Gb2N1cykpIHtcclxuICAgICAgICAgICAgbm9kZVRvRm9jdXMuc2V0U2VsZWN0aW9uUmFuZ2Uoc3RhcnRQb3MsIGVuZFBvcyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2UgaWYgKGhhc0NyZWF0ZVRleHRSbmFnZShub2RlVG9Gb2N1cykpIHtcclxuICAgICAgICAgICAgdHJhbmdlID0gbm9kZVRvRm9jdXMuY3JlYXRlVGV4dFJhbmdlKCk7XHJcbiAgICAgICAgICAgIHRyYW5nZS5tb3ZlRW5kKCdjaGFyYWN0ZXInLCBlbmRQb3MpO1xyXG4gICAgICAgICAgICB0cmFuZ2UubW92ZVN0YXJ0KCdjaGFyYWN0ZXInLCBzdGFydFBvcyk7XHJcbiAgICAgICAgICAgIHRyYW5nZS5zZWxlY3QoKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZiAobm9kZVRvRm9jdXMuaXNDb250ZW50RWRpdGFibGUgJiYgbm9kZVRvRm9jdXMuY2hpbGROb2Rlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHJhbmdlID0gZG9jdW1lbnQuY3JlYXRlUmFuZ2UoKTtcclxuICAgICAgICAgICAgcmFuZ2Uuc2V0U3RhcnQobm9kZVRvRm9jdXMuY2hpbGROb2Rlc1swXSwgc3RhcnRQb3MpO1xyXG4gICAgICAgICAgICByYW5nZS5zZXRFbmQobm9kZVRvRm9jdXMuY2hpbGROb2Rlc1swXSwgZW5kUG9zKTtcclxuICAgICAgICAgICAgc2VsID0gd2luZG93LmdldFNlbGVjdGlvbigpO1xyXG4gICAgICAgICAgICBzZWwucmVtb3ZlQWxsUmFuZ2VzKCk7XHJcbiAgICAgICAgICAgIHNlbC5hZGRSYW5nZShyYW5nZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcbmZ1bmN0aW9uIGhhc1NldFNlbGVjdGlvblJhbmdlKG5vZGUpIHtcclxuICAgIHJldHVybiAhIW5vZGUuc2V0U2VsZWN0aW9uUmFuZ2U7XHJcbn1cclxuZnVuY3Rpb24gaGFzQ3JlYXRlVGV4dFJuYWdlKG5vZGUpIHtcclxuICAgIHJldHVybiAhIW5vZGUuY3JlYXRlVGV4dFJhbmdlO1xyXG59XHJcblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vfi9zdXJwbHVzLW1peGluLWZvY3VzL2luZGV4LmVzLmpzXG4vLyBtb2R1bGUgaWQgPSAxMlxuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCJpbXBvcnQgeyBTIH0gZnJvbSAnc3VycGx1cyc7XG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBvbmtleShrZXksIGFyZzEsIGFyZzIpIHtcbiAgICB2YXIgZXZlbnQgPSBhcmd1bWVudHMubGVuZ3RoIDwgMyA/ICdrZXlkb3duJyA6ICdrZXknICsgYXJnMSwgZm4gPSBhcmd1bWVudHMubGVuZ3RoIDwgMyA/IGFyZzEgOiBhcmcyO1xuICAgIHZhciBwYXJ0cyA9IGtleS50b0xvd2VyQ2FzZSgpLnNwbGl0KCctJywgMiksIGtleUNvZGUgPSBrZXlDb2Rlc1twYXJ0c1twYXJ0cy5sZW5ndGggLSAxXV0sIG1vZCA9IHBhcnRzLmxlbmd0aCA+IDEgPyBwYXJ0c1swXSArIFwiS2V5XCIgOiBudWxsO1xuICAgIGlmIChrZXlDb2RlID09PSB1bmRlZmluZWQpXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkBvbmtleTogdW5yZWNvZ25pemVkIGtleSBpZGVudGlmaWVyICdcIiArIGtleSArIFwiJ1wiKTtcbiAgICBpZiAodHlwZW9mIGZuICE9PSAnZnVuY3Rpb24nKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJAb25rZXk6IG11c3Qgc3VwcGx5IGEgZnVuY3Rpb24gdG8gY2FsbCB3aGVuIHRoZSBrZXkgaXMgZW50ZXJlZFwiKTtcbiAgICByZXR1cm4gZnVuY3Rpb24gb25rZXkobm9kZSkge1xuICAgICAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnQsIG9ua2V5TGlzdGVuZXIsIGZhbHNlKTtcbiAgICAgICAgUy5jbGVhbnVwKGZ1bmN0aW9uICgpIHsgbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50LCBvbmtleUxpc3RlbmVyKTsgfSk7XG4gICAgfTtcbiAgICBmdW5jdGlvbiBvbmtleUxpc3RlbmVyKGUpIHtcbiAgICAgICAgaWYgKGUua2V5Q29kZSA9PT0ga2V5Q29kZSAmJiAoIW1vZCB8fCBlW21vZF0pKVxuICAgICAgICAgICAgZm4oZSk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbn1cbjtcbnZhciBrZXlDb2RlcyA9IHtcbiAgICBiYWNrc3BhY2U6IDgsXG4gICAgdGFiOiA5LFxuICAgIGVudGVyOiAxMyxcbiAgICBzaGlmdDogMTYsXG4gICAgY3RybDogMTcsXG4gICAgYWx0OiAxOCxcbiAgICBwYXVzZTogMTksXG4gICAgYnJlYWs6IDE5LFxuICAgIGNhcHNsb2NrOiAyMCxcbiAgICBlc2M6IDI3LFxuICAgIGVzY2FwZTogMjcsXG4gICAgc3BhY2U6IDMyLFxuICAgIHBhZ2V1cDogMzMsXG4gICAgcGFnZWRvd246IDM0LFxuICAgIGVuZDogMzUsXG4gICAgaG9tZTogMzYsXG4gICAgbGVmdGFycm93OiAzNyxcbiAgICB1cGFycm93OiAzOCxcbiAgICByaWdodGFycm93OiAzOSxcbiAgICBkb3duYXJyb3c6IDQwLFxuICAgIHBybnRzY3JuOiA0NCxcbiAgICBpbnNlcnQ6IDQ1LFxuICAgIGRlbGV0ZTogNDYsXG4gICAgXCIwXCI6IDQ4LFxuICAgIFwiMVwiOiA0OSxcbiAgICBcIjJcIjogNTAsXG4gICAgXCIzXCI6IDUxLFxuICAgIFwiNFwiOiA1MixcbiAgICBcIjVcIjogNTMsXG4gICAgXCI2XCI6IDU0LFxuICAgIFwiN1wiOiA1NSxcbiAgICBcIjhcIjogNTYsXG4gICAgXCI5XCI6IDU3LFxuICAgIGE6IDY1LFxuICAgIGI6IDY2LFxuICAgIGM6IDY3LFxuICAgIGQ6IDY4LFxuICAgIGU6IDY5LFxuICAgIGY6IDcwLFxuICAgIGc6IDcxLFxuICAgIGg6IDcyLFxuICAgIGk6IDczLFxuICAgIGo6IDc0LFxuICAgIGs6IDc1LFxuICAgIGw6IDc2LFxuICAgIG06IDc3LFxuICAgIG46IDc4LFxuICAgIG86IDc5LFxuICAgIHA6IDgwLFxuICAgIHE6IDgxLFxuICAgIHI6IDgyLFxuICAgIHM6IDgzLFxuICAgIHQ6IDg0LFxuICAgIHU6IDg1LFxuICAgIHY6IDg2LFxuICAgIHc6IDg3LFxuICAgIHg6IDg4LFxuICAgIHk6IDg5LFxuICAgIHo6IDkwLFxuICAgIHdpbmtleTogOTEsXG4gICAgd2lubWVudTogOTMsXG4gICAgZjE6IDExMixcbiAgICBmMjogMTEzLFxuICAgIGYzOiAxMTQsXG4gICAgZjQ6IDExNSxcbiAgICBmNTogMTE2LFxuICAgIGY2OiAxMTcsXG4gICAgZjc6IDExOCxcbiAgICBmODogMTE5LFxuICAgIGY5OiAxMjAsXG4gICAgZjEwOiAxMjEsXG4gICAgZjExOiAxMjIsXG4gICAgZjEyOiAxMjMsXG4gICAgbnVtbG9jazogMTQ0LFxuICAgIHNjcm9sbGxvY2s6IDE0NSxcbiAgICBcIixcIjogMTg4LFxuICAgIFwiPFwiOiAxODgsXG4gICAgXCIuXCI6IDE5MCxcbiAgICBcIj5cIjogMTkwLFxuICAgIFwiL1wiOiAxOTEsXG4gICAgXCI/XCI6IDE5MSxcbiAgICBcImBcIjogMTkyLFxuICAgIFwiflwiOiAxOTIsXG4gICAgXCJbXCI6IDIxOSxcbiAgICBcIntcIjogMjE5LFxuICAgIFwiXFxcXFwiOiAyMjAsXG4gICAgXCJ8XCI6IDIyMCxcbiAgICBcIl1cIjogMjIxLFxuICAgIFwifVwiOiAyMjEsXG4gICAgXCInXCI6IDIyMixcbiAgICBcIlxcXCJcIjogMjIyXG59O1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9+L3N1cnBsdXMtbWl4aW4tb25rZXkvaW5kZXguZXMuanNcbi8vIG1vZHVsZSBpZCA9IDEzXG4vLyBtb2R1bGUgY2h1bmtzID0gMCIsImltcG9ydCB7IFMgfSBmcm9tICcuL2luZGV4JztcbmV4cG9ydCBmdW5jdGlvbiBjb250ZW50KHBhcmVudCwgdmFsdWUsIGN1cnJlbnQpIHtcbiAgICB2YXIgdCA9IHR5cGVvZiB2YWx1ZTtcbiAgICBpZiAoY3VycmVudCA9PT0gdmFsdWUpIHtcbiAgICAgICAgLy8gbm90aGluZyB0byBkb1xuICAgIH1cbiAgICBlbHNlIGlmICh0ID09PSAnc3RyaW5nJykge1xuICAgICAgICAvLyBpZiBhIFRleHQgbm9kZSBhbHJlYWR5IGV4aXN0cywgaXQncyBmYXN0ZXIgdG8gc2V0IGl0cyAuZGF0YSB0aGFuIHNldCB0aGUgcGFyZW50LnRleHRDb250ZW50XG4gICAgICAgIGlmIChjdXJyZW50ICE9PSBcIlwiICYmIHR5cGVvZiBjdXJyZW50ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgY3VycmVudCA9IHBhcmVudC5maXJzdENoaWxkLmRhdGEgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGN1cnJlbnQgPSBwYXJlbnQudGV4dENvbnRlbnQgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmICh0ID09PSAnbnVtYmVyJykge1xuICAgICAgICB2YWx1ZSA9IHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgICAgIGlmIChjdXJyZW50ICE9PSBcIlwiICYmIHR5cGVvZiBjdXJyZW50ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgY3VycmVudCA9IHBhcmVudC5maXJzdENoaWxkLmRhdGEgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGN1cnJlbnQgPSBwYXJlbnQudGV4dENvbnRlbnQgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmICh2YWx1ZSA9PSBudWxsIHx8IHQgPT09ICdib29sZWFuJykge1xuICAgICAgICBjbGVhcihwYXJlbnQpO1xuICAgICAgICBjdXJyZW50ID0gXCJcIjtcbiAgICB9XG4gICAgZWxzZSBpZiAodCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICBTKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGN1cnJlbnQgPSBjb250ZW50KHBhcmVudCwgdmFsdWUoKSwgY3VycmVudCk7XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBlbHNlIGlmICh2YWx1ZSBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkoY3VycmVudCkpIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHBhcmVudC5hcHBlbmRDaGlsZCh2YWx1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChjdXJyZW50Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgICAgICAgICAgIHBhcmVudC5yZXBsYWNlQ2hpbGQodmFsdWUsIGN1cnJlbnRbMF0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgY2xlYXIocGFyZW50KTtcbiAgICAgICAgICAgICAgICBwYXJlbnQuYXBwZW5kQ2hpbGQodmFsdWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGN1cnJlbnQgPT09IFwiXCIpIHtcbiAgICAgICAgICAgIHBhcmVudC5hcHBlbmRDaGlsZCh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBwYXJlbnQucmVwbGFjZUNoaWxkKHZhbHVlLCBwYXJlbnQuZmlyc3RDaGlsZCk7XG4gICAgICAgIH1cbiAgICAgICAgY3VycmVudCA9IHZhbHVlO1xuICAgIH1cbiAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICB2YXIgYXJyYXkgPSBub3JtYWxpemVJbmNvbWluZ0FycmF5KFtdLCB2YWx1ZSk7XG4gICAgICAgIGlmIChhcnJheS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIGNsZWFyKHBhcmVudCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShjdXJyZW50KSkge1xuICAgICAgICAgICAgICAgIGlmIChjdXJyZW50Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICBhcHBlbmROb2RlcyhwYXJlbnQsIGFycmF5LCAwLCBhcnJheS5sZW5ndGgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgcmVjb25jaWxlQXJyYXlzKHBhcmVudCwgY3VycmVudCwgYXJyYXkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKGN1cnJlbnQgPT09IFwiXCIpIHtcbiAgICAgICAgICAgICAgICBhcHBlbmROb2RlcyhwYXJlbnQsIGFycmF5LCAwLCBhcnJheS5sZW5ndGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVjb25jaWxlQXJyYXlzKHBhcmVudCwgW3BhcmVudC5maXJzdENoaWxkXSwgYXJyYXkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGN1cnJlbnQgPSBhcnJheTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcImNvbnRlbnQgbXVzdCBiZSBOb2RlLCBzdHJpbmdhYmxlLCBvciBhcnJheSBvZiBzYW1lXCIpO1xuICAgIH1cbiAgICByZXR1cm4gY3VycmVudDtcbn1cbnZhciBOT01BVENIID0gLTEsIE5PSU5TRVJUID0gLTI7XG52YXIgUkVDT05DSUxFX0FSUkFZX0JBVENIID0gMDtcbnZhciBSRUNPTkNJTEVfQVJSQVlfQklUUyA9IDE2LCBSRUNPTkNJTEVfQVJSQVlfSU5DID0gMSA8PCBSRUNPTkNJTEVfQVJSQVlfQklUUywgUkVDT05DSUxFX0FSUkFZX01BU0sgPSBSRUNPTkNJTEVfQVJSQVlfSU5DIC0gMTtcbi8vIHJlY29uY2lsZSB0aGUgY29udGVudCBvZiBwYXJlbnQgZnJvbSBucyB0byB1c1xuLy8gc2VlIGl2aSdzIGV4Y2VsbGVudCB3cml0ZXVwIG9mIGRpZmZpbmcgYXJyYXlzIGluIGEgdmRvbSBsaWJyYXJ5OiBcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9pdmlqcy9pdmkvYmxvYi8yYzgxZWFkOTM0YjkxMjhlMDkyY2MyYTVlZjJkM2NhYmM3M2NiNWRkL3BhY2thZ2VzL2l2aS9zcmMvdmRvbS9pbXBsZW1lbnRhdGlvbi50cyNMMTE4N1xuLy8gdGhpcyBjb2RlIGlzbid0IGlkZW50aWNhbCwgc2luY2Ugd2UncmUgZGlmZmluZyByZWFsIGRvbSBub2RlcyB0byBub2Rlcy1vci1zdHJpbmdzLCBcbi8vIGJ1dCB0aGUgY29yZSBtZXRob2RvbG9neSBvZiB0cmltbWluZyBlbmRzIGFuZCByZXZlcnNhbHMsIG1hdGNoaW5nIG5vZGVzLCB0aGVuIHVzaW5nXG4vLyB0aGUgbG9uZ2VzdCBpbmNyZWFzaW5nIHN1YnNlcXVlbmNlIHRvIG1pbmltaXplIERPTSBvcHMgaXMgaW5zcGlyZWQgYnkgaXZpLlxuZnVuY3Rpb24gcmVjb25jaWxlQXJyYXlzKHBhcmVudCwgbnMsIHVzKSB7XG4gICAgdmFyIHVsZW4gPSB1cy5sZW5ndGgsIFxuICAgIC8vIG4gPSBub2RlcywgdSA9IHVwZGF0ZXNcbiAgICAvLyByYW5nZXMgZGVmaW5lZCBieSBtaW4gYW5kIG1heCBpbmRpY2VzXG4gICAgbm1pbiA9IDAsIG5tYXggPSBucy5sZW5ndGggLSAxLCB1bWluID0gMCwgdW1heCA9IHVsZW4gLSAxLCBcbiAgICAvLyBzdGFydCBub2RlcyBvZiByYW5nZXNcbiAgICBuID0gbnNbbm1pbl0sIHUgPSB1c1t1bWluXSwgXG4gICAgLy8gZW5kIG5vZGVzIG9mIHJhbmdlc1xuICAgIG54ID0gbnNbbm1heF0sIHV4ID0gdXNbdW1heF0sIFxuICAgIC8vIG5vZGUsIGlmIGFueSwganVzdCBhZnRlciB1eCwgdXNlZCBmb3IgZG9pbmcgLmluc2VydEJlZm9yZSgpIHRvIHB1dCBub2RlcyBhdCBlbmRcbiAgICB1bCA9IG54Lm5leHRTaWJsaW5nLCBpLCBqLCBrLCBsb29wID0gdHJ1ZTtcbiAgICAvLyBzY2FuIG92ZXIgY29tbW9uIHByZWZpeGVzLCBzdWZmaXhlcywgYW5kIHNpbXBsZSByZXZlcnNhbHNcbiAgICBmaXhlczogd2hpbGUgKGxvb3ApIHtcbiAgICAgICAgbG9vcCA9IGZhbHNlO1xuICAgICAgICAvLyBjb21tb24gcHJlZml4LCB1ID09PSBuXG4gICAgICAgIHdoaWxlIChlcXVhYmxlKHUsIG4sIHVtaW4sIHVzKSkge1xuICAgICAgICAgICAgdW1pbisrO1xuICAgICAgICAgICAgbm1pbisrO1xuICAgICAgICAgICAgaWYgKHVtaW4gPiB1bWF4IHx8IG5taW4gPiBubWF4KVxuICAgICAgICAgICAgICAgIGJyZWFrIGZpeGVzO1xuICAgICAgICAgICAgdSA9IHVzW3VtaW5dO1xuICAgICAgICAgICAgbiA9IG5zW25taW5dO1xuICAgICAgICB9XG4gICAgICAgIC8vIGNvbW1vbiBzdWZmaXgsIHV4ID09PSBueFxuICAgICAgICB3aGlsZSAoZXF1YWJsZSh1eCwgbngsIHVtYXgsIHVzKSkge1xuICAgICAgICAgICAgdWwgPSBueDtcbiAgICAgICAgICAgIHVtYXgtLTtcbiAgICAgICAgICAgIG5tYXgtLTtcbiAgICAgICAgICAgIGlmICh1bWluID4gdW1heCB8fCBubWluID4gbm1heClcbiAgICAgICAgICAgICAgICBicmVhayBmaXhlcztcbiAgICAgICAgICAgIHV4ID0gdXNbdW1heF07XG4gICAgICAgICAgICBueCA9IG5zW25tYXhdO1xuICAgICAgICB9XG4gICAgICAgIC8vIHJldmVyc2FsIHUgPT09IG54LCBoYXZlIHRvIHN3YXAgbm9kZSBmb3J3YXJkXG4gICAgICAgIHdoaWxlIChlcXVhYmxlKHUsIG54LCB1bWluLCB1cykpIHtcbiAgICAgICAgICAgIGxvb3AgPSB0cnVlO1xuICAgICAgICAgICAgcGFyZW50Lmluc2VydEJlZm9yZShueCwgbik7XG4gICAgICAgICAgICB1bWluKys7XG4gICAgICAgICAgICBubWF4LS07XG4gICAgICAgICAgICBpZiAodW1pbiA+IHVtYXggfHwgbm1pbiA+IG5tYXgpXG4gICAgICAgICAgICAgICAgYnJlYWsgZml4ZXM7XG4gICAgICAgICAgICB1ID0gdXNbdW1pbl07XG4gICAgICAgICAgICBueCA9IG5zW25tYXhdO1xuICAgICAgICB9XG4gICAgICAgIC8vIHJldmVyc2FsIHV4ID09PSBuLCBoYXZlIHRvIHN3YXAgbm9kZSBiYWNrXG4gICAgICAgIHdoaWxlIChlcXVhYmxlKHV4LCBuLCB1bWF4LCB1cykpIHtcbiAgICAgICAgICAgIGxvb3AgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKHVsID09PSBudWxsKVxuICAgICAgICAgICAgICAgIHBhcmVudC5hcHBlbmRDaGlsZChuKTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKG4sIHVsKTtcbiAgICAgICAgICAgIHVsID0gbjtcbiAgICAgICAgICAgIHVtYXgtLTtcbiAgICAgICAgICAgIG5taW4rKztcbiAgICAgICAgICAgIGlmICh1bWluID4gdW1heCB8fCBubWluID4gbm1heClcbiAgICAgICAgICAgICAgICBicmVhayBmaXhlcztcbiAgICAgICAgICAgIHV4ID0gdXNbdW1heF07XG4gICAgICAgICAgICBuID0gbnNbbm1pbl07XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gaWYgdGhhdCBjb3ZlcmVkIGFsbCB1cGRhdGVzLCBqdXN0IG5lZWQgdG8gcmVtb3ZlIGFueSByZW1haW5pbmcgbm9kZXMgYW5kIHdlJ3JlIGRvbmVcbiAgICBpZiAodW1pbiA+IHVtYXgpIHtcbiAgICAgICAgLy8gcmVtb3ZlIGFueSByZW1haW5pbmcgbm9kZXNcbiAgICAgICAgd2hpbGUgKG5taW4gPD0gbm1heCkge1xuICAgICAgICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKG5zW25tYXhdKTtcbiAgICAgICAgICAgIG5tYXgtLTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIGlmIHRoYXQgY292ZXJlZCBhbGwgY3VycmVudCBub2RlcywganVzdCBuZWVkIHRvIGluc2VydCBhbnkgcmVtYWluaW5nIHVwZGF0ZXMgYW5kIHdlJ3JlIGRvbmVcbiAgICBpZiAobm1pbiA+IG5tYXgpIHtcbiAgICAgICAgLy8gaW5zZXJ0IGFueSByZW1haW5pbmcgbm9kZXNcbiAgICAgICAgd2hpbGUgKHVtaW4gPD0gdW1heCkge1xuICAgICAgICAgICAgaW5zZXJ0T3JBcHBlbmQocGFyZW50LCB1c1t1bWluXSwgdWwsIHVtaW4sIHVzKTtcbiAgICAgICAgICAgIHVtaW4rKztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIHNpbXBsZSBjYXNlcyBkb24ndCBhcHBseSwgaGF2ZSB0byBhY3R1YWxseSBtYXRjaCB1cCBub2RlcyBhbmQgZmlndXJlIG91dCBtaW5pbXVtIERPTSBvcHNcbiAgICAvLyBsb29wIHRocm91Z2ggbm9kZXMgYW5kIG1hcmsgdGhlbSB3aXRoIGEgc3BlY2lhbCBwcm9wZXJ0eSBpbmRpY2F0aW5nIHRoZWlyIG9yZGVyXG4gICAgLy8gd2UnbGwgdGhlbiBnbyB0aHJvdWdoIHRoZSB1cGRhdGVzIGFuZCBsb29rIGZvciB0aG9zZSBwcm9wZXJ0aWVzXG4gICAgLy8gaW4gY2FzZSBhbnkgb2YgdGhlIHVwZGF0ZXMgaGF2ZSBvcmRlciBwcm9wZXJ0aWVzIGxlZnQgb3ZlciBmcm9tIGVhcmxpZXIgcnVucywgd2UgXG4gICAgLy8gdXNlIHRoZSBsb3cgYml0cyBvZiB0aGUgb3JkZXIgcHJvcCB0byByZWNvcmQgYSBiYXRjaCBpZGVudGlmaWVyLlxuICAgIC8vIEknZCBtdWNoIHJhdGhlciB1c2UgYSBNYXAgdGhhbiBhIHNwZWNpYWwgcHJvcGVydHksIGJ1dCBNYXBzIG9mIG9iamVjdHMgYXJlIHJlYWxseVxuICAgIC8vIHNsb3cgY3VycmVudGx5LCBsaWtlIG9ubHkgMTAwayBnZXQvc2V0IG9wcyAvIHNlY29uZFxuICAgIC8vIGZvciBUZXh0IG5vZGVzLCBhbGwgdGhhdCBtYXR0ZXJzIGlzIHRoZWlyIG9yZGVyLCBhcyB0aGV5J3JlIGVhc2lseSwgaW50ZXJjaGFuZ2VhYmxlXG4gICAgLy8gc28gd2UgcmVjb3JkIHRoZWlyIHBvc2l0aW9ucyBpbiBudGV4dFtdXG4gICAgdmFyIG50ZXh0ID0gW107XG4gICAgLy8gdXBkYXRlIGdsb2JhbCBiYXRjaCBpZGVudGlmZXJcbiAgICBSRUNPTkNJTEVfQVJSQVlfQkFUQ0ggPSAoUkVDT05DSUxFX0FSUkFZX0JBVENIICsgMSkgJSBSRUNPTkNJTEVfQVJSQVlfSU5DO1xuICAgIGZvciAoaSA9IG5taW4sIGogPSAobm1pbiA8PCBSRUNPTkNJTEVfQVJSQVlfQklUUykgKyBSRUNPTkNJTEVfQVJSQVlfQkFUQ0g7IGkgPD0gbm1heDsgaSsrLCBqICs9IFJFQ09OQ0lMRV9BUlJBWV9JTkMpIHtcbiAgICAgICAgbiA9IG5zW2ldO1xuICAgICAgICAvLyBhZGQgb3IgdXBkYXRlIHNwZWNpYWwgb3JkZXIgcHJvcGVydHlcbiAgICAgICAgaWYgKG4uX19zdXJwbHVzX29yZGVyID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShuLCAnX19zdXJwbHVzX29yZGVyJywgeyB2YWx1ZTogaiwgd3JpdGFibGU6IHRydWUgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBuLl9fc3VycGx1c19vcmRlciA9IGo7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG4gaW5zdGFuY2VvZiBUZXh0KSB7XG4gICAgICAgICAgICBudGV4dC5wdXNoKGkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIG5vdyBsb29wIHRocm91Z2ggdXMsIGxvb2tpbmcgZm9yIHRoZSBvcmRlciBwcm9wZXJ0eSwgb3RoZXJ3aXNlIHJlY29yZGluZyBOT01BVENIXG4gICAgdmFyIHNyYyA9IG5ldyBBcnJheSh1bWF4IC0gdW1pbiArIDEpLCB1dGV4dCA9IFtdLCBwcmVzZXJ2ZWQgPSAwO1xuICAgIGZvciAoaSA9IHVtaW47IGkgPD0gdW1heDsgaSsrKSB7XG4gICAgICAgIHUgPSB1c1tpXTtcbiAgICAgICAgaWYgKHR5cGVvZiB1ID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdXRleHQucHVzaChpKTtcbiAgICAgICAgICAgIHNyY1tpIC0gdW1pbl0gPSBOT01BVENIO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKChqID0gdS5fX3N1cnBsdXNfb3JkZXIpICE9PSB1bmRlZmluZWQgJiYgKGogJiBSRUNPTkNJTEVfQVJSQVlfTUFTSykgPT09IFJFQ09OQ0lMRV9BUlJBWV9CQVRDSCkge1xuICAgICAgICAgICAgaiA+Pj0gUkVDT05DSUxFX0FSUkFZX0JJVFM7XG4gICAgICAgICAgICBzcmNbaSAtIHVtaW5dID0gajtcbiAgICAgICAgICAgIG5zW2pdID0gbnVsbDtcbiAgICAgICAgICAgIHByZXNlcnZlZCsrO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc3JjW2kgLSB1bWluXSA9IE5PTUFUQ0g7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKHByZXNlcnZlZCA9PT0gMCAmJiBubWluID09PSAwICYmIG5tYXggPT09IG5zLmxlbmd0aCAtIDEpIHtcbiAgICAgICAgLy8gbm8gbm9kZXMgcHJlc2VydmVkLCB1c2UgZmFzdCBjbGVhciBhbmQgYXBwZW5kXG4gICAgICAgIGNsZWFyKHBhcmVudCk7XG4gICAgICAgIHdoaWxlICh1bWluIDw9IHVtYXgpIHtcbiAgICAgICAgICAgIGluc2VydE9yQXBwZW5kKHBhcmVudCwgdXNbdW1pbl0sIG51bGwsIHVtaW4sIHVzKTtcbiAgICAgICAgICAgIHVtaW4rKztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIC8vIGZpbmQgbG9uZ2VzdCBjb21tb24gc2VxdWVuY2UgYmV0d2VlbiBucyBhbmQgdXMsIHJlcHJlc2VudGVkIGFzIHRoZSBpbmRpY2VzIFxuICAgIC8vIG9mIHRoZSBsb25nZXN0IGluY3JlYXNpbmcgc3Vic2VxdWVuY2UgaW4gc3JjXG4gICAgdmFyIGxjcyA9IGxvbmdlc3RQb3NpdGl2ZUluY3JlYXNpbmdTdWJzZXF1ZW5jZShzcmMpO1xuICAgIC8vIHdlIGtub3cgd2UgY2FuIHByZXNlcnZlIHRoZWlyIG9yZGVyLCBzbyBtYXJjaCB0aGVtIGFzIE5PSU5TRVJUXG4gICAgZm9yIChpID0gMDsgaSA8IGxjcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBzcmNbbGNzW2ldXSA9IE5PSU5TRVJUO1xuICAgIH1cbiAgICAvKlxuICAgICAgICAgICAgICAwICAgMSAgIDIgICAzICAgNCAgIDUgICA2ICAgN1xuICAgIG5zICAgID0gWyBuLCAgbiwgIHQsICBuLCAgbiwgIG4sICB0LCAgbiBdXG4gICAgICAgICAgICAgICAgICB8ICAgICAgICAgIC8gICAvICAgICAgIC9cbiAgICAgICAgICAgICAgICAgIHwgICAgICAgIC8gICAvICAgICAgIC9cbiAgICAgICAgICAgICAgICAgICstLS0tLS0vLS0tLy0tLS0tLS0vLS0tLStcbiAgICAgICAgICAgICAgICAgICAgICAgLyAgIC8gICAgICAgLyAgICAgIHxcbiAgICB1cyAgICA9IFsgbiwgIHMsICBuLCAgbiwgIHMsICBuLCAgcywgIG4gXVxuICAgIHNyYyAgID0gWy0xLCAtMSwgIDQsICA1LCAtMSwgIDcsIC0xLCAgMSBdXG4gICAgbGlzICAgPSBbICAgICAgICAgMiwgIDMsICAgICAgNV1cbiAgICAgICAgICAgICAgICAgICAgICBqXG4gICAgdXRleHQgPSBbICAgICAxLCAgICAgICAgICA0LCAgICAgIDYgXVxuICAgICAgICAgICAgICAgICAgaVxuICAgIG50ZXh0ID0gWyAgICAgICAgIDIsICAgICAgICAgICAgICA2IF1cbiAgICAgICAgICAgICAgICAgICAgICBrXG4gICAgKi9cbiAgICAvLyByZXBsYWNlIHN0cmluZ3MgaW4gdXMgd2l0aCBUZXh0IG5vZGVzLCByZXVzaW5nIFRleHQgbm9kZXMgZnJvbSBucyB3aGVuIHdlIGNhbiBkbyBzbyB3aXRob3V0IG1vdmluZyB0aGVtXG4gICAgdmFyIHV0ZXh0aSA9IDAsIGxjc2ogPSAwLCBudGV4dGsgPSAwO1xuICAgIGZvciAoaSA9IDAsIGogPSAwLCBrID0gMDsgaSA8IHV0ZXh0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHV0ZXh0aSA9IHV0ZXh0W2ldO1xuICAgICAgICAvLyBuZWVkIHRvIGFuc3dlciBxZXVzdGlvbiBcImlmIHV0ZXh0W2ldIGZhbGxzIGJldHdlZW4gdHdvIGxjcyBub2RlcywgaXMgdGhlcmUgYW4gbnRleHQgYmV0d2VlbiB0aGVtIHdoaWNoIHdlIGNhbiByZXVzZT9cIlxuICAgICAgICAvLyBmaXJzdCwgZmluZCBqIHN1Y2ggdGhhdCBsY3Nbal0gaXMgdGhlIGZpcnN0IGxjcyBub2RlICphZnRlciogdXRleHRbaV1cbiAgICAgICAgd2hpbGUgKGogPCBsY3MubGVuZ3RoICYmIChsY3NqID0gbGNzW2pdKSA8IHV0ZXh0aSAtIHVtaW4pXG4gICAgICAgICAgICBqKys7XG4gICAgICAgIC8vIG5vdywgZmluZCBrIHN1Y2ggdGhhdCBudGV4dFtrXSBpcyB0aGUgZmlyc3QgbnRleHQgKmFmdGVyKiBsY3Nbai0xXSAob3IgYWZ0ZXIgc3RhcnQsIGlmIGogPT09IDApXG4gICAgICAgIHdoaWxlIChrIDwgbnRleHQubGVuZ3RoICYmIChudGV4dGsgPSBudGV4dFtrXSwgaiAhPT0gMCkgJiYgbnRleHRrIDwgc3JjW2xjc1tqIC0gMV1dKVxuICAgICAgICAgICAgaysrO1xuICAgICAgICAvLyBpZiBudGV4dFtrXSA8IGxjc1tqXSwgdGhlbiB3ZSBrbm93IG50ZXh0W2tdIGZhbGxzIGJldHdlZW4gbGNzW2otMV0gKG9yIHN0YXJ0KSBhbmQgbGNzW2pdIChvciBlbmQpXG4gICAgICAgIC8vIHRoYXQgbWVhbnMgd2UgY2FuIHJlLXVzZSBpdCB3aXRob3V0IG1vdmluZyBpdFxuICAgICAgICBpZiAoayA8IG50ZXh0Lmxlbmd0aCAmJiAoaiA9PT0gbGNzLmxlbmd0aCB8fCBudGV4dGsgPCBzcmNbbGNzal0pKSB7XG4gICAgICAgICAgICBuID0gbnNbbnRleHRrXTtcbiAgICAgICAgICAgIHUgPSB1c1t1dGV4dGldO1xuICAgICAgICAgICAgaWYgKG4uZGF0YSAhPT0gdSlcbiAgICAgICAgICAgICAgICBuLmRhdGEgPSB1O1xuICAgICAgICAgICAgbnNbbnRleHRrXSA9IG51bGw7XG4gICAgICAgICAgICB1c1t1dGV4dGldID0gbjtcbiAgICAgICAgICAgIHNyY1t1dGV4dGldID0gTk9JTlNFUlQ7XG4gICAgICAgICAgICBrKys7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAvLyBpZiB3ZSBkaWRuJ3QgZmluZCBvbmUgdG8gcmUtdXNlLCBtYWtlIGEgbmV3IFRleHQgbm9kZVxuICAgICAgICAgICAgdXNbdXRleHRpXSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHVzW3V0ZXh0aV0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIHJlbW92ZSBzdGFsZSBub2RlcyBpbiBuc1xuICAgIHdoaWxlIChubWluIDw9IG5tYXgpIHtcbiAgICAgICAgbiA9IG5zW25taW5dO1xuICAgICAgICBpZiAobiAhPT0gbnVsbCkge1xuICAgICAgICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKG4pO1xuICAgICAgICB9XG4gICAgICAgIG5taW4rKztcbiAgICB9XG4gICAgLy8gaW5zZXJ0IG5ldyBub2Rlc1xuICAgIHdoaWxlICh1bWluIDw9IHVtYXgpIHtcbiAgICAgICAgdXggPSB1c1t1bWF4XTtcbiAgICAgICAgaWYgKHNyY1t1bWF4IC0gdW1pbl0gIT09IE5PSU5TRVJUKSB7XG4gICAgICAgICAgICBpZiAodWwgPT09IG51bGwpXG4gICAgICAgICAgICAgICAgcGFyZW50LmFwcGVuZENoaWxkKHV4KTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKHV4LCB1bCk7XG4gICAgICAgIH1cbiAgICAgICAgdWwgPSB1eDtcbiAgICAgICAgdW1heC0tO1xuICAgIH1cbn1cbi8vIHR3byBub2RlcyBhcmUgXCJlcXVhYmxlXCIgaWYgdGhleSBhcmUgaWRlbnRpY2FsICg9PT0pIG9yIGlmIHdlIGNhbiBtYWtlIHRoZW0gdGhlIHNhbWUsIGkuZS4gdGhleSdyZSBcbi8vIFRleHQgbm9kZXMsIHdoaWNoIHdlIGNhbiByZXVzZSB3aXRoIHRoZSBuZXcgdGV4dFxuZnVuY3Rpb24gZXF1YWJsZSh1LCBuLCBpLCB1cykge1xuICAgIGlmICh1ID09PSBuKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlb2YgdSA9PT0gJ3N0cmluZycgJiYgbiBpbnN0YW5jZW9mIFRleHQpIHtcbiAgICAgICAgaWYgKG4uZGF0YSAhPT0gdSlcbiAgICAgICAgICAgIG4uZGF0YSA9IHU7XG4gICAgICAgIHVzW2ldID0gbjtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuZnVuY3Rpb24gYXBwZW5kTm9kZXMocGFyZW50LCBhcnJheSwgaSwgZW5kKSB7XG4gICAgdmFyIG5vZGU7XG4gICAgZm9yICg7IGkgPCBlbmQ7IGkrKykge1xuICAgICAgICBub2RlID0gYXJyYXlbaV07XG4gICAgICAgIGlmIChub2RlIGluc3RhbmNlb2YgTm9kZSkge1xuICAgICAgICAgICAgcGFyZW50LmFwcGVuZENoaWxkKG5vZGUpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbm9kZSA9IGFycmF5W2ldID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUobm9kZSk7XG4gICAgICAgICAgICBwYXJlbnQuYXBwZW5kQ2hpbGQobm9kZSk7XG4gICAgICAgIH1cbiAgICB9XG59XG5mdW5jdGlvbiBpbnNlcnRPckFwcGVuZChwYXJlbnQsIG5vZGUsIG1hcmtlciwgaSwgdXMpIHtcbiAgICBpZiAodHlwZW9mIG5vZGUgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIG5vZGUgPSB1c1tpXSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKG5vZGUpO1xuICAgIH1cbiAgICBpZiAobWFya2VyID09PSBudWxsKVxuICAgICAgICBwYXJlbnQuYXBwZW5kQ2hpbGQobm9kZSk7XG4gICAgZWxzZVxuICAgICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKG5vZGUsIG1hcmtlcik7XG59XG5mdW5jdGlvbiBub3JtYWxpemVJbmNvbWluZ0FycmF5KG5vcm1hbGl6ZWQsIGFycmF5KSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGFycmF5Lmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgIHZhciBpdGVtID0gYXJyYXlbaV07XG4gICAgICAgIGlmIChpdGVtIGluc3RhbmNlb2YgTm9kZSkge1xuICAgICAgICAgICAgbm9ybWFsaXplZC5wdXNoKGl0ZW0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKGl0ZW0gPT0gbnVsbCB8fCBpdGVtID09PSB0cnVlIHx8IGl0ZW0gPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAvLyBza2lwXG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheShpdGVtKSkge1xuICAgICAgICAgICAgbm9ybWFsaXplSW5jb21pbmdBcnJheShub3JtYWxpemVkLCBpdGVtKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0eXBlb2YgaXRlbSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIG5vcm1hbGl6ZWQucHVzaChpdGVtKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIG5vcm1hbGl6ZWQucHVzaChpdGVtLnRvU3RyaW5nKCkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBub3JtYWxpemVkO1xufVxuZnVuY3Rpb24gY2xlYXIobm9kZSkge1xuICAgIG5vZGUudGV4dENvbnRlbnQgPSBcIlwiO1xufVxuLy8gcmV0dXJuIGFuIGFycmF5IG9mIHRoZSBpbmRpY2VzIG9mIG5zIHRoYXQgY29tcHJpc2UgdGhlIGxvbmdlc3QgaW5jcmVhc2luZyBzdWJzZXF1ZW5jZSB3aXRoaW4gbnNcbmZ1bmN0aW9uIGxvbmdlc3RQb3NpdGl2ZUluY3JlYXNpbmdTdWJzZXF1ZW5jZShucykge1xuICAgIHZhciBzZXEgPSBbXSwgaXMgPSBbXSwgbCA9IC0xLCBwcmUgPSBuZXcgQXJyYXkobnMubGVuZ3RoKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gbnMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgdmFyIG4gPSBuc1tpXTtcbiAgICAgICAgaWYgKG4gPCAwKVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIHZhciBqID0gZmluZEdyZWF0ZXN0SW5kZXhMRVEoc2VxLCBuKTtcbiAgICAgICAgaWYgKGogIT09IC0xKVxuICAgICAgICAgICAgcHJlW2ldID0gaXNbal07XG4gICAgICAgIGlmIChqID09PSBsKSB7XG4gICAgICAgICAgICBsKys7XG4gICAgICAgICAgICBzZXFbbF0gPSBuO1xuICAgICAgICAgICAgaXNbbF0gPSBpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG4gPCBzZXFbaiArIDFdKSB7XG4gICAgICAgICAgICBzZXFbaiArIDFdID0gbjtcbiAgICAgICAgICAgIGlzW2ogKyAxXSA9IGk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yIChpID0gaXNbbF07IGwgPj0gMDsgaSA9IHByZVtpXSwgbC0tKSB7XG4gICAgICAgIHNlcVtsXSA9IGk7XG4gICAgfVxuICAgIHJldHVybiBzZXE7XG59XG5mdW5jdGlvbiBmaW5kR3JlYXRlc3RJbmRleExFUShzZXEsIG4pIHtcbiAgICAvLyBpbnZhcmlhbnQ6IGxvIGlzIGd1YXJhbnRlZWQgdG8gYmUgaW5kZXggb2YgYSB2YWx1ZSA8PSBuLCBoaSB0byBiZSA+XG4gICAgLy8gdGhlcmVmb3JlLCB0aGV5IGFjdHVhbGx5IHN0YXJ0IG91dCBvZiByYW5nZTogKC0xLCBsYXN0ICsgMSlcbiAgICB2YXIgbG8gPSAtMSwgaGkgPSBzZXEubGVuZ3RoO1xuICAgIC8vIGZhc3QgcGF0aCBmb3Igc2ltcGxlIGluY3JlYXNpbmcgc2VxdWVuY2VzXG4gICAgaWYgKGhpID4gMCAmJiBzZXFbaGkgLSAxXSA8PSBuKVxuICAgICAgICByZXR1cm4gaGkgLSAxO1xuICAgIHdoaWxlIChoaSAtIGxvID4gMSkge1xuICAgICAgICB2YXIgbWlkID0gTWF0aC5mbG9vcigobG8gKyBoaSkgLyAyKTtcbiAgICAgICAgaWYgKHNlcVttaWRdID4gbikge1xuICAgICAgICAgICAgaGkgPSBtaWQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBsbyA9IG1pZDtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gbG87XG59XG5cblxuXG4vLy8vLy8vLy8vLy8vLy8vLy9cbi8vIFdFQlBBQ0sgRk9PVEVSXG4vLyAuL34vc3VycGx1cy9lcy9jb250ZW50LmpzXG4vLyBtb2R1bGUgaWQgPSAxNFxuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCJ2YXIgXG4vLyBwcmUtc2VlZCB0aGUgY2FjaGVzIHdpdGggYSBmZXcgc3BlY2lhbCBjYXNlcywgc28gd2UgZG9uJ3QgbmVlZCB0byBjaGVjayBmb3IgdGhlbSBpbiB0aGUgY29tbW9uIGNhc2VzXG5odG1sRmllbGRDYWNoZSA9IHtcbiAgICAvLyBzcGVjaWFsIHByb3BzXG4gICAgc3R5bGU6IFsnc3R5bGUnLCBudWxsLCAzIC8qIEFzc2lnbiAqL10sXG4gICAgcmVmOiBbJ3JlZicsIG51bGwsIDIgLyogSWdub3JlICovXSxcbiAgICBmbjogWydmbicsIG51bGwsIDIgLyogSWdub3JlICovXSxcbiAgICAvLyBhdHRyIGNvbXBhdFxuICAgIGNsYXNzOiBbJ2NsYXNzTmFtZScsIG51bGwsIDAgLyogUHJvcGVydHkgKi9dLFxuICAgIGZvcjogWydodG1sRm9yJywgbnVsbCwgMCAvKiBQcm9wZXJ0eSAqL10sXG4gICAgXCJhY2NlcHQtY2hhcnNldFwiOiBbJ2FjY2VwdENoYXJzZXQnLCBudWxsLCAwIC8qIFByb3BlcnR5ICovXSxcbiAgICBcImh0dHAtZXF1aXZcIjogWydodHRwRXF1aXYnLCBudWxsLCAwIC8qIFByb3BlcnR5ICovXSxcbiAgICAvLyBhIGZldyBSZWFjdCBvZGRpdGllcywgbW9zdGx5IGRpc2FncmVlaW5nIGFib3V0IGNhc2luZ1xuICAgIG9uRG91YmxlQ2xpY2s6IFsnb25kYmxjbGljaycsIG51bGwsIDAgLyogUHJvcGVydHkgKi9dLFxuICAgIHNwZWxsQ2hlY2s6IFsnc3BlbGxjaGVjaycsIG51bGwsIDAgLyogUHJvcGVydHkgKi9dLFxuICAgIGFsbG93RnVsbFNjcmVlbjogWydhbGxvd0Z1bGxzY3JlZW4nLCBudWxsLCAwIC8qIFByb3BlcnR5ICovXSxcbiAgICBhdXRvQ2FwaXRhbGl6ZTogWydhdXRvY2FwaXRhbGl6ZScsIG51bGwsIDAgLyogUHJvcGVydHkgKi9dLFxuICAgIGF1dG9Gb2N1czogWydhdXRvZm9jdXMnLCBudWxsLCAwIC8qIFByb3BlcnR5ICovXSxcbiAgICBhdXRvUGxheTogWydhdXRvcGxheScsIG51bGwsIDAgLyogUHJvcGVydHkgKi9dLFxuICAgIC8vIG90aGVyXG4gICAgLy8gcm9sZSBpcyBwYXJ0IG9mIHRoZSBBUklBIHNwZWMgYnV0IG5vdCBjYXVnaHQgYnkgdGhlIGFyaWEtIGF0dHIgZmlsdGVyXG4gICAgcm9sZTogWydyb2xlJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dXG59LCBzdmdGaWVsZENhY2hlID0ge1xuICAgIC8vIHNwZWNpYWwgcHJvcHNcbiAgICBzdHlsZTogWydzdHlsZScsIG51bGwsIDMgLyogQXNzaWduICovXSxcbiAgICByZWY6IFsncmVmJywgbnVsbCwgMiAvKiBJZ25vcmUgKi9dLFxuICAgIGZuOiBbJ2ZuJywgbnVsbCwgMiAvKiBJZ25vcmUgKi9dLFxuICAgIC8vIHByb3BlcnR5IGNvbXBhdFxuICAgIGNsYXNzTmFtZTogWydjbGFzcycsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICBodG1sRm9yOiBbJ2ZvcicsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICB0YWJJbmRleDogWyd0YWJpbmRleCcsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICAvLyBSZWFjdCBjb21wYXRcbiAgICBvbkRvdWJsZUNsaWNrOiBbJ29uZGJsY2xpY2snLCBudWxsLCAwIC8qIFByb3BlcnR5ICovXSxcbiAgICAvLyBhdHRyaWJ1dGVzIHdpdGggZWNjZW50cmljIGNhc2luZyAtIHNvbWUgU1ZHIGF0dHJzIGFyZSBzbmFrZS1jYXNlZCwgc29tZSBjYW1lbENhc2VkXG4gICAgYWxsb3dSZW9yZGVyOiBbJ2FsbG93UmVvcmRlcicsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICBhdHRyaWJ1dGVOYW1lOiBbJ2F0dHJpYnV0ZU5hbWUnLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgYXR0cmlidXRlVHlwZTogWydhdHRyaWJ1dGVUeXBlJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIGF1dG9SZXZlcnNlOiBbJ2F1dG9SZXZlcnNlJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIGJhc2VGcmVxdWVuY3k6IFsnYmFzZUZyZXF1ZW5jeScsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICBjYWxjTW9kZTogWydjYWxjTW9kZScsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICBjbGlwUGF0aFVuaXRzOiBbJ2NsaXBQYXRoVW5pdHMnLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgY29udGVudFNjcmlwdFR5cGU6IFsnY29udGVudFNjcmlwdFR5cGUnLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgY29udGVudFN0eWxlVHlwZTogWydjb250ZW50U3R5bGVUeXBlJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIGRpZmZ1c2VDb25zdGFudDogWydkaWZmdXNlQ29uc3RhbnQnLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgZWRnZU1vZGU6IFsnZWRnZU1vZGUnLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgZXh0ZXJuYWxSZXNvdXJjZXNSZXF1aXJlZDogWydleHRlcm5hbFJlc291cmNlc1JlcXVpcmVkJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIGZpbHRlclJlczogWydmaWx0ZXJSZXMnLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgZmlsdGVyVW5pdHM6IFsnZmlsdGVyVW5pdHMnLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgZ3JhZGllbnRUcmFuc2Zvcm06IFsnZ3JhZGllbnRUcmFuc2Zvcm0nLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgZ3JhZGllbnRVbml0czogWydncmFkaWVudFVuaXRzJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIGtlcm5lbE1hdHJpeDogWydrZXJuZWxNYXRyaXgnLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAga2VybmVsVW5pdExlbmd0aDogWydrZXJuZWxVbml0TGVuZ3RoJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIGtleVBvaW50czogWydrZXlQb2ludHMnLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAga2V5U3BsaW5lczogWydrZXlTcGxpbmVzJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIGtleVRpbWVzOiBbJ2tleVRpbWVzJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIGxlbmd0aEFkanVzdDogWydsZW5ndGhBZGp1c3QnLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgbGltaXRpbmdDb25lQW5nbGU6IFsnbGltaXRpbmdDb25lQW5nbGUnLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgbWFya2VySGVpZ2h0OiBbJ21hcmtlckhlaWdodCcsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICBtYXJrZXJVbml0czogWydtYXJrZXJVbml0cycsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICBtYXNrQ29udGVudFVuaXRzOiBbJ21hc2tDb250ZW50VW5pdHMnLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgbWFza1VuaXRzOiBbJ21hc2tVbml0cycsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICBudW1PY3RhdmVzOiBbJ251bU9jdGF2ZXMnLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgcGF0aExlbmd0aDogWydwYXRoTGVuZ3RoJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIHBhdHRlcm5Db250ZW50VW5pdHM6IFsncGF0dGVybkNvbnRlbnRVbml0cycsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICBwYXR0ZXJuVHJhbnNmb3JtOiBbJ3BhdHRlcm5UcmFuc2Zvcm0nLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgcGF0dGVyblVuaXRzOiBbJ3BhdHRlcm5Vbml0cycsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICBwb2ludHNBdFg6IFsncG9pbnRzQXRYJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIHBvaW50c0F0WTogWydwb2ludHNBdFknLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgcG9pbnRzQXRaOiBbJ3BvaW50c0F0WicsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICBwcmVzZXJ2ZUFscGhhOiBbJ3ByZXNlcnZlQWxwaGEnLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgcHJlc2VydmVBc3BlY3RSYXRpbzogWydwcmVzZXJ2ZUFzcGVjdFJhdGlvJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIHByaW1pdGl2ZVVuaXRzOiBbJ3ByaW1pdGl2ZVVuaXRzJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIHJlZlg6IFsncmVmWCcsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICByZWZZOiBbJ3JlZlknLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgcmVwZWF0Q291bnQ6IFsncmVwZWF0Q291bnQnLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgcmVwZWF0RHVyOiBbJ3JlcGVhdER1cicsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICByZXF1aXJlZEV4dGVuc2lvbnM6IFsncmVxdWlyZWRFeHRlbnNpb25zJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIHJlcXVpcmVkRmVhdHVyZXM6IFsncmVxdWlyZWRGZWF0dXJlcycsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICBzcGVjdWxhckNvbnN0YW50OiBbJ3NwZWN1bGFyQ29uc3RhbnQnLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgc3BlY3VsYXJFeHBvbmVudDogWydzcGVjdWxhckV4cG9uZW50JywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIHNwcmVhZE1ldGhvZDogWydzcHJlYWRNZXRob2QnLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgc3RhcnRPZmZzZXQ6IFsnc3RhcnRPZmZzZXQnLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgc3RkRGV2aWF0aW9uOiBbJ3N0ZERldmlhdGlvbicsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICBzdGl0Y2hUaWxlczogWydzdGl0Y2hUaWxlcycsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICBzdXJmYWNlU2NhbGU6IFsnc3VyZmFjZVNjYWxlJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIHN5c3RlbUxhbmd1YWdlOiBbJ3N5c3RlbUxhbmd1YWdlJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIHRhYmxlVmFsdWVzOiBbJ3RhYmxlVmFsdWVzJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIHRhcmdldFg6IFsndGFyZ2V0WCcsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICB0YXJnZXRZOiBbJ3RhcmdldFknLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgdGV4dExlbmd0aDogWyd0ZXh0TGVuZ3RoJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIHZpZXdCb3g6IFsndmlld0JveCcsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICB2aWV3VGFyZ2V0OiBbJ3ZpZXdUYXJnZXQnLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG4gICAgeENoYW5uZWxTZWxlY3RvcjogWyd4Q2hhbm5lbFNlbGVjdG9yJywgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dLFxuICAgIHlDaGFubmVsU2VsZWN0b3I6IFsneUNoYW5uZWxTZWxlY3RvcicsIG51bGwsIDEgLyogQXR0cmlidXRlICovXSxcbiAgICB6b29tQW5kUGFuOiBbJ3pvb21BbmRQYW4nLCBudWxsLCAxIC8qIEF0dHJpYnV0ZSAqL10sXG59O1xudmFyIGF0dHJpYnV0ZU9ubHlSeCA9IC8tLywgZGVlcEF0dHJSeCA9IC9ec3R5bGUtLywgaXNBdHRyT25seUZpZWxkID0gZnVuY3Rpb24gKGZpZWxkKSB7IHJldHVybiBhdHRyaWJ1dGVPbmx5UngudGVzdChmaWVsZCkgJiYgIWRlZXBBdHRyUngudGVzdChmaWVsZCk7IH0sIHByb3BPbmx5UnggPSAvXihvbnxzdHlsZSkvLCBpc1Byb3BPbmx5RmllbGQgPSBmdW5jdGlvbiAoZmllbGQpIHsgcmV0dXJuIHByb3BPbmx5UngudGVzdChmaWVsZCk7IH0sIHByb3BQYXJ0UnggPSAvW2Etel1bQS1aXS9nLCBnZXRBdHRyTmFtZSA9IGZ1bmN0aW9uIChmaWVsZCkgeyByZXR1cm4gZmllbGQucmVwbGFjZShwcm9wUGFydFJ4LCBmdW5jdGlvbiAobSkgeyByZXR1cm4gbVswXSArICctJyArIG1bMV07IH0pLnRvTG93ZXJDYXNlKCk7IH0sIGpzeEV2ZW50UHJvcFJ4ID0gL15vbltBLVpdLywgYXR0clBhcnRSeCA9IC9cXC0oPzpbYS16XXwkKS9nLCBnZXRQcm9wTmFtZSA9IGZ1bmN0aW9uIChmaWVsZCkge1xuICAgIHZhciBwcm9wID0gZmllbGQucmVwbGFjZShhdHRyUGFydFJ4LCBmdW5jdGlvbiAobSkgeyByZXR1cm4gbS5sZW5ndGggPT09IDEgPyAnJyA6IG1bMV0udG9VcHBlckNhc2UoKTsgfSk7XG4gICAgcmV0dXJuIGpzeEV2ZW50UHJvcFJ4LnRlc3QocHJvcCkgPyBwcm9wLnRvTG93ZXJDYXNlKCkgOiBwcm9wO1xufSwgZGVlcFByb3BSeCA9IC9eKHN0eWxlKShbQS1aXSkvLCBidWlsZFByb3BEYXRhID0gZnVuY3Rpb24gKHByb3ApIHtcbiAgICB2YXIgbSA9IGRlZXBQcm9wUnguZXhlYyhwcm9wKTtcbiAgICByZXR1cm4gbSA/IFttWzJdLnRvTG93ZXJDYXNlKCkgKyBwcm9wLnN1YnN0cihtWzBdLmxlbmd0aCksIG1bMV0sIDAgLyogUHJvcGVydHkgKi9dIDogW3Byb3AsIG51bGwsIDAgLyogUHJvcGVydHkgKi9dO1xufSwgYXR0ck5hbWVzcGFjZXMgPSB7XG4gICAgeGxpbms6IFwiaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGlua1wiLFxuICAgIHhtbDogXCJodHRwOi8vd3d3LnczLm9yZy9YTUwvMTk5OC9uYW1lc3BhY2VcIixcbn0sIGF0dHJOYW1lc3BhY2VSeCA9IG5ldyBSZWdFeHAoXCJeKFwiICsgT2JqZWN0LmtleXMoYXR0ck5hbWVzcGFjZXMpLmpvaW4oJ3wnKSArIFwiKS0oLiopXCIpLCBidWlsZEF0dHJEYXRhID0gZnVuY3Rpb24gKGF0dHIpIHtcbiAgICB2YXIgbSA9IGF0dHJOYW1lc3BhY2VSeC5leGVjKGF0dHIpO1xuICAgIHJldHVybiBtID8gW21bMl0sIGF0dHJOYW1lc3BhY2VzW21bMV1dLCAxIC8qIEF0dHJpYnV0ZSAqL10gOiBbYXR0ciwgbnVsbCwgMSAvKiBBdHRyaWJ1dGUgKi9dO1xufTtcbmV4cG9ydCB2YXIgZ2V0RmllbGREYXRhID0gZnVuY3Rpb24gKGZpZWxkLCBzdmcpIHtcbiAgICB2YXIgY2FjaGUgPSBzdmcgPyBzdmdGaWVsZENhY2hlIDogaHRtbEZpZWxkQ2FjaGUsIGNhY2hlZCA9IGNhY2hlW2ZpZWxkXTtcbiAgICBpZiAoY2FjaGVkKVxuICAgICAgICByZXR1cm4gY2FjaGVkO1xuICAgIHZhciBhdHRyID0gc3ZnICYmICFpc1Byb3BPbmx5RmllbGQoZmllbGQpXG4gICAgICAgIHx8ICFzdmcgJiYgaXNBdHRyT25seUZpZWxkKGZpZWxkKSwgbmFtZSA9IGF0dHIgPyBnZXRBdHRyTmFtZShmaWVsZCkgOiBnZXRQcm9wTmFtZShmaWVsZCk7XG4gICAgaWYgKG5hbWUgIT09IGZpZWxkICYmIChjYWNoZWQgPSBjYWNoZVtuYW1lXSkpXG4gICAgICAgIHJldHVybiBjYWNoZWQ7XG4gICAgdmFyIGRhdGEgPSBhdHRyID8gYnVpbGRBdHRyRGF0YShuYW1lKSA6IGJ1aWxkUHJvcERhdGEobmFtZSk7XG4gICAgcmV0dXJuIGNhY2hlW2ZpZWxkXSA9IGRhdGE7XG59O1xuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9+L3N1cnBsdXMvZXMvZmllbGREYXRhLmpzXG4vLyBtb2R1bGUgaWQgPSAxNVxuLy8gbW9kdWxlIGNodW5rcyA9IDAiLCJpbXBvcnQgeyBTIH0gZnJvbSAnLi9pbmRleCc7XG52YXIgRE9DVU1FTlRfRlJBR01FTlRfTk9ERSA9IDExLCBURVhUX05PREUgPSAzO1xuZXhwb3J0IGZ1bmN0aW9uIGluc2VydChyYW5nZSwgdmFsdWUpIHtcbiAgICB2YXIgcGFyZW50ID0gcmFuZ2Uuc3RhcnQucGFyZW50Tm9kZSwgdGVzdCA9IHJhbmdlLnN0YXJ0LCBnb29kID0gbnVsbCwgdCA9IHR5cGVvZiB2YWx1ZTtcbiAgICAvL2lmIChwYXJlbnQgPT09IG51bGwpIHtcbiAgICAvLyAgICB0aHJvdyBuZXcgRXJyb3IoXCJTdXJwbHVzLmluc2VydCgpIGNhbiBvbmx5IGJlIHVzZWQgb24gYSBub2RlIHRoYXQgaGFzIGEgcGFyZW50IG5vZGUuIFxcblwiXG4gICAgLy8gICAgICAgICsgXCJOb2RlIGBgXCIgKyByYW5nZS5zdGFydCArIFwiJycgaXMgY3VycmVudGx5IHVuYXR0YWNoZWQgdG8gYSBwYXJlbnQuXCIpO1xuICAgIC8vfVxuICAgIC8vaWYgKHJhbmdlLmVuZC5wYXJlbnROb2RlICE9PSBwYXJlbnQpIHtcbiAgICAvLyAgICB0aHJvdyBuZXcgRXJyb3IoXCJTdXJwbHVzLmluc2VydCgpIHJlcXVpcmVzIHRoYXQgdGhlIGluc2VydGVkIG5vZGVzIHJlbWFpbiBzaWJpbGluZ3MgXFxuXCJcbiAgICAvLyAgICAgICAgKyBcIm9mIHRoZSBvcmlnaW5hbCBub2RlLiAgVGhlIERPTSBoYXMgYmVlbiBtb2RpZmllZCBzdWNoIHRoYXQgdGhpcyBpcyBcXG5cIlxuICAgIC8vICAgICAgICArIFwibm8gbG9uZ2VyIHRoZSBjYXNlLlwiKTtcbiAgICAvL31cbiAgICBpZiAodCA9PT0gJ3N0cmluZycgfHwgdCA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgdmFsdWUgPSB2YWx1ZS50b1N0cmluZygpO1xuICAgICAgICBpZiAodGVzdC5ub2RlVHlwZSA9PT0gVEVYVF9OT0RFKSB7XG4gICAgICAgICAgICB0ZXN0LmRhdGEgPSB2YWx1ZTtcbiAgICAgICAgICAgIGdvb2QgPSB0ZXN0O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFsdWUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh2YWx1ZSk7XG4gICAgICAgICAgICBwYXJlbnQucmVwbGFjZUNoaWxkKHZhbHVlLCB0ZXN0KTtcbiAgICAgICAgICAgIGlmIChyYW5nZS5lbmQgPT09IHRlc3QpXG4gICAgICAgICAgICAgICAgcmFuZ2UuZW5kID0gdmFsdWU7XG4gICAgICAgICAgICByYW5nZS5zdGFydCA9IGdvb2QgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmICh2YWx1ZSBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICAgICAgaWYgKHRlc3QgIT09IHZhbHVlKSB7XG4gICAgICAgICAgICBwYXJlbnQucmVwbGFjZUNoaWxkKHZhbHVlLCB0ZXN0KTtcbiAgICAgICAgICAgIGlmIChyYW5nZS5lbmQgPT09IHRlc3QpXG4gICAgICAgICAgICAgICAgcmFuZ2UuZW5kID0gdmFsdWU7XG4gICAgICAgICAgICByYW5nZS5zdGFydCA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIGdvb2QgPSB2YWx1ZTtcbiAgICB9XG4gICAgZWxzZSBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgaW5zZXJ0QXJyYXkodmFsdWUpO1xuICAgIH1cbiAgICBlbHNlIGlmICh2YWx1ZSBpbnN0YW5jZW9mIEZ1bmN0aW9uKSB7XG4gICAgICAgIFMoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaW5zZXJ0KHJhbmdlLCB2YWx1ZSgpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGdvb2QgPSByYW5nZS5lbmQ7XG4gICAgfVxuICAgIGVsc2UgaWYgKHZhbHVlICE9PSBudWxsICYmIHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IHRydWUgJiYgdmFsdWUgIT09IGZhbHNlKSB7XG4gICAgICAgIHZhbHVlID0gdmFsdWUudG9TdHJpbmcoKTtcbiAgICAgICAgaWYgKHRlc3Qubm9kZVR5cGUgPT09IFRFWFRfTk9ERSkge1xuICAgICAgICAgICAgdGVzdC5kYXRhID0gdmFsdWU7XG4gICAgICAgICAgICBnb29kID0gdGVzdDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhbHVlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodmFsdWUpO1xuICAgICAgICAgICAgcGFyZW50LnJlcGxhY2VDaGlsZCh2YWx1ZSwgdGVzdCk7XG4gICAgICAgICAgICBpZiAocmFuZ2UuZW5kID09PSB0ZXN0KVxuICAgICAgICAgICAgICAgIHJhbmdlLmVuZCA9IHZhbHVlO1xuICAgICAgICAgICAgcmFuZ2Uuc3RhcnQgPSBnb29kID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICB9XG4gICAgaWYgKGdvb2QgPT09IG51bGwpIHtcbiAgICAgICAgaWYgKHJhbmdlLnN0YXJ0ID09PSBwYXJlbnQuZmlyc3RDaGlsZCAmJiByYW5nZS5lbmQgPT09IHBhcmVudC5sYXN0Q2hpbGQgJiYgcmFuZ2Uuc3RhcnQgIT09IHJhbmdlLmVuZCkge1xuICAgICAgICAgICAgLy8gZmFzdCBkZWxldGUgZW50aXJlIGNvbnRlbnRzXG4gICAgICAgICAgICBwYXJlbnQudGV4dENvbnRlbnQgPSBcIlwiO1xuICAgICAgICAgICAgdmFsdWUgPSBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShcIlwiKTtcbiAgICAgICAgICAgIHBhcmVudC5hcHBlbmRDaGlsZCh2YWx1ZSk7XG4gICAgICAgICAgICBnb29kID0gcmFuZ2Uuc3RhcnQgPSByYW5nZS5lbmQgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0ZXN0Lm5vZGVUeXBlID09PSBURVhUX05PREUpIHtcbiAgICAgICAgICAgIHRlc3QuZGF0YSA9IFwiXCI7XG4gICAgICAgICAgICBnb29kID0gdGVzdDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHZhbHVlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoXCJcIik7XG4gICAgICAgICAgICBwYXJlbnQucmVwbGFjZUNoaWxkKHZhbHVlLCB0ZXN0KTtcbiAgICAgICAgICAgIGlmIChyYW5nZS5lbmQgPT09IHRlc3QpXG4gICAgICAgICAgICAgICAgcmFuZ2UuZW5kID0gdmFsdWU7XG4gICAgICAgICAgICByYW5nZS5zdGFydCA9IGdvb2QgPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyByZW1vdmUgYW55dGhpbmcgbGVmdCBhZnRlciB0aGUgZ29vZCBjdXJzb3IgZnJvbSB0aGUgaW5zZXJ0IHJhbmdlXG4gICAgd2hpbGUgKGdvb2QgIT09IHJhbmdlLmVuZCkge1xuICAgICAgICB0ZXN0ID0gcmFuZ2UuZW5kO1xuICAgICAgICByYW5nZS5lbmQgPSB0ZXN0LnByZXZpb3VzU2libGluZztcbiAgICAgICAgcGFyZW50LnJlbW92ZUNoaWxkKHRlc3QpO1xuICAgIH1cbiAgICByZXR1cm4gcmFuZ2U7XG4gICAgZnVuY3Rpb24gaW5zZXJ0QXJyYXkoYXJyYXkpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGFycmF5Lmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBhcnJheVtpXTtcbiAgICAgICAgICAgIGlmIChnb29kID09PSByYW5nZS5lbmQpIHtcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgaW5zdGFuY2VvZiBOb2RlKSB7XG4gICAgICAgICAgICAgICAgICAgIGdvb2QgPSByYW5nZS5lbmQgPSAoZ29vZC5uZXh0U2libGluZyA/IHBhcmVudC5pbnNlcnRCZWZvcmUodmFsdWUsIGdvb2QubmV4dFNpYmxpbmcpIDogcGFyZW50LmFwcGVuZENoaWxkKHZhbHVlKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHZhbHVlIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5zZXJ0QXJyYXkodmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSAhPT0gbnVsbCAmJiB2YWx1ZSAhPT0gdW5kZWZpbmVkICYmIHZhbHVlICE9PSBmYWxzZSAmJiB2YWx1ZSAhPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHZhbHVlLnRvU3RyaW5nKCkpO1xuICAgICAgICAgICAgICAgICAgICBnb29kID0gcmFuZ2UuZW5kID0gKGdvb2QubmV4dFNpYmxpbmcgPyBwYXJlbnQuaW5zZXJ0QmVmb3JlKHZhbHVlLCBnb29kLm5leHRTaWJsaW5nKSA6IHBhcmVudC5hcHBlbmRDaGlsZCh2YWx1ZSkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSBpbnN0YW5jZW9mIE5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRlc3QgIT09IHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ29vZCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyYW5nZS5lbmQgPT09IHZhbHVlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByYW5nZS5lbmQgPSB2YWx1ZS5wcmV2aW91c1NpYmxpbmc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcGFyZW50LnJlcGxhY2VDaGlsZCh2YWx1ZSwgdGVzdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmFuZ2Uuc3RhcnQgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocmFuZ2UuZW5kID09PSB0ZXN0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByYW5nZS5lbmQgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXN0ID0gdmFsdWUubmV4dFNpYmxpbmc7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAodGVzdC5uZXh0U2libGluZyA9PT0gdmFsdWUgJiYgdGVzdCAhPT0gdmFsdWUubmV4dFNpYmxpbmcgJiYgdGVzdCAhPT0gcmFuZ2UuZW5kKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudC5yZW1vdmVDaGlsZCh0ZXN0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVzdCA9IHZhbHVlLm5leHRTaWJsaW5nO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJhbmdlLmVuZCA9PT0gdmFsdWUpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByYW5nZS5lbmQgPSB2YWx1ZS5wcmV2aW91c1NpYmxpbmc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUodmFsdWUsIHRlc3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlc3QgPSB0ZXN0Lm5leHRTaWJsaW5nO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGdvb2QgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICBpbnNlcnRBcnJheSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKHZhbHVlICE9PSBudWxsICYmIHZhbHVlICE9PSB1bmRlZmluZWQgJiYgdmFsdWUgIT09IHRydWUgJiYgdmFsdWUgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUudG9TdHJpbmcoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRlc3Qubm9kZVR5cGUgPT09IFRFWFRfTk9ERSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGVzdC5kYXRhID0gdmFsdWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZ29vZCA9PT0gbnVsbClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByYW5nZS5zdGFydCA9IHRlc3Q7XG4gICAgICAgICAgICAgICAgICAgICAgICBnb29kID0gdGVzdCwgdGVzdCA9IGdvb2QubmV4dFNpYmxpbmc7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUodmFsdWUsIHRlc3QpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGdvb2QgPT09IG51bGwpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmFuZ2Uuc3RhcnQgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdvb2QgPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuXG5cbi8vLy8vLy8vLy8vLy8vLy8vL1xuLy8gV0VCUEFDSyBGT09URVJcbi8vIC4vfi9zdXJwbHVzL2VzL2luc2VydC5qc1xuLy8gbW9kdWxlIGlkID0gMTZcbi8vIG1vZHVsZSBjaHVua3MgPSAwIiwiaW1wb3J0IHsgc2V0QXR0cmlidXRlIH0gZnJvbSAnLi9kb20nO1xuaW1wb3J0IHsgZ2V0RmllbGREYXRhIH0gZnJvbSAnLi9maWVsZERhdGEnO1xuaW1wb3J0IHsgc2V0QXR0cmlidXRlTlMgfSBmcm9tICcuL2luZGV4JztcbmV4cG9ydCBmdW5jdGlvbiBhc3NpZ24oYSwgYikge1xuICAgIHZhciBwcm9wcyA9IE9iamVjdC5rZXlzKGIpO1xuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBwcm9wcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgICAgICB2YXIgbmFtZSA9IHByb3BzW2ldO1xuICAgICAgICBhW25hbWVdID0gYltuYW1lXTtcbiAgICB9XG59XG5leHBvcnQgZnVuY3Rpb24gc3ByZWFkKG5vZGUsIG9iaiwgc3ZnKSB7XG4gICAgdmFyIHByb3BzID0gT2JqZWN0LmtleXMob2JqKTtcbiAgICBmb3IgKHZhciBpID0gMCwgbGVuID0gcHJvcHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgdmFyIG5hbWUgPSBwcm9wc1tpXTtcbiAgICAgICAgc2V0RmllbGQobm9kZSwgbmFtZSwgb2JqW25hbWVdLCBzdmcpO1xuICAgIH1cbn1cbmZ1bmN0aW9uIHNldEZpZWxkKG5vZGUsIGZpZWxkLCB2YWx1ZSwgc3ZnKSB7XG4gICAgdmFyIF9hID0gZ2V0RmllbGREYXRhKGZpZWxkLCBzdmcpLCBuYW1lID0gX2FbMF0sIG5hbWVzcGFjZSA9IF9hWzFdLCBmbGFncyA9IF9hWzJdLCB0eXBlID0gZmxhZ3MgJiAzIC8qIFR5cGUgKi87XG4gICAgaWYgKHR5cGUgPT09IDAgLyogUHJvcGVydHkgKi8pIHtcbiAgICAgICAgaWYgKG5hbWVzcGFjZSlcbiAgICAgICAgICAgIG5vZGUgPSBub2RlW25hbWVzcGFjZV07XG4gICAgICAgIG5vZGVbbmFtZV0gPSB2YWx1ZTtcbiAgICB9XG4gICAgZWxzZSBpZiAodHlwZSA9PT0gMSAvKiBBdHRyaWJ1dGUgKi8pIHtcbiAgICAgICAgaWYgKG5hbWVzcGFjZSlcbiAgICAgICAgICAgIHNldEF0dHJpYnV0ZU5TKG5vZGUsIG5hbWVzcGFjZSwgbmFtZSwgdmFsdWUpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzZXRBdHRyaWJ1dGUobm9kZSwgbmFtZSwgdmFsdWUpO1xuICAgIH1cbiAgICBlbHNlIGlmICh0eXBlID09PSAzIC8qIEFzc2lnbiAqLykge1xuICAgICAgICBpZiAodmFsdWUgJiYgdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JylcbiAgICAgICAgICAgIGFzc2lnbihub2RlLnN0eWxlLCB2YWx1ZSk7XG4gICAgfVxufVxuXG5cblxuLy8vLy8vLy8vLy8vLy8vLy8vXG4vLyBXRUJQQUNLIEZPT1RFUlxuLy8gLi9+L3N1cnBsdXMvZXMvc3ByZWFkLmpzXG4vLyBtb2R1bGUgaWQgPSAxN1xuLy8gbW9kdWxlIGNodW5rcyA9IDAiXSwic291cmNlUm9vdCI6IiJ9