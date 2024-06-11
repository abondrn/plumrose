const xml = require('@xmldom/xmldom');


function parseXml(src) {
    return new xml.DOMParser().parseFromString(src, "text/xml");
}


function dumpXml(doc) {
    return new xml.XMLSerializer().serializeToString(doc);
}


// TODO: support entities
function xmlToJson(node, dropWhitespace = false) {
    // If the node is a text node, return its text content
    if (node.nodeType === node.TEXT_NODE) {
        return node.nodeValue;
    }


    // Initialize the result object
    const obj = {attr: {}, elem: []};
    // If the node has attributes, add them to the result object
    if (node.nodeType === node.ELEMENT_NODE) {
        obj.tag = node.nodeName;
        for (let i = 0; i < node.attributes.length; i++) {
            const attr = node.attributes.item(i);
            obj['attr'][attr.nodeName] = attr.nodeValue;
        }
    } else if (node.nodeType === node.COMMENT_NODE) {
        obj.tag = 'comment';
        obj.elem.push(node.nodeValue);
    } else {
        console.log(node.nodeType);
        return node;
    }

    // If the node has child nodes, recursively process them
    if (node.hasChildNodes()) {
        let currentNode = node.firstChild;
        while (currentNode) {
            const json = xmlToJson(currentNode);
            currentNode = currentNode.nextSibling;
            if (typeof json === 'string' && /^\s*$/.test(json)) {
                continue;
            }
            obj['elem'].push(json);
        }
    }

    return obj;
}


function jsonToXml(json) {
    const document = new xml.DOMImplementation().createDocument('', '', null);
    const dom = jsonToXmlHelper(json, document, null);
    return dom;
}


function jsonToXmlHelper(json, document, parent) {
    if (typeof json === 'object') {
        const childNode = (json.tag === 'comment'
            ? document.createComment(json.elem[0])
            : document.createElement(json.tag));
            
        const attributes = json.attr;
        for (const attrName in attributes) {
            const attrValue = attributes[attrName];
            childNode.setAttribute(attrName, attrValue);
        }
        if (json.tag != 'comment') {
            for (const item of json.elem) {
                jsonToXmlHelper(item, document, childNode);
            }
        }

        if (parent !== null) {
            parent.appendChild(childNode);
        } else {
            document.insertBefore(childNode);
        }
    } else {
        const textNode = document.createTextNode(json);
        if (parent !== null) {
            parent.appendChild(textNode);
        } else {
            document.insertBefore(textNode);
        }
    }

    return document;
}


function read(src) {
    return xmlToJson(parseXml(src).documentElement);
}

module.exports = { read };