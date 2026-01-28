const GRAVITY = -9.81;


// Collision Groups

// Interaction groups are 32-bit integers.
// high 16 bits = membership (what I am)
// low 16 bits = filter (what I collide with)
const GROUPS = {
  STATIC:  0x00010000,
  DYNAMIC: 0x00020000,
  DRAGGED: 0x00040000,
}

// Static things collide with everything.
// Filter 0x0007 = 0001 (Static) | 0010 (Dynamic) | 0100 (Dragged)
const COLLISION_GROUP_STATIC = GROUPS.STATIC | 0x0007;

// Dynamic things collide with everything.
// Filter 0x0007 = 0001 (Static) | 0010 (Dynamic) | 0100 (Dragged)
const COLLISION_GROUP_DYNAMIC = GROUPS.DYNAMIC | 0x0007;

// Dragged things collide with everything.
// Filter 0x0007 = 0001 (Static) | 0010 (Dynamic) | 0100 (Dragged)
const COLLISION_GROUP_DRAGGED = GROUPS.DRAGGED | 0x0007;

// Drag Proxy handle should collide with Static & Dynamic, but NOT Dragged (itself)
const COLLISION_GROUP_DRAG_PROXY = GROUPS.DRAGGED | 0x0003;

export {
  GRAVITY,
  COLLISION_GROUP_STATIC,
  COLLISION_GROUP_DYNAMIC,
  COLLISION_GROUP_DRAGGED,
  COLLISION_GROUP_DRAG_PROXY,
};
