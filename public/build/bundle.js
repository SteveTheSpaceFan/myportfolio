
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
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
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
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
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root.host) {
            return root;
        }
        return document;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
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
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
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
        const doc = get_root_for_style(node);
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = append_empty_stylesheet(node).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    function create_animation(node, from, fn, params) {
        if (!from)
            return noop;
        const to = node.getBoundingClientRect();
        if (from.left === to.left && from.right === to.right && from.top === to.top && from.bottom === to.bottom)
            return noop;
        const { delay = 0, duration = 300, easing = identity, 
        // @ts-ignore todo: should this be separated from destructuring? Or start/end added to public api and documentation?
        start: start_time = now() + delay, 
        // @ts-ignore todo:
        end = start_time + duration, tick = noop, css } = fn(node, { from, to }, params);
        let running = true;
        let started = false;
        let name;
        function start() {
            if (css) {
                name = create_rule(node, 0, 1, duration, delay, easing, css);
            }
            if (!delay) {
                started = true;
            }
        }
        function stop() {
            if (css)
                delete_rule(node, name);
            running = false;
        }
        loop(now => {
            if (!started && now >= start_time) {
                started = true;
            }
            if (started && now >= end) {
                tick(1, 0);
                stop();
            }
            if (!running) {
                return false;
            }
            if (started) {
                const p = now - start_time;
                const t = 0 + 1 * easing(p / duration);
                tick(t, 1 - t);
            }
            return true;
        });
        start();
        tick(0, 1);
        return stop;
    }
    function fix_position(node) {
        const style = getComputedStyle(node);
        if (style.position !== 'absolute' && style.position !== 'fixed') {
            const { width, height } = style;
            const a = node.getBoundingClientRect();
            node.style.position = 'absolute';
            node.style.width = width;
            node.style.height = height;
            add_transform(node, a);
        }
    }
    function add_transform(node, a) {
        const b = node.getBoundingClientRect();
        if (a.left !== b.left || a.top !== b.top) {
            const style = getComputedStyle(node);
            const transform = style.transform === 'none' ? '' : style.transform;
            node.style.transform = `${transform} translate(${a.left - b.left}px, ${a.top - b.top}px)`;
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
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
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
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
                started = true;
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

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function fix_and_destroy_block(block, lookup) {
        block.f();
        destroy_block(block, lookup);
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
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
        }
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
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
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
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
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
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
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
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.42.1' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }

    /* src/header/header.svelte generated by Svelte v3.42.1 */

    const file$4 = "src/header/header.svelte";

    function create_fragment$4(ctx) {
    	let div2;
    	let div0;
    	let a0;
    	let span0;
    	let t1;
    	let span1;
    	let t2;
    	let div1;
    	let h1;
    	let t4;
    	let p;
    	let t5;
    	let strong0;
    	let t7;
    	let strong1;
    	let t9;
    	let t10;
    	let a1;
    	let button;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			a0 = element("a");
    			span0 = element("span");
    			span0.textContent = "⍨";
    			t1 = space();
    			span1 = element("span");
    			t2 = space();
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Steve";
    			t4 = space();
    			p = element("p");
    			t5 = text("I study ");
    			strong0 = element("strong");
    			strong0.textContent = "Physics";
    			t7 = text(" at University of\n            ");
    			strong1 = element("strong");
    			strong1.textContent = "British Columbia";
    			t9 = text(".");
    			t10 = space();
    			a1 = element("a");
    			button = element("button");
    			button.textContent = "Contact";
    			set_style(span0, "font-size", "40px");
    			add_location(span0, file$4, 9, 13, 216);
    			attr_dev(a0, "href", "https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    			set_style(a0, "text-decoration", "none");
    			add_location(a0, file$4, 6, 8, 94);
    			set_style(span1, "float", "right");
    			set_style(span1, "font-size", "xx-large");
    			add_location(span1, file$4, 11, 8, 277);
    			set_style(div0, "padding", "10px");
    			set_style(div0, "margin", "0");
    			add_location(div0, file$4, 5, 4, 47);
    			set_style(h1, "font-size", "45px");
    			set_style(h1, "margin", "0");
    			add_location(h1, file$4, 15, 8, 421);
    			add_location(strong0, file$4, 17, 20, 568);
    			add_location(strong1, file$4, 18, 12, 622);
    			set_style(p, "font-size", "larger");
    			set_style(p, "font-weight", "300");
    			set_style(p, "padding", "0px 10px");
    			add_location(p, file$4, 16, 8, 480);
    			set_style(button, "padding", "10px 20px");
    			set_style(button, "background-color", "rgb(61, 129, 248)");
    			set_style(button, "color", "white");
    			set_style(button, "border-radius", "90px");
    			set_style(button, "cursor", "pointer");
    			set_style(button, "margin-top", "20px");
    			attr_dev(button, "class", "cardLike");
    			add_location(button, file$4, 21, 13, 733);
    			attr_dev(a1, "href", "mailto:yuyustevejobs@icloud.com");
    			add_location(a1, file$4, 20, 8, 678);
    			set_style(div1, "padding", "40px 0");
    			set_style(div1, "padding-top", "20px");
    			set_style(div1, "text-align", "center");
    			add_location(div1, file$4, 14, 4, 344);
    			attr_dev(div2, "id", "header");
    			attr_dev(div2, "class", "svelte-di5dxc");
    			add_location(div2, file$4, 4, 0, 25);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, a0);
    			append_dev(a0, span0);
    			append_dev(div0, t1);
    			append_dev(div0, span1);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, h1);
    			append_dev(div1, t4);
    			append_dev(div1, p);
    			append_dev(p, t5);
    			append_dev(p, strong0);
    			append_dev(p, t7);
    			append_dev(p, strong1);
    			append_dev(p, t9);
    			append_dev(div1, t10);
    			append_dev(div1, a1);
    			append_dev(a1, button);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
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

    function instance$4($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Header', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/compoents/projectSection.svelte generated by Svelte v3.42.1 */

    const file$3 = "src/compoents/projectSection.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i].name;
    	child_ctx[2] = list[i].detail;
    	child_ctx[3] = list[i].link;
    	child_ctx[4] = list[i].imgsrc;
    	child_ctx[6] = i;
    	return child_ctx;
    }

    // (34:4) {#each projects as { name, detail, link, imgsrc }
    function create_each_block$1(ctx) {
    	let div1;
    	let div0;
    	let span0;
    	let t0_value = /*name*/ ctx[1] + "";
    	let t0;
    	let br0;
    	let t1;
    	let span1;
    	let t2_value = /*detail*/ ctx[2] + "";
    	let t2;
    	let br1;
    	let t3;
    	let a;
    	let t4;
    	let t5;
    	let img;
    	let img_src_value;
    	let t6;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			span0 = element("span");
    			t0 = text(t0_value);
    			br0 = element("br");
    			t1 = space();
    			span1 = element("span");
    			t2 = text(t2_value);
    			br1 = element("br");
    			t3 = space();
    			a = element("a");
    			t4 = text("GitHub");
    			t5 = space();
    			img = element("img");
    			t6 = space();
    			attr_dev(span0, "class", "projectName svelte-i23547");
    			add_location(span0, file$3, 36, 16, 1233);
    			add_location(br0, file$3, 36, 55, 1272);
    			attr_dev(span1, "class", "projectDetail svelte-i23547");
    			add_location(span1, file$3, 37, 16, 1295);
    			add_location(br1, file$3, 37, 59, 1338);
    			attr_dev(a, "href", /*link*/ ctx[3]);
    			attr_dev(a, "class", "projectLink svelte-i23547");
    			add_location(a, file$3, 38, 16, 1361);
    			attr_dev(div0, "class", "projectDescription svelte-i23547");
    			add_location(div0, file$3, 35, 12, 1184);
    			attr_dev(img, "class", "projectImg svelte-i23547");
    			attr_dev(img, "loading", "lazy");
    			if (!src_url_equal(img.src, img_src_value = /*imgsrc*/ ctx[4])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "ProjectImage");
    			add_location(img, file$3, 40, 12, 1438);
    			attr_dev(div1, "class", "cardLike project svelte-i23547");
    			add_location(div1, file$3, 34, 8, 1141);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, span0);
    			append_dev(span0, t0);
    			append_dev(div0, br0);
    			append_dev(div0, t1);
    			append_dev(div0, span1);
    			append_dev(span1, t2);
    			append_dev(div0, br1);
    			append_dev(div0, t3);
    			append_dev(div0, a);
    			append_dev(a, t4);
    			append_dev(div1, t5);
    			append_dev(div1, img);
    			append_dev(div1, t6);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(34:4) {#each projects as { name, detail, link, imgsrc }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let p;
    	let t1;
    	let each_value = /*projects*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			p.textContent = "My Projects";
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			set_style(p, "margin-left", "20px");
    			add_location(p, file$3, 31, 4, 1028);
    			attr_dev(div, "id", "projectSection");
    			attr_dev(div, "class", "cardLike svelte-i23547");
    			add_location(div, file$3, 30, 0, 981);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p);
    			append_dev(div, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*projects*/ 1) {
    				each_value = /*projects*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
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

    function Project(name, detail, link, imgsrc) {
    	this.name = name;
    	this.detail = detail;
    	this.link = link;
    	this.imgsrc = imgsrc;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ProjectSection', slots, []);
    	let projects = [];
    	projects.push(new Project("StarShip Simulator", "This is a cross-platform game and literally support any device that is able to connect to Internet, and also can be played offline ( If you are interested, this is actually a PWA (Progressive Web App), which means that it is also installable on almost any device and can work like regular apps)", "http://www.pornhub.com", "https://i.ibb.co/ThTzJdC/Screen-Shot-2021-08-12-at-1-29-35-PM.png"));

    	for (let n = 0; n < 3; n++) {
    		projects.push(new Project("StarShip Simulator", "apps)", "", "https://i.ibb.co/ThTzJdC/Screen-Shot-2021-08-12-at-1-29-35-PM.png"));
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ProjectSection> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ projects, Project });

    	$$self.$inject_state = $$props => {
    		if ('projects' in $$props) $$invalidate(0, projects = $$props.projects);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [projects];
    }

    class ProjectSection extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ProjectSection",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    function flip(node, animation, params = {}) {
        const style = getComputedStyle(node);
        const transform = style.transform === 'none' ? '' : style.transform;
        const scaleX = animation.from.width / node.clientWidth;
        const scaleY = animation.from.height / node.clientHeight;
        const dx = (animation.from.left - animation.to.left) / scaleX;
        const dy = (animation.from.top - animation.to.top) / scaleY;
        const d = Math.sqrt(dx * dx + dy * dy);
        const { delay = 0, duration = (d) => Math.sqrt(d) * 120, easing = cubicOut } = params;
        return {
            delay,
            duration: is_function(duration) ? duration(d) : duration,
            easing,
            css: (_t, u) => `transform: ${transform} translate(${u * dx}px, ${u * dy}px);`
        };
    }

    /* src/compoents/commentSection.svelte generated by Svelte v3.42.1 */

    const { console: console_1, document: document_1 } = globals;
    const file$2 = "src/compoents/commentSection.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i].commenterName;
    	child_ctx[13] = list[i].commentContent;
    	child_ctx[14] = list[i].timeOfPost;
    	return child_ctx;
    }

    // (174:4) {#if charactor}
    function create_if_block(ctx) {
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*charactor*/ ctx[0]);
    			attr_dev(span, "id", "commentSectionName");
    			attr_dev(span, "class", "svelte-15q0so0");
    			add_location(span, file$2, 174, 8, 4896);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*charactor*/ 1) set_data_dev(t, /*charactor*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(174:4) {#if charactor}",
    		ctx
    	});

    	return block;
    }

    // (195:8) {#each comments as { commenterName, commentContent, timeOfPost }
    function create_each_block(key_1, ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*commenterName*/ ctx[12] + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*commentContent*/ ctx[13] + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = getTimeElapsed(/*timeOfPost*/ ctx[14]) + "";
    	let t4;
    	let t5;
    	let rect;
    	let stop_animation = noop;
    	let mounted;
    	let dispose;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			attr_dev(td0, "class", "nameCell svelte-15q0so0");
    			add_location(td0, file$2, 200, 16, 5627);
    			attr_dev(td1, "class", "contentCell svelte-15q0so0");
    			add_location(td1, file$2, 201, 16, 5685);
    			attr_dev(td2, "class", "infoCell svelte-15q0so0");
    			add_location(td2, file$2, 202, 16, 5747);
    			attr_dev(tr, "class", "commentRow");
    			add_location(tr, file$2, 195, 12, 5476);
    			this.first = tr;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);

    			if (!mounted) {
    				dispose = listen_dev(
    					tr,
    					"click",
    					function () {
    						if (is_function(/*removeComment*/ ctx[3](/*timeOfPost*/ ctx[14]))) /*removeComment*/ ctx[3](/*timeOfPost*/ ctx[14]).apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*comments*/ 2 && t0_value !== (t0_value = /*commenterName*/ ctx[12] + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*comments*/ 2 && t2_value !== (t2_value = /*commentContent*/ ctx[13] + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*comments*/ 2 && t4_value !== (t4_value = getTimeElapsed(/*timeOfPost*/ ctx[14]) + "")) set_data_dev(t4, t4_value);
    		},
    		r: function measure() {
    			rect = tr.getBoundingClientRect();
    		},
    		f: function fix() {
    			fix_position(tr);
    			stop_animation();
    		},
    		a: function animate() {
    			stop_animation();
    			stop_animation = create_animation(tr, rect, flip, {});
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(195:8) {#each comments as { commenterName, commentContent, timeOfPost }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let script;
    	let script_src_value;
    	let t0;
    	let div1;
    	let t1;
    	let input;
    	let t2;
    	let div0;
    	let button0;
    	let t4;
    	let button1;
    	let t6;
    	let table;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let mounted;
    	let dispose;
    	let if_block = /*charactor*/ ctx[0] && create_if_block(ctx);
    	let each_value = /*comments*/ ctx[1];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*timeOfPost*/ ctx[14];
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			script = element("script");
    			t0 = space();
    			div1 = element("div");
    			if (if_block) if_block.c();
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "Change Charactor";
    			t4 = space();
    			button1 = element("button");
    			button1.textContent = "Post!";
    			t6 = space();
    			table = element("table");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (!src_url_equal(script.src, script_src_value = "https://cdnjs.cloudflare.com/ajax/libs/axios/0.21.1/axios.min.js")) attr_dev(script, "src", script_src_value);
    			attr_dev(script, "integrity", "sha512-bZS47S7sPOxkjU/4Bt0zrhEtWx0y0CRkhEp8IckzK+ltifIIE9EMIMTuT/mEzoIMewUINruDBIR/jJnbguonqQ==");
    			attr_dev(script, "crossorigin", "anonymous");
    			add_location(script, file$2, 165, 4, 4541);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "id", "commentSectionInput");
    			attr_dev(input, "class", "cardLike svelte-15q0so0");
    			attr_dev(input, "placeholder", "Say whatever you want");
    			add_location(input, file$2, 179, 4, 4982);
    			attr_dev(button0, "class", "cardLike svelte-15q0so0");
    			add_location(button0, file$2, 187, 8, 5164);
    			attr_dev(button1, "class", "cardLike svelte-15q0so0");
    			add_location(button1, file$2, 190, 8, 5272);
    			attr_dev(div0, "id", "commentSectionButtons");
    			attr_dev(div0, "class", "svelte-15q0so0");
    			add_location(div0, file$2, 186, 4, 5123);
    			attr_dev(table, "id", "commentsList");
    			attr_dev(table, "class", "svelte-15q0so0");
    			add_location(table, file$2, 193, 4, 5351);
    			attr_dev(div1, "id", "commentSection");
    			attr_dev(div1, "class", "cardLike svelte-15q0so0");
    			add_location(div1, file$2, 172, 0, 4825);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document_1.head, script);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div1, t1);
    			append_dev(div1, input);
    			append_dev(div1, t2);
    			append_dev(div1, div0);
    			append_dev(div0, button0);
    			append_dev(div0, t4);
    			append_dev(div0, button1);
    			append_dev(div1, t6);
    			append_dev(div1, table);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(script, "load", /*init*/ ctx[5], false, false, false),
    					listen_dev(button0, "click", /*changeCharactor*/ ctx[4], false, false, false),
    					listen_dev(button1, "click", /*postComment*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*charactor*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(div1, t1);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*removeComment, comments, getTimeElapsed*/ 10) {
    				each_value = /*comments*/ ctx[1];
    				validate_each_argument(each_value);
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].r();
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, table, fix_and_destroy_block, create_each_block, null, get_each_context);
    				for (let i = 0; i < each_blocks.length; i += 1) each_blocks[i].a();
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			detach_dev(script);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			mounted = false;
    			run_all(dispose);
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

    async function fetchData(route, mycallback) {
    	try {
    		const dataRecived = await axios.get(route);
    		mycallback(dataRecived.data);
    	} catch(error) {
    		console.log(error);
    	}
    }

    async function postData(route, dataToSend) {
    	try {
    		const data = await axios.post(route, dataToSend);
    	} catch(error) {
    		console.log(error.response.data.msg);
    	}
    }

    async function deleteData(route, dataToSend) {
    	try {
    		const data = await axios.delete(route, dataToSend);
    	} catch(error) {
    		console.log(error.response.data.msg);
    	}
    }

    function Comment(commenterName, commentContent) {
    	this.commenterName = commenterName;
    	this.commentContent = commentContent;
    	this.timeOfPost = Date.now();
    	this.ip_adress = "";
    	this.platform_info = window.navigator.userAgent;
    }

    function getLocalCharactor() {
    	return localStorage.getItem("charactor");
    }

    function getTimeElapsed(time) {
    	let timeElapsed = (Date.now() - time) * 0.001; //in sec

    	if (timeElapsed < 2) {
    		return "now";
    	} else if (timeElapsed < 60) {
    		timeElapsed = Math.round(timeElapsed) + " s";
    	} else if (timeElapsed < 3600) {
    		timeElapsed = Math.round(timeElapsed / 60) + " mins";
    	} else if (timeElapsed < 3600 * 24) {
    		timeElapsed = Math.round(timeElapsed / 3600) + " hrs";
    	} else if (timeElapsed < 3600 * 24 * 365.25) {
    		timeElapsed = Math.round(timeElapsed / 3600 / 24) + " days";
    	} else {
    		timeElapsed = Math.round(timeElapsed / 3600 / 24 / 365.25) + " years";
    	}

    	return timeElapsed;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('CommentSection', slots, []);
    	let charactor;
    	let comments = [];
    	let commentRoute = "/data/comments";

    	function updateComments() {
    		fetchData(commentRoute, makeListFromDb_storeToLocal);
    	}

    	function initCommentsFromLocal() {
    		let localComments = localStorage.getItem("comments");

    		if (localComments == null) {
    			return;
    		} else {
    			makeListFromDb_storeToLocal(JSON.parse(localComments));
    		}
    	}

    	async function postComment() {
    		let commentContent = document.getElementById("commentSectionInput").value;
    		let commenterName = charactor;

    		if (commentContent == "") {
    			return;
    		}

    		let the_comment = new Comment(commenterName, commentContent);
    		comments.unshift(the_comment);
    		makeListFromDb_storeToLocal(comments);
    		postData(commentRoute, the_comment);
    		document.getElementById('commentSectionInput').value = '';
    		updateComments();
    	}

    	function removeComment(commentTimeOfPost) {
    		makeListFromDb_storeToLocal(comments.filter(c => c.timeOfPost !== commentTimeOfPost));
    		let deleteQuery = { timeOfPost: commentTimeOfPost };
    		deleteData(commentRoute, { data: deleteQuery });
    		updateComments();
    	}

    	function makeListFromDb_storeToLocal(data) {
    		$$invalidate(1, comments = data.slice());
    		localStorage.setItem("comments", JSON.stringify(comments));
    	}

    	function generateRandomCharactor() {
    		let names = [
    			"🐶",
    			"🐱",
    			"🐭",
    			"🐰",
    			"🦊",
    			"🐻",
    			"🐼",
    			"🐻‍❄️",
    			"🐨",
    			"🐯",
    			"🦁",
    			"🐮",
    			"🐷"
    		];

    		let new_charactor = names[Math.floor(Math.random() * names.length)];

    		return new_charactor;
    	}

    	function changeCharactor() {
    		let new_charactor = generateRandomCharactor();
    		$$invalidate(0, charactor = new_charactor);
    		localStorage.setItem("charactor", new_charactor);
    	}

    	function initCharactor() {
    		let storedCharactor = getLocalCharactor();

    		if (storedCharactor == null) {
    			changeCharactor();
    		} else {
    			$$invalidate(0, charactor = storedCharactor);
    		}
    	}

    	function init() {
    		initCharactor();
    		initCommentsFromLocal();
    		updateComments();
    	}

    	document.addEventListener("keydown", event => {
    		if (event.key === 'Enter') {
    			postComment();
    		}
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<CommentSection> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		flip,
    		fetchData,
    		postData,
    		deleteData,
    		Comment,
    		charactor,
    		comments,
    		commentRoute,
    		updateComments,
    		initCommentsFromLocal,
    		postComment,
    		removeComment,
    		makeListFromDb_storeToLocal,
    		generateRandomCharactor,
    		changeCharactor,
    		getLocalCharactor,
    		initCharactor,
    		getTimeElapsed,
    		init
    	});

    	$$self.$inject_state = $$props => {
    		if ('charactor' in $$props) $$invalidate(0, charactor = $$props.charactor);
    		if ('comments' in $$props) $$invalidate(1, comments = $$props.comments);
    		if ('commentRoute' in $$props) commentRoute = $$props.commentRoute;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [charactor, comments, postComment, removeComment, changeCharactor, init];
    }

    class CommentSection extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CommentSection",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/compoents/introSection.svelte generated by Svelte v3.42.1 */

    const file$1 = "src/compoents/introSection.svelte";

    function create_fragment$1(ctx) {
    	let div1;
    	let p0;
    	let t1;
    	let div0;
    	let p1;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			p0 = element("p");
    			p0.textContent = "A brief introduction";
    			t1 = space();
    			div0 = element("div");
    			p1 = element("p");
    			p1.textContent = "Lorem ipsum dolor sit amet consectetur adipisicing elit. Doloremque reprehenderit magni suscipit, optio odit quis quaerat accusamus provident molestiae tempore nihil obcaecati autem a non consectetur eaque nostrum. Alias, repellendus assumenda nobis, hic odio vel aut id ducimus quae explicabo voluptatibus consequuntur minus incidunt cumque perferendis cupiditate, dolor provident. Id, molestias placeat eveniet harum nemo laborum sunt culpa ipsum temporibus qui voluptate dolores fugit ad optio voluptatem saepe magnam laudantium dolorum autem odio officia nostrum est iusto. Repudiandae, omnis inventore repellendus quibusdam accusantium dicta quos dolorum blanditiis odio dolores corporis, voluptatum eum reprehenderit fuga. Maxime in ex officiis excepturi? Nesciunt?";
    			set_style(p0, "margin-left", "20px");
    			add_location(p0, file$1, 1, 4, 45);
    			add_location(p1, file$1, 3, 8, 143);
    			attr_dev(div0, "class", "introSectionBody svelte-1fbjxlt");
    			add_location(div0, file$1, 2, 4, 104);
    			attr_dev(div1, "id", "introSection");
    			attr_dev(div1, "class", "cardLike svelte-1fbjxlt");
    			add_location(div1, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, p0);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, p1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
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

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('IntroSection', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<IntroSection> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class IntroSection extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "IntroSection",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.42.1 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let link0;
    	let link1;
    	let link2;
    	let link3;
    	let link4;
    	let t0;
    	let main;
    	let header;
    	let t1;
    	let div;
    	let commentsection;
    	let t2;
    	let projectsectiom;
    	let t3;
    	let introsection;
    	let main_intro;
    	let current;
    	header = new Header({ $$inline: true });
    	commentsection = new CommentSection({ $$inline: true });
    	projectsectiom = new ProjectSection({ $$inline: true });
    	introsection = new IntroSection({ $$inline: true });

    	const block = {
    		c: function create() {
    			link0 = element("link");
    			link1 = element("link");
    			link2 = element("link");
    			link3 = element("link");
    			link4 = element("link");
    			t0 = space();
    			main = element("main");
    			create_component(header.$$.fragment);
    			t1 = space();
    			div = element("div");
    			create_component(commentsection.$$.fragment);
    			t2 = space();
    			create_component(projectsectiom.$$.fragment);
    			t3 = space();
    			create_component(introsection.$$.fragment);
    			document.title = "Steve's";
    			attr_dev(link0, "rel", "preconnect");
    			attr_dev(link0, "href", "https://fonts.googleapis.com");
    			add_location(link0, file, 11, 1, 340);
    			attr_dev(link1, "rel", "preconnect");
    			attr_dev(link1, "href", "https://fonts.gstatic.com");
    			attr_dev(link1, "crossorigin", "");
    			add_location(link1, file, 12, 1, 403);
    			attr_dev(link2, "href", "https://fonts.googleapis.com/css2?family=Inter:wght@300&display=swap");
    			attr_dev(link2, "rel", "stylesheet");
    			add_location(link2, file, 13, 1, 475);
    			attr_dev(link3, "href", "https://fonts.googleapis.com/css2?family=Inter:wght@400&display=swap");
    			attr_dev(link3, "rel", "stylesheet");
    			add_location(link3, file, 17, 1, 583);
    			attr_dev(link4, "href", "https://fonts.googleapis.com/css2?family=Inter:wght@800&display=swap");
    			attr_dev(link4, "rel", "stylesheet");
    			add_location(link4, file, 21, 1, 691);
    			attr_dev(div, "id", "compoents");
    			attr_dev(div, "class", "svelte-n6t9rc");
    			add_location(div, file, 29, 1, 842);
    			attr_dev(main, "class", "svelte-n6t9rc");
    			add_location(main, file, 27, 0, 814);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document.head, link0);
    			append_dev(document.head, link1);
    			append_dev(document.head, link2);
    			append_dev(document.head, link3);
    			append_dev(document.head, link4);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(header, main, null);
    			append_dev(main, t1);
    			append_dev(main, div);
    			mount_component(commentsection, div, null);
    			append_dev(div, t2);
    			mount_component(projectsectiom, div, null);
    			append_dev(div, t3);
    			mount_component(introsection, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			transition_in(commentsection.$$.fragment, local);
    			transition_in(projectsectiom.$$.fragment, local);
    			transition_in(introsection.$$.fragment, local);

    			if (!main_intro) {
    				add_render_callback(() => {
    					main_intro = create_in_transition(main, fade, {});
    					main_intro.start();
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			transition_out(commentsection.$$.fragment, local);
    			transition_out(projectsectiom.$$.fragment, local);
    			transition_out(introsection.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(link0);
    			detach_dev(link1);
    			detach_dev(link2);
    			detach_dev(link3);
    			detach_dev(link4);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(header);
    			destroy_component(commentsection);
    			destroy_component(projectsectiom);
    			destroy_component(introsection);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		fade,
    		Header,
    		ProjectSectiom: ProjectSection,
    		CommentSection,
    		IntroSection
    	});

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	intro: true,
    	props: {
    		
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
