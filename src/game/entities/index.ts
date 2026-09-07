import { Cube } from '~/game/entities/Cube';
import { Truck } from '~/game/entities/Truck';
import { Rocket } from '~/game/entities/Rocket';

/**
 * All dynamic Entities
 *  - the environment (Floor, Terrain, Wall) is absent b/c is placed by a level.
 *  - the ragdoll is also absent, which is loaded once under a fixed id.
 */
const ENTITIES = {
  Cube,
  Truck,
  Rocket
};

type EntityName = keyof typeof ENTITIES;

export { ENTITIES };
export type { EntityName };
