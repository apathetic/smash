/**
 * Set's the World's gravity
 */
const GRAVITY = -9.81;


/**
 * Number of solver iterations for the physics engine.
 * Higher values = more accurate physics, but slower performance.
 */
const NUM_SOLVER_ITERATIONS = 20;


/**
 * Solid Smash Session State Storage
 */
const SESSION_STORAGE_KEY = 'sssss';


/**
 * Collision system
 * In Rapier, a Collision Group is a 32-bit integer composed of two 16-bit halves:
 * [16-bit Membership (What I am)] | [16-bit Filter (What I collide with)]
 */

// 1. Memberships (What am I?)
const MEMBERSHIP_STATIC  = 0x0001;
const MEMBERSHIP_DYNAMIC = 0x0002;
const MEMBERSHIP_ALL     = 0xFFFF; // Wildcard: matches everything

// 2. Filters (What do I collide with?)
const FILTER_ALL          = MEMBERSHIP_STATIC | MEMBERSHIP_DYNAMIC;
const FILTER_ONLY_DYNAMIC = MEMBERSHIP_DYNAMIC;

// 3. Final 32-bit Collision Groups: (Membership << 16) | Filter
const COLLISION_GROUP_STATIC      = (MEMBERSHIP_STATIC << 16) | FILTER_ALL;
const COLLISION_GROUP_DYNAMIC     = (MEMBERSHIP_DYNAMIC << 16) | FILTER_ALL;
const COLLISION_GROUP_RAY_DYNAMIC = (MEMBERSHIP_ALL << 16)    | FILTER_ONLY_DYNAMIC;


export {
  GRAVITY,
  SESSION_STORAGE_KEY,
  NUM_SOLVER_ITERATIONS,
  COLLISION_GROUP_STATIC,
  COLLISION_GROUP_DYNAMIC,
  COLLISION_GROUP_RAY_DYNAMIC,
};
