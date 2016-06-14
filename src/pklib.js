/*jslint continue: true, nomen: true, plusplus: true, regexp: true, vars: true, white: true, indent: 4 */
/*global document, XMLHttpRequest, ActiveXObject, setInterval, clearInterval, setTimeout, clearTimeout, navigator */

/** pklib JavaScript library v2.0.0 - MIT License */

(function (root) {
    'use strict';

    // Imports.
    var document = root.document;

    // Prototypes.
    var ObjectProto = Object.prototype;
    var ArrayProto = Array.prototype;

    // Shortcuts.
    var toString = ObjectProto.toString;
    var isIE = (/msie/).test(navigator.userAgent);

    // Helpers.
    // --------

    // Basic test function. Simple assertion 2 variables.
    function assert(expression, comment) {
        if (!expression) {
            throw new Error(comment);
        }

        assert.count++;
    }

    assert.count = 0;

    var pklib = {
        VERSION: '2.0'
    };

    // Ajax.
    // -----

    // Default time what is timeout to use function `pklib.ajax`.
    var DEFAULT_TIMEOUT_TIME = 30 * 1000; // 30 second

    // Array contain key as url, value as ajax response.
    var cache = [];

    // When success request.
    function successHandler(settings, xhr) {
        var contentType,
            xmlContentType = ['application/xml', 'text/xml'],
            property = 'responseText';

        if (settings.cache) {
            cache[settings.url] = xhr;
        }

        contentType = xhr.getResponseHeader('Content-Type');

        if (inArray(contentType, xmlContentType)) {
            property = 'responseXML';
        }

        settings.done.call(null, xhr[property]);

        // Clear memory.
        xhr = null;
    }

    // When error request.
    function errorHandler(settings, xhr) {
        // Check if error handler is run yet.
        if (!xhr._run_error_handler) {
            // No, so we run error handler first time.
            settings.error(settings, xhr);

            // Set flag to no run error handler.
            xhr._run_error_handler = true;
        }
    }

    // Use when state in request is changed or if used cache is handler to request.
    function stateChangeHandler(settings, xhr) {
        var status = 0;

        if (xhr.readyState === XMLHttpRequest.DONE && xhr.status !== XMLHttpRequest.UNSENT) {
            if (xhr.status !== undefined) {
                status = xhr.status;
            }

            clearTimeout(xhr.ontimeout);
            if (xhr.ontimeout) {
                delete xhr.ontimeout;
            }

            if ((status >= 200 && status < 300) || status === 304) {
                successHandler(settings, xhr);
            } else {
                errorHandlerWithAbort(settings, xhr);
            }
        }
    }

    function errorHandlerWithAbort(settings, xhr) {
        xhr.abort();

        errorHandler(settings, xhr);
    }

    // Handler to unusually situation - timeout.
    function timeoutHandler(settings, xhr) {
        errorHandler(settings, xhr);
    }

    // Try to create Internet Explorer XMLHttpRequest.
    function createMicrosoftXhr() {
        var xhr;
        try {
            xhr = new ActiveXObject('Msxml2.XMLHTTP');
        } catch (ignore) {
            try {
                xhr = new ActiveXObject('Microsoft.XMLHTTP');
            } catch (ignored) {
                throw new Error("pklib.ajax.load: can't create XMLHttpRequest object");
            }
        }
        return xhr;
    }

    // Try to create XMLHttpRequest.
    function createXhr() {
        var xhr;
        try {
            xhr = new XMLHttpRequest();
        } catch (ignore) {
            xhr = createMicrosoftXhr();
        }
        return xhr;
    }

    // Add headers to xhr object.
    function addHeadersToXhr(settings, xhr) {
        var header, headers = settings.headers;

        if (headers !== null) {
            for (header in headers) {
                if (headers.hasOwnProperty(header)) {
                    xhr.setRequestHeader(header, headers[header]);
                }
            }
        }
    }

    // Add timeout service to xhr object.
    function addTimeoutServiceToXhr(settings, xhr) {
        xhr.ontimeout = setTimeout(function () {
            timeoutHandler(settings, xhr);
        }, settings.timeout);
    }

    // Check is response on this request is in cache.
    function isResponseInCache(settings) {
        return cache[settings.url];
    }

    // Return object what is default configuration of request.
    function getDefaultSettings() {
        // Request settings, contain ex. headers, callback when run after
        // request finish. Default timeout on request is 30 seconds.
        // This is default timeout from popular web servers, ex. Apache, nginx.
        // Default request hasn't any headers.
        // Default cache is disabled.
        // Default asynchronous is enable.
        return {
            type: 'get',
            async: true,
            cache: false,
            url: null,
            params: null,
            timeout: DEFAULT_TIMEOUT_TIME,
            headers: {},
            // Function run after request ended
            // In params exists only: response
            done: function () {},
            error: function () {}
        };
    }

    pklib.ajax = {
        // Send request to server on url defined in config.url.
        // Method throw exception when request have timeout on server or if
        // url is not set. Also, every response (if config.cache is true)
        // saved to hashmap by key config.url. Method on first try to can
        // create XMLHttpRequest if browser doesn't support, check if browser
        // support object ActiveXObject which is implemented in Internet
        // Explorer.
        load: function (config) {
            var xhr = null, settings = getDefaultSettings();

            settings = mixin(settings, config);
            settings.type = settings.type.toUpperCase();

            // Simple assert to check 'url' is set.
            assert(settings.url !== null, 'pklib.ajax.load: @url is not defined');

            // Check if we use 'cache' flag in request.
            if (settings.cache && isResponseInCache(settings)) {
                // Yes, we use, so we can return response from cache object.
                stateChangeHandler.call(null, settings, cache[settings.url]);
            } else {
                // No, is normal request to server.
                xhr = createXhr();
                xhr.onreadystatechange = stateChangeHandler.bind(null, settings, xhr);

                try {
                    xhr.open(settings.type, settings.url, settings.async);
                } catch (open_exception) {
                    errorHandlerWithAbort(settings, xhr);

                    return xhr;
                }

                addHeadersToXhr(settings, xhr);
                addTimeoutServiceToXhr(settings, xhr);

                try {
                    xhr.send(settings.params);
                } catch (send_exception) {
                    errorHandlerWithAbort(settings, xhr);

                    return xhr;
                }
            }

            return xhr;
        },

        // Stop request setting in param.
        stop: function (xhr) {
            xhr.abort();

            // Clear memory.
            xhr = null;
        }
    };

    // Array.
    // ------

    // Check if param is array.
    function isArray(array) {
        return array !== null && typeof array === 'object' && toString.call(array) === '[object Array]' &&
            typeof array.length === 'number' && typeof array.slice === 'function';
    }

    // Check if element is in array by loop.
    function inArray(param, array) {
        var i, len = array.length;

        for (i = 0; i < len; ++i) {
            if (array[i] === param) {
                return true;
            }
        }
        return false;
    }

    // Get index of element. If couldn't find searching element, return null value.
    function arrayIndex(item, array) {
        var i, len = array.length;

        for (i = 0; i < len; ++i) {
            if (array[i] === item) {
                return i;
            }
        }
        return null;
    }

    // Unique array. Delete element what was duplicated.
    function unique(array) {
        var i, item, temp = [], len = array.length;

        for (i = 0; i < len; ++i) {
            item = array[i];
            if (!inArray.call(null, item, temp)) {
                temp.push(item);
            }
        }
        return temp;
    }

    // Remove element declared in infinity params without first.
    // First parameter is array object.
    function arrayRemove(array) {
        var i, param, params = ArrayProto.slice.call(arguments, 1), len = params.length;

        for (i = 0; i < len; ++i) {
            param = params[i];
            if (inArray(param, array)) {
                array.splice(arrayIndex(param, array), 1);
            }
        }
        return array;
    }

    pklib.array = {
        isArray: isArray,
        inArray: inArray,
        index: arrayIndex,
        unique: unique,
        remove: arrayRemove
    };

    // Aspect.
    // -------

    // Bind function to aspect. Create method with merge first and second. Second method is run after first.
    pklib.aspect = function (fun, asp, when) {
        var self = this, result;

        assert(typeof fun === 'function', 'pklib.aspect: @func: not {Function}');
        assert(typeof asp === 'function', 'pklib.aspect: @asp: not {Function}');

        when = when || 'before';

        return function () {
            if (when === 'before') {
                asp.call(self);
            }

            result = fun.apply(self, arguments);

            if (when === 'after') {
                result = asp.call(self);
            }

            return result;
        };
    };

    // Common.
    // -------

    // Deferred function about some milliseconds.
    // If milliseconds is 0 that it's hack for some platforms to use function in 'next' thread.
    function defer(deferFn, milliseconds) {
        milliseconds = milliseconds || 0;
        setTimeout(deferFn, milliseconds);
    }

    // Interval checking first function until returns true, run after this second function callback.
    function checking(condition, callback) {
        var interval, intervalTime = 100;

        assert(typeof condition === 'function', 'pklib.common.checking: @condition: not {Function}');
        assert(typeof callback === 'function', 'pklib.common.checking: @callback: not {Function}');

        if (condition()) {
            callback();
        } else {
            interval = setInterval(function () {
                if (condition()) {
                    clearInterval(interval);
                    callback();
                }
            }, intervalTime);
        }
    }

    pklib.common = {
        assert: assert,
        defer: defer,
        checking: checking
    };

    // Cookie.
    // -------

    // Read cookie by it name.
    function getCookie(name) {
        if (name === undefined) {
            return null;
        }
        name += '=';

        var i, c, ca = document.cookie.split(';'), len = ca.length;

        for (i = 0; i < len; ++i) {
            c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1, c.length);
            }
            if (c.indexOf(name) === 0) {
                return decodeURIComponent(c.substring(name.length, c.length));
            }
        }
        return null;
    }

    // Create cookie file with name, value and day expired.
    function createCookie(name, value, days) {
        var expires = '', date = new Date();

        value = value || null;

        if (days !== undefined) {
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = '; expires=' + date.toUTCString();
        }

        document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/';

        return getCookie(name);
    }

    // Delete cookie by it name.
    function removeCookie(name) {
        return createCookie(name, undefined, -1);
    }

    pklib.cookie = {
        create: createCookie,
        get: getCookie,
        remove: removeCookie
    };

    // CSS.
    // ----

    // RegExp use to delete white chars.
    var rclass = /[\n\t\r]/g;

    // Check typeof params.
    function checkParams(css_class, element, call_func_name) {
        var prefix = 'pklib.css.' + call_func_name;
        assert(typeof css_class === 'string', prefix + ': @css_class: not {string}');
        assert(isElement(element), prefix + ': @element: not {HTMLElement}');
    }

    // Check if element has CSS class.
    function hasClass(css_class, element) {
        checkParams(css_class, element, 'hasClass');
        var className = ' ' + css_class + ' ';
        return ((' ' + element.className + ' ').replace(rclass, ' ').indexOf(className) > -1);
    }

    // Add CSS class to element define in second parameter.
    function addClass(css_class, element) {
        checkParams(css_class, element, 'addClass');
        var class_element = element.className;

        if (!hasClass(css_class, element)) {
            if (class_element.length) {
                class_element += ' ' + css_class;
            } else {
                class_element = css_class;
            }
        }
        element.className = class_element;
    }

    // Remove CSS class from element define in second parameter.
    function removeClass(css_class, element) {
        checkParams(css_class, element, 'removeClass');
        var regexp = new RegExp('(\\s' + css_class + ')|(' + css_class + '\\s)|' + css_class, 'i');
        element.className = trim(element.className.replace(regexp, ''));
    }

    pklib.css = {
        add_class: addClass,
        remove_class: removeClass,
        has_class: hasClass
    };

    // DOM.
    // ----

    // Types of all available node.
    var node_types = {
        'ELEMENT_NODE': 1,
        'ATTRIBUTE_NODE': 2,
        'TEXT_NODE': 3,
        'CDATA_SECTION_NODE': 4,
        'ENTITY_REFERENCE_NODE': 5,
        'ENTITY_NODE': 6,
        'PROCESSING_INSTRUCTION_NODE': 7,
        'COMMENT_NODE': 8,
        'DOCUMENT_NODE': 9,
        'DOCUMENT_TYPE_NODE': 10,
        'DOCUMENT_FRAGMENT_NODE': 11,
        'NOTATION_NODE': 12
    };

    // Walking on every node in node.
    function walkTheDom(node, func) {
        if (!!node) {
            func(node);
            node = node.firstChild;
            while (node) {
                walkTheDom(node, func);
                node = node.nextSibling;
            }
        }
    }

    // Check if param is Node, with use assertions.
    function isNode(node) {
        return node && node.nodeType && node.nodeName &&
            toString.call(node) === '[object Node]';
    }

    // Check if param is NodeList, with use assertions.
    function isNodeList(node_list) {
        var list = ['[object HTMLCollection]', '[object NodeList]'];
        return inArray(toString.call(node_list), list);
    }

    // Check if param is instanceOf Element.
    function isElement(node) {
        return (node && node.nodeType === node_types.ELEMENT_NODE) || false;
    }

    // Check visibility of Node, with use assertions.
    function isVisible(node) {
        assert(isElement(node), 'pklib.dom.isVisible: @node is not HTMLElement');

        return node.style.display !== 'none' && node.style.visibility !== 'hidden' && node.offsetWidth !== 0 && node.offsetHeight !== 0;
    }

    // Get element by attribute ID.
    function byId(id) {
        return document.getElementById(id);
    }

    // Get elements by tag name.
    function byTag(tag, element) {
        return (element || document).getElementsByTagName(tag);
    }

    // Get elements by attribute CLASS.
    function byClass(css_class, wrapper) {
        var results = [];

        wrapper = wrapper || document;

        walkTheDom(wrapper, function (node) {
            if (isElement(node) && hasClass(css_class, node)) {
                results.push(node);
            }
        });
        return results;
    }

    // Get index of node relative siblings.
    function nodeIndex(node) {
        assert(isElement(node), 'pklib.dom.index: @node is not HTMLElement');

        var i, childrenInstance = children(parent(node)), len = children.length;

        for (i = 0; i < len; ++i) {
            if (childrenInstance[i] === node) {
                return i;
            }
        }
        return null;
    }

    // Get children of element filter by Element type.
    function children(node) {
        assert(isElement(node), 'pklib.dom.children: @node is not HTMLElement');

        var i, array = [], childNodes = node.childNodes, len = childNodes.length;

        for (i = 0; i < len; ++i) {
            if (isElement(childNodes[i])) {
                array.push(childNodes[i]);
            }
        }
        return array;
    }

    // Insert data to Node. Maybe param is string so insert will be exec
    // by innerHTML, but if param is Node inserting with appendChild().
    function insert(element, node) {
        if (isElement(element)) {
            node.appendChild(element);
        } else if (isString(element)) {
            node.innerHTML += element;
        }
        return element;
    }

    // Remove Element specified in params.
    function nodeRemove(items) {
        var i, node = null, parent = null, args = ArrayProto.slice.call(arguments), len = args.length;

        for (i = 0; i < len; ++i) {
            node = args[i];
            if (isElement(node)) {
                parent = node.parentNode;
                parent.removeChild(node);
            }
        }
    }

    // Get prev Node what will be Element.
    function prev(node) {
        var prev_node;

        assert(isElement(node), 'pklib.dom.prev: @node is not HTMLElement');

        while (true) {
            prev_node = node.previousSibling;
            if (prev_node !== undefined && prev_node !== null && prev_node.nodeType !== node_types.ELEMENT_NODE) {
                node = prev_node;
            } else {
                break;
            }
        }
        return prev_node;
    }

    // Get next Node what will be Element.
    function next(node) {
        var next_node;

        assert(isElement(node), 'pklib.dom.next: @node is not HTMLElement');

        while (true) {
            next_node = node.nextSibling;
            if (next_node !== undefined && next_node !== null && next_node.nodeType !== node_types.ELEMENT_NODE) {
                node = next_node;
            } else {
                break;
            }
        }
        return next_node;
    }

    // Get parent element what will by Element, but if parent is not exists returns null.
    function parent(node) {
        var parent_node;

        assert(isElement(node), 'pklib.dom.parent: @node is not HTMLElement');

        while (true) {
            parent_node = node.parentNode;
            if (parent_node !== undefined && parent_node !== null && parent_node.nodeType !== node_types.ELEMENT_NODE) {
                node = parent_node;
            } else {
                break;
            }
        }
        return parent_node;
    }

    pklib.dom = {
        isNode: isNode,
        isNodeList: isNodeList,
        isElement: isElement,
        isVisible: isVisible,
        byId: byId,
        byTag: byTag,
        byClass: byClass,
        index: nodeIndex,
        children: children,
        insert: insert,
        remove: nodeRemove,
        prev: prev,
        next: next,
        parent: parent
    };

    // Events.
    // -------

    // Add event to Element.
    function addEvent(target, event_name, handler) {
        if (target.events === undefined) {
            target.events = {};
        }

        var event = target.events[event_name];

        if (event === undefined) {
            target.events[event_name] = [];
        }

        target.events[event_name].push(handler);

        if (target.attachEvent) {
            // IE browser.
            target.attachEvent('on' + event_name, handler);
        } else if (target.addEventListener) {
            // Other browser.
            target.addEventListener(event_name, handler, false);
        } else {
            // For very old browser.
            target['on' + event_name] = handler;
        }
    }

    // Remove event from Element.
    function removeEvent(target, event_name) {
        var removeAPI, events, len, i, handler;

        if (target.events === undefined) {
            target.events = {};
        }

        if (target.detachEvent) {
            // IE browser.
            removeAPI = 'detachEvent';
        } else if (target.removeEventListener) {
            // Other browser
            removeAPI = 'removeEventListener';
        }

        if (removeAPI === undefined) {
            // For old browser.
            delete target['on' + event_name];
        } else {
            events = target.events[event_name];

            if (events !== undefined) {
                len = events.length;

                for (i = 0; i < len; ++i) {
                    handler = events[i];
                    target[removeAPI](event_name, handler);
                    delete target.events[event_name];
                }
            }
        }
    }

    // Get array with events with concrete name.
    function getEvent(target, event_name) {
        if (target.events === undefined) {
            target.events = {};
        }
        return target.events[event_name];
    }

    // Run events on Element.
    function trigger(target, event_name) {
        var events, len, i;

        if (target.events === undefined) {
            target.events = {};
        }

        events = target.events[event_name];

        if (events !== undefined) {
            len = events.length;

            for (i = 0; i < len; ++i) {
                events[i].call(target, events[i]);
            }
        }
    }

    pklib.event = {
        add: addEvent,
        remove: removeEvent,
        get: getEvent,
        trigger: trigger
    };

    // File.
    // -----

    var copy_files = [];

    function simpleLoadJS(url, callback) {
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;

        function success_callback() {
            if (typeof callback === 'function') {
                callback(script);
            }
        }

        function readystatechange() {
            if (script.readyState === 'loaded' || script.readyState === 'complete') {
                script.onreadystatechange = null;
                success_callback();
            }
        }

        if (script.readyState === undefined) {
            script.onload = success_callback;
        } else {
            script.onreadystatechange = readystatechange;
        }

        if (document.head === undefined) {
            document.head = document.getElementsByTagName('head')[0];
        }

        document.head.appendChild(script);
    }

    // Load JS files. Url to files could be with path absolute or not.
    // If you must load more than 1 file use array, to set url to files.
    function loadJSFile(files, callback) {
        var file;

        if (typeof files === 'string') {
            file = files;
            simpleLoadJS(file, function (script) {
                if (typeof callback === 'function') {
                    callback(script);
                }
            });
        } else if (isArray(files)) {
            if (!copy_files.length) {
                copy_files = mixin(copy_files, files);
            }

            file = files.shift();

            if (file === undefined) {
                if (typeof callback === 'function') {
                    callback({
                        src: copy_files[copy_files.length - 1]
                    });

                    copy_files = [];
                }
            } else {
                simpleLoadJS(file, function () {
                    loadJSFile(files, callback);
                });
            }
        } else {
            throw new Error('pklib.file.loadjs: @files not {string} or {Array}');
        }
    }

    pklib.file = {
        loadjs: loadJSFile
    };

    // Object.
    // -------

    // Check if param is object.
    function isObject(it) {
        return it && toString.call(it) === '[object Object]' && typeof it === 'object' &&
            typeof it.hasOwnProperty === 'function' && typeof it.isPrototypeOf === 'function';
    }

    // Mix two params, from second to first param. Return first param mixin with second param.
    function mixin(target, source) {
        var i, len, element, item;

        if (isArray(target) && isArray(source)) {
            len = source.length;

            for (i = 0; i < len; ++i) {
                element = source[i];

                if (!inArray(element, target)) {
                    target.push(element);
                }
            }
        } else {
            for (item in source) {
                if (source.hasOwnProperty(item)) {
                    if (isObject(target[item])) {
                        target[item] = mixin(target[item], source[item]);
                    } else {
                        target[item] = source[item];
                    }
                }
            }
        }
        return target;
    }

    // Check if object is empty (contains non-value).
    function isEmpty(obj) {
        var i;

        for (i in obj) {
            if (obj.hasOwnProperty(i)) {
                return false;
            }
        }
        return true;
    }

    pklib.object = {
        isObject: isObject,
        mixin: mixin,
        isEmpty: isEmpty
    };

    // Profiler.
    // ---------

    var profilerData = {};

    function startProfile(name) {
        profilerData[name] = new Date();
        return profilerData[name];
    }

    function stopProfile(name) {
        profilerData[name] = new Date() - profilerData[name];
        return (new Date((new Date()).getTime() + profilerData[name])).getTime();
    }

    function getProfilerTime(name) {
        return profilerData[name];
    }

    pklib.profiler = {
        start: startProfile,
        stop: stopProfile,
        getTime: getProfilerTime
    };

    // String.
    // -------

    function isString(source) {
        return typeof source === 'string';
    }

    function isLetter(source) {
        return isString(source) && (/^[a-zA-Z]$/).test(source);
    }

    function trim(source) {
        return source.replace(/^\s+|\s+$/g, '');
    }

    function slug(source) {
        var polish = [];
        polish[261] = 97;
        polish[281] = 101;
        polish[243] = 111;
        polish[347] = 115;
        polish[322] = 108;
        polish[378] = polish[380] = 122;
        polish[263] = 99;
        polish[324] = 110;

        var result = source.toLowerCase().replace(/\s/mg, '-');
        result = result.replace(/[^a-zA-Z0-9\-]/mg, function (ch) {
            var char = polish[ch.charCodeAt(0)];
            if (char) {
                return String.fromCharCode(char);
            }
            return '';
        });
        return result;
    }

    function capitalize(source) {
        return source.substr(0, 1).toUpperCase() + source.substring(1, source.length);
    }

    function delimiterSeparatedWords(source) {
        return source.replace(/[A-ZĘÓĄŚŁŻŹĆŃ]/g, function (match) {
            return '-' + match.toLowerCase();
        });
    }

    function stripTags(source) {
        assert(typeof source === 'string', 'pklib.string.stripTags: param @source is not a string');

        if (source && source.length !== 0) {
            var dummy = document.createElement('div');
            dummy.innerHTML = source;
            return dummy.textContent || dummy.innerText;
        }
        return source;
    }

    function camelCase(source) {
        var pos, pre, sub, post;

        while (source.indexOf('-') !== -1) {
            pos = source.indexOf('-');
            pre = source.substr(0, pos);
            sub = source.substr(pos + 1, 1).toUpperCase();
            post = source.substring(pos + 2, source.length);
            source = pre + sub + post;
        }
        return source;
    }

    function slice(source, length, is_force) {
        assert(typeof source === 'string', 'pklib.string.slice: param @source is not a string');

        // When source is longer than limit, return it
        if (source.length < length) {
            return source;
        }

        // Slice source text using second param
        var text = source.slice(0, length), last_space;

        // If we don't cut in the middle of word, add ellipsis
        if (source[length] === ' ' || text[length - 1] === ' ') {
            return trim(text) + '...';
        }

        if (!is_force) {
            last_space = text.lastIndexOf(' ');

            if (last_space !== -1) {
                return text.slice(0, last_space) + '...';
            }
        }

        return text + '...';
    }

    // Replace tags in string to defined data.
    // ${NAME} - replace by value of object['NAME']
    function format(str, obj) {
        var name;

        for (name in obj) {
            if (obj.hasOwnProperty(name)) {
                str = str.replace(new RegExp('%{' + name + '}', 'ig'), obj[name]);
            }
        }
        return str;
    }

    // Left padding any chars.
    function lpad(staff, nrFill, add_char) {
        var i, string = staff.toString();

        for (i = string.length; i < nrFill; ++i) {
            string = add_char + string;
        }
        return string;
    }

    // Right padding any chars.
    function rpad(staff, nrFill, add_char) {
        var i, string = staff.toString();

        for (i = string.length; i < nrFill; ++i) {
            string += add_char;
        }
        return string;
    }

    pklib.string = {
        isString: isString,
        isLetter: isLetter,
        trim: trim,
        slug: slug,
        capitalize: capitalize,
        delimiterSeparatedWords: delimiterSeparatedWords,
        stripTags: stripTags,
        camelCase: camelCase,
        slice: slice,
        format: format,
        lpad: lpad,
        rpad: rpad
    };

    // UI
    // --

    function center(element, wrapper) {
        var left = null, top = null, pus = pklib.ui.size;

        assert(isElement(element), 'pklib.ui.center: @element: not {HTMLElement}');

        if (wrapper === document.body) {
            left = (Math.max(pus.window('width'), pus.document('width')) - pus.object(element, 'width')) / 2;
            top = (Math.max(pus.window('height'), pus.document('height')) - pus.object(element, 'height')) / 2;
        } else {
            left = (pus.window('width') - pus.object(element, 'width')) / 2;
            top = (pus.window('height') - pus.object(element, 'height')) / 2;
        }
        element.style.left = left + 'px';
        element.style.top = top + 'px';
        element.style.position = 'absolute';
        return [left, top];
    }

    function maximize(element, wrapper) {
        var width = null, height = null, pus = pklib.ui.size;

        if (wrapper === document.body) {
            width = Math.max(pus.window('width'), pus.document('width'));
            height = Math.max(pus.window('height'), pus.document('height'));
            if (isIE) {
                width -= 20;
            }
        } else {
            width = pus.object(wrapper, 'width');
            height = pus.object(wrapper, 'height');
        }
        element.style.width = width;
        element.style.height = height;
        return [width, height];
    }

    function scrollTo(param, animate) {
        var interval = null;
        if (animate) {
            interval = setInterval(function () {
                document.body.scroll_top -= 5;
                if (document.body.scroll_top <= 0) {
                    clearInterval(interval);
                }
            }, 1);
        } else {
            document.body.scroll_top = param + 'px';
        }
    }

    pklib.ui = {
        center: center,
        maximize: maximize,
        scrollTo: scrollTo
    };

    // UI Glass.
    // ---------

    var glassId = 'pklib-glass-wrapper';
    var glassSettings = {
        container: null,
        style: {
            position: 'absolute',
            left: 0,
            top: 0,
            background: '#000',
            opacity: 0.5,
            zIndex: 1000
        }
    };

    function showGlass(config, callback) {
        var glass = document.createElement('div'),
            glassStyle = glass.style,
            style;

        glassSettings.container = document.body;
        glassSettings = mixin(glassSettings, config);
        glassSettings.style.filter = 'alpha(opacity=' + parseFloat(glassSettings.style.opacity) * 100 + ')';

        glass.setAttribute('id', glassId);

        for (style in glassSettings.style) {
            if (glassSettings.style.hasOwnProperty(style)) {
                glassStyle[style] = glassSettings.style[style];
            }
        }

        glassSettings.container.appendChild(glass);

        maximize(glass, glassSettings.container);

        addEvent(root, 'resize', function () {
            closeGlass();
            showGlass(config, callback);
            maximize(glass, glassSettings.container);
        });

        if (typeof callback === 'function') {
            callback();
        }
        return glass;
    }

    function closeGlass(callback) {
        var glass = byId(glassId),
            result = false;

        removeEvent(root, 'resize');

        if (glass !== null) {
            glass.parentNode.removeChild(glass);
            closeGlass(callback);
            result = true;
        }

        if (typeof callback === 'function') {
            callback();
        }
        return result;
    }

    pklib.ui.glass = {
        objId: glassId,
        show: showGlass,
        close: closeGlass
    };

    // UI Loader.
    // ----------

    var loaderId = 'pklib-loader-wrapper';
    var loaderSettings = {
        src: '',
        container: null,
        style: {
            width: 31,
            height: 31,
            zIndex: 1010
        },
        center: true
    };

    function showLoader(config, callback) {
        var loader = document.createElement('img'),
            loaderStyle = loader.style,
            style;

        loaderSettings.container = document.body;
        loaderSettings = mixin(loaderSettings, config);

        loader.setAttribute('id', pklib.ui.loader.objId);
        loader.setAttribute('src', loaderSettings.src);

        for (style in loaderSettings.style) {
            if (loaderSettings.style.hasOwnProperty(style)) {
                loaderStyle[style] = loaderSettings.style[style];
            }
        }

        if (settings.center) {
            center(loader, loaderSettings.container);

            addEvent(root, 'resize', function () {
                center(loader, loaderSettings.container);
            });
        }

        loaderSettings.container.appendChild(loader);

        if (typeof callback === 'function') {
            callback();
        }

        // Clear memory.
        loader = null;
    }

    function closeLoader(callback) {
        var loader = byId(loaderId),
            result = false;

        if (loader !== null) {
            loader.parentNode.removeChild(loader);
            closeLoader(callback);
            result = true;
        }

        if (typeof callback === 'function') {
            callback();
        }
        return result;
    }

    pklib.ui.loader = {
        objId: loaderId,
        show: showLoader,
        close: closeLoader
    };

    // UI Message.
    // -----------

    var messageId = 'pklib-message-wrapper';
    var messageSettings = {
        container: null,
        style: {
            width: 300,
            height: 300,
            zIndex: 1010
        }
    };

    function showMessage(config, callback) {
        var message = document.createElement('div'),
            messageStyle = message.style,
            style;

        messageSettings.container = document.body;
        messageSettings = mixin(messageSettings, config);

        message.setAttribute('id', pklib.ui.message.objId);

        for (style in messageSettings.style) {
            if (messageSettings.style.hasOwnProperty(style)) {
                messageStyle[style] = messageSettings.style[style];
            }
        }

        insert(pklib.ui.message.content, message);

        messageSettings.container.appendChild(message);
        center(message, messageSettings.container);

        addEvent(root, 'resize', function () {
            center(message, messageSettings.container);
        });

        if (typeof callback === 'function') {
            callback();
        }
        return message;
    }

    function closeMessage(callback) {
        var message = byId(pklib.ui.message.objId),
            result = false;

        if (message !== null) {
            message.parentNode.removeChild(message);
            closeMessage(callback);
            result = true;
        }

        if (typeof callback === 'function') {
            callback();
        }
        return result;
    }

    pklib.ui.message = {
        objId: messageId,
        content: null,
        show: showMessage,
        close: closeMessage
    };

    // UI Size.
    // --------

    function getWindowSize(name) {
        var clientName;
        assert(typeof name === 'string', 'pklib.ui.size.window: @name: not {string}');

        name = capitalize(name);
        clientName = document.documentElement['client' + name];
        return (document.compatMode === 'CSS1Compat' && clientName) ||
            document.body['client' + name] ||
            clientName;
    }

    function getDocumentSize(name) {
        var clientName,
            scrollBodyName,
            scrollName,
            offsetBodyName,
            offsetName;

        assert(typeof name === 'string', 'pklib.ui.size.document: @name: not {string}');

        name = capitalize(name);
        clientName = document.documentElement['client' + name];
        scrollBodyName = document.body['scroll' + name];
        scrollName = document.documentElement['scroll' + name];
        offsetBodyName = document.body['offset' + name];
        offsetName = document.documentElement['offset' + name];
        return Math.max(clientName, scrollBodyName, scrollName, offsetBodyName, offsetName);
    }

    function getObjectSize(obj, name) {
        assert(typeof name === 'string', 'pklib.ui.size.object: @name: not {string}');
        assert(isElement(obj), 'pklib.ui.size.object: @obj: not {HTMLElement}');

        name = capitalize(name);

        var client = obj['client' + name],
            scroll = obj['scroll' + name],
            offset = obj['offset' + name];
        return Math.max(client, scroll, offset);
    }

    pklib.ui.size = {
        window: getWindowSize,
        document: getDocumentSize,
        object: getObjectSize
    };

    // URL.
    // ----

    // Get all params, and return in JSON object.
    function getParams(url) {
        var i, item, len, key_value_section, params, params_list = {};

        if (typeof url === 'string') {
            params = url.match(/\?(.*)/)[0] || '';
        } else {
            params = root.location.search;
        }

        if (params.substr(0, 1) === '?') {
            params = params.substr(1);
        }

        params = params.split('&');
        len = params.length;

        for (i = 0; i < len; ++i) {
            key_value_section = params[i];
            if (key_value_section.length > 0) {
                item = key_value_section.split('=');
                params_list[item[0]] = item[1];
            }
        }
        return params_list;
    }

    // Get concrete param from URL. If param if not defined return null.
    function getParam(key, url) {
        var params, i, item, len;

        if (typeof url === 'string') {
            params = url.match(/\?(.*)/)[0] || '';
        } else {
            params = root.location.search;
        }

        if (params.substr(0, 1) === '?') {
            params = params.substr(1);
        }

        params = params.split('&');
        len = params.length;

        for (i = 0; i < len; ++i) {
            item = params[i].split('=');
            if (item[0] === key) {
                return item[1];
            }
        }
        return null;
    }

    pklib.url = {
        getParams: getParams,
        getParam: getParam
    };

    // Utilities.
    // ----------

    function openTrigger(evt) {
        var url = '';

        if (evt.originalTarget && typeof evt.originalTarget === 'object' && evt.originalTarget.href !== undefined) {
            url = evt.originalTarget.href;
        } else if (evt.toElement && typeof evt.toElement === 'object' && evt.toElement.href !== undefined) {
            url = evt.toElement.href;
        } else if (evt.srcElement && typeof evt.srcElement === 'object' && evt.srcElement !== undefined) {
            url = evt.srcElement.href;
        }

        root.open(url);

        try {
            evt.preventDefault();
        } catch (ignore) {
            root.event.returnValue = false;
        }
        return false;
    }

    function clearFocus(obj) {
        if (isElement(obj)) {
            addEvent(obj, 'focus', function () {
                if (obj.value === obj.defaultValue) {
                    obj.value = '';
                }
            });
            addEvent(obj, 'blur', function () {
                if (obj.value === '') {
                    obj.value = obj.defaultValue;
                }
            });
        }
    }

    function outerlink(area) {
        var i, len, link, links;

        area = area || document;

        links = pklib.dom.by_tag('a', area);
        len = links.length;

        for (i = 0; i < len; ++i) {
            link = links[i];
            if (link.rel === 'outerlink') {
                addEvent(link, 'click', openTrigger.bind(link));
            }
        }
    }

    function confirm(element, text) {
        var response;

        if (element !== undefined) {
            text = text || 'Sure?';

            addEvent(element, 'click', function (evt) {
                response = root.confirm(text);
                if (!response) {
                    try {
                        evt.preventDefault();
                    } catch (ignore) {
                        root.event.returnValue = false;
                    }

                    return false;
                }
                return true;
            });
        }
    }

    pklib.utils = {
        // Numbers of chars in ASCII system.
        ascii: {
            letters: {
                lower: [113, 119, 101, 114, 116, 121, 117, 105, 111, 112, 97,
                    115, 100, 102, 103, 104, 106, 107, 108, 122, 120, 99, 118,
                    98, 110, 109],
                upper: [81, 87, 69, 82, 84, 89, 85, 73, 79, 80, 65, 83, 68,
                    70, 71, 72, 74, 75, 76, 90, 88, 67, 86, 66, 78, 77]
            }
        },

        action: {
            clearfocus: clearFocus,
            outerlink: outerlink,
            confirm: confirm
        }
    };

    // Exports.
    root.pklib = pklib;

}(this));
