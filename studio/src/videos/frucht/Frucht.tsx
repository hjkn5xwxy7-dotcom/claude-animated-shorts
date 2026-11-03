// "Die Erdbeere bekam ein Video aus der Zukunft" (fruit drama, part 1), same engine as the other shorts.
import { makeShort, calcStory } from "../mond/Mond";
import { shotAt } from "./shots";
import { Overlays } from "./Overlays";

export const FruchtShort = makeShort(shotAt, Overlays);
export const calcFrucht = calcStory("frucht");
