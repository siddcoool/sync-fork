/**
 * Import Maintainer before Repo so populate("maintainerId") works in serverless
 * bundles where models may load in separate chunks.
 */
import { Maintainer } from "./maintainer";
import { Repo } from "./repo";

export { Maintainer, Repo };
