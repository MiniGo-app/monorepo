import { phraseBackend } from "./phraseBackend";
import { createPhraseStore } from "./phraseStoreCore";

export const phraseStore = createPhraseStore(phraseBackend);
