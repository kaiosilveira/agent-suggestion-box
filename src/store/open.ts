import type { Config } from "../config.js";
import { FileStore } from "./file-store.js";
import type { SuggestionStore } from "./store.js";

/** The store the configuration names. A new store adds a case here. */
export function openStore(config: Config): SuggestionStore {
  switch (config.store) {
    case "file":
      return new FileStore(config.file.path);
  }
}
