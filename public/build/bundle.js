
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (!store || typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, callback) {
        const unsub = store.subscribe(callback);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if (typeof $$scope.dirty === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? undefined : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let stylesheet;
    let active = 0;
    let current_rules = {};
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        if (!current_rules[name]) {
            if (!stylesheet) {
                const style = element('style');
                document.head.appendChild(style);
                stylesheet = style.sheet;
            }
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        node.style.animation = (node.style.animation || '')
            .split(', ')
            .filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        )
            .join(', ');
        if (name && !--active)
            clear_rules();
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            let i = stylesheet.cssRules.length;
            while (i--)
                stylesheet.deleteRule(i);
            current_rules = {};
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            $$.fragment && $$.fragment.p($$.ctx, $$.dirty);
            $$.dirty = [-1];
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined' ? window : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }
    function expoOut(t) {
        return t === 1.0 ? t : 1.0 - Math.pow(2.0, -10.0 * t);
    }

    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    /* src/components/layout/Page.svelte generated by Svelte v3.16.3 */
    const file = "src/components/layout/Page.svelte";

    function create_fragment(ctx) {
    	let div;
    	let div_outro;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "svelte-1fgtgu0");
    			add_location(div, file, 26, 0, 483);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 2) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[1], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			if (div_outro) div_outro.end(1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			div_outro = create_out_transition(div, fly, /*flyOptions*/ ctx[0]);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let flyOptions = {
    		x: -100,
    		duration: 600,
    		opacity: 1,
    		easing: expoOut
    	};

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("flyOptions" in $$props) $$invalidate(0, flyOptions = $$props.flyOptions);
    	};

    	return [flyOptions, $$scope, $$slots];
    }

    class Page extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Page",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/components/Icon.svelte generated by Svelte v3.16.3 */

    const file$1 = "src/components/Icon.svelte";

    // (120:0) {:else}
    function create_else_block(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("wrong iconname");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(120:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (116:28) 
    function create_if_block_15(ctx) {
    	let svg;
    	let line0;
    	let line1;
    	let line2;
    	let line3;
    	let line4;
    	let line5;
    	let line6;
    	let line7;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			line0 = svg_element("line");
    			line1 = svg_element("line");
    			line2 = svg_element("line");
    			line3 = svg_element("line");
    			line4 = svg_element("line");
    			line5 = svg_element("line");
    			line6 = svg_element("line");
    			line7 = svg_element("line");
    			attr_dev(line0, "x1", "12");
    			attr_dev(line0, "y1", "2");
    			attr_dev(line0, "x2", "12");
    			attr_dev(line0, "y2", "6");
    			add_location(line0, file$1, 117, 0, 28180);
    			attr_dev(line1, "x1", "12");
    			attr_dev(line1, "y1", "18");
    			attr_dev(line1, "x2", "12");
    			attr_dev(line1, "y2", "22");
    			add_location(line1, file$1, 117, 43, 28223);
    			attr_dev(line2, "x1", "4.93");
    			attr_dev(line2, "y1", "4.93");
    			attr_dev(line2, "x2", "7.76");
    			attr_dev(line2, "y2", "7.76");
    			add_location(line2, file$1, 117, 88, 28268);
    			attr_dev(line3, "x1", "16.24");
    			attr_dev(line3, "y1", "16.24");
    			attr_dev(line3, "x2", "19.07");
    			attr_dev(line3, "y2", "19.07");
    			add_location(line3, file$1, 117, 141, 28321);
    			attr_dev(line4, "x1", "2");
    			attr_dev(line4, "y1", "12");
    			attr_dev(line4, "x2", "6");
    			attr_dev(line4, "y2", "12");
    			add_location(line4, file$1, 117, 198, 28378);
    			attr_dev(line5, "x1", "18");
    			attr_dev(line5, "y1", "12");
    			attr_dev(line5, "x2", "22");
    			attr_dev(line5, "y2", "12");
    			add_location(line5, file$1, 117, 241, 28421);
    			attr_dev(line6, "x1", "4.93");
    			attr_dev(line6, "y1", "19.07");
    			attr_dev(line6, "x2", "7.76");
    			attr_dev(line6, "y2", "16.24");
    			add_location(line6, file$1, 117, 286, 28466);
    			attr_dev(line7, "x1", "16.24");
    			attr_dev(line7, "y1", "7.76");
    			attr_dev(line7, "x2", "19.07");
    			attr_dev(line7, "y2", "4.93");
    			add_location(line7, file$1, 117, 341, 28521);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			set_style(svg, "width", /*size*/ ctx[4] + "px");
    			set_style(svg, "height", /*size*/ ctx[4] + "px");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "width", "56");
    			attr_dev(svg, "height", "56");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "preserveAspectRatio", "none");
    			attr_dev(svg, "stroke", "currentColor");
    			attr_dev(svg, "stroke-width", "2");
    			attr_dev(svg, "stroke-linecap", "round");
    			attr_dev(svg, "stroke-linejoin", "round");
    			attr_dev(svg, "class", "svelte-1200cyk");
    			toggle_class(svg, "left", /*left*/ ctx[1]);
    			toggle_class(svg, "right", /*right*/ ctx[2]);
    			toggle_class(svg, "active", /*active*/ ctx[3]);
    			add_location(svg, file$1, 116, 0, 27884);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, line0);
    			append_dev(svg, line1);
    			append_dev(svg, line2);
    			append_dev(svg, line3);
    			append_dev(svg, line4);
    			append_dev(svg, line5);
    			append_dev(svg, line6);
    			append_dev(svg, line7);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*size*/ 16) {
    				set_style(svg, "width", /*size*/ ctx[4] + "px");
    			}

    			if (dirty & /*size*/ 16) {
    				set_style(svg, "height", /*size*/ ctx[4] + "px");
    			}

    			if (dirty & /*left*/ 2) {
    				toggle_class(svg, "left", /*left*/ ctx[1]);
    			}

    			if (dirty & /*right*/ 4) {
    				toggle_class(svg, "right", /*right*/ ctx[2]);
    			}

    			if (dirty & /*active*/ 8) {
    				toggle_class(svg, "active", /*active*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_15.name,
    		type: "if",
    		source: "(116:28) ",
    		ctx
    	});

    	return block;
    }

    // (111:28) 
    function create_if_block_14(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M19.1031052 5.19949494L16.3178239 3.41421356C15.5367753 2.63316498 15.5367753 1.36683502 16.3178239.585786438 17.0988724-.195262146 18.3652024-.195262146 19.146251.585786438L26.2173188 5.65685425C26.2958496 5.73538501 26.3664844 5.81882166 26.4292234 5.90617766 26.7251225 6.25487776 26.9036103 6.70634232 26.9036103 7.19949494 26.9036103 7.77726249 26.6586182 8.29780906 26.2668515 8.66291716 26.2507052 8.68023598 26.2341943 8.69733804 26.2173188 8.71421356L19.146251 13.7852814C18.3652024 14.56633 17.0988724 14.56633 16.3178239 13.7852814 15.5367753 13.0042328 15.5367753 11.7379028 16.3178239 10.9568542L19.0751832 9.19949494 18.9036103 9.19949494C11.2940904 9.2 5.00800417 14.8662932 4.03448654 22.2097446 4.02615749 22.2725724 4.0181201 22.3402035 4.01037436 22.4126379 3.90169745 23.4291076 3.04397499 24.2 2.0217122 24.2L1.83151776 24.2000157C.819998432 24.2000157 0 23.3800173 0 22.368498 0 22.3040622.00340043011 22.2396713.0101871051 22.175594 1.02077426 12.6339908 9.09404148 5.2 18.9036103 5.2L19.1031052 5.19949494zM18.8005051 43.0005208L21.5857864 44.7858022C22.366835 45.5668507 22.366835 46.8331807 21.5857864 47.6142293 20.8047379 48.3952779 19.5384079 48.3952779 18.7573593 47.6142293L11.6862915 42.5431615C11.6077607 42.4646307 11.5371259 42.3811941 11.4743869 42.2938381 11.1784878 41.945138 11 41.4936734 11 41.0005208 11 40.4227532 11.2449921 39.9022067 11.6367588 39.5370986 11.6529051 39.5197797 11.669416 39.5026777 11.6862915 39.4858022L18.7573593 34.4147344C19.5384079 33.6336858 20.8047379 33.6336858 21.5857864 34.4147344 22.366835 35.1957829 22.366835 36.4621129 21.5857864 37.2431615L18.8284271 39.0005208 19 39.0005208C26.6095199 39.0000157 32.8956061 33.3337226 33.8691237 25.9902711 33.8774528 25.9274433 33.8854902 25.8598122 33.8932359 25.7873778 34.0019128 24.7709081 34.8596353 24.0000157 35.8818981 24.0000157L36.0720925 24C37.0836119 24 37.9036103 24.8199984 37.9036103 25.8315178 37.9036103 25.8959535 37.9002099 25.9603444 37.8934232 26.0244218 36.882836 35.5660249 28.8095688 43.0000157 19 43.0000157L18.8005051 43.0005208z");
    			attr_dev(path, "transform", "translate(9 4)");
    			add_location(path, file$1, 113, 2, 25740);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			set_style(svg, "width", /*size*/ ctx[4] + "px");
    			set_style(svg, "height", /*size*/ ctx[4] + "px");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "width", "56");
    			attr_dev(svg, "height", "56");
    			attr_dev(svg, "viewBox", "0 0 56 56");
    			attr_dev(svg, "class", "svelte-1200cyk");
    			toggle_class(svg, "left", /*left*/ ctx[1]);
    			toggle_class(svg, "right", /*right*/ ctx[2]);
    			toggle_class(svg, "active", /*active*/ ctx[3]);
    			add_location(svg, file$1, 112, 0, 25555);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*size*/ 16) {
    				set_style(svg, "width", /*size*/ ctx[4] + "px");
    			}

    			if (dirty & /*size*/ 16) {
    				set_style(svg, "height", /*size*/ ctx[4] + "px");
    			}

    			if (dirty & /*left*/ 2) {
    				toggle_class(svg, "left", /*left*/ ctx[1]);
    			}

    			if (dirty & /*right*/ 4) {
    				toggle_class(svg, "right", /*right*/ ctx[2]);
    			}

    			if (dirty & /*active*/ 8) {
    				toggle_class(svg, "active", /*active*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_14.name,
    		type: "if",
    		source: "(111:28) ",
    		ctx
    	});

    	return block;
    }

    // (106:29) 
    function create_if_block_13(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M19,7.99949494 L19.1994949,7.99949494 L15.4142136,4.21421356 C14.633165,3.43316498 14.633165,2.16683502 15.4142136,1.38578644 C16.1952621,0.604737854 17.4615921,0.604737854 18.2426407,1.38578644 L25.3137085,8.45685425 C25.3922393,8.53538501 25.4628741,8.61882166 25.5256131,8.70617766 C25.8215122,9.05487776 26,9.50634232 26,9.99949494 C26,10.5772625 25.7550079,11.0978091 25.3632412,11.4629172 C25.3470949,11.480236 25.330584,11.497338 25.3137085,11.5142136 L18.2426407,18.5852814 C17.4615921,19.36633 16.1952621,19.36633 15.4142136,18.5852814 C14.633165,17.8042328 14.633165,16.5379028 15.4142136,15.7568542 L19.1715729,11.9994949 L19,11.9994949 C10.7157288,12 4,18.7157288 4,27 C4,35.2842712 10.7157288,42 19,42 C26.2546803,42 32.3064753,36.8498356 33.6986842,30.0062078 C33.7632725,29.6887136 33.8203392,29.285971 33.8698844,28.79798 C33.9735554,27.7768814 34.8333145,26.9999927 35.8596625,26.9999927 L36,27 C36.0563615,27 36.1126945,27.002536 36.168828,27.0076002 C37.2023373,27.1008414 37.9645751,28.014253 37.871334,29.0477622 L37.8713547,29.0477641 C37.8282658,29.525373 37.7791614,29.9243467 37.7240416,30.244685 C36.1844378,39.1923613 28.3872235,46 19,46 C8.50658975,46 0,37.4934102 0,27 C0,16.5065898 8.50658975,8 19,8 L19,7.99949494 Z");
    			attr_dev(path, "transform", "translate(9 5)");
    			add_location(path, file$1, 108, 2, 24217);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			set_style(svg, "width", /*size*/ ctx[4] + "px");
    			set_style(svg, "height", /*size*/ ctx[4] + "px");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "width", "56");
    			attr_dev(svg, "height", "56");
    			attr_dev(svg, "viewBox", "0 0 56 56");
    			attr_dev(svg, "class", "svelte-1200cyk");
    			toggle_class(svg, "left", /*left*/ ctx[1]);
    			toggle_class(svg, "right", /*right*/ ctx[2]);
    			toggle_class(svg, "active", /*active*/ ctx[3]);
    			add_location(svg, file$1, 107, 0, 24032);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*size*/ 16) {
    				set_style(svg, "width", /*size*/ ctx[4] + "px");
    			}

    			if (dirty & /*size*/ 16) {
    				set_style(svg, "height", /*size*/ ctx[4] + "px");
    			}

    			if (dirty & /*left*/ 2) {
    				toggle_class(svg, "left", /*left*/ ctx[1]);
    			}

    			if (dirty & /*right*/ 4) {
    				toggle_class(svg, "right", /*right*/ ctx[2]);
    			}

    			if (dirty & /*active*/ 8) {
    				toggle_class(svg, "active", /*active*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_13.name,
    		type: "if",
    		source: "(106:29) ",
    		ctx
    	});

    	return block;
    }

    // (101:36) 
    function create_if_block_12(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "d", "M21.2400395,12.8053834 L20.8055019,11.8293959 C20.356233,10.8203215 20.8100451,9.63810061 21.8191195,9.18883172 C22.828194,8.73956283 24.0104148,9.1933749 24.4596837,10.2024493 L24.8921899,11.1738741 C26.5560169,10.6068963 28.2715564,10.2462091 30,10.0897787 L30,9 C30,7.8954305 30.8954305,7 32,7 C33.1045695,7 34,7.8954305 34,9 L34,10.0909951 C35.8472287,10.2591774 37.6749765,10.6597125 39.4356116,11.290104 L39.8956827,10.3034783 C40.3624939,9.30239837 41.5524549,8.86928801 42.5535348,9.33609926 C43.5546147,9.8029105 43.9877251,10.9928714 43.5209138,11.9939514 L43.0625786,12.9768544 C44.431363,13.7732686 45.7299994,14.7282745 46.9308713,15.8404247 L47.7433121,15.1088998 C48.5641672,14.3697985 49.8287617,14.4360731 50.567863,15.2569282 C51.3069642,16.0777833 51.2406896,17.3423778 50.4198345,18.0814791 L49.6098316,18.810809 C50.6727254,20.2265508 51.5409432,21.737002 52.2163146,23.3072515 L53.2530807,22.9703858 C54.3035887,22.629055 55.431897,23.2039568 55.7732277,24.2544648 C56.1145585,25.3049728 55.5396567,26.4332811 54.4891487,26.7746118 L53.4539436,27.1109704 C53.8431139,28.8259388 54.0236868,30.5761161 53.9977439,32.3217834 L55.076543,32.4351698 C56.1750615,32.5506287 56.9719888,33.5347519 56.8565298,34.6332705 C56.7410709,35.731789 55.7569477,36.5287163 54.6584291,36.4132574 L53.5771148,36.2996066 C53.2424921,37.9856926 52.7099258,39.6380932 51.9813921,41.2191018 L52.9235035,41.76303 C53.8800887,42.3153148 54.207839,43.5384956 53.6555543,44.4950808 C53.1032695,45.4516661 51.8800887,45.7794164 50.9235035,45.2271316 L49.9817307,44.6833989 C49.053643,45.9966348 47.9662019,47.2278873 46.7208733,48.3491862 C46.6306576,48.4304168 46.5399545,48.5107631 46.4487749,48.5902255 L47.0749093,49.4520257 C47.724159,50.3456412 47.5260613,51.5963805 46.6324458,52.2456302 C45.7388303,52.8948798 44.488091,52.6967822 43.8388413,51.8031667 L43.2085112,50.9355917 C41.7274426,51.8144087 40.1688974,52.502833 38.5668581,53.0026455 L38.798209,54.0910658 C39.0278619,55.1714978 38.3381692,56.2335314 37.2577372,56.4631844 C36.1773052,56.6928373 35.1152715,56.0031445 34.8856186,54.9227125 L34.6556919,53.8409923 C32.9140439,54.0512308 31.1542243,54.0528808 29.4162069,53.8480372 L29.1877263,54.9229539 C28.9580734,56.0033859 27.8960398,56.6930786 26.8156077,56.4634257 C25.7351757,56.2337728 25.045483,55.1717391 25.2751359,54.0913071 L25.5023999,53.0221144 C23.7482421,52.4817523 22.0509189,51.7184428 20.4558003,50.7345637 L19.7830143,51.6273808 C19.1182678,52.5095293 17.8642617,52.6857683 16.9821132,52.0210218 C16.0999648,51.3562753 15.9237258,50.1022692 16.5884723,49.2201207 L17.2576221,48.3321289 C16.7007553,47.8282423 16.1642574,47.2911102 15.6508138,46.7208733 C15.0706039,46.0764849 14.5355139,45.4072367 14.0453408,44.7170039 L13.0814157,45.2735336 C12.1248305,45.8258183 10.9016497,45.498068 10.3493649,44.5414828 C9.79708016,43.5848975 10.1248305,42.3617167 11.0814157,41.809432 L12.0363964,41.2580736 C11.3206042,39.7159166 10.7946244,38.1108309 10.4566735,36.4768488 L9.22655442,36.6061396 C8.12803586,36.7215985 7.14391265,35.9246712 7.0284537,34.8261527 C6.91299475,33.7276341 7.70992201,32.7435109 8.80844056,32.628052 L10.0053531,32.5022514 C9.96598863,30.7436347 10.1364427,28.9832547 10.5145887,27.2616902 L9.41018382,26.9028473 C8.3596758,26.5615165 7.78477403,25.4332083 8.12610478,24.3827003 C8.46743553,23.3321923 9.59574378,22.7572905 10.6462518,23.0986212 L11.7242127,23.448872 C12.393607,21.8586929 13.2567817,20.3337981 14.3117979,18.9111863 L13.4907099,18.1718753 C12.6698548,17.4327741 12.6035802,16.1681796 13.3426814,15.3473245 C14.0817827,14.5264694 15.3463772,14.4601948 16.1672323,15.199296 L16.976712,15.9281549 C17.07646,15.8349824 17.1772652,15.7425303 17.2791267,15.6508138 C18.5168657,14.5363486 19.8463239,13.5883515 21.2400395,12.8053834 L21.2400395,12.8053834 Z M40.9805788,21.2576257 L31.4949163,29.7985547 L19.408548,25.8714556 C20.1744411,24.2965137 21.2506296,22.8399183 22.6321715,21.5959724 C27.880234,16.8705958 35.7194605,16.8481169 40.9805788,21.2576257 Z M43.6515651,24.2351898 C47.4533379,29.924533 46.6024795,37.6907266 41.3678285,42.4040276 C39.9706384,43.6620632 38.389791,44.5867657 36.7228301,45.1832469 L34.0985114,32.836798 L43.6515651,24.2351898 Z M32.802291,45.9774979 C28.7096781,46.209827 24.5522951,44.6511574 21.5959724,41.3678285 C18.6253177,38.0685822 17.5133105,33.7452736 18.1926419,29.6822326 L30.1655179,33.5724559 L32.802291,45.9774979 Z M18.6233931,44.0443509 C25.2753045,51.4320469 36.6566549,52.0285182 44.0443509,45.3766069 C51.4320469,38.7246955 52.0285182,27.3433451 45.3766069,19.9556491 C38.7246955,12.5679531 27.3433451,11.9714818 19.9556491,18.6233931 C12.5679531,25.2753045 11.9714818,36.6566549 18.6233931,44.0443509 Z");
    			attr_dev(path, "transform", "translate(-4 -4)");
    			add_location(path, file$1, 103, 2, 19199);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			set_style(svg, "width", /*size*/ ctx[4] + "px");
    			set_style(svg, "height", /*size*/ ctx[4] + "px");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "width", "56");
    			attr_dev(svg, "height", "56");
    			attr_dev(svg, "viewBox", "0 0 56 56");
    			attr_dev(svg, "class", "svelte-1200cyk");
    			toggle_class(svg, "left", /*left*/ ctx[1]);
    			toggle_class(svg, "right", /*right*/ ctx[2]);
    			toggle_class(svg, "active", /*active*/ ctx[3]);
    			add_location(svg, file$1, 102, 0, 19014);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*size*/ 16) {
    				set_style(svg, "width", /*size*/ ctx[4] + "px");
    			}

    			if (dirty & /*size*/ 16) {
    				set_style(svg, "height", /*size*/ ctx[4] + "px");
    			}

    			if (dirty & /*left*/ 2) {
    				toggle_class(svg, "left", /*left*/ ctx[1]);
    			}

    			if (dirty & /*right*/ 4) {
    				toggle_class(svg, "right", /*right*/ ctx[2]);
    			}

    			if (dirty & /*active*/ 8) {
    				toggle_class(svg, "active", /*active*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_12.name,
    		type: "if",
    		source: "(101:36) ",
    		ctx
    	});

    	return block;
    }

    // (96:30) 
    function create_if_block_11(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M8.3600392,21.4001281 C8.12393983,22.5632842 8,23.7671683 8,25 C8,34.9411255 16.0588745,43 26,43 C26.5207131,43 27.0362619,42.9778894 27.5457589,42.9345559 L24.0522381,26.4988326 L8.3600392,21.4001281 L8.3600392,21.4001281 Z M9.58943226,17.5937333 L25.3816364,22.7249315 L37.8768768,11.4741665 C34.707444,8.68891794 30.550956,7 26,7 C18.6989437,7 12.4131487,11.3468502 9.58943226,17.5937333 L9.58943226,17.5937333 Z M31.4692217,42.1540599 C38.7362428,39.8391185 44,33.0342674 44,25 C44,21.0506384 42.728088,17.3983478 40.571544,14.4304082 L27.9852316,25.7631748 L31.4692217,42.1540599 L31.4692217,42.1540599 Z M15.2403873,5.80616457 L14.8055019,4.82939592 C14.356233,3.82032147 14.8100451,2.63810061 15.8191195,2.18883172 C16.828194,1.73956283 18.0104148,2.1933749 18.4596837,3.20244935 L18.8920512,4.17356269 C20.5174199,3.61898488 22.2284316,3.24933062 24,3.08968603 L24,2 C24,0.8954305 24.8954305,2.02906125e-16 26,0 C27.1045695,-2.02906125e-16 28,0.8954305 28,2 L28,3.08968603 C29.8913079,3.26012091 31.7135962,3.66991376 33.4363408,4.28854021 L33.8956827,3.30347831 C34.3624939,2.30239837 35.5524549,1.86928801 36.5535348,2.33609926 C37.5546147,2.8029105 37.9877251,3.99287142 37.5209138,4.99395135 L37.0615918,5.97897057 C38.455714,6.79146738 39.7524083,7.75284424 40.9298859,8.84131202 L41.7433121,8.10889975 C42.5641672,7.36979849 43.8287617,7.43607308 44.567863,8.25692819 C45.3069642,9.0777833 45.2406896,10.3423778 44.4198345,11.0814791 L43.609768,11.8108663 C44.6463907,13.1927218 45.5241598,14.7005872 46.2159746,16.307362 L47.2530807,15.9703858 C48.3035887,15.629055 49.431897,16.2039568 49.7732277,17.2544648 C50.1145585,18.3049728 49.5396567,19.4332811 48.4891487,19.7746118 L47.4547568,20.1107061 C47.8115952,21.6831524 48,23.3195741 48,25 C48,25.107441 47.9992298,25.2147022 47.9976947,25.3217782 L49.076543,25.4351698 C50.1750615,25.5506287 50.9719888,26.5347519 50.8565298,27.6332705 C50.7410709,28.731789 49.7569477,29.5287163 48.6584291,29.4132574 L47.5799947,29.2999093 C47.2391393,31.0202092 46.6977136,32.6683474 45.9811053,34.2189362 L46.9235035,34.76303 C47.8800887,35.3153148 48.207839,36.5384956 47.6555543,37.4950808 C47.1032695,38.4516661 45.8800887,38.7794164 44.9235035,38.2271316 L43.979132,37.6818985 C42.9614736,39.1219995 41.7751545,40.4344299 40.4489281,41.5904364 L41.0749093,42.4520257 C41.724159,43.3456412 41.5260613,44.5963805 40.6324458,45.2456302 C39.7388303,45.8948798 38.488091,45.6967822 37.8388413,44.8031667 L37.2080279,43.9349265 C35.7597641,44.7940375 34.2044813,45.4917193 32.5669717,46.0031798 L32.798209,47.0910658 C33.0278619,48.1714978 32.3381692,49.2335314 31.2577372,49.4631844 C30.1773052,49.6928373 29.1152715,49.0031445 28.8856186,47.9227125 L28.6557651,46.8413369 C27.7851383,46.9460935 26.8988644,47 26,47 C25.1257587,47 24.2634276,46.9490064 23.4158189,46.8498313 L23.1877263,47.9229539 C22.9580734,49.0033859 21.8960398,49.6930786 20.8156077,49.4634257 C19.7351757,49.2337728 19.045483,48.1717391 19.2751359,47.0913071 L19.50188,46.0245602 C17.7121052,45.4720233 16.0198712,44.6972327 14.4574131,43.7324234 L13.7830143,44.6273808 C13.1182678,45.5095293 11.8642617,45.6857683 10.9821132,45.0210218 C10.0999648,44.3562753 9.92372575,43.1022692 10.5884723,42.2201207 L11.2585602,41.330884 C10.0605224,40.2487669 8.98213187,39.0366793 8.04561828,37.716851 L7.08141571,38.2735336 C6.12483047,38.8258183 4.90164966,38.498068 4.34936491,37.5414828 C3.79708016,36.5848975 4.12483047,35.3617167 5.08141571,34.809432 L6.03689514,34.2577857 C5.33606556,32.7490945 4.80122777,31.1476584 4.45584077,29.4769364 L3.22655442,29.6061396 C2.12803586,29.7215985 1.14391265,28.9246712 1.0284537,27.8261527 C0.912994747,26.7276341 1.70992201,25.7435109 2.80844056,25.628052 L4.00561824,25.5022235 C4.00187981,25.3352679 4,25.1678535 4,25 C4,23.3729601 4.17662392,21.7871729 4.51174423,20.260766 L3.41018382,19.9028473 C2.3596758,19.5615165 1.78477403,18.4332083 2.12610478,17.3827003 C2.46743553,16.3321923 3.59574378,15.7572905 4.6462518,16.0986212 L5.72374944,16.4487214 C6.40782528,14.828669 7.28039221,13.3076487 8.31396926,11.9131414 L7.49070987,11.1718753 C6.66985476,10.4327741 6.60358017,9.16817959 7.34268143,8.34732448 C8.08178269,7.52646937 9.34637718,7.46019478 10.1672323,8.19929604 L10.9767115,8.92815438 C12.2630419,7.72524323 13.6938911,6.6749561 15.2403873,5.80616457 L15.2403873,5.80616457 Z");
    			attr_dev(path, "transform", "translate(2 3)");
    			add_location(path, file$1, 98, 2, 14551);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			set_style(svg, "width", /*size*/ ctx[4] + "px");
    			set_style(svg, "height", /*size*/ ctx[4] + "px");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "width", "56");
    			attr_dev(svg, "height", "56");
    			attr_dev(svg, "viewBox", "0 0 56 56");
    			attr_dev(svg, "class", "svelte-1200cyk");
    			toggle_class(svg, "left", /*left*/ ctx[1]);
    			toggle_class(svg, "right", /*right*/ ctx[2]);
    			toggle_class(svg, "active", /*active*/ ctx[3]);
    			add_location(svg, file$1, 97, 0, 14366);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*size*/ 16) {
    				set_style(svg, "width", /*size*/ ctx[4] + "px");
    			}

    			if (dirty & /*size*/ 16) {
    				set_style(svg, "height", /*size*/ ctx[4] + "px");
    			}

    			if (dirty & /*left*/ 2) {
    				toggle_class(svg, "left", /*left*/ ctx[1]);
    			}

    			if (dirty & /*right*/ 4) {
    				toggle_class(svg, "right", /*right*/ ctx[2]);
    			}

    			if (dirty & /*active*/ 8) {
    				toggle_class(svg, "active", /*active*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_11.name,
    		type: "if",
    		source: "(96:30) ",
    		ctx
    	});

    	return block;
    }

    // (88:26) 
    function create_if_block_10(ctx) {
    	let svg;
    	let g;
    	let path0;
    	let path1;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			g = svg_element("g");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr_dev(path0, "d", "M31.1114229,23.4545686 C30.3303743,24.2356172 29.0640444,24.2356172 28.2829958,23.4545686 L25.1010153,20.2725881 C22.2885484,17.4601212 17.893514,17.3785639 15.2865858,19.9854921 L6.42914296,28.842935 C3.82221472,31.4498632 3.90377205,35.8448976 6.71623894,38.6573644 L9.34263556,41.2837611 C12.1551024,44.0962279 16.5501368,44.1777853 19.157065,41.570857 L24.7022708,36.0256512 C25.4833194,35.2446026 26.7496494,35.2446026 27.530698,36.0256512 C28.3117465,36.8066998 28.3117465,38.0730298 27.530698,38.8540784 L21.9854921,44.3992842 C17.7924945,48.5922818 10.8657648,48.4637446 6.51420843,44.1121882 L3.88781182,41.4857916 C-0.463744575,37.1342352 -0.592281826,30.2075055 3.60071583,26.0145079 L12.4581587,17.157065 C16.6511563,12.9640674 23.577886,13.0926046 27.9294424,17.444161 L31.1114229,20.6261415 C31.8924715,21.4071901 31.8924715,22.6735201 31.1114229,23.4545686 Z");
    			add_location(path0, file$1, 91, 4, 12530);
    			attr_dev(path1, "d", "M16.231978,23.8888322 C17.0130265,23.1077836 18.2793565,23.1077836 19.0604051,23.8888322 L22.8989847,27.7274119 C25.7114516,30.5398788 30.106486,30.6214361 32.7134142,28.0145079 L41.570857,19.157065 C44.1777853,16.5501368 44.0962279,12.1551024 41.2837611,9.34263556 L38.6573644,6.71623894 C35.8448976,3.90377205 31.4498632,3.82221472 28.842935,6.42914296 L23.2977292,11.9743488 C22.5166806,12.7553974 21.2503506,12.7553974 20.469302,11.9743488 C19.6882535,11.1933002 19.6882535,9.92697023 20.469302,9.14592164 L26.0145079,3.60071583 C30.2075055,-0.592281826 37.1342352,-0.463744575 41.4857916,3.88781182 L44.1121882,6.51420843 C48.4637446,10.8657648 48.5922818,17.7924945 44.3992842,21.9854921 L35.5418413,30.842935 C31.3488437,35.0359326 24.422114,34.9073954 20.0705576,30.555839 L16.231978,26.7172593 C15.4509294,25.9362107 15.4509294,24.6698808 16.231978,23.8888322 Z");
    			add_location(path1, file$1, 92, 4, 13420);
    			attr_dev(g, "transform", "translate(4 4)");
    			add_location(g, file$1, 90, 2, 12495);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			set_style(svg, "width", /*size*/ ctx[4] + "px");
    			set_style(svg, "height", /*size*/ ctx[4] + "px");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "width", "56");
    			attr_dev(svg, "height", "56");
    			attr_dev(svg, "viewBox", "0 0 56 56");
    			attr_dev(svg, "class", "svelte-1200cyk");
    			toggle_class(svg, "left", /*left*/ ctx[1]);
    			toggle_class(svg, "right", /*right*/ ctx[2]);
    			toggle_class(svg, "active", /*active*/ ctx[3]);
    			add_location(svg, file$1, 89, 0, 12310);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, g);
    			append_dev(g, path0);
    			append_dev(g, path1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*size*/ 16) {
    				set_style(svg, "width", /*size*/ ctx[4] + "px");
    			}

    			if (dirty & /*size*/ 16) {
    				set_style(svg, "height", /*size*/ ctx[4] + "px");
    			}

    			if (dirty & /*left*/ 2) {
    				toggle_class(svg, "left", /*left*/ ctx[1]);
    			}

    			if (dirty & /*right*/ 4) {
    				toggle_class(svg, "right", /*right*/ ctx[2]);
    			}

    			if (dirty & /*active*/ 8) {
    				toggle_class(svg, "active", /*active*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_10.name,
    		type: "if",
    		source: "(88:26) ",
    		ctx
    	});

    	return block;
    }

    // (83:36) 
    function create_if_block_9(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "d", "M8,0 L42,0 C46.418278,-8.11624501e-16 50,3.581722 50,8 L50,42 C50,46.418278 46.418278,50 42,50 L8,50 C3.581722,50 5.41083001e-16,46.418278 0,42 L0,8 C-5.41083001e-16,3.581722 3.581722,8.11624501e-16 8,0 Z M8,4 C5.790861,4 4,5.790861 4,8 L4,16 L46,16 L46,8 C46,5.790861 44.209139,4 42,4 L8,4 Z M9,33 C10.1045695,33 11,32.1045695 11,31 C11,29.8954305 10.1045695,29 9,29 C7.8954305,29 7,29.8954305 7,31 C7,32.1045695 7.8954305,33 9,33 Z M9,42 C10.1045695,42 11,41.1045695 11,40 C11,38.8954305 10.1045695,38 9,38 C7.8954305,38 7,38.8954305 7,40 C7,41.1045695 7.8954305,42 9,42 Z M17,33 C18.1045695,33 19,32.1045695 19,31 C19,29.8954305 18.1045695,29 17,29 C15.8954305,29 15,29.8954305 15,31 C15,32.1045695 15.8954305,33 17,33 Z M17,42 C18.1045695,42 19,41.1045695 19,40 C19,38.8954305 18.1045695,38 17,38 C15.8954305,38 15,38.8954305 15,40 C15,41.1045695 15.8954305,42 17,42 Z M25,33 C26.1045695,33 27,32.1045695 27,31 C27,29.8954305 26.1045695,29 25,29 C23.8954305,29 23,29.8954305 23,31 C23,32.1045695 23.8954305,33 25,33 Z M25,42 C26.1045695,42 27,41.1045695 27,40 C27,38.8954305 26.1045695,38 25,38 C23.8954305,38 23,38.8954305 23,40 C23,41.1045695 23.8954305,42 25,42 Z M33,33 C34.1045695,33 35,32.1045695 35,31 C35,29.8954305 34.1045695,29 33,29 C31.8954305,29 31,29.8954305 31,31 C31,32.1045695 31.8954305,33 33,33 Z M33,42 C34.1045695,42 35,41.1045695 35,40 C35,38.8954305 34.1045695,38 33,38 C31.8954305,38 31,38.8954305 31,40 C31,41.1045695 31.8954305,42 33,42 Z M41,33 C42.1045695,33 43,32.1045695 43,31 C43,29.8954305 42.1045695,29 41,29 C39.8954305,29 39,29.8954305 39,31 C39,32.1045695 39.8954305,33 41,33 Z M41,42 C42.1045695,42 43,41.1045695 43,40 C43,38.8954305 42.1045695,38 41,38 C39.8954305,38 39,38.8954305 39,40 C39,41.1045695 39.8954305,42 41,42 Z");
    			attr_dev(path, "transform", "translate(3 3)");
    			add_location(path, file$1, 85, 2, 10436);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			set_style(svg, "width", /*size*/ ctx[4] + "px");
    			set_style(svg, "height", /*size*/ ctx[4] + "px");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "width", "56");
    			attr_dev(svg, "height", "56");
    			attr_dev(svg, "viewBox", "0 0 56 56");
    			attr_dev(svg, "class", "svelte-1200cyk");
    			toggle_class(svg, "left", /*left*/ ctx[1]);
    			toggle_class(svg, "right", /*right*/ ctx[2]);
    			toggle_class(svg, "active", /*active*/ ctx[3]);
    			add_location(svg, file$1, 84, 0, 10251);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*size*/ 16) {
    				set_style(svg, "width", /*size*/ ctx[4] + "px");
    			}

    			if (dirty & /*size*/ 16) {
    				set_style(svg, "height", /*size*/ ctx[4] + "px");
    			}

    			if (dirty & /*left*/ 2) {
    				toggle_class(svg, "left", /*left*/ ctx[1]);
    			}

    			if (dirty & /*right*/ 4) {
    				toggle_class(svg, "right", /*right*/ ctx[2]);
    			}

    			if (dirty & /*active*/ 8) {
    				toggle_class(svg, "active", /*active*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(83:36) ",
    		ctx
    	});

    	return block;
    }

    // (66:30) 
    function create_if_block_8(ctx) {
    	let svg;
    	let g;
    	let path;
    	let circle0;
    	let circle1;
    	let circle2;
    	let circle3;
    	let circle4;
    	let circle5;
    	let circle6;
    	let circle7;
    	let circle8;
    	let circle9;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			g = svg_element("g");
    			path = svg_element("path");
    			circle0 = svg_element("circle");
    			circle1 = svg_element("circle");
    			circle2 = svg_element("circle");
    			circle3 = svg_element("circle");
    			circle4 = svg_element("circle");
    			circle5 = svg_element("circle");
    			circle6 = svg_element("circle");
    			circle7 = svg_element("circle");
    			circle8 = svg_element("circle");
    			circle9 = svg_element("circle");
    			attr_dev(path, "d", "M8,0 L42,0 C46.418278,-8.11624501e-16 50,3.581722 50,8 L50,42 C50,46.418278 46.418278,50 42,50 L8,50 C3.581722,50 5.41083001e-16,46.418278 0,42 L0,8 C-5.41083001e-16,3.581722 3.581722,8.11624501e-16 8,0 Z M4,16 L4,42 C4,44.209139 5.790861,46 8,46 L42,46 C44.209139,46 46,44.209139 46,42 L46,16 L4,16 Z");
    			add_location(path, file$1, 69, 4, 9503);
    			attr_dev(circle0, "cx", "9");
    			attr_dev(circle0, "cy", "31");
    			attr_dev(circle0, "r", "2");
    			add_location(circle0, file$1, 70, 4, 9821);
    			attr_dev(circle1, "cx", "9");
    			attr_dev(circle1, "cy", "40");
    			attr_dev(circle1, "r", "2");
    			add_location(circle1, file$1, 71, 4, 9856);
    			attr_dev(circle2, "cx", "17");
    			attr_dev(circle2, "cy", "31");
    			attr_dev(circle2, "r", "2");
    			add_location(circle2, file$1, 72, 4, 9891);
    			attr_dev(circle3, "cx", "17");
    			attr_dev(circle3, "cy", "40");
    			attr_dev(circle3, "r", "2");
    			add_location(circle3, file$1, 73, 4, 9927);
    			attr_dev(circle4, "cx", "25");
    			attr_dev(circle4, "cy", "31");
    			attr_dev(circle4, "r", "2");
    			add_location(circle4, file$1, 74, 4, 9963);
    			attr_dev(circle5, "cx", "25");
    			attr_dev(circle5, "cy", "40");
    			attr_dev(circle5, "r", "2");
    			add_location(circle5, file$1, 75, 4, 9999);
    			attr_dev(circle6, "cx", "33");
    			attr_dev(circle6, "cy", "31");
    			attr_dev(circle6, "r", "2");
    			add_location(circle6, file$1, 76, 4, 10035);
    			attr_dev(circle7, "cx", "33");
    			attr_dev(circle7, "cy", "40");
    			attr_dev(circle7, "r", "2");
    			add_location(circle7, file$1, 77, 4, 10071);
    			attr_dev(circle8, "cx", "41");
    			attr_dev(circle8, "cy", "31");
    			attr_dev(circle8, "r", "2");
    			add_location(circle8, file$1, 78, 4, 10107);
    			attr_dev(circle9, "cx", "41");
    			attr_dev(circle9, "cy", "40");
    			attr_dev(circle9, "r", "2");
    			add_location(circle9, file$1, 79, 4, 10143);
    			attr_dev(g, "fill-rule", "evenodd");
    			attr_dev(g, "transform", "translate(3 3)");
    			add_location(g, file$1, 68, 2, 9448);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			set_style(svg, "width", /*size*/ ctx[4] + "px");
    			set_style(svg, "height", /*size*/ ctx[4] + "px");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "width", "56");
    			attr_dev(svg, "height", "56");
    			attr_dev(svg, "viewBox", "0 0 56 56");
    			attr_dev(svg, "class", "svelte-1200cyk");
    			toggle_class(svg, "left", /*left*/ ctx[1]);
    			toggle_class(svg, "right", /*right*/ ctx[2]);
    			toggle_class(svg, "active", /*active*/ ctx[3]);
    			add_location(svg, file$1, 67, 0, 9263);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, g);
    			append_dev(g, path);
    			append_dev(g, circle0);
    			append_dev(g, circle1);
    			append_dev(g, circle2);
    			append_dev(g, circle3);
    			append_dev(g, circle4);
    			append_dev(g, circle5);
    			append_dev(g, circle6);
    			append_dev(g, circle7);
    			append_dev(g, circle8);
    			append_dev(g, circle9);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*size*/ 16) {
    				set_style(svg, "width", /*size*/ ctx[4] + "px");
    			}

    			if (dirty & /*size*/ 16) {
    				set_style(svg, "height", /*size*/ ctx[4] + "px");
    			}

    			if (dirty & /*left*/ 2) {
    				toggle_class(svg, "left", /*left*/ ctx[1]);
    			}

    			if (dirty & /*right*/ 4) {
    				toggle_class(svg, "right", /*right*/ ctx[2]);
    			}

    			if (dirty & /*active*/ 8) {
    				toggle_class(svg, "active", /*active*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(66:30) ",
    		ctx
    	});

    	return block;
    }

    // (61:27) 
    function create_if_block_7(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M36.6464466,1.64644661 L37.3535534,2.35355339 C38.134602,3.13460197 38.134602,4.40093193 37.3535534,5.18198052 L14.4142136,28.1213203 C13.633165,28.9023689 12.366835,28.9023689 11.5857864,28.1213203 L1.64644661,18.1819805 C0.865398026,17.4009319 0.865398026,16.134602 1.64644661,15.3535534 L2.35355339,14.6464466 C3.13460197,13.865398 4.40093193,13.865398 5.18198052,14.6464466 L11.5857864,21.0502525 C12.366835,21.8313011 13.633165,21.8313011 14.4142136,21.0502525 L33.8180195,1.64644661 C34.5990681,0.865398026 35.865398,0.865398026 36.6464466,1.64644661 Z");
    			attr_dev(path, "transform", "translate(9 13)");
    			add_location(path, file$1, 63, 2, 8608);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			set_style(svg, "width", /*size*/ ctx[4] + "px");
    			set_style(svg, "height", /*size*/ ctx[4] + "px");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "width", "56");
    			attr_dev(svg, "height", "56");
    			attr_dev(svg, "viewBox", "0 0 56 56");
    			attr_dev(svg, "class", "svelte-1200cyk");
    			toggle_class(svg, "left", /*left*/ ctx[1]);
    			toggle_class(svg, "right", /*right*/ ctx[2]);
    			toggle_class(svg, "active", /*active*/ ctx[3]);
    			add_location(svg, file$1, 62, 0, 8423);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*size*/ 16) {
    				set_style(svg, "width", /*size*/ ctx[4] + "px");
    			}

    			if (dirty & /*size*/ 16) {
    				set_style(svg, "height", /*size*/ ctx[4] + "px");
    			}

    			if (dirty & /*left*/ 2) {
    				toggle_class(svg, "left", /*left*/ ctx[1]);
    			}

    			if (dirty & /*right*/ 4) {
    				toggle_class(svg, "right", /*right*/ ctx[2]);
    			}

    			if (dirty & /*active*/ 8) {
    				toggle_class(svg, "active", /*active*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(61:27) ",
    		ctx
    	});

    	return block;
    }

    // (56:26) 
    function create_if_block_6(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "d", "M47.6293598 10.7784955l-1.7727086-1.7700706c-.9760448-.9760448-2.5720101-.9760448-3.548055 0l-1.7700705 1.7700706 5.3181255 5.3207635 1.7727086-1.7727085c.9760448-.973407.9760448-2.5667342 0-3.548055zm-7.1330415 3.6298317l-1.7727085-1.7727085-26.9414763 26.9098209s-1.2055474 2.128833-1.6540004 3.6377456c-.6647657 2.2396273-.8705265 4.1574235-.8705265 4.1574235s2.2317134-.063311 4.450237-.7834738c1.413946-.456367 3.3924154-1.6909318 3.3924154-1.6909318l26.9441143-26.907183-1.7753464-1.7727084-1.7727086-1.7779845z");
    			set_style(path, "mix-blend-mode", "color-burn");
    			add_location(path, file$1, 58, 2, 7789);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			set_style(svg, "width", /*size*/ ctx[4] + "px");
    			set_style(svg, "height", /*size*/ ctx[4] + "px");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "width", "56");
    			attr_dev(svg, "height", "56");
    			attr_dev(svg, "viewBox", "0 0 56 56");
    			attr_dev(svg, "preserveAspectRatio", "none");
    			attr_dev(svg, "class", "svelte-1200cyk");
    			toggle_class(svg, "left", /*left*/ ctx[1]);
    			toggle_class(svg, "right", /*right*/ ctx[2]);
    			toggle_class(svg, "active", /*active*/ ctx[3]);
    			add_location(svg, file$1, 57, 0, 7577);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*size*/ 16) {
    				set_style(svg, "width", /*size*/ ctx[4] + "px");
    			}

    			if (dirty & /*size*/ 16) {
    				set_style(svg, "height", /*size*/ ctx[4] + "px");
    			}

    			if (dirty & /*left*/ 2) {
    				toggle_class(svg, "left", /*left*/ ctx[1]);
    			}

    			if (dirty & /*right*/ 4) {
    				toggle_class(svg, "right", /*right*/ ctx[2]);
    			}

    			if (dirty & /*active*/ 8) {
    				toggle_class(svg, "active", /*active*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(56:26) ",
    		ctx
    	});

    	return block;
    }

    // (51:27) 
    function create_if_block_5(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "d", "M25.8284271,23 L34.3137085,31.4852814 C35.0947571,32.26633 35.0947571,33.5326599 34.3137085,34.3137085 C33.5326599,35.0947571 32.26633,35.0947571 31.4852814,34.3137085 L23,25.8284271 L14.5147186,34.3137085 C13.73367,35.0947571 12.4673401,35.0947571 11.6862915,34.3137085 C10.9052429,33.5326599 10.9052429,32.26633 11.6862915,31.4852814 L20.1715729,23 L11.6862915,14.5147186 C10.9052429,13.73367 10.9052429,12.4673401 11.6862915,11.6862915 C12.4673401,10.9052429 13.73367,10.9052429 14.5147186,11.6862915 L23,20.1715729 L31.4852814,11.6862915 C32.26633,10.9052429 33.5326599,10.9052429 34.3137085,11.6862915 C35.0947571,12.4673401 35.0947571,13.73367 34.3137085,14.5147186 L25.8284271,23 Z");
    			attr_dev(path, "transform", "translate(5 5)");
    			add_location(path, file$1, 53, 2, 6781);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			set_style(svg, "width", /*size*/ ctx[4] + "px");
    			set_style(svg, "height", /*size*/ ctx[4] + "px");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "width", "56");
    			attr_dev(svg, "height", "56");
    			attr_dev(svg, "viewBox", "0 0 56 56");
    			attr_dev(svg, "class", "svelte-1200cyk");
    			toggle_class(svg, "left", /*left*/ ctx[1]);
    			toggle_class(svg, "right", /*right*/ ctx[2]);
    			toggle_class(svg, "active", /*active*/ ctx[3]);
    			add_location(svg, file$1, 52, 0, 6596);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*size*/ 16) {
    				set_style(svg, "width", /*size*/ ctx[4] + "px");
    			}

    			if (dirty & /*size*/ 16) {
    				set_style(svg, "height", /*size*/ ctx[4] + "px");
    			}

    			if (dirty & /*left*/ 2) {
    				toggle_class(svg, "left", /*left*/ ctx[1]);
    			}

    			if (dirty & /*right*/ 4) {
    				toggle_class(svg, "right", /*right*/ ctx[2]);
    			}

    			if (dirty & /*active*/ 8) {
    				toggle_class(svg, "active", /*active*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(51:27) ",
    		ctx
    	});

    	return block;
    }

    // (46:33) 
    function create_if_block_4(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "d", "M11,6 L11,4 C11,1.790861 12.790861,4.05812251e-16 15,0 L27,0 C29.209139,-4.05812251e-16 31,1.790861 31,4 L31,6 L40,6 C41.1045695,6 42,6.8954305 42,8 C42,9.1045695 41.1045695,10 40,10 L37.7391304,10 L35.2438924,48.2603165 C35.1067004,50.3639274 33.3604517,52 31.252372,52 L10.747628,52 C8.63954825,52 6.89329961,50.3639274 6.7561076,48.2603165 L4.26086957,10 L2,10 C0.8954305,10 1.3527075e-16,9.1045695 0,8 C-1.3527075e-16,6.8954305 0.8954305,6 2,6 L11,6 Z M15,6 L27,6 L27,4 L15,4 L15,6 Z M21,13 C19.8954305,13 19,13.8954305 19,15 L19,44 C19,45.1045695 19.8954305,46 21,46 C22.1045695,46 23,45.1045695 23,44 L23,15 C23,13.8954305 22.1045695,13 21,13 Z M13,13 C12.9804065,13 12.9608141,13.0002968 12.9412296,13.0008903 C11.8701166,13.0333482 11.0281203,13.9279693 11.0605783,14.9990824 L11.9412296,44.0605783 C11.9739716,45.1410644 12.8593299,46 13.940312,46 L14,46 C14.0195935,46 14.0391859,45.9997032 14.0587704,45.9991097 C15.1298834,45.9666518 15.9718797,45.0720307 15.9394217,44.0009176 L15.0587704,14.9394217 C15.0260284,13.8589356 14.1406701,13 13.059688,13 L13,13 Z M28.940312,13 C27.8593299,13 26.9739716,13.8589356 26.9412296,14.9394217 L26.0605783,44.0009176 C26.0599848,44.0205021 26.059688,44.0400945 26.059688,44.059688 C26.059688,45.1312927 26.9283953,46 28,46 L28.059688,46 C29.1406701,46 30.0260284,45.1410644 30.0587704,44.0605783 L30.9394217,14.9990824 C30.9400152,14.9794979 30.940312,14.9599055 30.940312,14.940312 C30.940312,13.8687073 30.0716047,13 29,13 L28.940312,13 Z");
    			attr_dev(path, "transform", "translate(7 2)");
    			add_location(path, file$1, 48, 2, 4995);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			set_style(svg, "width", /*size*/ ctx[4] + "px");
    			set_style(svg, "height", /*size*/ ctx[4] + "px");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "width", "56");
    			attr_dev(svg, "height", "56");
    			attr_dev(svg, "viewBox", "0 0 56 56");
    			attr_dev(svg, "class", "svelte-1200cyk");
    			toggle_class(svg, "left", /*left*/ ctx[1]);
    			toggle_class(svg, "right", /*right*/ ctx[2]);
    			toggle_class(svg, "active", /*active*/ ctx[3]);
    			add_location(svg, file$1, 47, 0, 4810);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*size*/ 16) {
    				set_style(svg, "width", /*size*/ ctx[4] + "px");
    			}

    			if (dirty & /*size*/ 16) {
    				set_style(svg, "height", /*size*/ ctx[4] + "px");
    			}

    			if (dirty & /*left*/ 2) {
    				toggle_class(svg, "left", /*left*/ ctx[1]);
    			}

    			if (dirty & /*right*/ 4) {
    				toggle_class(svg, "right", /*right*/ ctx[2]);
    			}

    			if (dirty & /*active*/ 8) {
    				toggle_class(svg, "active", /*active*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(46:33) ",
    		ctx
    	});

    	return block;
    }

    // (41:27) 
    function create_if_block_3(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M33.7306328,10 L8.26936716,10 L10.747628,48 L31.252372,48 L33.7306328,10 Z M11,6 L11,4 C11,1.790861 12.790861,4.05812251e-16 15,0 L27,0 C29.209139,-4.05812251e-16 31,1.790861 31,4 L31,6 L40,6 C41.1045695,6 42,6.8954305 42,8 C42,9.1045695 41.1045695,10 40,10 L37.7391304,10 L35.2438924,48.2603165 C35.1067004,50.3639274 33.3604517,52 31.252372,52 L10.747628,52 C8.63954825,52 6.89329961,50.3639274 6.7561076,48.2603165 L4.26086957,10 L2,10 C0.8954305,10 1.3527075e-16,9.1045695 0,8 C-1.3527075e-16,6.8954305 0.8954305,6 2,6 L11,6 Z M15,6 L27,6 L27,4 L15,4 L15,6 Z M21,13 C22.1045695,13 23,13.8954305 23,15 L23,44 C23,45.1045695 22.1045695,46 21,46 C19.8954305,46 19,45.1045695 19,44 L19,15 C19,13.8954305 19.8954305,13 21,13 Z M13,13 L13.1175424,13 C14.1751244,13 15.0499009,13.8233648 15.1138794,14.8790099 L16.8790099,44.003663 C16.9419037,45.0414115 16.1516279,45.9336584 15.1138794,45.9965523 C15.0759631,45.9988502 15.0379859,46 15,46 L14.8824576,46 C13.8248756,46 12.9500991,45.1766352 12.8861206,44.1209901 L11.1209901,14.996337 C11.0580963,13.9585885 11.8483721,13.0663416 12.8861206,13.0034477 C12.9240369,13.0011498 12.9620141,13 13,13 L13,13 Z M28.8824576,13 L29,13 C30.0396526,13 30.8824576,13.842805 30.8824576,14.8824576 C30.8824576,14.9204435 30.8813078,14.9584207 30.8790099,14.996337 L29.1138794,44.1209901 C29.0499009,45.1766352 28.1751244,46 27.1175424,46 L27,46 C25.9603474,46 25.1175424,45.157195 25.1175424,44.1175424 C25.1175424,44.0795565 25.1186922,44.0415793 25.1209901,44.003663 L26.8861206,14.8790099 C26.9500991,13.8233648 27.8248756,13 28.8824576,13 Z");
    			attr_dev(path, "transform", "translate(7 2)");
    			add_location(path, file$1, 43, 2, 3127);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			set_style(svg, "width", /*size*/ ctx[4] + "px");
    			set_style(svg, "height", /*size*/ ctx[4] + "px");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "width", "56");
    			attr_dev(svg, "height", "56");
    			attr_dev(svg, "viewBox", "0 0 56 56");
    			attr_dev(svg, "class", "svelte-1200cyk");
    			toggle_class(svg, "left", /*left*/ ctx[1]);
    			toggle_class(svg, "right", /*right*/ ctx[2]);
    			toggle_class(svg, "active", /*active*/ ctx[3]);
    			add_location(svg, file$1, 42, 0, 2942);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*size*/ 16) {
    				set_style(svg, "width", /*size*/ ctx[4] + "px");
    			}

    			if (dirty & /*size*/ 16) {
    				set_style(svg, "height", /*size*/ ctx[4] + "px");
    			}

    			if (dirty & /*left*/ 2) {
    				toggle_class(svg, "left", /*left*/ ctx[1]);
    			}

    			if (dirty & /*right*/ 4) {
    				toggle_class(svg, "right", /*right*/ ctx[2]);
    			}

    			if (dirty & /*active*/ 8) {
    				toggle_class(svg, "active", /*active*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(41:27) ",
    		ctx
    	});

    	return block;
    }

    // (36:26) 
    function create_if_block_2(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "d", "M0.365469004,18.8565608 C0.435955332,18.7535279 0.517036574,18.6554163 0.608720414,18.5637325 L18.2970446,0.875408321 C19.4639824,-0.29152949 21.3521632,-0.295328794 22.5326699,0.885177919 C23.7050032,2.05751135 23.7158815,3.94736123 22.5424394,5.12080324 L7.65685571,20.0063869 L22.5302759,34.8798071 C23.6972138,36.0467449 23.701013,37.9349257 22.5205062,39.1154323 C21.3481728,40.2877659 19.458323,40.2986439 18.2848809,39.1252019 L0.596556802,21.4368778 C-0.10925029,20.7310707 -0.191949541,19.6417332 0.365469004,18.8565608 Z");
    			attr_dev(path, "transform", "translate(16 8)");
    			add_location(path, file$1, 38, 2, 2301);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			set_style(svg, "width", /*size*/ ctx[4] + "px");
    			set_style(svg, "height", /*size*/ ctx[4] + "px");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "width", "56");
    			attr_dev(svg, "height", "56");
    			attr_dev(svg, "viewBox", "0 0 56 56");
    			attr_dev(svg, "class", "svelte-1200cyk");
    			toggle_class(svg, "left", /*left*/ ctx[1]);
    			toggle_class(svg, "right", /*right*/ ctx[2]);
    			toggle_class(svg, "active", /*active*/ ctx[3]);
    			add_location(svg, file$1, 37, 0, 2116);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*size*/ 16) {
    				set_style(svg, "width", /*size*/ ctx[4] + "px");
    			}

    			if (dirty & /*size*/ 16) {
    				set_style(svg, "height", /*size*/ ctx[4] + "px");
    			}

    			if (dirty & /*left*/ 2) {
    				toggle_class(svg, "left", /*left*/ ctx[1]);
    			}

    			if (dirty & /*right*/ 4) {
    				toggle_class(svg, "right", /*right*/ ctx[2]);
    			}

    			if (dirty & /*active*/ 8) {
    				toggle_class(svg, "active", /*active*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(36:26) ",
    		ctx
    	});

    	return block;
    }

    // (31:28) 
    function create_if_block_1(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "d", "M31.1315715,30.3111301 C31.1695633,30.3438299 31.2066181,30.378191 31.2426407,30.4142136 L42.5563492,41.7279221 C43.3373978,42.5089706 43.3373978,43.7753006 42.5563492,44.5563492 C41.7753006,45.3373978 40.5089706,45.3373978 39.7279221,44.5563492 L28.4142136,33.2426407 C28.3030175,33.1314446 28.2076521,33.0104126 28.1281175,32.8823452 C25.2427701,34.8497621 21.7557113,36 18,36 C8.0588745,36 0,27.9411255 0,18 C0,8.0588745 8.0588745,0 18,0 C27.9411255,0 36,8.0588745 36,18 C36,22.7618751 34.1509047,27.0918709 31.1315715,30.3111301 L31.1315715,30.3111301 Z M18,32 C25.7319865,32 32,25.7319865 32,18 C32,10.2680135 25.7319865,4 18,4 C10.2680135,4 4,10.2680135 4,18 C4,25.7319865 10.2680135,32 18,32 Z");
    			attr_dev(path, "transform", "translate(6 5)");
    			add_location(path, file$1, 33, 2, 1308);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			set_style(svg, "width", /*size*/ ctx[4] + "px");
    			set_style(svg, "height", /*size*/ ctx[4] + "px");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "width", "56");
    			attr_dev(svg, "height", "56");
    			attr_dev(svg, "viewBox", "0 0 56 56");
    			attr_dev(svg, "class", "svelte-1200cyk");
    			toggle_class(svg, "left", /*left*/ ctx[1]);
    			toggle_class(svg, "right", /*right*/ ctx[2]);
    			toggle_class(svg, "active", /*active*/ ctx[3]);
    			add_location(svg, file$1, 32, 0, 1123);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*size*/ 16) {
    				set_style(svg, "width", /*size*/ ctx[4] + "px");
    			}

    			if (dirty & /*size*/ 16) {
    				set_style(svg, "height", /*size*/ ctx[4] + "px");
    			}

    			if (dirty & /*left*/ 2) {
    				toggle_class(svg, "left", /*left*/ ctx[1]);
    			}

    			if (dirty & /*right*/ 4) {
    				toggle_class(svg, "right", /*right*/ ctx[2]);
    			}

    			if (dirty & /*active*/ 8) {
    				toggle_class(svg, "active", /*active*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(31:28) ",
    		ctx
    	});

    	return block;
    }

    // (26:0) {#if name === 'add'}
    function create_if_block(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "d", "M18,14 L30,14 C31.1045695,14 32,14.8954305 32,16 C32,17.1045695 31.1045695,18 30,18 L18,18 L18,30 C18,31.1045695 17.1045695,32 16,32 C14.8954305,32 14,31.1045695 14,30 L14,18 L2,18 C0.8954305,18 1.3527075e-16,17.1045695 0,16 C-1.3527075e-16,14.8954305 0.8954305,14 2,14 L14,14 L14,2 C14,0.8954305 14.8954305,2.02906125e-16 16,0 C17.1045695,-2.02906125e-16 18,0.8954305 18,2 L18,14 Z");
    			attr_dev(path, "transform", "translate(12 12)");
    			add_location(path, file$1, 28, 2, 627);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			set_style(svg, "width", /*size*/ ctx[4] + "px");
    			set_style(svg, "height", /*size*/ ctx[4] + "px");
    			attr_dev(svg, "fill", "currentColor");
    			attr_dev(svg, "width", "56");
    			attr_dev(svg, "height", "56");
    			attr_dev(svg, "viewBox", "0 0 56 56");
    			attr_dev(svg, "class", "svelte-1200cyk");
    			toggle_class(svg, "left", /*left*/ ctx[1]);
    			toggle_class(svg, "right", /*right*/ ctx[2]);
    			toggle_class(svg, "active", /*active*/ ctx[3]);
    			add_location(svg, file$1, 27, 0, 442);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*size*/ 16) {
    				set_style(svg, "width", /*size*/ ctx[4] + "px");
    			}

    			if (dirty & /*size*/ 16) {
    				set_style(svg, "height", /*size*/ ctx[4] + "px");
    			}

    			if (dirty & /*left*/ 2) {
    				toggle_class(svg, "left", /*left*/ ctx[1]);
    			}

    			if (dirty & /*right*/ 4) {
    				toggle_class(svg, "right", /*right*/ ctx[2]);
    			}

    			if (dirty & /*active*/ 8) {
    				toggle_class(svg, "active", /*active*/ ctx[3]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(26:0) {#if name === 'add'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*name*/ ctx[0] === "add") return create_if_block;
    		if (/*name*/ ctx[0] === "search") return create_if_block_1;
    		if (/*name*/ ctx[0] === "back") return create_if_block_2;
    		if (/*name*/ ctx[0] === "trash") return create_if_block_3;
    		if (/*name*/ ctx[0] === "trashFilled") return create_if_block_4;
    		if (/*name*/ ctx[0] === "close") return create_if_block_5;
    		if (/*name*/ ctx[0] === "edit") return create_if_block_6;
    		if (/*name*/ ctx[0] === "check") return create_if_block_7;
    		if (/*name*/ ctx[0] === "calendar") return create_if_block_8;
    		if (/*name*/ ctx[0] === "calendarFilled") return create_if_block_9;
    		if (/*name*/ ctx[0] === "link") return create_if_block_10;
    		if (/*name*/ ctx[0] === "settings") return create_if_block_11;
    		if (/*name*/ ctx[0] === "settingsFilled") return create_if_block_12;
    		if (/*name*/ ctx[0] === "refresh") return create_if_block_13;
    		if (/*name*/ ctx[0] === "reload") return create_if_block_14;
    		if (/*name*/ ctx[0] === "loader") return create_if_block_15;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { name = "wrong name" } = $$props;
    	let { left = false } = $$props;
    	let { right = false } = $$props;
    	let { active = false } = $$props;
    	let { size = 28 } = $$props;
    	const writable_props = ["name", "left", "right", "active", "size"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Icon> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("left" in $$props) $$invalidate(1, left = $$props.left);
    		if ("right" in $$props) $$invalidate(2, right = $$props.right);
    		if ("active" in $$props) $$invalidate(3, active = $$props.active);
    		if ("size" in $$props) $$invalidate(4, size = $$props.size);
    	};

    	$$self.$capture_state = () => {
    		return { name, left, right, active, size };
    	};

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("left" in $$props) $$invalidate(1, left = $$props.left);
    		if ("right" in $$props) $$invalidate(2, right = $$props.right);
    		if ("active" in $$props) $$invalidate(3, active = $$props.active);
    		if ("size" in $$props) $$invalidate(4, size = $$props.size);
    	};

    	return [name, left, right, active, size];
    }

    class Icon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			name: 0,
    			left: 1,
    			right: 2,
    			active: 3,
    			size: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Icon",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get name() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get left() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set left(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get right() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set right(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get active() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => store.subscribe((value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    function useLocalStorage(store, key) {
        if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
            const json = localStorage.getItem(key);
            if (json) {
                store.set(JSON.parse(json));
            }
            const unsubscribe = store.subscribe(current => {
                localStorage.setItem(key, JSON.stringify(current));
            });
        }
    }

    // User Settings
    const darkmode = writable(false);
    useLocalStorage(darkmode, 'svelteIOSPWAdarkmode');

    darkmode.subscribe(darkmode => {
        if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
            const bodyClassList = document.body.classList;
            darkmode ? bodyClassList.add('darkmode') : bodyClassList.remove('darkmode');
        }
    });

    // Navigation Config
    const navConfig = writable({
        type: 'page',
        title: 'Home',
        tools: [],
        actions: {}
    });

    // Eventsdata
    const events = writable([]);
    useLocalStorage(events, 'events');
    const activeFilter = writable('');
    useLocalStorage(activeFilter, 'activeFilter');

    /* src/routes/index.svelte generated by Svelte v3.16.3 */
    const file$2 = "src/routes/index.svelte";

    // (65:0) <Page>
    function create_default_slot(ctx) {
    	let div;
    	let h1;
    	let h1_intro;
    	let t1;
    	let h2;
    	let h2_intro;
    	let t3;
    	let h30;
    	let t4;
    	let h30_intro;
    	let t5;
    	let h31;
    	let t6;
    	let h31_intro;
    	let current;

    	const icon0 = new Icon({
    			props: { name: "calendar" },
    			$$inline: true
    		});

    	const icon1 = new Icon({
    			props: { name: "settings" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			h1.textContent = "Hi,";
    			t1 = space();
    			h2 = element("h2");
    			h2.textContent = "at the bottom navigation you find links to ...";
    			t3 = space();
    			h30 = element("h3");
    			create_component(icon0.$$.fragment);
    			t4 = text("\n            your events");
    			t5 = space();
    			h31 = element("h3");
    			create_component(icon1.$$.fragment);
    			t6 = text("\n            and your settings");
    			attr_dev(h1, "class", "svelte-1wfalkr");
    			add_location(h1, file$2, 66, 8, 1010);
    			attr_dev(h2, "class", "svelte-1wfalkr");
    			add_location(h2, file$2, 67, 8, 1051);
    			attr_dev(h30, "class", "link1 svelte-1wfalkr");
    			add_location(h30, file$2, 70, 8, 1157);
    			attr_dev(h31, "class", "link3 svelte-1wfalkr");
    			add_location(h31, file$2, 74, 8, 1299);
    			attr_dev(div, "class", "wrapper svelte-1wfalkr");
    			add_location(div, file$2, 65, 4, 980);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(div, t1);
    			append_dev(div, h2);
    			append_dev(div, t3);
    			append_dev(div, h30);
    			mount_component(icon0, h30, null);
    			append_dev(h30, t4);
    			append_dev(div, t5);
    			append_dev(div, h31);
    			mount_component(icon1, h31, null);
    			append_dev(h31, t6);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			if (!h1_intro) {
    				add_render_callback(() => {
    					h1_intro = create_in_transition(h1, fly, /*flyOptions*/ ctx[0]);
    					h1_intro.start();
    				});
    			}

    			if (!h2_intro) {
    				add_render_callback(() => {
    					h2_intro = create_in_transition(h2, fly, /*flyOptions*/ ctx[0]);
    					h2_intro.start();
    				});
    			}

    			transition_in(icon0.$$.fragment, local);

    			if (!h30_intro) {
    				add_render_callback(() => {
    					h30_intro = create_in_transition(h30, fly, { .../*flyOptions*/ ctx[0], delay: 1500 });
    					h30_intro.start();
    				});
    			}

    			transition_in(icon1.$$.fragment, local);

    			if (!h31_intro) {
    				add_render_callback(() => {
    					h31_intro = create_in_transition(h31, fly, { .../*flyOptions*/ ctx[0], delay: 2500 });
    					h31_intro.start();
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon0.$$.fragment, local);
    			transition_out(icon1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(icon0);
    			destroy_component(icon1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(65:0) <Page>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let current;

    	const page = new Page({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(page.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(page, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const page_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				page_changes.$$scope = { dirty, ctx };
    			}

    			page.$set(page_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(page.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(page.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(page, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $navConfig;
    	validate_store(navConfig, "navConfig");
    	component_subscribe($$self, navConfig, $$value => $$invalidate(1, $navConfig = $$value));
    	set_store_value(navConfig, $navConfig = { type: "page", pageTitle: "", tools: [] });
    	let flyOptions = { x: 300, duration: 600, easing: expoOut };

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("flyOptions" in $$props) $$invalidate(0, flyOptions = $$props.flyOptions);
    		if ("$navConfig" in $$props) navConfig.set($navConfig = $$props.$navConfig);
    	};

    	return [flyOptions];
    }

    class Routes extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Routes",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    function regexparam (str, loose) {
    	if (str instanceof RegExp) return { keys:false, pattern:str };
    	var c, o, tmp, ext, keys=[], pattern='', arr = str.split('/');
    	arr[0] || arr.shift();

    	while (tmp = arr.shift()) {
    		c = tmp[0];
    		if (c === '*') {
    			keys.push('wild');
    			pattern += '/(.*)';
    		} else if (c === ':') {
    			o = tmp.indexOf('?', 1);
    			ext = tmp.indexOf('.', 1);
    			keys.push( tmp.substring(1, !!~o ? o : !!~ext ? ext : tmp.length) );
    			pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)';
    			if (!!~ext) pattern += (!!~o ? '?' : '') + '\\' + tmp.substring(ext);
    		} else {
    			pattern += '/' + tmp;
    		}
    	}

    	return {
    		keys: keys,
    		pattern: new RegExp('^' + pattern + (loose ? '(?=$|\/)' : '\/?$'), 'i')
    	};
    }

    /* node_modules/svelte-spa-router/Router.svelte generated by Svelte v3.16.3 */

    const { Error: Error_1, Object: Object_1 } = globals;

    function create_fragment$3(ctx) {
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*component*/ ctx[0];

    	function switch_props(ctx) {
    		return {
    			props: { params: /*componentParams*/ ctx[1] },
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		var switch_instance = new switch_value(switch_props(ctx));
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) {
    				mount_component(switch_instance, target, anchor);
    			}

    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const switch_instance_changes = {};
    			if (dirty & /*componentParams*/ 2) switch_instance_changes.params = /*componentParams*/ ctx[1];

    			if (switch_value !== (switch_value = /*component*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			} else if (switch_value) {
    				switch_instance.$set(switch_instance_changes);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function getLocation() {
    	const hashPosition = window.location.href.indexOf("#/");

    	let location = hashPosition > -1
    	? window.location.href.substr(hashPosition + 1)
    	: "/";

    	const qsPosition = location.indexOf("?");
    	let querystring = "";

    	if (qsPosition > -1) {
    		querystring = location.substr(qsPosition + 1);
    		location = location.substr(0, qsPosition);
    	}

    	return { location, querystring };
    }

    const loc = readable(getLocation(), function start(set) {
    	const update = () => {
    		set(getLocation());
    	};

    	window.addEventListener("hashchange", update, false);

    	return function stop() {
    		window.removeEventListener("hashchange", update, false);
    	};
    });

    const location = derived(loc, $loc => $loc.location);
    const querystring = derived(loc, $loc => $loc.querystring);

    function push(location) {
    	if (!location || location.length < 1 || location.charAt(0) != "/" && location.indexOf("#/") !== 0) {
    		throw Error("Invalid parameter location");
    	}

    	setTimeout(
    		() => {
    			window.location.hash = (location.charAt(0) == "#" ? "" : "#") + location;
    		},
    		0
    	);
    }

    function link(node) {
    	if (!node || !node.tagName || node.tagName.toLowerCase() != "a") {
    		throw Error("Action \"link\" can only be used with <a> tags");
    	}

    	const href = node.getAttribute("href");

    	if (!href || href.length < 1 || href.charAt(0) != "/") {
    		throw Error("Invalid value for \"href\" attribute");
    	}

    	node.setAttribute("href", "#" + href);
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $loc,
    		$$unsubscribe_loc = noop;

    	validate_store(loc, "loc");
    	component_subscribe($$self, loc, $$value => $$invalidate(4, $loc = $$value));
    	$$self.$$.on_destroy.push(() => $$unsubscribe_loc());
    	let { routes = {} } = $$props;
    	let { prefix = "" } = $$props;

    	class RouteItem {
    		constructor(path, component) {
    			if (!component || typeof component != "function" && (typeof component != "object" || component._sveltesparouter !== true)) {
    				throw Error("Invalid component object");
    			}

    			if (!path || typeof path == "string" && (path.length < 1 || path.charAt(0) != "/" && path.charAt(0) != "*") || typeof path == "object" && !(path instanceof RegExp)) {
    				throw Error("Invalid value for \"path\" argument");
    			}

    			const { pattern, keys } = regexparam(path);
    			this.path = path;

    			if (typeof component == "object" && component._sveltesparouter === true) {
    				this.component = component.route;
    				this.conditions = component.conditions || [];
    				this.userData = component.userData;
    			} else {
    				this.component = component;
    				this.conditions = [];
    				this.userData = undefined;
    			}

    			this._pattern = pattern;
    			this._keys = keys;
    		}

    		match(path) {
    			if (prefix && path.startsWith(prefix)) {
    				path = path.substr(prefix.length) || "/";
    			}

    			const matches = this._pattern.exec(path);

    			if (matches === null) {
    				return null;
    			}

    			if (this._keys === false) {
    				return matches;
    			}

    			const out = {};
    			let i = 0;

    			while (i < this._keys.length) {
    				out[this._keys[i]] = matches[++i] || null;
    			}

    			return out;
    		}

    		checkConditions(detail) {
    			for (let i = 0; i < this.conditions.length; i++) {
    				if (!this.conditions[i](detail)) {
    					return false;
    				}
    			}

    			return true;
    		}
    	}

    	const routesIterable = routes instanceof Map ? routes : Object.entries(routes);
    	const routesList = [];

    	for (const [path, route] of routesIterable) {
    		routesList.push(new RouteItem(path, route));
    	}

    	let component = null;
    	let componentParams = {};
    	const dispatch = createEventDispatcher();

    	const dispatchNextTick = (name, detail) => {
    		setTimeout(
    			() => {
    				dispatch(name, detail);
    			},
    			0
    		);
    	};

    	const writable_props = ["routes", "prefix"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Router> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(3, prefix = $$props.prefix);
    	};

    	$$self.$capture_state = () => {
    		return {
    			routes,
    			prefix,
    			component,
    			componentParams,
    			$loc
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("routes" in $$props) $$invalidate(2, routes = $$props.routes);
    		if ("prefix" in $$props) $$invalidate(3, prefix = $$props.prefix);
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    		if ("componentParams" in $$props) $$invalidate(1, componentParams = $$props.componentParams);
    		if ("$loc" in $$props) loc.set($loc = $$props.$loc);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*component, $loc*/ 17) {
    			 {
    				$$invalidate(0, component = null);
    				let i = 0;

    				while (!component && i < routesList.length) {
    					const match = routesList[i].match($loc.location);

    					if (match) {
    						const detail = {
    							component: routesList[i].component,
    							name: routesList[i].component.name,
    							location: $loc.location,
    							querystring: $loc.querystring,
    							userData: routesList[i].userData
    						};

    						if (!routesList[i].checkConditions(detail)) {
    							dispatchNextTick("conditionsFailed", detail);
    							break;
    						}

    						$$invalidate(0, component = routesList[i].component);
    						$$invalidate(1, componentParams = match);
    						dispatchNextTick("routeLoaded", detail);
    					}

    					i++;
    				}
    			}
    		}
    	};

    	return [component, componentParams, routes, prefix];
    }

    class Router extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { routes: 2, prefix: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Router",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get routes() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set routes(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get prefix() {
    		throw new Error_1("<Router>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set prefix(value) {
    		throw new Error_1("<Router>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function is_date(obj) {
        return Object.prototype.toString.call(obj) === '[object Date]';
    }

    function tick_spring(ctx, last_value, current_value, target_value) {
        if (typeof current_value === 'number' || is_date(current_value)) {
            // @ts-ignore
            const delta = target_value - current_value;
            // @ts-ignore
            const velocity = (current_value - last_value) / (ctx.dt || 1 / 60); // guard div by 0
            const spring = ctx.opts.stiffness * delta;
            const damper = ctx.opts.damping * velocity;
            const acceleration = (spring - damper) * ctx.inv_mass;
            const d = (velocity + acceleration) * ctx.dt;
            if (Math.abs(d) < ctx.opts.precision && Math.abs(delta) < ctx.opts.precision) {
                return target_value; // settled
            }
            else {
                ctx.settled = false; // signal loop to keep ticking
                // @ts-ignore
                return is_date(current_value) ?
                    new Date(current_value.getTime() + d) : current_value + d;
            }
        }
        else if (Array.isArray(current_value)) {
            // @ts-ignore
            return current_value.map((_, i) => tick_spring(ctx, last_value[i], current_value[i], target_value[i]));
        }
        else if (typeof current_value === 'object') {
            const next_value = {};
            for (const k in current_value)
                // @ts-ignore
                next_value[k] = tick_spring(ctx, last_value[k], current_value[k], target_value[k]);
            // @ts-ignore
            return next_value;
        }
        else {
            throw new Error(`Cannot spring ${typeof current_value} values`);
        }
    }
    function spring(value, opts = {}) {
        const store = writable(value);
        const { stiffness = 0.15, damping = 0.8, precision = 0.01 } = opts;
        let last_time;
        let task;
        let current_token;
        let last_value = value;
        let target_value = value;
        let inv_mass = 1;
        let inv_mass_recovery_rate = 0;
        let cancel_task = false;
        function set(new_value, opts = {}) {
            target_value = new_value;
            const token = current_token = {};
            if (value == null || opts.hard || (spring.stiffness >= 1 && spring.damping >= 1)) {
                cancel_task = true; // cancel any running animation
                last_time = now();
                last_value = new_value;
                store.set(value = target_value);
                return Promise.resolve();
            }
            else if (opts.soft) {
                const rate = opts.soft === true ? .5 : +opts.soft;
                inv_mass_recovery_rate = 1 / (rate * 60);
                inv_mass = 0; // infinite mass, unaffected by spring forces
            }
            if (!task) {
                last_time = now();
                cancel_task = false;
                task = loop(now => {
                    if (cancel_task) {
                        cancel_task = false;
                        task = null;
                        return false;
                    }
                    inv_mass = Math.min(inv_mass + inv_mass_recovery_rate, 1);
                    const ctx = {
                        inv_mass,
                        opts: spring,
                        settled: true,
                        dt: (now - last_time) * 60 / 1000
                    };
                    const next_value = tick_spring(ctx, last_value, value, target_value);
                    last_time = now;
                    last_value = value;
                    store.set(value = next_value);
                    if (ctx.settled)
                        task = null;
                    return !ctx.settled;
                });
            }
            return new Promise(fulfil => {
                task.promise.then(() => {
                    if (token === current_token)
                        fulfil();
                });
            });
        }
        const spring = {
            set,
            update: (fn, opts) => set(fn(target_value, value), opts),
            subscribe: store.subscribe,
            stiffness,
            damping,
            precision
        };
        return spring;
    }

    function get_interpolator(a, b) {
        if (a === b || a !== a)
            return () => a;
        const type = typeof a;
        if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
            throw new Error('Cannot interpolate values of different type');
        }
        if (Array.isArray(a)) {
            const arr = b.map((bi, i) => {
                return get_interpolator(a[i], bi);
            });
            return t => arr.map(fn => fn(t));
        }
        if (type === 'object') {
            if (!a || !b)
                throw new Error('Object cannot be null');
            if (is_date(a) && is_date(b)) {
                a = a.getTime();
                b = b.getTime();
                const delta = b - a;
                return t => new Date(a + t * delta);
            }
            const keys = Object.keys(b);
            const interpolators = {};
            keys.forEach(key => {
                interpolators[key] = get_interpolator(a[key], b[key]);
            });
            return t => {
                const result = {};
                keys.forEach(key => {
                    result[key] = interpolators[key](t);
                });
                return result;
            };
        }
        if (type === 'number') {
            const delta = b - a;
            return t => a + t * delta;
        }
        throw new Error(`Cannot interpolate ${type} values`);
    }
    function tweened(value, defaults = {}) {
        const store = writable(value);
        let task;
        let target_value = value;
        function set(new_value, opts) {
            if (value == null) {
                store.set(value = new_value);
                return Promise.resolve();
            }
            target_value = new_value;
            let previous_task = task;
            let started = false;
            let { delay = 0, duration = 400, easing = identity, interpolate = get_interpolator } = assign(assign({}, defaults), opts);
            const start = now() + delay;
            let fn;
            task = loop(now => {
                if (now < start)
                    return true;
                if (!started) {
                    fn = interpolate(value, new_value);
                    if (typeof duration === 'function')
                        duration = duration(value, new_value);
                    started = true;
                }
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                const elapsed = now - start;
                if (elapsed > duration) {
                    store.set(value = new_value);
                    return false;
                }
                // @ts-ignore
                store.set(value = fn(easing(elapsed / duration)));
                return true;
            });
            return task.promise;
        }
        return {
            set,
            update: (fn, opts) => set(fn(target_value, value), opts),
            subscribe: store.subscribe
        };
    }

    function swipe(node) {
    	let x;
    	let y;

    	function handleMousedown(event) {
    		x = event.changedTouches[0].clientX;
    		y = event.changedTouches[0].clientY;

    		node.dispatchEvent(new CustomEvent('panstart', {
    			detail: { x, y }
    		}));

    		window.addEventListener('touchmove', handleMousemove);
    		window.addEventListener('touchend', handleMouseup);
    	}

    	function handleMousemove(event) {
    		const dx = event.changedTouches[0].clientX - x;
    		const dy = event.changedTouches[0].clientY - y;
    		x = event.changedTouches[0].clientX;
    		y = event.changedTouches[0].clientY;

    		node.dispatchEvent(new CustomEvent('panmove', {
    			detail: { x, y, dx, dy }
    		}));
    	}

    	function handleMouseup(event) {
    		x = event.changedTouches[0].clientX;
    		y = event.changedTouches[0].clientY;

    		node.dispatchEvent(new CustomEvent('panend', {
    			detail: { x, y }
    		}));

    		window.removeEventListener('touchmove', handleMousemove);
    		window.removeEventListener('touchend', handleMouseup);
    	}

    	node.addEventListener('touchstart', handleMousedown);

    	return {
    		destroy() {
    			node.removeEventListener('touchstart', handleMousedown);
    		}
    	};
    }

    /* src/components/Loading.svelte generated by Svelte v3.16.3 */
    const file$3 = "src/components/Loading.svelte";

    function create_fragment$4(ctx) {
    	let div;
    	let span;
    	let div_transition;
    	let current;

    	const icon = new Icon({
    			props: { name: "loader" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			create_component(icon.$$.fragment);
    			attr_dev(span, "class", "svelte-1m9kd7c");
    			add_location(span, file$3, 23, 46, 507);
    			attr_dev(div, "class", "svelte-1m9kd7c");
    			add_location(div, file$3, 23, 0, 461);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			mount_component(icon, span, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { duration: 300, y: -50 }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fly, { duration: 300, y: -50 }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(icon);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class Loading extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Loading",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/components/ListItem.svelte generated by Svelte v3.16.3 */
    const file$4 = "src/components/ListItem.svelte";

    // (76:2) {:else}
    function create_else_block$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("delete");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(76:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (74:2) {#if isDeleting}
    function create_if_block_3$1(ctx) {
    	let current;
    	const loading = new Loading({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(loading.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(loading, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loading.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loading.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(loading, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(74:2) {#if isDeleting}",
    		ctx
    	});

    	return block;
    }

    // (89:37) {#if startDay !== endDay}
    function create_if_block_2$1(ctx) {
    	let t0;
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			t0 = text("- ");
    			t1 = text(/*endDay*/ ctx[5]);
    			t2 = text(".");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*endDay*/ 32) set_data_dev(t1, /*endDay*/ ctx[5]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(89:37) {#if startDay !== endDay}",
    		ctx
    	});

    	return block;
    }

    // (91:3) {#if title}
    function create_if_block_1$1(ctx) {
    	let h4;
    	let t;

    	const block = {
    		c: function create() {
    			h4 = element("h4");
    			t = text(/*title*/ ctx[1]);
    			attr_dev(h4, "class", "svelte-1oajajv");
    			add_location(h4, file$4, 90, 14, 2085);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h4, anchor);
    			append_dev(h4, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*title*/ 2) set_data_dev(t, /*title*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(91:3) {#if title}",
    		ctx
    	});

    	return block;
    }

    // (92:9) {#if location}
    function create_if_block$1(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*location*/ ctx[2]);
    			attr_dev(p, "class", "svelte-1oajajv");
    			add_location(p, file$4, 91, 23, 2130);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*location*/ 4) set_data_dev(t, /*location*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(92:9) {#if location}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div4;
    	let div0;
    	let a0;
    	let t0;
    	let a0_href_value;
    	let link_action;
    	let t1;
    	let a1;
    	let current_block_type_index;
    	let if_block0;
    	let t2;
    	let div3;
    	let div1;
    	let t3;
    	let t4;
    	let t5;
    	let div2;
    	let t6;
    	let t7;
    	let swipe_action;
    	let current;
    	let dispose;
    	const if_block_creators = [create_if_block_3$1, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*isDeleting*/ ctx[3]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let if_block1 = /*startDay*/ ctx[4] !== /*endDay*/ ctx[5] && create_if_block_2$1(ctx);
    	let if_block2 = /*title*/ ctx[1] && create_if_block_1$1(ctx);
    	let if_block3 = /*location*/ ctx[2] && create_if_block$1(ctx);
    	const default_slot_template = /*$$slots*/ ctx[19].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[18], null);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			a0 = element("a");
    			t0 = text("edit");
    			t1 = space();
    			a1 = element("a");
    			if_block0.c();
    			t2 = space();
    			div3 = element("div");
    			div1 = element("div");
    			t3 = text(/*startDay*/ ctx[4]);
    			t4 = text(". ");
    			if (if_block1) if_block1.c();
    			t5 = space();
    			div2 = element("div");
    			if (if_block2) if_block2.c();
    			t6 = space();
    			if (if_block3) if_block3.c();
    			t7 = space();
    			if (default_slot) default_slot.c();
    			attr_dev(a0, "href", a0_href_value = "/events/edit/" + /*id*/ ctx[0]);
    			attr_dev(a0, "class", "svelte-1oajajv");
    			add_location(a0, file$4, 69, 8, 1522);
    			attr_dev(a1, "href", "/events");
    			attr_dev(a1, "class", "svelte-1oajajv");
    			add_location(a1, file$4, 72, 8, 1583);
    			attr_dev(div0, "class", "options svelte-1oajajv");
    			add_location(div0, file$4, 68, 1, 1492);
    			attr_dev(div1, "class", "shortDate svelte-1oajajv");
    			add_location(div1, file$4, 88, 2, 1954);
    			attr_dev(div2, "class", "shortDescription svelte-1oajajv");
    			add_location(div2, file$4, 89, 2, 2040);
    			attr_dev(div3, "class", "box svelte-1oajajv");
    			set_style(div3, "transform", "translate(" + /*$coords*/ ctx[7].x + "px)");
    			add_location(div3, file$4, 80, 1, 1727);
    			attr_dev(div4, "class", "listitem svelte-1oajajv");
    			add_location(div4, file$4, 67, 0, 1459);

    			dispose = [
    				listen_dev(a1, "click", prevent_default(/*click_handler_1*/ ctx[21]), false, true, false),
    				listen_dev(div3, "panstart", /*handlePanStart*/ ctx[8], false, false, false),
    				listen_dev(div3, "panmove", /*handlePanMove*/ ctx[9], false, false, false),
    				listen_dev(div3, "panend", /*handlePanEnd*/ ctx[10], false, false, false),
    				listen_dev(div3, "click", /*click_handler_2*/ ctx[22], false, false, false),
    				listen_dev(div4, "click", /*click_handler*/ ctx[20], false, false, false)
    			];
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div0, a0);
    			append_dev(a0, t0);
    			link_action = link.call(null, a0) || ({});
    			append_dev(div0, t1);
    			append_dev(div0, a1);
    			if_blocks[current_block_type_index].m(a1, null);
    			append_dev(div4, t2);
    			append_dev(div4, div3);
    			append_dev(div3, div1);
    			append_dev(div1, t3);
    			append_dev(div1, t4);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			if (if_block2) if_block2.m(div2, null);
    			append_dev(div2, t6);
    			if (if_block3) if_block3.m(div2, null);
    			append_dev(div3, t7);

    			if (default_slot) {
    				default_slot.m(div3, null);
    			}

    			swipe_action = swipe.call(null, div3) || ({});
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*id*/ 1 && a0_href_value !== (a0_href_value = "/events/edit/" + /*id*/ ctx[0])) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block0 = if_blocks[current_block_type_index];

    				if (!if_block0) {
    					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block0.c();
    				}

    				transition_in(if_block0, 1);
    				if_block0.m(a1, null);
    			}

    			if (!current || dirty & /*startDay*/ 16) set_data_dev(t3, /*startDay*/ ctx[4]);

    			if (/*startDay*/ ctx[4] !== /*endDay*/ ctx[5]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_2$1(ctx);
    					if_block1.c();
    					if_block1.m(div1, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (/*title*/ ctx[1]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_1$1(ctx);
    					if_block2.c();
    					if_block2.m(div2, t6);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (/*location*/ ctx[2]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block$1(ctx);
    					if_block3.c();
    					if_block3.m(div2, null);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 262144) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[18], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[18], dirty, null));
    			}

    			if (!current || dirty & /*$coords*/ 128) {
    				set_style(div3, "transform", "translate(" + /*$coords*/ ctx[7].x + "px)");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if (link_action && is_function(link_action.destroy)) link_action.destroy();
    			if_blocks[current_block_type_index].d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (default_slot) default_slot.d(detaching);
    			if (swipe_action && is_function(swipe_action.destroy)) swipe_action.destroy();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $coords;
    	let $events;
    	validate_store(events, "events");
    	component_subscribe($$self, events, $$value => $$invalidate(17, $events = $$value));

    	let { id } = $$props,
    		{ title } = $$props,
    		{ location } = $$props,
    		{ startDate } = $$props,
    		{ endDate } = $$props,
    		{ startTime } = $$props,
    		{ endTime } = $$props;

    	let isDeleting = false;
    	let open = false;
    	let startDay = "";
    	let endDay = "";
    	const coords = spring({ x: 0, y: 0 }, { stiffness: 1, damping: 1 });
    	validate_store(coords, "coords");
    	component_subscribe($$self, coords, value => $$invalidate(7, $coords = value));

    	function handlePanStart() {
    		$$invalidate(6, coords.stiffness = $$invalidate(6, coords.damping = 1, coords), coords);
    	}

    	function handlePanMove(event) {
    		if (Math.abs(event.detail.dx) / 2 > Math.abs(event.detail.dy)) {
    			coords.update($coords => ({
    				x: $coords.x + event.detail.dx,
    				y: $coords.y + event.detail.dy
    			}));
    		}
    	}

    	function handlePanEnd(event) {
    		$$invalidate(6, coords.stiffness = 0.15, coords);
    		$$invalidate(6, coords.damping = 0.6, coords);

    		if (!open && $coords.x < -50) {
    			open = true;
    			coords.set({ x: -150, y: 0 });
    		} else {
    			open = false;
    			coords.set({ x: 0, y: 0 });
    		}
    	}

    	const deleteItem = id => {
    		if (!confirm("Realy delete event?")) return;
    		$$invalidate(3, isDeleting = true);
    		const newEvents = $events.filter(event => event.id !== id);
    		set_store_value(events, $events = [...$events, newEvents]);

    		setTimeout(
    			() => {
    				$$invalidate(3, isDeleting = falseM);
    			},
    			1000
    		);
    	};

    	const writable_props = ["id", "title", "location", "startDate", "endDate", "startTime", "endTime"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ListItem> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	const click_handler_1 = () => deleteItem(id);
    	const click_handler_2 = () => push(`/events/${id}`);

    	$$self.$set = $$props => {
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("location" in $$props) $$invalidate(2, location = $$props.location);
    		if ("startDate" in $$props) $$invalidate(12, startDate = $$props.startDate);
    		if ("endDate" in $$props) $$invalidate(13, endDate = $$props.endDate);
    		if ("startTime" in $$props) $$invalidate(14, startTime = $$props.startTime);
    		if ("endTime" in $$props) $$invalidate(15, endTime = $$props.endTime);
    		if ("$$scope" in $$props) $$invalidate(18, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {
    			id,
    			title,
    			location,
    			startDate,
    			endDate,
    			startTime,
    			endTime,
    			isDeleting,
    			open,
    			startDay,
    			endDay,
    			$coords,
    			$events
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("location" in $$props) $$invalidate(2, location = $$props.location);
    		if ("startDate" in $$props) $$invalidate(12, startDate = $$props.startDate);
    		if ("endDate" in $$props) $$invalidate(13, endDate = $$props.endDate);
    		if ("startTime" in $$props) $$invalidate(14, startTime = $$props.startTime);
    		if ("endTime" in $$props) $$invalidate(15, endTime = $$props.endTime);
    		if ("isDeleting" in $$props) $$invalidate(3, isDeleting = $$props.isDeleting);
    		if ("open" in $$props) open = $$props.open;
    		if ("startDay" in $$props) $$invalidate(4, startDay = $$props.startDay);
    		if ("endDay" in $$props) $$invalidate(5, endDay = $$props.endDay);
    		if ("$coords" in $$props) coords.set($coords = $$props.$coords);
    		if ("$events" in $$props) events.set($events = $$props.$events);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*startDate*/ 4096) {
    			 if (startDate) {
    				let date = new Date(startDate);
    				$$invalidate(4, startDay = date.getDate());
    			}
    		}

    		if ($$self.$$.dirty & /*endDate*/ 8192) {
    			 if (endDate) {
    				let date = new Date(endDate);
    				$$invalidate(5, endDay = date.getDate());
    			}
    		}
    	};

    	return [
    		id,
    		title,
    		location,
    		isDeleting,
    		startDay,
    		endDay,
    		coords,
    		$coords,
    		handlePanStart,
    		handlePanMove,
    		handlePanEnd,
    		deleteItem,
    		startDate,
    		endDate,
    		startTime,
    		endTime,
    		open,
    		$events,
    		$$scope,
    		$$slots,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class ListItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$5, safe_not_equal, {
    			id: 0,
    			title: 1,
    			location: 2,
    			startDate: 12,
    			endDate: 13,
    			startTime: 14,
    			endTime: 15
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ListItem",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*id*/ ctx[0] === undefined && !("id" in props)) {
    			console.warn("<ListItem> was created without expected prop 'id'");
    		}

    		if (/*title*/ ctx[1] === undefined && !("title" in props)) {
    			console.warn("<ListItem> was created without expected prop 'title'");
    		}

    		if (/*location*/ ctx[2] === undefined && !("location" in props)) {
    			console.warn("<ListItem> was created without expected prop 'location'");
    		}

    		if (/*startDate*/ ctx[12] === undefined && !("startDate" in props)) {
    			console.warn("<ListItem> was created without expected prop 'startDate'");
    		}

    		if (/*endDate*/ ctx[13] === undefined && !("endDate" in props)) {
    			console.warn("<ListItem> was created without expected prop 'endDate'");
    		}

    		if (/*startTime*/ ctx[14] === undefined && !("startTime" in props)) {
    			console.warn("<ListItem> was created without expected prop 'startTime'");
    		}

    		if (/*endTime*/ ctx[15] === undefined && !("endTime" in props)) {
    			console.warn("<ListItem> was created without expected prop 'endTime'");
    		}
    	}

    	get id() {
    		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get location() {
    		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set location(value) {
    		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get startDate() {
    		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set startDate(value) {
    		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get endDate() {
    		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set endDate(value) {
    		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get startTime() {
    		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set startTime(value) {
    		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get endTime() {
    		throw new Error("<ListItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set endTime(value) {
    		throw new Error("<ListItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const monthMap = ['January','February','March','April','May','June','July','August','September','October','November','December'];

    /* src/components/Tabs.svelte generated by Svelte v3.16.3 */

    const file$5 = "src/components/Tabs.svelte";

    function create_fragment$6(ctx) {
    	let div1;
    	let div0;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", "inner svelte-1ok4kdu");
    			add_location(div0, file$5, 14, 4, 234);
    			attr_dev(div1, "class", "outer svelte-1ok4kdu");
    			add_location(div1, file$5, 13, 0, 210);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 1) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[0], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		
    	};

    	return [$$scope, $$slots];
    }

    class Tabs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tabs",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/components/Tab.svelte generated by Svelte v3.16.3 */

    const file$6 = "src/components/Tab.svelte";

    function create_fragment$7(ctx) {
    	let button;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (default_slot) default_slot.c();
    			attr_dev(button, "class", "svelte-1auallc");
    			toggle_class(button, "active", /*active*/ ctx[0]);
    			toggle_class(button, "first", /*first*/ ctx[1]);
    			toggle_class(button, "last", /*last*/ ctx[2]);
    			add_location(button, file$6, 30, 0, 553);
    			dispose = listen_dev(button, "click", /*click_handler*/ ctx[5], false, false, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 8) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[3], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[3], dirty, null));
    			}

    			if (dirty & /*active*/ 1) {
    				toggle_class(button, "active", /*active*/ ctx[0]);
    			}

    			if (dirty & /*first*/ 2) {
    				toggle_class(button, "first", /*first*/ ctx[1]);
    			}

    			if (dirty & /*last*/ 4) {
    				toggle_class(button, "last", /*last*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { active } = $$props;
    	let { first } = $$props;
    	let { last } = $$props;
    	const writable_props = ["active", "first", "last"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tab> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$set = $$props => {
    		if ("active" in $$props) $$invalidate(0, active = $$props.active);
    		if ("first" in $$props) $$invalidate(1, first = $$props.first);
    		if ("last" in $$props) $$invalidate(2, last = $$props.last);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return { active, first, last };
    	};

    	$$self.$inject_state = $$props => {
    		if ("active" in $$props) $$invalidate(0, active = $$props.active);
    		if ("first" in $$props) $$invalidate(1, first = $$props.first);
    		if ("last" in $$props) $$invalidate(2, last = $$props.last);
    	};

    	return [active, first, last, $$scope, $$slots, click_handler];
    }

    class Tab extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$7, safe_not_equal, { active: 0, first: 1, last: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tab",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*active*/ ctx[0] === undefined && !("active" in props)) {
    			console.warn("<Tab> was created without expected prop 'active'");
    		}

    		if (/*first*/ ctx[1] === undefined && !("first" in props)) {
    			console.warn("<Tab> was created without expected prop 'first'");
    		}

    		if (/*last*/ ctx[2] === undefined && !("last" in props)) {
    			console.warn("<Tab> was created without expected prop 'last'");
    		}
    	}

    	get active() {
    		throw new Error("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get first() {
    		throw new Error("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set first(value) {
    		throw new Error("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get last() {
    		throw new Error("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set last(value) {
    		throw new Error("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/events.svelte generated by Svelte v3.16.3 */
    const file$7 = "src/routes/events.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	child_ctx[11] = i;
    	return child_ctx;
    }

    // (38:1) {#if preparedEvents}
    function create_if_block$2(ctx) {
    	let div;
    	let t;
    	let each_1_anchor;
    	let current;

    	const tabs = new Tabs({
    			props: {
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let each_value = /*preparedEvents*/ ctx[1];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(tabs.$$.fragment);
    			t = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			attr_dev(div, "class", "tabs svelte-17rh0m1");
    			add_location(div, file$7, 38, 2, 1023);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(tabs, div, null);
    			insert_dev(target, t, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tabs_changes = {};

    			if (dirty & /*$$scope, $activeFilter*/ 4097) {
    				tabs_changes.$$scope = { dirty, ctx };
    			}

    			tabs.$set(tabs_changes);

    			if (dirty & /*$activeFilter, preparedEvents*/ 3) {
    				each_value = /*preparedEvents*/ ctx[1];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tabs.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tabs.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(tabs);
    			if (detaching) detach_dev(t);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(38:1) {#if preparedEvents}",
    		ctx
    	});

    	return block;
    }

    // (41:4) <Tab on:click={() => $activeFilter = 'all'} active={$activeFilter === 'all'} first>
    function create_default_slot_4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("All");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(41:4) <Tab on:click={() => $activeFilter = 'all'} active={$activeFilter === 'all'} first>",
    		ctx
    	});

    	return block;
    }

    // (42:4) <Tab on:click={() => $activeFilter = 'eventsA'} active={$activeFilter === 'eventsA'} >
    function create_default_slot_3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("FilterA");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(42:4) <Tab on:click={() => $activeFilter = 'eventsA'} active={$activeFilter === 'eventsA'} >",
    		ctx
    	});

    	return block;
    }

    // (43:4) <Tab on:click={() => $activeFilter = 'eventsB'} active={$activeFilter === 'eventsB'} last>
    function create_default_slot_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("FilterB");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(43:4) <Tab on:click={() => $activeFilter = 'eventsB'} active={$activeFilter === 'eventsB'} last>",
    		ctx
    	});

    	return block;
    }

    // (40:3) <Tabs>
    function create_default_slot_1(ctx) {
    	let t0;
    	let t1;
    	let current;

    	const tab0 = new Tab({
    			props: {
    				active: /*$activeFilter*/ ctx[0] === "all",
    				first: true,
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	tab0.$on("click", /*click_handler*/ ctx[6]);

    	const tab1 = new Tab({
    			props: {
    				active: /*$activeFilter*/ ctx[0] === "eventsA",
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	tab1.$on("click", /*click_handler_1*/ ctx[7]);

    	const tab2 = new Tab({
    			props: {
    				active: /*$activeFilter*/ ctx[0] === "eventsB",
    				last: true,
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	tab2.$on("click", /*click_handler_2*/ ctx[8]);

    	const block = {
    		c: function create() {
    			create_component(tab0.$$.fragment);
    			t0 = space();
    			create_component(tab1.$$.fragment);
    			t1 = space();
    			create_component(tab2.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tab0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(tab1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(tab2, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tab0_changes = {};
    			if (dirty & /*$activeFilter*/ 1) tab0_changes.active = /*$activeFilter*/ ctx[0] === "all";

    			if (dirty & /*$$scope*/ 4096) {
    				tab0_changes.$$scope = { dirty, ctx };
    			}

    			tab0.$set(tab0_changes);
    			const tab1_changes = {};
    			if (dirty & /*$activeFilter*/ 1) tab1_changes.active = /*$activeFilter*/ ctx[0] === "eventsA";

    			if (dirty & /*$$scope*/ 4096) {
    				tab1_changes.$$scope = { dirty, ctx };
    			}

    			tab1.$set(tab1_changes);
    			const tab2_changes = {};
    			if (dirty & /*$activeFilter*/ 1) tab2_changes.active = /*$activeFilter*/ ctx[0] === "eventsB";

    			if (dirty & /*$$scope*/ 4096) {
    				tab2_changes.$$scope = { dirty, ctx };
    			}

    			tab2.$set(tab2_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tab0.$$.fragment, local);
    			transition_in(tab1.$$.fragment, local);
    			transition_in(tab2.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tab0.$$.fragment, local);
    			transition_out(tab1.$$.fragment, local);
    			transition_out(tab2.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tab0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(tab1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(tab2, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(40:3) <Tabs>",
    		ctx
    	});

    	return block;
    }

    // (48:12) {#if $activeFilter === 'all' || $activeFilter === event.type}
    function create_if_block_1$2(ctx) {
    	let t;
    	let if_block_anchor;
    	let current;
    	const listitem_spread_levels = [/*event*/ ctx[9]];
    	let listitem_props = {};

    	for (let i = 0; i < listitem_spread_levels.length; i += 1) {
    		listitem_props = assign(listitem_props, listitem_spread_levels[i]);
    	}

    	const listitem = new ListItem({ props: listitem_props, $$inline: true });
    	let if_block = /*preparedEvents*/ ctx[1][/*id*/ ctx[11] + 1] && /*preparedEvents*/ ctx[1][/*id*/ ctx[11] + 1].month !== /*event*/ ctx[9].month && create_if_block_2$2(ctx);

    	const block = {
    		c: function create() {
    			create_component(listitem.$$.fragment);
    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			mount_component(listitem, target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const listitem_changes = (dirty & /*preparedEvents*/ 2)
    			? get_spread_update(listitem_spread_levels, [get_spread_object(/*event*/ ctx[9])])
    			: {};

    			listitem.$set(listitem_changes);
    			if (/*preparedEvents*/ ctx[1][/*id*/ ctx[11] + 1] && /*preparedEvents*/ ctx[1][/*id*/ ctx[11] + 1].month !== /*event*/ ctx[9].month) if_block.p(ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(listitem.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(listitem.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(listitem, detaching);
    			if (detaching) detach_dev(t);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(48:12) {#if $activeFilter === 'all' || $activeFilter === event.type}",
    		ctx
    	});

    	return block;
    }

    // (50:16) {#if preparedEvents[id+1] && preparedEvents[id+1].month !== event.month}
    function create_if_block_2$2(ctx) {
    	let span;
    	let t_value = /*preparedEvents*/ ctx[1][/*id*/ ctx[11] + 1].month + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "svelte-17rh0m1");
    			add_location(span, file$7, 50, 20, 1652);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(50:16) {#if preparedEvents[id+1] && preparedEvents[id+1].month !== event.month}",
    		ctx
    	});

    	return block;
    }

    // (47:2) {#each preparedEvents as event, id}
    function create_each_block(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = (/*$activeFilter*/ ctx[0] === "all" || /*$activeFilter*/ ctx[0] === /*event*/ ctx[9].type) && create_if_block_1$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*$activeFilter*/ ctx[0] === "all" || /*$activeFilter*/ ctx[0] === /*event*/ ctx[9].type) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block_1$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(47:2) {#each preparedEvents as event, id}",
    		ctx
    	});

    	return block;
    }

    // (37:0) <Page>
    function create_default_slot$1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*preparedEvents*/ ctx[1] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*preparedEvents*/ ctx[1]) if_block.p(ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(37:0) <Page>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let t;
    	let current;

    	const page = new Page({
    			props: {
    				$$slots: { default: [create_default_slot$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			t = space();
    			create_component(page.$$.fragment);
    			document.title = "Events";
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    			mount_component(page, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const page_changes = {};

    			if (dirty & /*$$scope, $activeFilter*/ 4097) {
    				page_changes.$$scope = { dirty, ctx };
    			}

    			page.$set(page_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(page.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(page.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    			destroy_component(page, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $navConfig;
    	let $events;
    	let $activeFilter;
    	validate_store(navConfig, "navConfig");
    	component_subscribe($$self, navConfig, $$value => $$invalidate(2, $navConfig = $$value));
    	validate_store(events, "events");
    	component_subscribe($$self, events, $$value => $$invalidate(3, $events = $$value));
    	validate_store(activeFilter, "activeFilter");
    	component_subscribe($$self, activeFilter, $$value => $$invalidate(0, $activeFilter = $$value));

    	set_store_value(navConfig, $navConfig = {
    		type: "page",
    		title: "Events",
    		tools: ["add"],
    		actions: { add: () => push("/events/add") }
    	});

    	let prevEvent = new Date();
    	let prevMonth = prevEvent.getMonth();
    	let preparedEvents = [];

    	for (event of $events) {
    		const preparedEvent = { ...event };
    		const date = new Date(preparedEvent.startDate);
    		const month = date.getMonth();
    		preparedEvent.month = monthMap[month];
    		preparedEvents.push(preparedEvent);
    	}

    	const click_handler = () => set_store_value(activeFilter, $activeFilter = "all");
    	const click_handler_1 = () => set_store_value(activeFilter, $activeFilter = "eventsA");
    	const click_handler_2 = () => set_store_value(activeFilter, $activeFilter = "eventsB");

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("prevEvent" in $$props) prevEvent = $$props.prevEvent;
    		if ("prevMonth" in $$props) prevMonth = $$props.prevMonth;
    		if ("preparedEvents" in $$props) $$invalidate(1, preparedEvents = $$props.preparedEvents);
    		if ("$navConfig" in $$props) navConfig.set($navConfig = $$props.$navConfig);
    		if ("$events" in $$props) events.set($events = $$props.$events);
    		if ("$activeFilter" in $$props) activeFilter.set($activeFilter = $$props.$activeFilter);
    	};

    	return [
    		$activeFilter,
    		preparedEvents,
    		$navConfig,
    		$events,
    		prevEvent,
    		prevMonth,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class Events extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Events",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/components/layout/SubPage.svelte generated by Svelte v3.16.3 */
    const file$8 = "src/components/layout/SubPage.svelte";

    function create_fragment$9(ctx) {
    	let div;
    	let div_intro;
    	let div_outro;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "svelte-oefkfe");
    			add_location(div, file$8, 27, 0, 547);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 2) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[1], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				if (!div_intro) div_intro = create_in_transition(div, fly, /*flyOptions*/ ctx[0]);
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fly, /*flyOptions*/ ctx[0]);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let flyOptions = {
    		x: window.innerWidth,
    		duration: 600,
    		opacity: 1,
    		easing: expoOut
    	};

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("flyOptions" in $$props) $$invalidate(0, flyOptions = $$props.flyOptions);
    	};

    	return [flyOptions, $$scope, $$slots];
    }

    class SubPage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SubPage",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    const formatToInputDateTime = dateTime => {
        if (!dateTime) return '';

        const date = new Date(dateTime);
        const year = date.getFullYear();
        const month = date.getMonth()+1  < 10 ? `0${date.getMonth()+1}` : date.getMonth()+1;
        const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
        const hours = date.getHours() < 10 ? `0${date.getHours()}` : date.getHours();
        const minutes = date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes();

        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const formatDate = new Intl.DateTimeFormat('de', {
        weekday: 'short', month: 'long', day: 'numeric'
    });

    const formatToReadable = dateTime => {
        if (!dateTime) return '';

        const date = new Date(dateTime);
        return formatDate.format(date);
    };

    /* src/routes/events/detail.svelte generated by Svelte v3.16.3 */
    const file$9 = "src/routes/events/detail.svelte";

    // (22:0) {#if event}
    function create_if_block$3(ctx) {
    	let h30;
    	let t1;
    	let div0;
    	let p;
    	let strong;
    	let br;
    	let t3_value = /*event*/ ctx[0].title + "";
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let h31;
    	let t8;
    	let div1;
    	let t9;
    	let t10;
    	let t11;
    	let if_block0 = /*event*/ ctx[0].location && create_if_block_6$1(ctx);
    	let if_block1 = /*event*/ ctx[0].description && create_if_block_5$1(ctx);
    	let if_block2 = /*event*/ ctx[0].startDate && create_if_block_4$1(ctx);
    	let if_block3 = /*event*/ ctx[0].endDate && create_if_block_3$2(ctx);
    	let if_block4 = /*event*/ ctx[0].startTime && create_if_block_2$3(ctx);
    	let if_block5 = /*event*/ ctx[0].endTime && create_if_block_1$3(ctx);

    	const block = {
    		c: function create() {
    			h30 = element("h3");
    			h30.textContent = "Event";
    			t1 = space();
    			div0 = element("div");
    			p = element("p");
    			strong = element("strong");
    			strong.textContent = "Title:";
    			br = element("br");
    			t3 = text(t3_value);
    			t4 = space();
    			if (if_block0) if_block0.c();
    			t5 = space();
    			if (if_block1) if_block1.c();
    			t6 = space();
    			h31 = element("h3");
    			h31.textContent = "Date/Time";
    			t8 = space();
    			div1 = element("div");
    			if (if_block2) if_block2.c();
    			t9 = space();
    			if (if_block3) if_block3.c();
    			t10 = space();
    			if (if_block4) if_block4.c();
    			t11 = space();
    			if (if_block5) if_block5.c();
    			attr_dev(h30, "class", "svelte-wjn3qf");
    			add_location(h30, file$9, 22, 1, 459);
    			add_location(strong, file$9, 24, 5, 500);
    			add_location(br, file$9, 24, 28, 523);
    			attr_dev(p, "class", "svelte-wjn3qf");
    			add_location(p, file$9, 24, 2, 497);
    			attr_dev(div0, "class", "group svelte-wjn3qf");
    			add_location(div0, file$9, 23, 1, 475);
    			attr_dev(h31, "class", "svelte-wjn3qf");
    			add_location(h31, file$9, 28, 1, 725);
    			attr_dev(div1, "class", "group svelte-wjn3qf");
    			add_location(div1, file$9, 29, 1, 745);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h30, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div0, anchor);
    			append_dev(div0, p);
    			append_dev(p, strong);
    			append_dev(p, br);
    			append_dev(p, t3);
    			append_dev(div0, t4);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div0, t5);
    			if (if_block1) if_block1.m(div0, null);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, h31, anchor);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, div1, anchor);
    			if (if_block2) if_block2.m(div1, null);
    			append_dev(div1, t9);
    			if (if_block3) if_block3.m(div1, null);
    			append_dev(div1, t10);
    			if (if_block4) if_block4.m(div1, null);
    			append_dev(div1, t11);
    			if (if_block5) if_block5.m(div1, null);
    		},
    		p: function update(ctx, dirty) {
    			if (/*event*/ ctx[0].location) if_block0.p(ctx, dirty);
    			if (/*event*/ ctx[0].description) if_block1.p(ctx, dirty);
    			if (/*event*/ ctx[0].startDate) if_block2.p(ctx, dirty);
    			if (/*event*/ ctx[0].endDate) if_block3.p(ctx, dirty);
    			if (/*event*/ ctx[0].startTime) if_block4.p(ctx, dirty);
    			if (/*event*/ ctx[0].endTime) if_block5.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h30);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div0);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(h31);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(div1);
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			if (if_block4) if_block4.d();
    			if (if_block5) if_block5.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(22:0) {#if event}",
    		ctx
    	});

    	return block;
    }

    // (26:2) {#if event.location}
    function create_if_block_6$1(ctx) {
    	let p;
    	let strong;
    	let br;
    	let t1_value = /*event*/ ctx[0].location + "";
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			strong = element("strong");
    			strong.textContent = "Location:";
    			br = element("br");
    			t1 = text(t1_value);
    			add_location(strong, file$9, 25, 25, 570);
    			add_location(br, file$9, 25, 51, 596);
    			attr_dev(p, "class", "svelte-wjn3qf");
    			add_location(p, file$9, 25, 22, 567);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, strong);
    			append_dev(p, br);
    			append_dev(p, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6$1.name,
    		type: "if",
    		source: "(26:2) {#if event.location}",
    		ctx
    	});

    	return block;
    }

    // (27:2) {#if event.description}
    function create_if_block_5$1(ctx) {
    	let p;
    	let strong;
    	let br;
    	let t1_value = /*event*/ ctx[0].description + "";
    	let t1;

    	const block = {
    		c: function create() {
    			p = element("p");
    			strong = element("strong");
    			strong.textContent = "Description:";
    			br = element("br");
    			t1 = text(t1_value);
    			add_location(strong, file$9, 26, 28, 654);
    			add_location(br, file$9, 26, 57, 683);
    			attr_dev(p, "class", "svelte-wjn3qf");
    			add_location(p, file$9, 26, 25, 651);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, strong);
    			append_dev(p, br);
    			append_dev(p, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$1.name,
    		type: "if",
    		source: "(27:2) {#if event.description}",
    		ctx
    	});

    	return block;
    }

    // (31:8) {#if event.startDate}
    function create_if_block_4$1(ctx) {
    	let p;
    	let strong;
    	let br;
    	let t1;
    	let t2_value = formatToReadable(/*event*/ ctx[0].startDate) + "";
    	let t2;

    	const block = {
    		c: function create() {
    			p = element("p");
    			strong = element("strong");
    			strong.textContent = "From:";
    			br = element("br");
    			t1 = space();
    			t2 = text(t2_value);
    			add_location(strong, file$9, 30, 50, 815);
    			add_location(br, file$9, 30, 72, 837);
    			attr_dev(p, "class", "half left svelte-wjn3qf");
    			add_location(p, file$9, 30, 29, 794);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, strong);
    			append_dev(p, br);
    			append_dev(p, t1);
    			append_dev(p, t2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(31:8) {#if event.startDate}",
    		ctx
    	});

    	return block;
    }

    // (32:8) {#if event.endDate}
    function create_if_block_3$2(ctx) {
    	let p;
    	let strong;
    	let br;
    	let t1;
    	let t2_value = formatToReadable(/*event*/ ctx[0].endDate) + "";
    	let t2;

    	const block = {
    		c: function create() {
    			p = element("p");
    			strong = element("strong");
    			strong.textContent = "To:";
    			br = element("br");
    			t1 = space();
    			t2 = text(t2_value);
    			add_location(strong, file$9, 31, 49, 936);
    			add_location(br, file$9, 31, 69, 956);
    			attr_dev(p, "class", "half right svelte-wjn3qf");
    			add_location(p, file$9, 31, 27, 914);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, strong);
    			append_dev(p, br);
    			append_dev(p, t1);
    			append_dev(p, t2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$2.name,
    		type: "if",
    		source: "(32:8) {#if event.endDate}",
    		ctx
    	});

    	return block;
    }

    // (33:8) {#if event.startTime}
    function create_if_block_2$3(ctx) {
    	let p;
    	let strong;
    	let br;
    	let t1;
    	let t2_value = formatToReadable(/*event*/ ctx[0].startTime) + "";
    	let t2;

    	const block = {
    		c: function create() {
    			p = element("p");
    			strong = element("strong");
    			strong.textContent = "Starttime:";
    			br = element("br");
    			t1 = space();
    			t2 = text(t2_value);
    			add_location(strong, file$9, 32, 50, 1054);
    			add_location(br, file$9, 32, 77, 1081);
    			attr_dev(p, "class", "half left svelte-wjn3qf");
    			add_location(p, file$9, 32, 29, 1033);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, strong);
    			append_dev(p, br);
    			append_dev(p, t1);
    			append_dev(p, t2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$3.name,
    		type: "if",
    		source: "(33:8) {#if event.startTime}",
    		ctx
    	});

    	return block;
    }

    // (34:8) {#if event.endTime}
    function create_if_block_1$3(ctx) {
    	let p;
    	let strong;
    	let br;
    	let t1;
    	let t2_value = formatToReadable(/*event*/ ctx[0].endTime) + "";
    	let t2;

    	const block = {
    		c: function create() {
    			p = element("p");
    			strong = element("strong");
    			strong.textContent = "Endtime:";
    			br = element("br");
    			t1 = space();
    			t2 = text(t2_value);
    			add_location(strong, file$9, 33, 49, 1180);
    			add_location(br, file$9, 33, 74, 1205);
    			attr_dev(p, "class", "half right svelte-wjn3qf");
    			add_location(p, file$9, 33, 27, 1158);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, strong);
    			append_dev(p, br);
    			append_dev(p, t1);
    			append_dev(p, t2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(34:8) {#if event.endTime}",
    		ctx
    	});

    	return block;
    }

    // (21:0) <SubPage>
    function create_default_slot$2(ctx) {
    	let if_block_anchor;
    	let if_block = /*event*/ ctx[0] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*event*/ ctx[0]) if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(21:0) <SubPage>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let t;
    	let current;

    	const subpage = new SubPage({
    			props: {
    				$$slots: { default: [create_default_slot$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			t = space();
    			create_component(subpage.$$.fragment);
    			document.title = "Event detail";
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    			mount_component(subpage, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const subpage_changes = {};

    			if (dirty & /*$$scope*/ 32) {
    				subpage_changes.$$scope = { dirty, ctx };
    			}

    			subpage.$set(subpage_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(subpage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(subpage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    			destroy_component(subpage, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let $navConfig;
    	let $events;
    	validate_store(navConfig, "navConfig");
    	component_subscribe($$self, navConfig, $$value => $$invalidate(2, $navConfig = $$value));
    	validate_store(events, "events");
    	component_subscribe($$self, events, $$value => $$invalidate(3, $events = $$value));

    	set_store_value(navConfig, $navConfig = {
    		type: "subpage",
    		title: "Event detail",
    		tools: []
    	});

    	let { params } = $$props;
    	const { slug } = params;
    	let event = $events.find(event => event.id === slug);
    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Detail> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ("params" in $$props) $$invalidate(1, params = $$props.params);
    	};

    	$$self.$capture_state = () => {
    		return { params, event, $navConfig, $events };
    	};

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(1, params = $$props.params);
    		if ("event" in $$props) $$invalidate(0, event = $$props.event);
    		if ("$navConfig" in $$props) navConfig.set($navConfig = $$props.$navConfig);
    		if ("$events" in $$props) events.set($events = $$props.$events);
    	};

    	return [event, params];
    }

    class Detail extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$a, safe_not_equal, { params: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Detail",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*params*/ ctx[1] === undefined && !("params" in props)) {
    			console.warn("<Detail> was created without expected prop 'params'");
    		}
    	}

    	get params() {
    		throw new Error("<Detail>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Detail>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/layout/FullPage.svelte generated by Svelte v3.16.3 */
    const file$a = "src/components/layout/FullPage.svelte";

    function create_fragment$b(ctx) {
    	let div;
    	let div_intro;
    	let div_outro;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "svelte-17hly25");
    			add_location(div, file$a, 26, 0, 495);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 2) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[1], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				if (!div_intro) div_intro = create_in_transition(div, fly, /*flyOptions*/ ctx[0]);
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fly, /*flyOptions*/ ctx[0]);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let flyOptions = {
    		y: window.innerHeight,
    		duration: 600,
    		opacity: 1,
    		easing: expoOut
    	};

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("flyOptions" in $$props) $$invalidate(0, flyOptions = $$props.flyOptions);
    	};

    	return [flyOptions, $$scope, $$slots];
    }

    class FullPage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FullPage",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src/components/forms/Headline.svelte generated by Svelte v3.16.3 */

    const file$b = "src/components/forms/Headline.svelte";

    function create_fragment$c(ctx) {
    	let h3;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			if (default_slot) default_slot.c();
    			attr_dev(h3, "class", "inputHeadline svelte-i57udh");
    			add_location(h3, file$b, 11, 0, 159);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);

    			if (default_slot) {
    				default_slot.m(h3, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 1) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[0], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		
    	};

    	return [$$scope, $$slots];
    }

    class Headline extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Headline",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    /* src/components/forms/InputGroup.svelte generated by Svelte v3.16.3 */

    const file$c = "src/components/forms/InputGroup.svelte";

    function create_fragment$d(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "svelte-freq8r");
    			add_location(div, file$c, 22, 0, 449);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 1) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[0], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		
    	};

    	return [$$scope, $$slots];
    }

    class InputGroup extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "InputGroup",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* src/components/forms/Input.svelte generated by Svelte v3.16.3 */
    const file$d = "src/components/forms/Input.svelte";

    // (202:32) 
    function create_if_block_9$1(ctx) {
    	let textarea;
    	let textarea_class_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			textarea = element("textarea");
    			attr_dev(textarea, "class", textarea_class_value = "textarea " + /*size*/ ctx[5] + " " + /*pos*/ ctx[6] + " svelte-vimyik");
    			attr_dev(textarea, "placeholder", /*placeholder*/ ctx[3]);
    			add_location(textarea, file$d, 202, 0, 4505);

    			dispose = [
    				listen_dev(textarea, "input", /*textarea_input_handler*/ ctx[21]),
    				listen_dev(textarea, "change", /*change_handler_2*/ ctx[13], false, false, false)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, textarea, anchor);
    			set_input_value(textarea, /*value*/ ctx[0]);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*size, pos*/ 96 && textarea_class_value !== (textarea_class_value = "textarea " + /*size*/ ctx[5] + " " + /*pos*/ ctx[6] + " svelte-vimyik")) {
    				attr_dev(textarea, "class", textarea_class_value);
    			}

    			if (dirty & /*placeholder*/ 8) {
    				attr_dev(textarea, "placeholder", /*placeholder*/ ctx[3]);
    			}

    			if (dirty & /*value*/ 1) {
    				set_input_value(textarea, /*value*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(textarea);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9$1.name,
    		type: "if",
    		source: "(202:32) ",
    		ctx
    	});

    	return block;
    }

    // (197:29) 
    function create_if_block_8$1(ctx) {
    	let label;
    	let t0;
    	let t1;
    	let span;
    	let t2;
    	let t3;
    	let input;
    	let input_class_value;
    	let label_class_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			label = element("label");
    			t0 = text(/*placeholder*/ ctx[3]);
    			t1 = space();
    			span = element("span");
    			t2 = text(/*value*/ ctx[0]);
    			t3 = space();
    			input = element("input");
    			attr_dev(input, "type", "range");
    			attr_dev(input, "min", /*min*/ ctx[8]);
    			attr_dev(input, "max", /*max*/ ctx[9]);
    			attr_dev(input, "step", /*step*/ ctx[10]);
    			attr_dev(input, "class", input_class_value = "" + (null_to_empty(/*size*/ ctx[5]) + " svelte-vimyik"));
    			add_location(input, file$d, 199, 15, 4361);
    			attr_dev(span, "class", "svelte-vimyik");
    			add_location(span, file$d, 199, 1, 4347);
    			attr_dev(label, "class", label_class_value = "range " + /*size*/ ctx[5] + " " + /*pos*/ ctx[6] + " svelte-vimyik");
    			add_location(label, file$d, 197, 0, 4296);

    			dispose = [
    				listen_dev(input, "change", /*input_change_input_handler*/ ctx[20]),
    				listen_dev(input, "input", /*input_change_input_handler*/ ctx[20]),
    				listen_dev(input, "change", /*change_handler_1*/ ctx[12], false, false, false)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, t0);
    			append_dev(label, t1);
    			append_dev(label, span);
    			append_dev(span, t2);
    			append_dev(span, t3);
    			append_dev(span, input);
    			set_input_value(input, /*value*/ ctx[0]);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*placeholder*/ 8) set_data_dev(t0, /*placeholder*/ ctx[3]);
    			if (dirty & /*value*/ 1) set_data_dev(t2, /*value*/ ctx[0]);

    			if (dirty & /*min*/ 256) {
    				attr_dev(input, "min", /*min*/ ctx[8]);
    			}

    			if (dirty & /*max*/ 512) {
    				attr_dev(input, "max", /*max*/ ctx[9]);
    			}

    			if (dirty & /*step*/ 1024) {
    				attr_dev(input, "step", /*step*/ ctx[10]);
    			}

    			if (dirty & /*size*/ 32 && input_class_value !== (input_class_value = "" + (null_to_empty(/*size*/ ctx[5]) + " svelte-vimyik"))) {
    				attr_dev(input, "class", input_class_value);
    			}

    			if (dirty & /*value*/ 1) {
    				set_input_value(input, /*value*/ ctx[0]);
    			}

    			if (dirty & /*size, pos*/ 96 && label_class_value !== (label_class_value = "range " + /*size*/ ctx[5] + " " + /*pos*/ ctx[6] + " svelte-vimyik")) {
    				attr_dev(label, "class", label_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8$1.name,
    		type: "if",
    		source: "(197:29) ",
    		ctx
    	});

    	return block;
    }

    // (191:32) 
    function create_if_block_6$2(ctx) {
    	let label;
    	let span;
    	let t0;
    	let t1;
    	let input;
    	let input_class_value;
    	let t2;
    	let label_class_value;
    	let dispose;
    	let if_block = /*group*/ ctx[1] === /*value*/ ctx[0] && create_if_block_7$1(ctx);

    	const block = {
    		c: function create() {
    			label = element("label");
    			span = element("span");
    			t0 = text(/*text*/ ctx[4]);
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			if (if_block) if_block.c();
    			attr_dev(span, "class", "svelte-vimyik");
    			add_location(span, file$d, 192, 1, 4118);
    			attr_dev(input, "type", "checkbox");
    			input.value = /*value*/ ctx[0];
    			attr_dev(input, "class", input_class_value = "" + (null_to_empty(/*size*/ ctx[5]) + " svelte-vimyik"));
    			input.checked = /*checked*/ ctx[7];
    			add_location(input, file$d, 193, 1, 4139);
    			attr_dev(label, "class", label_class_value = "checkbox " + /*size*/ ctx[5] + " " + /*pos*/ ctx[6] + " svelte-vimyik");
    			add_location(label, file$d, 191, 0, 4079);
    			dispose = listen_dev(input, "change", /*change_handler*/ ctx[11], false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, span);
    			append_dev(span, t0);
    			append_dev(label, t1);
    			append_dev(label, input);
    			append_dev(label, t2);
    			if (if_block) if_block.m(label, null);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*text*/ 16) set_data_dev(t0, /*text*/ ctx[4]);

    			if (dirty & /*value*/ 1) {
    				prop_dev(input, "value", /*value*/ ctx[0]);
    			}

    			if (dirty & /*size*/ 32 && input_class_value !== (input_class_value = "" + (null_to_empty(/*size*/ ctx[5]) + " svelte-vimyik"))) {
    				attr_dev(input, "class", input_class_value);
    			}

    			if (dirty & /*checked*/ 128) {
    				prop_dev(input, "checked", /*checked*/ ctx[7]);
    			}

    			if (/*group*/ ctx[1] === /*value*/ ctx[0]) {
    				if (!if_block) {
    					if_block = create_if_block_7$1(ctx);
    					if_block.c();
    					if_block.m(label, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*size, pos*/ 96 && label_class_value !== (label_class_value = "checkbox " + /*size*/ ctx[5] + " " + /*pos*/ ctx[6] + " svelte-vimyik")) {
    				attr_dev(label, "class", label_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			if (if_block) if_block.d();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6$2.name,
    		type: "if",
    		source: "(191:32) ",
    		ctx
    	});

    	return block;
    }

    // (185:29) 
    function create_if_block_4$2(ctx) {
    	let label;
    	let span;
    	let t0;
    	let t1;
    	let input;
    	let input_class_value;
    	let t2;
    	let label_class_value;
    	let current;
    	let dispose;
    	let if_block = /*group*/ ctx[1] === /*value*/ ctx[0] && create_if_block_5$2(ctx);

    	const block = {
    		c: function create() {
    			label = element("label");
    			span = element("span");
    			t0 = text(/*text*/ ctx[4]);
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			if (if_block) if_block.c();
    			attr_dev(span, "class", "svelte-vimyik");
    			add_location(span, file$d, 186, 1, 3874);
    			attr_dev(input, "type", "radio");
    			input.__value = /*value*/ ctx[0];
    			input.value = input.__value;
    			attr_dev(input, "class", input_class_value = "" + (null_to_empty(/*size*/ ctx[5]) + " svelte-vimyik"));
    			/*$$binding_groups*/ ctx[19][0].push(input);
    			add_location(input, file$d, 187, 1, 3895);
    			attr_dev(label, "class", label_class_value = "radio " + /*size*/ ctx[5] + " " + /*pos*/ ctx[6] + " svelte-vimyik");
    			add_location(label, file$d, 185, 0, 3838);
    			dispose = listen_dev(input, "change", /*input_change_handler*/ ctx[18]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, span);
    			append_dev(span, t0);
    			append_dev(label, t1);
    			append_dev(label, input);
    			input.checked = input.__value === /*group*/ ctx[1];
    			append_dev(label, t2);
    			if (if_block) if_block.m(label, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*text*/ 16) set_data_dev(t0, /*text*/ ctx[4]);

    			if (!current || dirty & /*value*/ 1) {
    				prop_dev(input, "__value", /*value*/ ctx[0]);
    			}

    			input.value = input.__value;

    			if (!current || dirty & /*size*/ 32 && input_class_value !== (input_class_value = "" + (null_to_empty(/*size*/ ctx[5]) + " svelte-vimyik"))) {
    				attr_dev(input, "class", input_class_value);
    			}

    			if (dirty & /*group*/ 2) {
    				input.checked = input.__value === /*group*/ ctx[1];
    			}

    			if (/*group*/ ctx[1] === /*value*/ ctx[0]) {
    				if (!if_block) {
    					if_block = create_if_block_5$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(label, null);
    				} else {
    					transition_in(if_block, 1);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*size, pos*/ 96 && label_class_value !== (label_class_value = "radio " + /*size*/ ctx[5] + " " + /*pos*/ ctx[6] + " svelte-vimyik")) {
    				attr_dev(label, "class", label_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			/*$$binding_groups*/ ctx[19][0].splice(/*$$binding_groups*/ ctx[19][0].indexOf(input), 1);
    			if (if_block) if_block.d();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$2.name,
    		type: "if",
    		source: "(185:29) ",
    		ctx
    	});

    	return block;
    }

    // (180:28) 
    function create_if_block_3$3(ctx) {
    	let label;
    	let input;
    	let input_class_value;
    	let t0;
    	let span;
    	let t1_value = (/*value*/ ctx[0] || /*placeholder*/ ctx[3]) + "";
    	let t1;
    	let label_class_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			label = element("label");
    			input = element("input");
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			attr_dev(input, "type", "time");
    			attr_dev(input, "placeholder", /*placeholder*/ ctx[3]);
    			attr_dev(input, "class", input_class_value = "" + (null_to_empty(/*size*/ ctx[5]) + " svelte-vimyik"));
    			add_location(input, file$d, 181, 1, 3659);
    			attr_dev(span, "class", "svelte-vimyik");
    			toggle_class(span, "hasValue", !!/*value*/ ctx[0]);
    			add_location(span, file$d, 182, 1, 3738);
    			attr_dev(label, "class", label_class_value = "time " + /*size*/ ctx[5] + " " + /*pos*/ ctx[6] + " svelte-vimyik");
    			add_location(label, file$d, 180, 0, 3624);
    			dispose = listen_dev(input, "input", /*input_input_handler_3*/ ctx[17]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, input);
    			set_input_value(input, /*value*/ ctx[0]);
    			append_dev(label, t0);
    			append_dev(label, span);
    			append_dev(span, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*placeholder*/ 8) {
    				attr_dev(input, "placeholder", /*placeholder*/ ctx[3]);
    			}

    			if (dirty & /*size*/ 32 && input_class_value !== (input_class_value = "" + (null_to_empty(/*size*/ ctx[5]) + " svelte-vimyik"))) {
    				attr_dev(input, "class", input_class_value);
    			}

    			if (dirty & /*value*/ 1) {
    				set_input_value(input, /*value*/ ctx[0]);
    			}

    			if (dirty & /*value, placeholder*/ 9 && t1_value !== (t1_value = (/*value*/ ctx[0] || /*placeholder*/ ctx[3]) + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*value*/ 1) {
    				toggle_class(span, "hasValue", !!/*value*/ ctx[0]);
    			}

    			if (dirty & /*size, pos*/ 96 && label_class_value !== (label_class_value = "time " + /*size*/ ctx[5] + " " + /*pos*/ ctx[6] + " svelte-vimyik")) {
    				attr_dev(label, "class", label_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$3.name,
    		type: "if",
    		source: "(180:28) ",
    		ctx
    	});

    	return block;
    }

    // (175:28) 
    function create_if_block_2$4(ctx) {
    	let label;
    	let input;
    	let input_class_value;
    	let t0;
    	let span;
    	let t1_value = (formatToReadable(/*value*/ ctx[0]) || /*placeholder*/ ctx[3]) + "";
    	let t1;
    	let label_class_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			label = element("label");
    			input = element("input");
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			attr_dev(input, "type", "date");
    			attr_dev(input, "placeholder", /*placeholder*/ ctx[3]);
    			attr_dev(input, "class", input_class_value = "" + (null_to_empty(/*size*/ ctx[5]) + " svelte-vimyik"));
    			add_location(input, file$d, 176, 1, 3428);
    			attr_dev(span, "class", "svelte-vimyik");
    			toggle_class(span, "hasValue", !!/*value*/ ctx[0]);
    			add_location(span, file$d, 177, 1, 3507);
    			attr_dev(label, "class", label_class_value = "date " + /*size*/ ctx[5] + " " + /*pos*/ ctx[6] + " svelte-vimyik");
    			add_location(label, file$d, 175, 0, 3393);
    			dispose = listen_dev(input, "input", /*input_input_handler_2*/ ctx[16]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, input);
    			set_input_value(input, /*value*/ ctx[0]);
    			append_dev(label, t0);
    			append_dev(label, span);
    			append_dev(span, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*placeholder*/ 8) {
    				attr_dev(input, "placeholder", /*placeholder*/ ctx[3]);
    			}

    			if (dirty & /*size*/ 32 && input_class_value !== (input_class_value = "" + (null_to_empty(/*size*/ ctx[5]) + " svelte-vimyik"))) {
    				attr_dev(input, "class", input_class_value);
    			}

    			if (dirty & /*value*/ 1) {
    				set_input_value(input, /*value*/ ctx[0]);
    			}

    			if (dirty & /*value, placeholder*/ 9 && t1_value !== (t1_value = (formatToReadable(/*value*/ ctx[0]) || /*placeholder*/ ctx[3]) + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*value*/ 1) {
    				toggle_class(span, "hasValue", !!/*value*/ ctx[0]);
    			}

    			if (dirty & /*size, pos*/ 96 && label_class_value !== (label_class_value = "date " + /*size*/ ctx[5] + " " + /*pos*/ ctx[6] + " svelte-vimyik")) {
    				attr_dev(label, "class", label_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$4.name,
    		type: "if",
    		source: "(175:28) ",
    		ctx
    	});

    	return block;
    }

    // (173:32) 
    function create_if_block_1$4(ctx) {
    	let input;
    	let input_class_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "password");
    			attr_dev(input, "placeholder", /*placeholder*/ ctx[3]);
    			attr_dev(input, "class", input_class_value = "" + (null_to_empty(`${/*size*/ ctx[5]} ${/*pos*/ ctx[6]}`) + " svelte-vimyik"));
    			add_location(input, file$d, 173, 0, 3270);
    			dispose = listen_dev(input, "input", /*input_input_handler_1*/ ctx[15]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*value*/ ctx[0]);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*placeholder*/ 8) {
    				attr_dev(input, "placeholder", /*placeholder*/ ctx[3]);
    			}

    			if (dirty & /*size, pos*/ 96 && input_class_value !== (input_class_value = "" + (null_to_empty(`${/*size*/ ctx[5]} ${/*pos*/ ctx[6]}`) + " svelte-vimyik"))) {
    				attr_dev(input, "class", input_class_value);
    			}

    			if (dirty & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
    				set_input_value(input, /*value*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(173:32) ",
    		ctx
    	});

    	return block;
    }

    // (171:0) {#if type === 'text'}
    function create_if_block$4(ctx) {
    	let input;
    	let input_class_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", /*placeholder*/ ctx[3]);
    			attr_dev(input, "class", input_class_value = "" + (null_to_empty(`${/*size*/ ctx[5]} ${/*pos*/ ctx[6]}`) + " svelte-vimyik"));
    			add_location(input, file$d, 171, 0, 3147);
    			dispose = listen_dev(input, "input", /*input_input_handler*/ ctx[14]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			set_input_value(input, /*value*/ ctx[0]);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*placeholder*/ 8) {
    				attr_dev(input, "placeholder", /*placeholder*/ ctx[3]);
    			}

    			if (dirty & /*size, pos*/ 96 && input_class_value !== (input_class_value = "" + (null_to_empty(`${/*size*/ ctx[5]} ${/*pos*/ ctx[6]}`) + " svelte-vimyik"))) {
    				attr_dev(input, "class", input_class_value);
    			}

    			if (dirty & /*value*/ 1 && input.value !== /*value*/ ctx[0]) {
    				set_input_value(input, /*value*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(171:0) {#if type === 'text'}",
    		ctx
    	});

    	return block;
    }

    // (195:1) {#if group === value}
    function create_if_block_7$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "svelte-vimyik");
    			add_location(div, file$d, 194, 22, 4240);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7$1.name,
    		type: "if",
    		source: "(195:1) {#if group === value}",
    		ctx
    	});

    	return block;
    }

    // (189:1) {#if group === value}
    function create_if_block_5$2(ctx) {
    	let span;
    	let current;

    	const icon = new Icon({
    			props: { name: "check", active: true },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			span = element("span");
    			create_component(icon.$$.fragment);
    			attr_dev(span, "class", "svelte-vimyik");
    			add_location(span, file$d, 188, 22, 3984);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			mount_component(icon, span, null);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			destroy_component(icon);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$2.name,
    		type: "if",
    		source: "(189:1) {#if group === value}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;

    	const if_block_creators = [
    		create_if_block$4,
    		create_if_block_1$4,
    		create_if_block_2$4,
    		create_if_block_3$3,
    		create_if_block_4$2,
    		create_if_block_6$2,
    		create_if_block_8$1,
    		create_if_block_9$1
    	];

    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*type*/ ctx[2] === "text") return 0;
    		if (/*type*/ ctx[2] === "password") return 1;
    		if (/*type*/ ctx[2] === "date") return 2;
    		if (/*type*/ ctx[2] === "time") return 3;
    		if (/*type*/ ctx[2] === "radio") return 4;
    		if (/*type*/ ctx[2] === "checkbox") return 5;
    		if (/*type*/ ctx[2] === "range") return 6;
    		if (/*type*/ ctx[2] === "textarea") return 7;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { value } = $$props;
    	let { type } = $$props;
    	let { placeholder } = $$props;
    	let { group } = $$props;
    	let { text } = $$props;
    	let { size } = $$props;
    	let { pos } = $$props;
    	let { checked } = $$props;
    	let { min = "10" } = $$props;
    	let { max = "60" } = $$props;
    	let { step = "5" } = $$props;

    	const writable_props = [
    		"value",
    		"type",
    		"placeholder",
    		"group",
    		"text",
    		"size",
    		"pos",
    		"checked",
    		"min",
    		"max",
    		"step"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Input> was created with unknown prop '${key}'`);
    	});

    	const $$binding_groups = [[]];

    	function change_handler(event) {
    		bubble($$self, event);
    	}

    	function change_handler_1(event) {
    		bubble($$self, event);
    	}

    	function change_handler_2(event) {
    		bubble($$self, event);
    	}

    	function input_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	function input_input_handler_1() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	function input_input_handler_2() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	function input_input_handler_3() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	function input_change_handler() {
    		group = this.__value;
    		$$invalidate(1, group);
    	}

    	function input_change_input_handler() {
    		value = to_number(this.value);
    		$$invalidate(0, value);
    	}

    	function textarea_input_handler() {
    		value = this.value;
    		$$invalidate(0, value);
    	}

    	$$self.$set = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("type" in $$props) $$invalidate(2, type = $$props.type);
    		if ("placeholder" in $$props) $$invalidate(3, placeholder = $$props.placeholder);
    		if ("group" in $$props) $$invalidate(1, group = $$props.group);
    		if ("text" in $$props) $$invalidate(4, text = $$props.text);
    		if ("size" in $$props) $$invalidate(5, size = $$props.size);
    		if ("pos" in $$props) $$invalidate(6, pos = $$props.pos);
    		if ("checked" in $$props) $$invalidate(7, checked = $$props.checked);
    		if ("min" in $$props) $$invalidate(8, min = $$props.min);
    		if ("max" in $$props) $$invalidate(9, max = $$props.max);
    		if ("step" in $$props) $$invalidate(10, step = $$props.step);
    	};

    	$$self.$capture_state = () => {
    		return {
    			value,
    			type,
    			placeholder,
    			group,
    			text,
    			size,
    			pos,
    			checked,
    			min,
    			max,
    			step
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("type" in $$props) $$invalidate(2, type = $$props.type);
    		if ("placeholder" in $$props) $$invalidate(3, placeholder = $$props.placeholder);
    		if ("group" in $$props) $$invalidate(1, group = $$props.group);
    		if ("text" in $$props) $$invalidate(4, text = $$props.text);
    		if ("size" in $$props) $$invalidate(5, size = $$props.size);
    		if ("pos" in $$props) $$invalidate(6, pos = $$props.pos);
    		if ("checked" in $$props) $$invalidate(7, checked = $$props.checked);
    		if ("min" in $$props) $$invalidate(8, min = $$props.min);
    		if ("max" in $$props) $$invalidate(9, max = $$props.max);
    		if ("step" in $$props) $$invalidate(10, step = $$props.step);
    	};

    	return [
    		value,
    		group,
    		type,
    		placeholder,
    		text,
    		size,
    		pos,
    		checked,
    		min,
    		max,
    		step,
    		change_handler,
    		change_handler_1,
    		change_handler_2,
    		input_input_handler,
    		input_input_handler_1,
    		input_input_handler_2,
    		input_input_handler_3,
    		input_change_handler,
    		$$binding_groups,
    		input_change_input_handler,
    		textarea_input_handler
    	];
    }

    class Input extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$d, create_fragment$e, safe_not_equal, {
    			value: 0,
    			type: 2,
    			placeholder: 3,
    			group: 1,
    			text: 4,
    			size: 5,
    			pos: 6,
    			checked: 7,
    			min: 8,
    			max: 9,
    			step: 10
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Input",
    			options,
    			id: create_fragment$e.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || ({});

    		if (/*value*/ ctx[0] === undefined && !("value" in props)) {
    			console.warn("<Input> was created without expected prop 'value'");
    		}

    		if (/*type*/ ctx[2] === undefined && !("type" in props)) {
    			console.warn("<Input> was created without expected prop 'type'");
    		}

    		if (/*placeholder*/ ctx[3] === undefined && !("placeholder" in props)) {
    			console.warn("<Input> was created without expected prop 'placeholder'");
    		}

    		if (/*group*/ ctx[1] === undefined && !("group" in props)) {
    			console.warn("<Input> was created without expected prop 'group'");
    		}

    		if (/*text*/ ctx[4] === undefined && !("text" in props)) {
    			console.warn("<Input> was created without expected prop 'text'");
    		}

    		if (/*size*/ ctx[5] === undefined && !("size" in props)) {
    			console.warn("<Input> was created without expected prop 'size'");
    		}

    		if (/*pos*/ ctx[6] === undefined && !("pos" in props)) {
    			console.warn("<Input> was created without expected prop 'pos'");
    		}

    		if (/*checked*/ ctx[7] === undefined && !("checked" in props)) {
    			console.warn("<Input> was created without expected prop 'checked'");
    		}
    	}

    	get value() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get group() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set group(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pos() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pos(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get checked() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set checked(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get min() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set min(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get max() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set max(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get step() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set step(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/events/edit.svelte generated by Svelte v3.16.3 */
    const file$e = "src/routes/events/edit.svelte";

    // (73:1) {#if error}
    function create_if_block_1$5(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Error.";
    			attr_dev(div, "class", "error");
    			add_location(div, file$e, 72, 12, 1843);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$5.name,
    		type: "if",
    		source: "(73:1) {#if error}",
    		ctx
    	});

    	return block;
    }

    // (74:1) {#if loading}
    function create_if_block$5(ctx) {
    	let current;
    	const loading_1 = new Loading({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(loading_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(loading_1, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loading_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loading_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(loading_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(74:1) {#if loading}",
    		ctx
    	});

    	return block;
    }

    // (76:4) <Headline>
    function create_default_slot_2$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Location");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$1.name,
    		type: "slot",
    		source: "(76:4) <Headline>",
    		ctx
    	});

    	return block;
    }

    // (77:4) <InputGroup>
    function create_default_slot_1$1(ctx) {
    	let updating_value;
    	let t0;
    	let updating_value_1;
    	let t1;
    	let updating_value_2;
    	let t2;
    	let updating_value_3;
    	let t3;
    	let updating_value_4;
    	let t4;
    	let updating_value_5;
    	let t5;
    	let updating_value_6;
    	let current;

    	function input0_value_binding(value) {
    		/*input0_value_binding*/ ctx[16].call(null, value);
    	}

    	let input0_props = { type: "text", placeholder: "Name" };

    	if (/*title*/ ctx[1] !== void 0) {
    		input0_props.value = /*title*/ ctx[1];
    	}

    	const input0 = new Input({ props: input0_props, $$inline: true });
    	binding_callbacks.push(() => bind(input0, "value", input0_value_binding));

    	function input1_value_binding(value_1) {
    		/*input1_value_binding*/ ctx[17].call(null, value_1);
    	}

    	let input1_props = { type: "text", placeholder: "Address" };

    	if (/*location*/ ctx[2] !== void 0) {
    		input1_props.value = /*location*/ ctx[2];
    	}

    	const input1 = new Input({ props: input1_props, $$inline: true });
    	binding_callbacks.push(() => bind(input1, "value", input1_value_binding));

    	function input2_value_binding(value_2) {
    		/*input2_value_binding*/ ctx[18].call(null, value_2);
    	}

    	let input2_props = {
    		type: "textarea",
    		placeholder: "Description"
    	};

    	if (/*description*/ ctx[3] !== void 0) {
    		input2_props.value = /*description*/ ctx[3];
    	}

    	const input2 = new Input({ props: input2_props, $$inline: true });
    	binding_callbacks.push(() => bind(input2, "value", input2_value_binding));

    	function input3_value_binding(value_3) {
    		/*input3_value_binding*/ ctx[19].call(null, value_3);
    	}

    	let input3_props = {
    		type: "date",
    		placeholder: "From",
    		size: "half",
    		pos: "left"
    	};

    	if (/*startDate*/ ctx[4] !== void 0) {
    		input3_props.value = /*startDate*/ ctx[4];
    	}

    	const input3 = new Input({ props: input3_props, $$inline: true });
    	binding_callbacks.push(() => bind(input3, "value", input3_value_binding));

    	function input4_value_binding(value_4) {
    		/*input4_value_binding*/ ctx[20].call(null, value_4);
    	}

    	let input4_props = {
    		type: "date",
    		placeholder: "To",
    		size: "half",
    		pos: "right"
    	};

    	if (/*endDate*/ ctx[5] !== void 0) {
    		input4_props.value = /*endDate*/ ctx[5];
    	}

    	const input4 = new Input({ props: input4_props, $$inline: true });
    	binding_callbacks.push(() => bind(input4, "value", input4_value_binding));

    	function input5_value_binding(value_5) {
    		/*input5_value_binding*/ ctx[21].call(null, value_5);
    	}

    	let input5_props = {
    		type: "time",
    		placeholder: "Starttime",
    		size: "half",
    		pos: "left"
    	};

    	if (/*startTime*/ ctx[6] !== void 0) {
    		input5_props.value = /*startTime*/ ctx[6];
    	}

    	const input5 = new Input({ props: input5_props, $$inline: true });
    	binding_callbacks.push(() => bind(input5, "value", input5_value_binding));

    	function input6_value_binding(value_6) {
    		/*input6_value_binding*/ ctx[22].call(null, value_6);
    	}

    	let input6_props = {
    		type: "time",
    		placeholder: "Endtime",
    		size: "half",
    		pos: "right"
    	};

    	if (/*endTime*/ ctx[7] !== void 0) {
    		input6_props.value = /*endTime*/ ctx[7];
    	}

    	const input6 = new Input({ props: input6_props, $$inline: true });
    	binding_callbacks.push(() => bind(input6, "value", input6_value_binding));

    	const block = {
    		c: function create() {
    			create_component(input0.$$.fragment);
    			t0 = space();
    			create_component(input1.$$.fragment);
    			t1 = space();
    			create_component(input2.$$.fragment);
    			t2 = space();
    			create_component(input3.$$.fragment);
    			t3 = space();
    			create_component(input4.$$.fragment);
    			t4 = space();
    			create_component(input5.$$.fragment);
    			t5 = space();
    			create_component(input6.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(input0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(input1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(input2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(input3, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(input4, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(input5, target, anchor);
    			insert_dev(target, t5, anchor);
    			mount_component(input6, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const input0_changes = {};

    			if (!updating_value && dirty & /*title*/ 2) {
    				updating_value = true;
    				input0_changes.value = /*title*/ ctx[1];
    				add_flush_callback(() => updating_value = false);
    			}

    			input0.$set(input0_changes);
    			const input1_changes = {};

    			if (!updating_value_1 && dirty & /*location*/ 4) {
    				updating_value_1 = true;
    				input1_changes.value = /*location*/ ctx[2];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			input1.$set(input1_changes);
    			const input2_changes = {};

    			if (!updating_value_2 && dirty & /*description*/ 8) {
    				updating_value_2 = true;
    				input2_changes.value = /*description*/ ctx[3];
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			input2.$set(input2_changes);
    			const input3_changes = {};

    			if (!updating_value_3 && dirty & /*startDate*/ 16) {
    				updating_value_3 = true;
    				input3_changes.value = /*startDate*/ ctx[4];
    				add_flush_callback(() => updating_value_3 = false);
    			}

    			input3.$set(input3_changes);
    			const input4_changes = {};

    			if (!updating_value_4 && dirty & /*endDate*/ 32) {
    				updating_value_4 = true;
    				input4_changes.value = /*endDate*/ ctx[5];
    				add_flush_callback(() => updating_value_4 = false);
    			}

    			input4.$set(input4_changes);
    			const input5_changes = {};

    			if (!updating_value_5 && dirty & /*startTime*/ 64) {
    				updating_value_5 = true;
    				input5_changes.value = /*startTime*/ ctx[6];
    				add_flush_callback(() => updating_value_5 = false);
    			}

    			input5.$set(input5_changes);
    			const input6_changes = {};

    			if (!updating_value_6 && dirty & /*endTime*/ 128) {
    				updating_value_6 = true;
    				input6_changes.value = /*endTime*/ ctx[7];
    				add_flush_callback(() => updating_value_6 = false);
    			}

    			input6.$set(input6_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(input0.$$.fragment, local);
    			transition_in(input1.$$.fragment, local);
    			transition_in(input2.$$.fragment, local);
    			transition_in(input3.$$.fragment, local);
    			transition_in(input4.$$.fragment, local);
    			transition_in(input5.$$.fragment, local);
    			transition_in(input6.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(input0.$$.fragment, local);
    			transition_out(input1.$$.fragment, local);
    			transition_out(input2.$$.fragment, local);
    			transition_out(input3.$$.fragment, local);
    			transition_out(input4.$$.fragment, local);
    			transition_out(input5.$$.fragment, local);
    			transition_out(input6.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(input0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(input1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(input2, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(input3, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(input4, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(input5, detaching);
    			if (detaching) detach_dev(t5);
    			destroy_component(input6, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(77:4) <InputGroup>",
    		ctx
    	});

    	return block;
    }

    // (72:0) <FullPage>
    function create_default_slot$3(ctx) {
    	let t0;
    	let t1;
    	let t2;
    	let current;
    	let if_block0 = /*error*/ ctx[8] && create_if_block_1$5(ctx);
    	let if_block1 = /*loading*/ ctx[0] && create_if_block$5(ctx);

    	const headline = new Headline({
    			props: {
    				$$slots: { default: [create_default_slot_2$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const inputgroup = new InputGroup({
    			props: {
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			create_component(headline.$$.fragment);
    			t2 = space();
    			create_component(inputgroup.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(headline, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(inputgroup, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*loading*/ ctx[0]) {
    				if (!if_block1) {
    					if_block1 = create_if_block$5(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(t1.parentNode, t1);
    				} else {
    					transition_in(if_block1, 1);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			const headline_changes = {};

    			if (dirty & /*$$scope*/ 8388608) {
    				headline_changes.$$scope = { dirty, ctx };
    			}

    			headline.$set(headline_changes);
    			const inputgroup_changes = {};

    			if (dirty & /*$$scope, endTime, startTime, endDate, startDate, description, location, title*/ 8388862) {
    				inputgroup_changes.$$scope = { dirty, ctx };
    			}

    			inputgroup.$set(inputgroup_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			transition_in(headline.$$.fragment, local);
    			transition_in(inputgroup.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			transition_out(headline.$$.fragment, local);
    			transition_out(inputgroup.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(headline, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(inputgroup, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(72:0) <FullPage>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$f(ctx) {
    	let t;
    	let current;

    	const fullpage = new FullPage({
    			props: {
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			t = space();
    			create_component(fullpage.$$.fragment);
    			document.title = "Edit event";
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    			mount_component(fullpage, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const fullpage_changes = {};

    			if (dirty & /*$$scope, endTime, startTime, endDate, startDate, description, location, title, loading*/ 8388863) {
    				fullpage_changes.$$scope = { dirty, ctx };
    			}

    			fullpage.$set(fullpage_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fullpage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fullpage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    			destroy_component(fullpage, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let $navConfig;
    	let $events;
    	validate_store(navConfig, "navConfig");
    	component_subscribe($$self, navConfig, $$value => $$invalidate(10, $navConfig = $$value));
    	validate_store(events, "events");
    	component_subscribe($$self, events, $$value => $$invalidate(11, $events = $$value));

    	set_store_value(navConfig, $navConfig = {
    		type: "editpage",
    		title: "Edit event",
    		tools: [],
    		actions: { update: () => update() }
    	});

    	let { params = {} } = $$props;
    	const { slug } = params;
    	let event = $events.find(event => event.id === slug);
    	let loading = false;
    	let error = false;
    	let title = event.title || "";
    	let location = event.location || "";
    	let description = event.description || "";
    	let startDate = formatToInputDateTime(event.startDate);
    	let endDate = formatToInputDateTime(event.endDate);
    	let startTime = event.startTime;
    	let endTime = event.endTime;
    	let type = event.type;

    	const update = () => {
    		$$invalidate(0, loading = true);

    		const data = {
    			"id": Date.now().toString(),
    			title,
    			location,
    			description,
    			startDate,
    			endDate,
    			startTime,
    			endTime,
    			type
    		};

    		let event = $events.find((event, id) => {
    			if (event.id === slug) {
    				set_store_value(events, $events[id] = data, $events);
    			}
    		});

    		setTimeout(
    			() => {
    				push("/events");
    			},
    			1000
    		);
    	};

    	const writable_props = ["params"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Edit> was created with unknown prop '${key}'`);
    	});

    	function input0_value_binding(value) {
    		title = value;
    		$$invalidate(1, title);
    	}

    	function input1_value_binding(value_1) {
    		location = value_1;
    		$$invalidate(2, location);
    	}

    	function input2_value_binding(value_2) {
    		description = value_2;
    		$$invalidate(3, description);
    	}

    	function input3_value_binding(value_3) {
    		startDate = value_3;
    		$$invalidate(4, startDate);
    	}

    	function input4_value_binding(value_4) {
    		endDate = value_4;
    		$$invalidate(5, endDate);
    	}

    	function input5_value_binding(value_5) {
    		startTime = value_5;
    		$$invalidate(6, startTime);
    	}

    	function input6_value_binding(value_6) {
    		endTime = value_6;
    		$$invalidate(7, endTime);
    	}

    	$$self.$set = $$props => {
    		if ("params" in $$props) $$invalidate(9, params = $$props.params);
    	};

    	$$self.$capture_state = () => {
    		return {
    			params,
    			event,
    			loading,
    			error,
    			title,
    			location,
    			description,
    			startDate,
    			endDate,
    			startTime,
    			endTime,
    			type,
    			$navConfig,
    			$events
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("params" in $$props) $$invalidate(9, params = $$props.params);
    		if ("event" in $$props) event = $$props.event;
    		if ("loading" in $$props) $$invalidate(0, loading = $$props.loading);
    		if ("error" in $$props) $$invalidate(8, error = $$props.error);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("location" in $$props) $$invalidate(2, location = $$props.location);
    		if ("description" in $$props) $$invalidate(3, description = $$props.description);
    		if ("startDate" in $$props) $$invalidate(4, startDate = $$props.startDate);
    		if ("endDate" in $$props) $$invalidate(5, endDate = $$props.endDate);
    		if ("startTime" in $$props) $$invalidate(6, startTime = $$props.startTime);
    		if ("endTime" in $$props) $$invalidate(7, endTime = $$props.endTime);
    		if ("type" in $$props) type = $$props.type;
    		if ("$navConfig" in $$props) navConfig.set($navConfig = $$props.$navConfig);
    		if ("$events" in $$props) events.set($events = $$props.$events);
    	};

    	return [
    		loading,
    		title,
    		location,
    		description,
    		startDate,
    		endDate,
    		startTime,
    		endTime,
    		error,
    		params,
    		$navConfig,
    		$events,
    		slug,
    		event,
    		type,
    		update,
    		input0_value_binding,
    		input1_value_binding,
    		input2_value_binding,
    		input3_value_binding,
    		input4_value_binding,
    		input5_value_binding,
    		input6_value_binding
    	];
    }

    class Edit extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$f, safe_not_equal, { params: 9 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Edit",
    			options,
    			id: create_fragment$f.name
    		});
    	}

    	get params() {
    		throw new Error("<Edit>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set params(value) {
    		throw new Error("<Edit>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/routes/events/add.svelte generated by Svelte v3.16.3 */

    // (65:1) {#if loading}
    function create_if_block_1$6(ctx) {
    	let current;
    	const loading_1 = new Loading({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(loading_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(loading_1, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loading_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loading_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(loading_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$6.name,
    		type: "if",
    		source: "(65:1) {#if loading}",
    		ctx
    	});

    	return block;
    }

    // (67:1) <Headline>
    function create_default_slot_4$1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Kalender");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4$1.name,
    		type: "slot",
    		source: "(67:1) <Headline>",
    		ctx
    	});

    	return block;
    }

    // (68:1) <InputGroup>
    function create_default_slot_3$1(ctx) {
    	let updating_group;
    	let t;
    	let updating_group_1;
    	let current;

    	function input0_group_binding(value) {
    		/*input0_group_binding*/ ctx[12].call(null, value);
    	}

    	let input0_props = {
    		type: "radio",
    		value: "eventsA",
    		text: "FilterA"
    	};

    	if (/*calendarType*/ ctx[0] !== void 0) {
    		input0_props.group = /*calendarType*/ ctx[0];
    	}

    	const input0 = new Input({ props: input0_props, $$inline: true });
    	binding_callbacks.push(() => bind(input0, "group", input0_group_binding));

    	function input1_group_binding(value_1) {
    		/*input1_group_binding*/ ctx[13].call(null, value_1);
    	}

    	let input1_props = {
    		type: "radio",
    		value: "eventsB",
    		text: "FilterB"
    	};

    	if (/*calendarType*/ ctx[0] !== void 0) {
    		input1_props.group = /*calendarType*/ ctx[0];
    	}

    	const input1 = new Input({ props: input1_props, $$inline: true });
    	binding_callbacks.push(() => bind(input1, "group", input1_group_binding));

    	const block = {
    		c: function create() {
    			create_component(input0.$$.fragment);
    			t = space();
    			create_component(input1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(input0, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(input1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const input0_changes = {};

    			if (!updating_group && dirty & /*calendarType*/ 1) {
    				updating_group = true;
    				input0_changes.group = /*calendarType*/ ctx[0];
    				add_flush_callback(() => updating_group = false);
    			}

    			input0.$set(input0_changes);
    			const input1_changes = {};

    			if (!updating_group_1 && dirty & /*calendarType*/ 1) {
    				updating_group_1 = true;
    				input1_changes.group = /*calendarType*/ ctx[0];
    				add_flush_callback(() => updating_group_1 = false);
    			}

    			input1.$set(input1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(input0.$$.fragment, local);
    			transition_in(input1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(input0.$$.fragment, local);
    			transition_out(input1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(input0, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(input1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3$1.name,
    		type: "slot",
    		source: "(68:1) <InputGroup>",
    		ctx
    	});

    	return block;
    }

    // (73:1) {#if calendarType}
    function create_if_block$6(ctx) {
    	let t;
    	let current;

    	const headline = new Headline({
    			props: {
    				$$slots: { default: [create_default_slot_2$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const inputgroup = new InputGroup({
    			props: {
    				$$slots: { default: [create_default_slot_1$2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(headline.$$.fragment);
    			t = space();
    			create_component(inputgroup.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(headline, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(inputgroup, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const headline_changes = {};

    			if (dirty & /*$$scope*/ 2097152) {
    				headline_changes.$$scope = { dirty, ctx };
    			}

    			headline.$set(headline_changes);
    			const inputgroup_changes = {};

    			if (dirty & /*$$scope, endTime, startTime, endDate, startDate, description, location, title*/ 2097406) {
    				inputgroup_changes.$$scope = { dirty, ctx };
    			}

    			inputgroup.$set(inputgroup_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(headline.$$.fragment, local);
    			transition_in(inputgroup.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(headline.$$.fragment, local);
    			transition_out(inputgroup.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(headline, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(inputgroup, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(73:1) {#if calendarType}",
    		ctx
    	});

    	return block;
    }

    // (74:8) <Headline>
    function create_default_slot_2$2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Location");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$2.name,
    		type: "slot",
    		source: "(74:8) <Headline>",
    		ctx
    	});

    	return block;
    }

    // (75:8) <InputGroup>
    function create_default_slot_1$2(ctx) {
    	let updating_value;
    	let t0;
    	let updating_value_1;
    	let t1;
    	let updating_value_2;
    	let t2;
    	let updating_value_3;
    	let t3;
    	let updating_value_4;
    	let t4;
    	let updating_value_5;
    	let t5;
    	let updating_value_6;
    	let current;

    	function input0_value_binding(value) {
    		/*input0_value_binding*/ ctx[14].call(null, value);
    	}

    	let input0_props = { type: "text", placeholder: "Name" };

    	if (/*title*/ ctx[1] !== void 0) {
    		input0_props.value = /*title*/ ctx[1];
    	}

    	const input0 = new Input({ props: input0_props, $$inline: true });
    	binding_callbacks.push(() => bind(input0, "value", input0_value_binding));

    	function input1_value_binding(value_1) {
    		/*input1_value_binding*/ ctx[15].call(null, value_1);
    	}

    	let input1_props = { type: "text", placeholder: "Address" };

    	if (/*location*/ ctx[2] !== void 0) {
    		input1_props.value = /*location*/ ctx[2];
    	}

    	const input1 = new Input({ props: input1_props, $$inline: true });
    	binding_callbacks.push(() => bind(input1, "value", input1_value_binding));

    	function input2_value_binding(value_2) {
    		/*input2_value_binding*/ ctx[16].call(null, value_2);
    	}

    	let input2_props = {
    		type: "textarea",
    		placeholder: "Description"
    	};

    	if (/*description*/ ctx[3] !== void 0) {
    		input2_props.value = /*description*/ ctx[3];
    	}

    	const input2 = new Input({ props: input2_props, $$inline: true });
    	binding_callbacks.push(() => bind(input2, "value", input2_value_binding));

    	function input3_value_binding(value_3) {
    		/*input3_value_binding*/ ctx[17].call(null, value_3);
    	}

    	let input3_props = {
    		type: "date",
    		placeholder: "From",
    		size: "half",
    		pos: "left"
    	};

    	if (/*startDate*/ ctx[4] !== void 0) {
    		input3_props.value = /*startDate*/ ctx[4];
    	}

    	const input3 = new Input({ props: input3_props, $$inline: true });
    	binding_callbacks.push(() => bind(input3, "value", input3_value_binding));

    	function input4_value_binding(value_4) {
    		/*input4_value_binding*/ ctx[18].call(null, value_4);
    	}

    	let input4_props = {
    		type: "date",
    		placeholder: "To",
    		size: "half",
    		pos: "right"
    	};

    	if (/*endDate*/ ctx[5] !== void 0) {
    		input4_props.value = /*endDate*/ ctx[5];
    	}

    	const input4 = new Input({ props: input4_props, $$inline: true });
    	binding_callbacks.push(() => bind(input4, "value", input4_value_binding));

    	function input5_value_binding(value_5) {
    		/*input5_value_binding*/ ctx[19].call(null, value_5);
    	}

    	let input5_props = {
    		type: "time",
    		placeholder: "Starttime",
    		size: "half",
    		pos: "left"
    	};

    	if (/*startTime*/ ctx[6] !== void 0) {
    		input5_props.value = /*startTime*/ ctx[6];
    	}

    	const input5 = new Input({ props: input5_props, $$inline: true });
    	binding_callbacks.push(() => bind(input5, "value", input5_value_binding));

    	function input6_value_binding(value_6) {
    		/*input6_value_binding*/ ctx[20].call(null, value_6);
    	}

    	let input6_props = {
    		type: "time",
    		placeholder: "Endtime",
    		size: "half",
    		pos: "right"
    	};

    	if (/*endTime*/ ctx[7] !== void 0) {
    		input6_props.value = /*endTime*/ ctx[7];
    	}

    	const input6 = new Input({ props: input6_props, $$inline: true });
    	binding_callbacks.push(() => bind(input6, "value", input6_value_binding));

    	const block = {
    		c: function create() {
    			create_component(input0.$$.fragment);
    			t0 = space();
    			create_component(input1.$$.fragment);
    			t1 = space();
    			create_component(input2.$$.fragment);
    			t2 = space();
    			create_component(input3.$$.fragment);
    			t3 = space();
    			create_component(input4.$$.fragment);
    			t4 = space();
    			create_component(input5.$$.fragment);
    			t5 = space();
    			create_component(input6.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(input0, target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(input1, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(input2, target, anchor);
    			insert_dev(target, t2, anchor);
    			mount_component(input3, target, anchor);
    			insert_dev(target, t3, anchor);
    			mount_component(input4, target, anchor);
    			insert_dev(target, t4, anchor);
    			mount_component(input5, target, anchor);
    			insert_dev(target, t5, anchor);
    			mount_component(input6, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const input0_changes = {};

    			if (!updating_value && dirty & /*title*/ 2) {
    				updating_value = true;
    				input0_changes.value = /*title*/ ctx[1];
    				add_flush_callback(() => updating_value = false);
    			}

    			input0.$set(input0_changes);
    			const input1_changes = {};

    			if (!updating_value_1 && dirty & /*location*/ 4) {
    				updating_value_1 = true;
    				input1_changes.value = /*location*/ ctx[2];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			input1.$set(input1_changes);
    			const input2_changes = {};

    			if (!updating_value_2 && dirty & /*description*/ 8) {
    				updating_value_2 = true;
    				input2_changes.value = /*description*/ ctx[3];
    				add_flush_callback(() => updating_value_2 = false);
    			}

    			input2.$set(input2_changes);
    			const input3_changes = {};

    			if (!updating_value_3 && dirty & /*startDate*/ 16) {
    				updating_value_3 = true;
    				input3_changes.value = /*startDate*/ ctx[4];
    				add_flush_callback(() => updating_value_3 = false);
    			}

    			input3.$set(input3_changes);
    			const input4_changes = {};

    			if (!updating_value_4 && dirty & /*endDate*/ 32) {
    				updating_value_4 = true;
    				input4_changes.value = /*endDate*/ ctx[5];
    				add_flush_callback(() => updating_value_4 = false);
    			}

    			input4.$set(input4_changes);
    			const input5_changes = {};

    			if (!updating_value_5 && dirty & /*startTime*/ 64) {
    				updating_value_5 = true;
    				input5_changes.value = /*startTime*/ ctx[6];
    				add_flush_callback(() => updating_value_5 = false);
    			}

    			input5.$set(input5_changes);
    			const input6_changes = {};

    			if (!updating_value_6 && dirty & /*endTime*/ 128) {
    				updating_value_6 = true;
    				input6_changes.value = /*endTime*/ ctx[7];
    				add_flush_callback(() => updating_value_6 = false);
    			}

    			input6.$set(input6_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(input0.$$.fragment, local);
    			transition_in(input1.$$.fragment, local);
    			transition_in(input2.$$.fragment, local);
    			transition_in(input3.$$.fragment, local);
    			transition_in(input4.$$.fragment, local);
    			transition_in(input5.$$.fragment, local);
    			transition_in(input6.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(input0.$$.fragment, local);
    			transition_out(input1.$$.fragment, local);
    			transition_out(input2.$$.fragment, local);
    			transition_out(input3.$$.fragment, local);
    			transition_out(input4.$$.fragment, local);
    			transition_out(input5.$$.fragment, local);
    			transition_out(input6.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(input0, detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(input1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(input2, detaching);
    			if (detaching) detach_dev(t2);
    			destroy_component(input3, detaching);
    			if (detaching) detach_dev(t3);
    			destroy_component(input4, detaching);
    			if (detaching) detach_dev(t4);
    			destroy_component(input5, detaching);
    			if (detaching) detach_dev(t5);
    			destroy_component(input6, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$2.name,
    		type: "slot",
    		source: "(75:8) <InputGroup>",
    		ctx
    	});

    	return block;
    }

    // (64:0) <FullPage>
    function create_default_slot$4(ctx) {
    	let t0;
    	let t1;
    	let t2;
    	let if_block1_anchor;
    	let current;
    	let if_block0 = /*loading*/ ctx[8] && create_if_block_1$6(ctx);

    	const headline = new Headline({
    			props: {
    				$$slots: { default: [create_default_slot_4$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const inputgroup = new InputGroup({
    			props: {
    				$$slots: { default: [create_default_slot_3$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let if_block1 = /*calendarType*/ ctx[0] && create_if_block$6(ctx);

    	const block = {
    		c: function create() {
    			if (if_block0) if_block0.c();
    			t0 = space();
    			create_component(headline.$$.fragment);
    			t1 = space();
    			create_component(inputgroup.$$.fragment);
    			t2 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			mount_component(headline, target, anchor);
    			insert_dev(target, t1, anchor);
    			mount_component(inputgroup, target, anchor);
    			insert_dev(target, t2, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*loading*/ ctx[8]) {
    				if (!if_block0) {
    					if_block0 = create_if_block_1$6(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t0.parentNode, t0);
    				} else {
    					transition_in(if_block0, 1);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			const headline_changes = {};

    			if (dirty & /*$$scope*/ 2097152) {
    				headline_changes.$$scope = { dirty, ctx };
    			}

    			headline.$set(headline_changes);
    			const inputgroup_changes = {};

    			if (dirty & /*$$scope, calendarType*/ 2097153) {
    				inputgroup_changes.$$scope = { dirty, ctx };
    			}

    			inputgroup.$set(inputgroup_changes);

    			if (/*calendarType*/ ctx[0]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    					transition_in(if_block1, 1);
    				} else {
    					if_block1 = create_if_block$6(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(headline.$$.fragment, local);
    			transition_in(inputgroup.$$.fragment, local);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(headline.$$.fragment, local);
    			transition_out(inputgroup.$$.fragment, local);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t0);
    			destroy_component(headline, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_component(inputgroup, detaching);
    			if (detaching) detach_dev(t2);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(64:0) <FullPage>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$g(ctx) {
    	let t;
    	let current;

    	const fullpage = new FullPage({
    			props: {
    				$$slots: { default: [create_default_slot$4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			t = space();
    			create_component(fullpage.$$.fragment);
    			document.title = "Add event";
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    			mount_component(fullpage, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const fullpage_changes = {};

    			if (dirty & /*$$scope, calendarType, endTime, startTime, endDate, startDate, description, location, title, loading*/ 2097663) {
    				fullpage_changes.$$scope = { dirty, ctx };
    			}

    			fullpage.$set(fullpage_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fullpage.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fullpage.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    			destroy_component(fullpage, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let $navConfig;
    	let $events;
    	validate_store(navConfig, "navConfig");
    	component_subscribe($$self, navConfig, $$value => $$invalidate(9, $navConfig = $$value));
    	validate_store(events, "events");
    	component_subscribe($$self, events, $$value => $$invalidate(10, $events = $$value));
    	let calendarType = "";
    	let title = "";
    	let location = "";
    	let description = "";
    	let startDate = "";
    	let endDate = "";
    	let startTime = "";
    	let endTime = "";
    	let loading = false;

    	set_store_value(navConfig, $navConfig = {
    		type: "createpage",
    		title: "Add event",
    		tools: [],
    		actions: { save: () => save() }
    	});

    	const save = () => {
    		if (!calendarType.length) {
    			alert("First set calendartype");
    			return;
    		}

    		const date = new Date(startDate);
    		const month = date.getMonth();

    		const data = {
    			"id": Date.now().toString(),
    			title,
    			location,
    			description,
    			startDate,
    			endDate,
    			startTime,
    			endTime,
    			"type": calendarType,
    			month
    		};

    		set_store_value(events, $events = [...$events, data]);
    		$$invalidate(8, loading = true);

    		setTimeout(
    			() => {
    				push("/events");
    			},
    			1000
    		);
    	};

    	function input0_group_binding(value) {
    		calendarType = value;
    		$$invalidate(0, calendarType);
    	}

    	function input1_group_binding(value_1) {
    		calendarType = value_1;
    		$$invalidate(0, calendarType);
    	}

    	function input0_value_binding(value) {
    		title = value;
    		$$invalidate(1, title);
    	}

    	function input1_value_binding(value_1) {
    		location = value_1;
    		$$invalidate(2, location);
    	}

    	function input2_value_binding(value_2) {
    		description = value_2;
    		$$invalidate(3, description);
    	}

    	function input3_value_binding(value_3) {
    		startDate = value_3;
    		$$invalidate(4, startDate);
    	}

    	function input4_value_binding(value_4) {
    		endDate = value_4;
    		$$invalidate(5, endDate);
    	}

    	function input5_value_binding(value_5) {
    		startTime = value_5;
    		$$invalidate(6, startTime);
    	}

    	function input6_value_binding(value_6) {
    		endTime = value_6;
    		$$invalidate(7, endTime);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("calendarType" in $$props) $$invalidate(0, calendarType = $$props.calendarType);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("location" in $$props) $$invalidate(2, location = $$props.location);
    		if ("description" in $$props) $$invalidate(3, description = $$props.description);
    		if ("startDate" in $$props) $$invalidate(4, startDate = $$props.startDate);
    		if ("endDate" in $$props) $$invalidate(5, endDate = $$props.endDate);
    		if ("startTime" in $$props) $$invalidate(6, startTime = $$props.startTime);
    		if ("endTime" in $$props) $$invalidate(7, endTime = $$props.endTime);
    		if ("loading" in $$props) $$invalidate(8, loading = $$props.loading);
    		if ("$navConfig" in $$props) navConfig.set($navConfig = $$props.$navConfig);
    		if ("$events" in $$props) events.set($events = $$props.$events);
    	};

    	return [
    		calendarType,
    		title,
    		location,
    		description,
    		startDate,
    		endDate,
    		startTime,
    		endTime,
    		loading,
    		$navConfig,
    		$events,
    		save,
    		input0_group_binding,
    		input1_group_binding,
    		input0_value_binding,
    		input1_value_binding,
    		input2_value_binding,
    		input3_value_binding,
    		input4_value_binding,
    		input5_value_binding,
    		input6_value_binding
    	];
    }

    class Add extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$g, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Add",
    			options,
    			id: create_fragment$g.name
    		});
    	}
    }

    /* src/routes/settings.svelte generated by Svelte v3.16.3 */

    // (24:1) <Headline>
    function create_default_slot_2$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Change theme");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2$3.name,
    		type: "slot",
    		source: "(24:1) <Headline>",
    		ctx
    	});

    	return block;
    }

    // (25:1) <InputGroup>
    function create_default_slot_1$3(ctx) {
    	let current;

    	const input = new Input({
    			props: {
    				type: "checkbox",
    				text: "Dark Theme",
    				checked: /*$darkmode*/ ctx[0]
    			},
    			$$inline: true
    		});

    	input.$on("change", /*switchTheme*/ ctx[1]);

    	const block = {
    		c: function create() {
    			create_component(input.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(input, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const input_changes = {};
    			if (dirty & /*$darkmode*/ 1) input_changes.checked = /*$darkmode*/ ctx[0];
    			input.$set(input_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(input.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(input.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(input, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$3.name,
    		type: "slot",
    		source: "(25:1) <InputGroup>",
    		ctx
    	});

    	return block;
    }

    // (23:0) <Page>
    function create_default_slot$5(ctx) {
    	let t;
    	let current;

    	const headline = new Headline({
    			props: {
    				$$slots: { default: [create_default_slot_2$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const inputgroup = new InputGroup({
    			props: {
    				$$slots: { default: [create_default_slot_1$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(headline.$$.fragment);
    			t = space();
    			create_component(inputgroup.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(headline, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(inputgroup, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const headline_changes = {};

    			if (dirty & /*$$scope*/ 8) {
    				headline_changes.$$scope = { dirty, ctx };
    			}

    			headline.$set(headline_changes);
    			const inputgroup_changes = {};

    			if (dirty & /*$$scope, $darkmode*/ 9) {
    				inputgroup_changes.$$scope = { dirty, ctx };
    			}

    			inputgroup.$set(inputgroup_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(headline.$$.fragment, local);
    			transition_in(inputgroup.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(headline.$$.fragment, local);
    			transition_out(inputgroup.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(headline, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(inputgroup, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$5.name,
    		type: "slot",
    		source: "(23:0) <Page>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$h(ctx) {
    	let t;
    	let current;

    	const page = new Page({
    			props: {
    				$$slots: { default: [create_default_slot$5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			t = space();
    			create_component(page.$$.fragment);
    			document.title = "Settings";
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    			mount_component(page, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const page_changes = {};

    			if (dirty & /*$$scope, $darkmode*/ 9) {
    				page_changes.$$scope = { dirty, ctx };
    			}

    			page.$set(page_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(page.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(page.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    			destroy_component(page, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let $darkmode;
    	let $navConfig;
    	validate_store(darkmode, "darkmode");
    	component_subscribe($$self, darkmode, $$value => $$invalidate(0, $darkmode = $$value));
    	validate_store(navConfig, "navConfig");
    	component_subscribe($$self, navConfig, $$value => $$invalidate(2, $navConfig = $$value));

    	const switchTheme = () => {
    		set_store_value(darkmode, $darkmode = !$darkmode);
    	};

    	set_store_value(navConfig, $navConfig = {
    		type: "page",
    		title: "Settings",
    		tools: []
    	});

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("$darkmode" in $$props) darkmode.set($darkmode = $$props.$darkmode);
    		if ("$navConfig" in $$props) navConfig.set($navConfig = $$props.$navConfig);
    	};

    	return [$darkmode, switchTheme];
    }

    class Settings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$g, create_fragment$h, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Settings",
    			options,
    			id: create_fragment$h.name
    		});
    	}
    }

    /* src/routes/notFound.svelte generated by Svelte v3.16.3 */

    const file$f = "src/routes/notFound.svelte";

    function create_fragment$i(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Page not found";
    			add_location(h1, file$f, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class NotFound extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$i, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NotFound",
    			options,
    			id: create_fragment$i.name
    		});
    	}
    }

    var routes = {
        '/': Routes,
        '/settings': Settings,
        '/events': Events,
        '/events/add': Add,
        '/events/edit/:slug': Edit,
        '/events/:slug': Detail,
        '*': NotFound,
    };

    /* src/components/layout/NavigationBar.svelte generated by Svelte v3.16.3 */
    const file$g = "src/components/layout/NavigationBar.svelte";

    // (62:1) {#if ($navConfig.type === 'subpage')}
    function create_if_block_4$3(ctx) {
    	let current;
    	const icon = new Icon({ props: { name: "back" }, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$3.name,
    		type: "if",
    		source: "(62:1) {#if ($navConfig.type === 'subpage')}",
    		ctx
    	});

    	return block;
    }

    // (67:1) {#if ($navConfig.type === 'createpage')}
    function create_if_block_3$4(ctx) {
    	let div0;
    	let div0_transition;
    	let t1;
    	let div1;
    	let div1_transition;
    	let current;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div0.textContent = "Save";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "Cancel";
    			attr_dev(div0, "class", "save right svelte-1h5xl9t");
    			add_location(div0, file$g, 67, 2, 1670);
    			attr_dev(div1, "class", "back left svelte-1h5xl9t");
    			add_location(div1, file$g, 68, 2, 1774);

    			dispose = [
    				listen_dev(
    					div0,
    					"click",
    					function () {
    						/*$navConfig*/ ctx[3].actions.save.apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				),
    				listen_dev(div1, "click", /*back*/ ctx[9], false, false, false)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fade, /*fadeOptions*/ ctx[8], true);
    				div0_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, /*fadeOptions*/ ctx[8], true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fade, /*fadeOptions*/ ctx[8], false);
    			div0_transition.run(0);
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, /*fadeOptions*/ ctx[8], false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching && div0_transition) div0_transition.end();
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			if (detaching && div1_transition) div1_transition.end();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$4.name,
    		type: "if",
    		source: "(67:1) {#if ($navConfig.type === 'createpage')}",
    		ctx
    	});

    	return block;
    }

    // (72:1) {#if ($navConfig.type === 'editpage')}
    function create_if_block_2$5(ctx) {
    	let div0;
    	let div0_transition;
    	let t1;
    	let div1;
    	let div1_transition;
    	let current;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div0.textContent = "Save";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = "Cancel";
    			attr_dev(div0, "class", "save right svelte-1h5xl9t");
    			add_location(div0, file$g, 72, 2, 1908);
    			attr_dev(div1, "class", "cancel left svelte-1h5xl9t");
    			add_location(div1, file$g, 73, 2, 2014);

    			dispose = [
    				listen_dev(
    					div0,
    					"click",
    					function () {
    						/*$navConfig*/ ctx[3].actions.update.apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				),
    				listen_dev(div1, "click", /*back*/ ctx[9], false, false, false)
    			];
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fade, /*fadeOptions*/ ctx[8], true);
    				div0_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, /*fadeOptions*/ ctx[8], true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fade, /*fadeOptions*/ ctx[8], false);
    			div0_transition.run(0);
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fade, /*fadeOptions*/ ctx[8], false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching && div0_transition) div0_transition.end();
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			if (detaching && div1_transition) div1_transition.end();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$5.name,
    		type: "if",
    		source: "(72:1) {#if ($navConfig.type === 'editpage')}",
    		ctx
    	});

    	return block;
    }

    // (79:64) 
    function create_if_block_1$7(ctx) {
    	let div;
    	let div_transition;
    	let current;
    	let dispose;

    	const icon = new Icon({
    			props: { name: "add", active: true },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(icon.$$.fragment);
    			attr_dev(div, "class", "add right svelte-1h5xl9t");
    			add_location(div, file$g, 79, 2, 2366);

    			dispose = listen_dev(
    				div,
    				"click",
    				function () {
    					/*$navConfig*/ ctx[3].actions.add.apply(this, arguments);
    				},
    				false,
    				false,
    				false
    			);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(icon, div, null);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fade, /*fadeOptions*/ ctx[8], true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fade, /*fadeOptions*/ ctx[8], false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(icon);
    			if (detaching && div_transition) div_transition.end();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$7.name,
    		type: "if",
    		source: "(79:64) ",
    		ctx
    	});

    	return block;
    }

    // (77:1) {#if (pageTitle === 'Links' && $navConfig.type === 'page')}
    function create_if_block$7(ctx) {
    	let div;
    	let div_transition;
    	let current;
    	let dispose;

    	const icon = new Icon({
    			props: { name: "add", active: true },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(icon.$$.fragment);
    			attr_dev(div, "class", "add right svelte-1h5xl9t");
    			add_location(div, file$g, 77, 2, 2171);

    			dispose = listen_dev(
    				div,
    				"click",
    				function () {
    					/*$navConfig*/ ctx[3].actions.add.apply(this, arguments);
    				},
    				false,
    				false,
    				false
    			);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(icon, div, null);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fade, /*fadeOptions*/ ctx[8], true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fade, /*fadeOptions*/ ctx[8], false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(icon);
    			if (detaching && div_transition) div_transition.end();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(77:1) {#if (pageTitle === 'Links' && $navConfig.type === 'page')}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$j(ctx) {
    	let nav;
    	let div0;
    	let t0;
    	let t1;
    	let div0_class_value;
    	let t2;
    	let div1;
    	let t3;
    	let t4;
    	let t5;
    	let t6;
    	let current_block_type_index;
    	let if_block3;
    	let current;
    	let dispose;
    	let if_block0 = /*$navConfig*/ ctx[3].type === "subpage" && create_if_block_4$3(ctx);
    	let if_block1 = /*$navConfig*/ ctx[3].type === "createpage" && create_if_block_3$4(ctx);
    	let if_block2 = /*$navConfig*/ ctx[3].type === "editpage" && create_if_block_2$5(ctx);
    	const if_block_creators = [create_if_block$7, create_if_block_1$7];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*pageTitle*/ ctx[1] === "Links" && /*$navConfig*/ ctx[3].type === "page") return 0;
    		if (/*pageTitle*/ ctx[1] === "Events" && /*$navConfig*/ ctx[3].type === "page") return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block3 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			nav = element("nav");
    			div0 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			t1 = text(/*pageTitle*/ ctx[1]);
    			t2 = space();
    			div1 = element("div");
    			t3 = text(/*subPageTitle*/ ctx[2]);
    			t4 = space();
    			if (if_block1) if_block1.c();
    			t5 = space();
    			if (if_block2) if_block2.c();
    			t6 = space();
    			if (if_block3) if_block3.c();
    			attr_dev(div0, "class", div0_class_value = "title " + /*pageTitlePos*/ ctx[0] + " svelte-1h5xl9t");
    			set_style(div0, "transform", "translateX(-" + /*$titleLeft*/ ctx[4] * 50 + "%)");
    			set_style(div0, "left", /*$titleLeft*/ ctx[4] * 50 + "vw");
    			add_location(div0, file$g, 60, 1, 1334);
    			attr_dev(div1, "class", "subTitle svelte-1h5xl9t");
    			set_style(div1, "left", "-" + /*$subTitleLeft*/ ctx[5] * 100 + "vw");
    			add_location(div1, file$g, 64, 1, 1545);
    			attr_dev(nav, "class", "svelte-1h5xl9t");
    			add_location(nav, file$g, 59, 0, 1327);
    			dispose = listen_dev(div0, "click", /*back*/ ctx[9], false, false, false);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, nav, anchor);
    			append_dev(nav, div0);
    			if (if_block0) if_block0.m(div0, null);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			append_dev(nav, t2);
    			append_dev(nav, div1);
    			append_dev(div1, t3);
    			append_dev(nav, t4);
    			if (if_block1) if_block1.m(nav, null);
    			append_dev(nav, t5);
    			if (if_block2) if_block2.m(nav, null);
    			append_dev(nav, t6);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(nav, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$navConfig*/ ctx[3].type === "subpage") {
    				if (!if_block0) {
    					if_block0 = create_if_block_4$3(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div0, t0);
    				} else {
    					transition_in(if_block0, 1);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty & /*pageTitle*/ 2) set_data_dev(t1, /*pageTitle*/ ctx[1]);

    			if (!current || dirty & /*pageTitlePos*/ 1 && div0_class_value !== (div0_class_value = "title " + /*pageTitlePos*/ ctx[0] + " svelte-1h5xl9t")) {
    				attr_dev(div0, "class", div0_class_value);
    			}

    			if (!current || dirty & /*$titleLeft*/ 16) {
    				set_style(div0, "transform", "translateX(-" + /*$titleLeft*/ ctx[4] * 50 + "%)");
    			}

    			if (!current || dirty & /*$titleLeft*/ 16) {
    				set_style(div0, "left", /*$titleLeft*/ ctx[4] * 50 + "vw");
    			}

    			if (!current || dirty & /*subPageTitle*/ 4) set_data_dev(t3, /*subPageTitle*/ ctx[2]);

    			if (!current || dirty & /*$subTitleLeft*/ 32) {
    				set_style(div1, "left", "-" + /*$subTitleLeft*/ ctx[5] * 100 + "vw");
    			}

    			if (/*$navConfig*/ ctx[3].type === "createpage") {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    					transition_in(if_block1, 1);
    				} else {
    					if_block1 = create_if_block_3$4(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(nav, t5);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (/*$navConfig*/ ctx[3].type === "editpage") {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    					transition_in(if_block2, 1);
    				} else {
    					if_block2 = create_if_block_2$5(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(nav, t6);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block3) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block3 = if_blocks[current_block_type_index];

    					if (!if_block3) {
    						if_block3 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block3.c();
    					}

    					transition_in(if_block3, 1);
    					if_block3.m(nav, null);
    				} else {
    					if_block3 = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			transition_in(if_block2);
    			transition_in(if_block3);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			transition_out(if_block2);
    			transition_out(if_block3);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(nav);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let $navConfig;
    	let $titleLeft;
    	let $subTitleLeft;
    	validate_store(navConfig, "navConfig");
    	component_subscribe($$self, navConfig, $$value => $$invalidate(3, $navConfig = $$value));
    	const titleLeft = tweened(1, { duration: 600, easing: cubicOut });
    	validate_store(titleLeft, "titleLeft");
    	component_subscribe($$self, titleLeft, value => $$invalidate(4, $titleLeft = value));
    	const subTitleLeft = tweened(1, { duration: 600, easing: cubicOut });
    	validate_store(subTitleLeft, "subTitleLeft");
    	component_subscribe($$self, subTitleLeft, value => $$invalidate(5, $subTitleLeft = value));
    	let pageTitlePos = "";
    	let fadeOptions = { duration: 100 };
    	let subTitleFlyOptions = { x: 320, duration: 600, opacity: 1 };
    	let pageTitle = "";
    	let subPageTitle = "";
    	let prevPageType = "page";

    	const back = () => {
    		if ($navConfig.type !== "page") window.history.back();
    	};

    	onMount(() => {
    		subTitleFlyOptions = {
    			x: window.innerWidth,
    			duration: 600,
    			opacity: 1
    		};
    	});

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("pageTitlePos" in $$props) $$invalidate(0, pageTitlePos = $$props.pageTitlePos);
    		if ("fadeOptions" in $$props) $$invalidate(8, fadeOptions = $$props.fadeOptions);
    		if ("subTitleFlyOptions" in $$props) subTitleFlyOptions = $$props.subTitleFlyOptions;
    		if ("pageTitle" in $$props) $$invalidate(1, pageTitle = $$props.pageTitle);
    		if ("subPageTitle" in $$props) $$invalidate(2, subPageTitle = $$props.subPageTitle);
    		if ("prevPageType" in $$props) $$invalidate(11, prevPageType = $$props.prevPageType);
    		if ("$navConfig" in $$props) navConfig.set($navConfig = $$props.$navConfig);
    		if ("$titleLeft" in $$props) titleLeft.set($titleLeft = $$props.$titleLeft);
    		if ("$subTitleLeft" in $$props) subTitleLeft.set($subTitleLeft = $$props.$subTitleLeft);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$navConfig, prevPageType*/ 2056) {
    			 if ($navConfig.title) {
    				if ($navConfig.type === "subpage") {
    					$$invalidate(2, subPageTitle = $navConfig.title);
    				} else {
    					$$invalidate(1, pageTitle = $navConfig.title);
    				}

    				if ($navConfig.type === "page" && prevPageType === "subpage") {
    					set_store_value(titleLeft, $titleLeft = 1);
    					set_store_value(subTitleLeft, $subTitleLeft = 0);
    					$$invalidate(0, pageTitlePos = "");
    				} else if ($navConfig.type === "subpage") {
    					set_store_value(titleLeft, $titleLeft = 0);
    					set_store_value(subTitleLeft, $subTitleLeft = 1);
    					$$invalidate(0, pageTitlePos = "left");
    				} else {
    					set_store_value(titleLeft, $titleLeft = 1);
    					set_store_value(subTitleLeft, $subTitleLeft = 0);
    					$$invalidate(0, pageTitlePos = "");
    				}

    				$$invalidate(11, prevPageType = $navConfig.type);
    			}
    		}
    	};

    	return [
    		pageTitlePos,
    		pageTitle,
    		subPageTitle,
    		$navConfig,
    		$titleLeft,
    		$subTitleLeft,
    		titleLeft,
    		subTitleLeft,
    		fadeOptions,
    		back
    	];
    }

    class NavigationBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$h, create_fragment$j, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NavigationBar",
    			options,
    			id: create_fragment$j.name
    		});
    	}
    }

    // List of nodes to update
    const nodes = [];

    // Current location
    let location$1;

    // Function that updates all nodes marking the active ones
    function checkActive(el) {
        // Remove the active class from all elements
        el.node.classList.remove(el.className);

        // If the pattern matches, then set the active class
        if (el.pattern.test(location$1)) {
            el.node.classList.add(el.className);
        }
    }

    // Listen to changes in the location
    loc.subscribe((value) => {
        // Update the location
        location$1 = value.location + (value.querystring ? '?' + value.querystring : '');

        // Update all nodes
        nodes.map(checkActive);
    });

    /**
     * @typedef {Object} ActiveOptions
     * @property {string} [path] - Path expression that makes the link active when matched (must start with '/' or '*'); default is the link's href
     * @property {string} [className] - CSS class to apply to the element when active; default value is "active"
     */

    /**
     * Svelte Action for automatically adding the "active" class to elements (links, or any other DOM element) when the current location matches a certain path.
     * 
     * @param {HTMLElement} node - The target node (automatically set by Svelte)
     * @param {ActiveOptions|string} [opts] - Can be an object of type ActiveOptions, or a string representing ActiveOptions.path.
     */
    function active$1(node, opts) {
        // Check options
        if (opts && typeof opts == 'string') {
            // Interpret strings as opts.path
            opts = {
                path: opts
            };
        }
        else {
            // Ensure opts is a dictionary
            opts = opts || {};
        }

        // Path defaults to link target
        if (!opts.path && node.hasAttribute('href')) {
            opts.path = node.getAttribute('href');
            if (opts.path && opts.path.length > 1 && opts.path.charAt(0) == '#') {
                opts.path = opts.path.substring(1);
            }
        }

        // Default class name
        if (!opts.className) {
            opts.className = 'active';
        }

        // Path must start with '/' or '*'
        if (!opts.path || opts.path.length < 1 || (opts.path.charAt(0) != '/' && opts.path.charAt(0) != '*')) {
            throw Error('Invalid value for "path" argument')
        }

        // Get the regular expression
        const {pattern} = regexparam(opts.path);

        // Add the node to the list
        const el = {
            node,
            className: opts.className,
            pattern
        };
        nodes.push(el);

        // Trigger the action right away
        checkActive(el);

        return {
            // When the element is destroyed, remove it from the list
            destroy() {
                nodes.splice(nodes.indexOf(el), 1);
            }
        }
    }

    /* src/components/layout/TabBar.svelte generated by Svelte v3.16.3 */
    const file$h = "src/components/layout/TabBar.svelte";

    function create_fragment$k(ctx) {
    	let span;
    	let a0;
    	let div0;
    	let link_action;
    	let active_action;
    	let t1;
    	let a1;
    	let div1;
    	let link_action_1;
    	let active_action_1;
    	let current;

    	const icon0 = new Icon({
    			props: { size: 22, name: "calendar" },
    			$$inline: true
    		});

    	const icon1 = new Icon({
    			props: { size: 22, name: "settings" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			span = element("span");
    			a0 = element("a");
    			create_component(icon0.$$.fragment);
    			div0 = element("div");
    			div0.textContent = "Events";
    			t1 = space();
    			a1 = element("a");
    			create_component(icon1.$$.fragment);
    			div1 = element("div");
    			div1.textContent = "Settings";
    			add_location(div0, file$h, 7, 85, 278);
    			attr_dev(a0, "href", "/events");
    			attr_dev(a0, "class", "svelte-pkmemc");
    			add_location(a0, file$h, 7, 1, 194);
    			add_location(div1, file$h, 8, 89, 389);
    			attr_dev(a1, "href", "/settings");
    			attr_dev(a1, "class", "svelte-pkmemc");
    			add_location(a1, file$h, 8, 1, 301);
    			attr_dev(span, "class", "svelte-pkmemc");
    			add_location(span, file$h, 6, 0, 186);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, a0);
    			mount_component(icon0, a0, null);
    			append_dev(a0, div0);
    			link_action = link.call(null, a0) || ({});
    			active_action = active$1.call(null, a0, "/events*") || ({});
    			append_dev(span, t1);
    			append_dev(span, a1);
    			mount_component(icon1, a1, null);
    			append_dev(a1, div1);
    			link_action_1 = link.call(null, a1) || ({});
    			active_action_1 = active$1.call(null, a1, "/settings*") || ({});
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon0.$$.fragment, local);
    			transition_in(icon1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon0.$$.fragment, local);
    			transition_out(icon1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			destroy_component(icon0);
    			if (link_action && is_function(link_action.destroy)) link_action.destroy();
    			if (active_action && is_function(active_action.destroy)) active_action.destroy();
    			destroy_component(icon1);
    			if (link_action_1 && is_function(link_action_1.destroy)) link_action_1.destroy();
    			if (active_action_1 && is_function(active_action_1.destroy)) active_action_1.destroy();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    class TabBar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$k, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TabBar",
    			options,
    			id: create_fragment$k.name
    		});
    	}
    }

    const word = '[a-fA-F\\d:]';
    const b = options => options && options.includeBoundaries ?
    	`(?:(?<=\\s|^)(?=${word})|(?<=${word})(?=\\s|$))` :
    	'';

    const v4 = '(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]\\d|\\d)){3}';

    const v6seg = '[a-fA-F\\d]{1,4}';
    const v6 = `
(
(?:${v6seg}:){7}(?:${v6seg}|:)|                                // 1:2:3:4:5:6:7::  1:2:3:4:5:6:7:8
(?:${v6seg}:){6}(?:${v4}|:${v6seg}|:)|                         // 1:2:3:4:5:6::    1:2:3:4:5:6::8   1:2:3:4:5:6::8  1:2:3:4:5:6::1.2.3.4
(?:${v6seg}:){5}(?::${v4}|(:${v6seg}){1,2}|:)|                 // 1:2:3:4:5::      1:2:3:4:5::7:8   1:2:3:4:5::8    1:2:3:4:5::7:1.2.3.4
(?:${v6seg}:){4}(?:(:${v6seg}){0,1}:${v4}|(:${v6seg}){1,3}|:)| // 1:2:3:4::        1:2:3:4::6:7:8   1:2:3:4::8      1:2:3:4::6:7:1.2.3.4
(?:${v6seg}:){3}(?:(:${v6seg}){0,2}:${v4}|(:${v6seg}){1,4}|:)| // 1:2:3::          1:2:3::5:6:7:8   1:2:3::8        1:2:3::5:6:7:1.2.3.4
(?:${v6seg}:){2}(?:(:${v6seg}){0,3}:${v4}|(:${v6seg}){1,5}|:)| // 1:2::            1:2::4:5:6:7:8   1:2::8          1:2::4:5:6:7:1.2.3.4
(?:${v6seg}:){1}(?:(:${v6seg}){0,4}:${v4}|(:${v6seg}){1,6}|:)| // 1::              1::3:4:5:6:7:8   1::8            1::3:4:5:6:7:1.2.3.4
(?::((?::${v6seg}){0,5}:${v4}|(?::${v6seg}){1,7}|:))           // ::2:3:4:5:6:7:8  ::2:3:4:5:6:7:8  ::8             ::1.2.3.4
)(%[0-9a-zA-Z]{1,})?                                           // %eth0            %1
`.replace(/\s*\/\/.*$/gm, '').replace(/\n/g, '').trim();

    const ip = options => options && options.exact ?
    	new RegExp(`(?:^${v4}$)|(?:^${v6}$)`) :
    	new RegExp(`(?:${b(options)}${v4}${b(options)})|(?:${b(options)}${v6}${b(options)})`, 'g');

    ip.v4 = options => options && options.exact ? new RegExp(`^${v4}$`) : new RegExp(`${b(options)}${v4}${b(options)}`, 'g');
    ip.v6 = options => options && options.exact ? new RegExp(`^${v6}$`) : new RegExp(`${b(options)}${v6}${b(options)}`, 'g');

    var ipRegex = ip;

    const isIp = string => ipRegex({exact: true}).test(string);
    isIp.v4 = string => ipRegex.v4({exact: true}).test(string);
    isIp.v6 = string => ipRegex.v6({exact: true}).test(string);
    isIp.version = string => isIp(string) ? (isIp.v4(string) ? 4 : 6) : undefined;

    var isIp_1 = isIp;

    const defaults = {
    	timeout: 5000
    };

    const urls = {
    	v4: 'https://ipv4.icanhazip.com/',
    	v6: 'https://ipv6.icanhazip.com/'
    };

    const fallbackUrls = {
    	v4: 'https://api.ipify.org',
    	v6: 'https://api6.ipify.org'
    };

    let xhr;

    const sendXhr = async (url, options, version) => {
    	return new Promise((resolve, reject) => {
    		xhr = new XMLHttpRequest();
    		xhr.addEventListener('error', reject, {once: true});
    		xhr.addEventListener('timeout', reject, {once: true});

    		xhr.addEventListener('load', () => {
    			const ip = xhr.responseText.trim();

    			if (!ip || !isIp_1[version](ip)) {
    				reject();
    			}

    			resolve(ip);
    		}, {once: true});

    		xhr.open('GET', url);
    		xhr.timeout = options.timeout;
    		xhr.send();
    	});
    };

    const queryHttps = async (version, options) => {
    	let ip;
    	try {
    		ip = await sendXhr(urls[version], options, version);
    	} catch (_) {
    		try {
    			ip = await sendXhr(fallbackUrls[version], options, version);
    		} catch (_) {
    			throw new Error('Couldn\'t find your IP');
    		}
    	}

    	return ip;
    };

    queryHttps.cancel = () => {
    	xhr.abort();
    };

    var v4$1 = options => queryHttps('v4', {...defaults, ...options});

    var v6$1 = options => queryHttps('v6', {...defaults, ...options});

    var browser = {
    	v4: v4$1,
    	v6: v6$1
    };

    const isOnline = async options => {
    	options = {
    		timeout: 5000,
    		version: 'v4',
    		...options
    	};

    	try {
    		await browser[options.version](options);
    		return true;
    	} catch (_) {
    		return false;
    	}
    };

    var browser$1 = isOnline;
    // TODO: Remove this for the next major release
    var default_1 = isOnline;
    browser$1.default = default_1;

    /* src/components/IsOnline.svelte generated by Svelte v3.16.3 */
    const file$i = "src/components/IsOnline.svelte";

    // (51:0) {#if showBanner}
    function create_if_block$8(ctx) {
    	let div1;
    	let t0;
    	let div0;
    	let div1_intro;
    	let div1_outro;
    	let current;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			t0 = text("Schlechte oder keine Internetverbindung! Bearbeiten und erstellen von Terminen und Links daher nicht möglich.\n    ");
    			div0 = element("div");
    			div0.textContent = "Verstanden";
    			attr_dev(div0, "class", "button svelte-9p8rq0");
    			add_location(div0, file$i, 53, 4, 1086);
    			attr_dev(div1, "class", "banner svelte-9p8rq0");
    			add_location(div1, file$i, 51, 4, 870);
    			dispose = listen_dev(div0, "click", /*hideBanner*/ ctx[1], false, false, false);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div1_outro) div1_outro.end(1);
    				if (!div1_intro) div1_intro = create_in_transition(div1, fly, { y: -100, duration: 600 });
    				div1_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div1_intro) div1_intro.invalidate();
    			div1_outro = create_out_transition(div1, fly, { y: -100, duration: 600 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching && div1_outro) div1_outro.end();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(51:0) {#if showBanner}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$l(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*showBanner*/ ctx[0] && create_if_block$8(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*showBanner*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$8(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let online = true;
    	let showBanner = false;

    	(async () => {
    		$$invalidate(2, online = await browser$1({ timeout: 3000 }));
    	})();

    	const hideBanner = () => {
    		$$invalidate(0, showBanner = false);
    	};

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("online" in $$props) $$invalidate(2, online = $$props.online);
    		if ("showBanner" in $$props) $$invalidate(0, showBanner = $$props.showBanner);
    	};

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*online*/ 4) {
    			 if (online) {
    				setTimeout(() => $$invalidate(0, showBanner = false), 7000);
    			} else {
    				$$invalidate(0, showBanner = true);
    			}
    		}
    	};

    	return [showBanner, hideBanner];
    }

    class IsOnline extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$l, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "IsOnline",
    			options,
    			id: create_fragment$l.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.16.3 */
    const file$j = "src/App.svelte";

    function create_fragment$m(ctx) {
    	let main;
    	let t0;
    	let t1;
    	let t2;
    	let current;
    	const navigationbar = new NavigationBar({ $$inline: true });
    	const router = new Router({ props: { routes }, $$inline: true });
    	const tabbar = new TabBar({ $$inline: true });
    	const isonline = new IsOnline({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(navigationbar.$$.fragment);
    			t0 = space();
    			create_component(router.$$.fragment);
    			t1 = space();
    			create_component(tabbar.$$.fragment);
    			t2 = space();
    			create_component(isonline.$$.fragment);
    			attr_dev(main, "class", "svelte-1xg8i0w");
    			add_location(main, file$j, 27, 0, 799);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(navigationbar, main, null);
    			append_dev(main, t0);
    			mount_component(router, main, null);
    			append_dev(main, t1);
    			mount_component(tabbar, main, null);
    			insert_dev(target, t2, anchor);
    			mount_component(isonline, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navigationbar.$$.fragment, local);
    			transition_in(router.$$.fragment, local);
    			transition_in(tabbar.$$.fragment, local);
    			transition_in(isonline.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navigationbar.$$.fragment, local);
    			transition_out(router.$$.fragment, local);
    			transition_out(tabbar.$$.fragment, local);
    			transition_out(isonline.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(navigationbar);
    			destroy_component(router);
    			destroy_component(tabbar);
    			if (detaching) detach_dev(t2);
    			destroy_component(isonline, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$m.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self) {
    	onMount(() => {
    		if ("serviceWorker" in navigator) {
    			if (navigator.serviceWorker.controller) {
    				console.log("Active service worker found, no need to register");
    			} else {
    				navigator.serviceWorker.register("service-worker.js", { scope: "./" }).then(reg => {
    					console.log("Service worker has been registered for scope: " + reg.scope);
    				});
    			}
    		}
    	});

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		
    	};

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$j, create_fragment$m, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$m.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'home'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
