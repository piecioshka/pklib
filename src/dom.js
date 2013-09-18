/**
 * @package pklib.dom
 * @dependence pklib.browser, pklib.css, pklib.string, pklib.utils
 */
(function (global) {
    "use strict";

    // imports
    var document = global.document;
    var pklib = (global.pklib = global.pklib || {});
    var to_string = Object.prototype.toString;

    /**
     * Types of all available node.
     */
    var node_types = {
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
    };

    /**
     * Walking on every node in node.
     * @param {HTMLElement} node
     * @param {Function} func Run on every node.
     */
    function walk_the_dom(node, func) {
        if (!!node) {
            func(node);
            node = node.firstChild;
            while (node) {
                walk_the_dom(node, func);
                node = node.nextSibling;
            }
        }
    }

    /**
     * Check if param is Node, with use assertions.
     * @param {Node} node
     * @return {string}
     */
    function is_node(node) {
        return node && node.nodeType && node.nodeName &&
            to_string.call(node) === "[object Node]";
    }

    /**
     * Check if param is NodeList, with use assertions.
     * @param {NodeList} node_list
     * @return {boolean}
     */
    function is_node_list(node_list) {
        var list = ["[object HTMLCollection]", "[object NodeList]"];
        return pklib.array.in_array(to_string.call(node_list), list);
    }

    /**
     * Check if param is instanceOf Element.
     * @param {HTMLElement} node
     * @return {boolean}
     */
    function is_element(node) {
        return (node && node.nodeType === node_types.ELEMENT_NODE) || false;
    }

    /**
     * Check visibility of Node, with use assertions.
     * @param {HTMLElement} node
     * @return {boolean}
     */
    function is_visible(node) {
        pklib.common.assert(is_element(node), "pklib.dom.is_visible: @node is not HTMLElement");

        return node.style.display !== "none" &&
            node.style.visibility !== "hidden" &&
            node.offsetWidth !== 0 &&
            node.offsetHeight !== 0;
    }

    /**
     * Get element by attribute ID.
     * @param {string} id
     * @return {HTMLElement|null}
     */
    function by_id(id) {
        return document.getElementById(id);
    }

    /**
     * Get elements by tag name.
     * @param {string} tag
     * @param {Element} [element]
     * @return {NodeList}
     */
    function by_tag(tag, element) {
        element = element || document;
        return element.getElementsByTagName(tag);
    }

    /**
     * Get elements by attribute CLASS.
     * @param {string} css_class
     * @param {HTMLElement} [wrapper]
     * @return {Array}
     */
    function by_class(css_class, wrapper) {
        var results = [];

        wrapper = wrapper || document;

        walk_the_dom(wrapper, function (node) {
            if (is_element(node) && pklib.css.has_class(css_class, node)) {
                results.push(node);
            }
        });

        return results;
    }

    /**
     * Get index of node relative siblings.
     * @param {HTMLElement} node
     * @return {number|null}
     */
    function index(node) {
        pklib.common.assert(is_element(node), "pklib.dom.index: @node is not HTMLElement");

        var i,
            parent = pklib.dom.parent(node),
            chren = pklib.dom.children(parent),
            len = chren.length;

        for (i = 0; i < len; ++i) {
            if (chren[i] === node) {
                return i;
            }
        }
        return null;
    }

    /**
     * Get children of element filter by Element type.
     * @param {HTMLElement} node
     * @return {Array}
     */
    function children(node) {
        pklib.common.assert(is_element(node), "pklib.dom.children: @node is not HTMLElement");

        var i,
            array = [],
            chren = node.childNodes,
            len = chren.length;

        for (i = 0; i < len; ++i) {
            if (is_element(chren[i])) {
                array.push(chren[i]);
            }
        }
        return array;
    }

    /**
     * Insert data to Node. Maybe param is string so insert will be exec
     * by innerHTML, but if param is Node inserting with appendChild().
     * @param {HTMLElement|string} element
     * @param {HTMLElement} node
     * @return {HTMLElement}
     */
    function insert(element, node) {
        if (is_element(element)) {
            node.appendChild(element);
        } else if (pklib.string.is_string(element)) {
            node.innerHTML += element;
        }
        return element;
    }

    /**
     * Remove Element specified in params.
     * @param {...HTMLElement} items
     */
    function remove(items) {
        var i, node = null, parent = null,
            args = [].slice.call(arguments),
            len = args.length;

        for (i = 0; i < len; ++i) {
            node = args[i];
            if (is_element(node)) {
                parent = node.parentNode;
                parent.removeChild(node);
            }
        }
    }

    /**
     * Get prev Node what will be Element.
     * @param {HTMLElement} node
     * @return {HTMLElement|null}
     */
    function prev(node) {
        var prev_node;

        pklib.common.assert(is_element(node), "pklib.dom.prev: @node is not HTMLElement");

        while (true) {
            prev_node = node.previousSibling;
            if (prev_node !== undefined &&
                    prev_node !== null &&
                    prev_node.nodeType !== node_types.ELEMENT_NODE) {
                node = prev_node;
            } else {
                break;
            }
        }
        return prev_node;
    }

    /**
     * Get next Node what will be Element.
     * @param {HTMLElement} node
     * @return {HTMLElement|null}
     */
    function next(node) {
        var next_node;

        pklib.common.assert(is_element(node), "pklib.dom.next: @node is not HTMLElement");

        while (true) {
            next_node = node.nextSibling;
            if (next_node !== undefined &&
                    next_node !== null &&
                    next_node.nodeType !== node_types.ELEMENT_NODE) {
                node = next_node;
            } else {
                break;
            }
        }
        return next_node;
    }

    /**
     * Get parent element what will by Element, but if parent is not exists
     *     returns null.
     * @param {HTMLElement} node
     * @return {HTMLElement|null}
     */
    function parent(node) {
        var parent_node;

        pklib.common.assert(is_element(node), "pklib.dom.parent: @node is not HTMLElement");

        while (true) {
            parent_node = node.parentNode;
            if (parent_node !== undefined &&
                    parent_node !== null &&
                    parent_node.nodeType !== node_types.ELEMENT_NODE) {
                node = parent_node;
            } else {
                break;
            }
        }
        return parent_node;
    }

    // exports
    pklib.dom = {
        is_node: is_node,
        is_node_list: is_node_list,
        is_element: is_element,
        is_visible: is_visible,
        by_id: by_id,
        by_tag: by_tag,
        by_class: by_class,
        index: index,
        children: children,
        insert: insert,
        remove: remove,
        prev: prev,
        next: next,
        parent: parent
    };

}(this));
