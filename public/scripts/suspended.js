import { lazyGetID } from "./master.js";

const unbanTime = Number(lazyGetID("unbanTime").innerHTML);

lazyGetID("unbanTime").innerHTML = new Date(unbanTime).toLocaleString();
