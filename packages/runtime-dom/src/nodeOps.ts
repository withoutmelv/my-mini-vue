export const nodeOps = {
    insert: (child: any, parent: { insertBefore: (arg0: any, arg1: any) => void; }, anchor: any) => {
        parent.insertBefore(child, anchor || null);
    },
    remove: (child: { parentNode: any; }) => {
        const parent = child.parentNode;
        if (parent) {
            parent.removeChild(child);
        }
    },
    createElement: (tag: any) => document.createElement(tag),
    createText: (text: string) => document.createTextNode(text),
    setElementText: (el: { textContent: any; }, text: any) => { // 
        el.textContent = text;
    },
    setText: (node: { nodeValue: any; }, text: any) => {
        node.nodeValue = text;
    },
    parentNode: (node: { parentNode: any; }) => node.parentNode,
    nextSibling: (node: { nextSibling: any; }) => node.nextSibling,
    querySelector: (selector: any) => document.querySelector(selector),
}