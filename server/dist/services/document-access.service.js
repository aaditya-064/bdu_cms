"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentScope = documentScope;
const folder_model_1 = __importDefault(require("../models/folder.model"));
const enum_types_1 = require("../types/enum.types");
async function documentScope(role) {
    if (role === enum_types_1.Role.ADMIN || role === enum_types_1.Role.DIRECTOR) {
        return {
            folderFilter: {},
            fileFilter: {},
        };
    }
    const folders = await folder_model_1.default.find({ deletedAt: null })
        .select("_id parentFolder isLocked")
        .lean();
    const visible = new Set();
    // A folder is visible only if it is unlocked and its entire
    // parent chain is visible. Broken/circular chains stay hidden.
    let changed = true;
    while (changed) {
        changed = false;
        for (const folder of folders) {
            const id = String(folder._id);
            if (folder.isLocked || visible.has(id))
                continue;
            const parentVisible = folder.parentFolder == null || visible.has(String(folder.parentFolder));
            if (parentVisible) {
                visible.add(id);
                changed = true;
            }
        }
    }
    const visibleIds = folders
        .filter((folder) => visible.has(String(folder._id)))
        .map((folder) => folder._id);
    return {
        folderFilter: {
            _id: { $in: visibleIds },
        },
        fileFilter: {
            isLocked: { $ne: true },
            parentFolder: { $in: [null, ...visibleIds] },
        },
    };
}
