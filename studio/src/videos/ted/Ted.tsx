// "Ich hieß Ted" (true crime, part 1): Ted Bundy's own account, same engine and look as the other shorts.
import { makeShort, calcStory } from "../mond/Mond";
import { shotAt } from "./shots";
import { Overlays } from "./Overlays";

export const TedShort = makeShort(shotAt, Overlays);
export const calcTed = calcStory("ted");
