
/**
 * Analyzes impact data to provide insights about damage
 */
export function analyzeDamage(impacts: Impact[]) {
  if (!impacts || impacts.length === 0) {
    return {
      totalDamage: 0,
      worstHit: null,
      bodyPartDamage: {},
      damageOverTime: []
    };
  }

  // Find the worst hit
  const worstHit = impacts.reduce((worst, current) =>
    current.force > worst.force ? current : worst, impacts[0]);

  // Calculate damage per body part
  const bodyPartDamage = impacts.reduce((acc, impact) => {
    const part = impact.bodyPart;
    if (!acc[part]) acc[part] = 0;
    acc[part] += impact.force;
    return acc;
  }, {} as Record<string, number>);

  // Calculate total damage
  const totalDamage = impacts.reduce((sum, impact) => sum + impact.force, 0);

  // Group impacts by time (in 1-second intervals)
  const damageOverTime = impacts.reduce((acc, impact) => {
    const timeKey = Math.floor(impact.timestamp / 1000);
    if (!acc[timeKey]) acc[timeKey] = 0;
    acc[timeKey] += impact.force;
    return acc;
  }, {} as Record<number, number>);

  // Convert to array format for easier charting
  const damageTimeline = Object.keys(damageOverTime).map(time => ({
    time: parseInt(time),
    damage: damageOverTime[parseInt(time)]
  })).sort((a, b) => a.time - b.time);

  return {
    totalDamage,
    worstHit,
    bodyPartDamage,
    damageOverTime: damageTimeline
  };
}

/**
 * Returns a "health percentage" based on accumulated damage
 */
export function calculateHealth(totalDamage: number) {
  // Define a threshold where health would reach zero
  const maxDamageThreshold = 100;

  // Calculate health percentage
  const healthPercentage = Math.max(0, 100 - (totalDamage / maxDamageThreshold * 100));

  return healthPercentage;
}