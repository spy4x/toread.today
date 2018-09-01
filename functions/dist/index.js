"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const ogs = require("open-graph-scraper");
console.log('--- COLD START ---');
exports.itemCreate = functions.firestore
    .document(`items/{id}`)
    .onCreate((docSnapshot) => __awaiter(this, void 0, void 0, function* () {
    const url = docSnapshot.data().url;
    const id = docSnapshot.id;
    try {
        const { data } = yield ogs({ url });
        const updateFields = {
            title: data.ogTitle || null,
            description: data.ogDescription || null,
            type: getType(data.ogType)
        };
        console.log('Result:', {
            id,
            url,
            updateFields,
            data: JSON.stringify(data, null, 2)
        });
        yield docSnapshot.ref.update(updateFields);
    }
    catch (error) {
        console.error('itemCreate', { url, id }, error);
    }
}));
function getType(item) {
    const defaultType = 'website';
    if (!item) {
        return defaultType;
    }
    const availableTypes = ['video', 'article', 'profile', defaultType];
    let result = defaultType;
    availableTypes.find(arrItem => {
        const contains = arrItem.indexOf(item) >= 0;
        if (contains) {
            result = arrItem;
        }
        return contains;
    });
    return result;
}
//# sourceMappingURL=index.js.map