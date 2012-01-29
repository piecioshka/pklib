/**
 * Helper related with DOM service.
 * @package dom
 * @dependence browser, css, utils
 */
(function (global) {
    "use strict";

    var pklib = global.pklib || {},
        document = global.document || {};

    /**
     * Walking on every element in node
     * @param node {Node}
     * @param func {Function}
     * @returns
     */
    function walk_the_dom(node, func) {
        func(node);
        node = node.firstChild;
        while (node) {
            walk_the_dom(node, func);
            node = node.nextSibling;
        }
    }

    pklib.dom = {
        /**
         * Types of all available node
         */
        nodeTypes: {
            "ELEMENT_NODE": 1,
            "ATTRIBUTE_NODE": 2,
            "TEXT_NODE": 3,
            "CDATA_SECTION_NODE": 4,
            "ENTITY_REFERENCE_NODE": 5,
            "ENTITY_NODE": 6,
            "PROCESSING_INSTRUCTION_NODE": 7,
            "COMMENT_NODE": 8,
            "DOCUMENT_NODE": 9,
            "DOCUMENT_TYPE_NODE": 10,
            "DOCUMENT_FRAGMENT_NODE": 11,
            "NOTATION_NODE": 12
        },
        /**
         * @param node {Node}
         * @return {String}
         */
        isNode: function (node) {
            return ((node && node.nodeType) && node.nodeName) || false;
        },
        /**
         * @param node {Node}
         * @return {String}
         */
        isElement: function (node) {
            return (node && node.nodeType === this.nodeTypes.ELEMENT_NODE) || false;
        },
        /**
         * @param id {String}
         * @param wrapper {HTMLElement}
         * @return {HTMLElement | null}
         */
        byId: function (id) {
            return document.getElementById(id);
        },
        /**
         * @param tag {String}
         * @param element {Element}
         * @return {NodeList}
         */
        byTag: function (tag, element) {
            element = element || document;
            return element.getElementsByTagName(tag);
        },
        /**
         * @param cssClass {String}
         * @param wrapper {HTMLElement}
         * @return {NodeList | Array}
         */
        byClass: function (cssClass, wrapper) {
            wrapper = wrapper || document;
            var results = [];
            if (wrapper.getElementsByClassName) {
                return wrapper.getElementsByClassName(cssClass);
            } else {
                walk_the_dom(wrapper, function (node) {
                    if (pklib.css.hasClass(cssClass, node)) {
                        results.push(node);
                    }
                });
                return results;
            }
        },
        /**
         * Get element from  selector
         * @param {String} selector
         * 
         * TODO: Feature
         */
        /*
        get: function (selector) {
		    function getType(selector) {
		        if (/^\.(\w*)$/.test(selector)) {
		            return "class";
		        } else if (/^\#(\w*)$/.test(selector)) {
		            return "id";
		        } else {
		            return "tag";
		        }
		    }
            try {
                var i,
                    elements = selector.match(/[\.\#\w]+/g),
                    len = elements.length,
                    scope = global,
                    item,
                    type;
                for (i = 0; i < len; ++i) {
                    item = elements[i];
                    type = getType(item);
                    if (type === "class") {
                        scope = this.byClass(item.substr(1), scope);
                    } else if (type === "id") {
                        scope = this.byId(item.substr(1), scope);
                    } else {
                        scope = this.byTag(item, scope);
                    }
                }
            } catch (ignore) {}
        },
        */
        /**
         * @param node {Node}
         * @return {Number | null}
         */
        index: function (node) {
            var i,
                parent = this.parent(node),
                childs = this.children(parent),
                len = childs.length;

            for (i = 0; i < len; ++i) {
                if (childs[i] === node) {
                    return i;
                }
            }
            return null;
        },
        /**
         * @param node {Node}
         * @return {Array}
         */
        children: function (node) {
            var i,
                array = [],
                childs = node.childNodes,
                len = childs.length;

            for (i = 0; i < len; ++i) {
                if (this.isElement(childs[i])) {
                    array.push(childs[i]);
                }
            }
            return array;
        },
        /**
         * @param element {HTMLElement}
         * @param wrapper {HTMLElement}
         * @throws {DOMException}
         * @return {Array}
         */
        center: function (element, wrapper) {
            var left = null,
                top = null,
                pus = pklib.utils.size;

            if (!this.isElement(element)) {
                throw DOMException();
            }

            if (wrapper === document.body) {
                left = (Math.max(pus.window("width"), pus.document("width")) - pus.object(element, "width")) / 2;
                top = (Math.max(pus.window("height"), pus.document("height")) - pus.object(element, "height")) / 2;
            } else {
                left = (pus.window("width") - pus.object(element, "width")) / 2;
                top = (pus.window("height") - pus.object(element, "height")) / 2;
            }
            element.style.left = left + "px";
            element.style.top = top + "px";
            element.style.position = "absolute";
            return [left, top];
        },
        /**
         * @param element {HTMLElement}
         * @param wrapper {HTMLElement}
         * @return {Array}
         */
        maximize: function (element, wrapper) {
            var width = null,
                height = null,
                pus = pklib.utils.size;

            if (wrapper === document.body) {
                width = Math.max(pus.window("width"), pus.document("width"));
                height = Math.max(pus.window("height"), pus.document("height"));
                if (pklib.browser.getName() === "msie") {
                    width -= 20;
                }
            } else {
                width = pus.object(wrapper, "width");
                height = pus.object(wrapper, "height");
            }
            element.style.width = width;
            element.style.height = height;
            return [width, height];
        },
        /**
         * @param element {HTMLElement}
         * @param node {Node}
         * @return {HTMLElement}
         */
        insert: function (element, node) {
            if (this.isNode(element)) {
                node.appendChild(element);
            } else if (typeof element === "string") {
                node.innerHTML += element;
            }
            return element;
        },
        /**
         * @param node {Node}
         */
        remove: function () {
            var i, node = null, parent = null,
                args = Array.prototype.slice.call(arguments),
                len = args.length;

            for (i = 0; i < len; ++i) {
                node = args[i];
                if (this.isNode(node)) {
                    parent = node.parentNode;
                    parent.removeChild(node);
                }
            }
        },
        /**
         * @param node {HTMLElement}
         * @return {HTMLElement | null}
         */
        prev: function (node) {
            var pNode = null;
            while (true) {
                pNode = node.previousSibling;
                if (pNode != null && pNode.nodeType !== this.nodeTypes.ELEMENT_NODE) {
                    node = pNode;
                } else {
                    break;
                }
            }
            return pNode;
        },
        /**
         * @param node {HTMLElement}
         * @return {HTMLElement | null}
         */
        next: function (node) {
            var nNode = null;
            while (true) {
                nNode = node.nextSibling;
                if (nNode != null && nNode.nodeType !== this.nodeTypes.ELEMENT_NODE) {
                    node = nNode;
                } else {
                    break;
                }
            }
            return nNode;
        },
        /**
         * @param node {HTMLElement}
         * @return {HTMLElement | null}
         */
        parent: function (node) {
            var parent = null;
            while (true) {
                parent = node.parentNode;
                if (parent != null && parent.nodeType !== this.nodeTypes.ELEMENT_NODE) {
                    node = parent;
                } else {
                    break;
                }
            }
            return parent;
        }
    };
}(this));
