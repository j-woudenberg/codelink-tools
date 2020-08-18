'use babel';

export default {
    buildJsonDom(jsonObj) {
        if (!jsonObj) return '';

        let createElem = (key, val) => {
            if (key == undefined || val == undefined) return;

            let domElem = document.createElement('div');
            let keyDisp = '' + key;

            // check if objector array and recall buildJsonDom with val and stuff between [] or {}
            let valDisp = this.getDispVal(val);
        };

        let jsonDom = document.createElement('div');

        return jsonDom;
    },

    getDispVal(val) {
        if (this.isNull(val)) return 'null';
        if (this.isUndefined(val)) return 'undefined';
        if (this.isBoolean(val)) return '' + val;
        if (this.isNumber(val)) return '' + val;
        if (this.isString(val)) return '\'' + val + '\'';
        if (this.isSymbol(val)) return '' + val;

        // if (this.isFunction(val)) return val;
        // if (this.isArray(val)) return val;
        // if (this.isObject(val)) return val;
    },

    isNull(val) {
        return val === null;
    },

    isUndefined(val) {
        return val === undefined;
    },

    isBoolean(val) {
        return typeof val == 'boolean';
    },

    isNumber(val) {
        return typeof val == 'number';
    },

    isString(val) {
        return typeof val == 'string';
    },

    isSymbol(val) {
        return typeof val == 'symbol';
    },

    isFunction(val) {
        return typeof val == 'function';
    },

    isArray(val) {
        return Array.isArray(val);
    },

    isObject(val) {
        return typeof val == 'object' && !this.isArray(val);
    }
};
