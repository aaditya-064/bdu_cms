import Folder from "../models/folder.model";
import { Role } from "../types/enum.types";

export async function documentScope(role: Role) {
  if (role === Role.ADMIN || role === Role.DIRECTOR) {
    return {
      folderFilter: {},
      fileFilter: {},
    };
  }

  const folders = await Folder.find({ deletedAt: null })
    .select("_id parentFolder isLocked")
    .lean();

  const visible = new Set<string>();

  // A folder is visible only if it is unlocked and its entire
  // parent chain is visible. Broken/circular chains stay hidden.
  let changed = true;

  while (changed) {
    changed = false;

    for (const folder of folders) {
      const id = String(folder._id);

      if (folder.isLocked || visible.has(id)) continue;

      const parentVisible =
        folder.parentFolder == null || visible.has(String(folder.parentFolder));

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
