// "Der Mann unter der Laterne" (horror, part 1): Ben tells it himself; same engine and look as the moon short.
import { makeShort, calcStory } from "../mond/Mond";
import { shotAt } from "./shots";
import { Overlays } from "./Overlays";

export const MannShort = makeShort(shotAt, Overlays);
export const calcMann = calcStory("mann");
