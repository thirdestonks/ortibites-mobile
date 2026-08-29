// Geometry for the metro spine. The rail is owned by the home screen and runs
// unbroken behind every station, so these values have to agree across
// SpineRail (draws the track), StationSection (places the pin), and TrackEnd.

/** Centre line of the rail, measured from the left edge of the spine column. */
export const RAIL_X = 16;
/** Track thickness. */
export const RAIL_W = 4;
/** Diameter of a station pin. */
export const NODE = 36;
/** Where station labels and cards begin, clear of the pin. */
export const GUTTER = 46;

/**
 * The train keeps a constant apparent speed regardless of how many stations
 * are on the line: a longer spine simply takes longer to traverse. Clamped so
 * a one-station line still reads as a journey and a huge line never crawls.
 *
 * The run loops with no pause, so this is paced slower than a one-shot sweep
 * would be — a train that reappears immediately should not also be hurrying.
 */
export function travelDuration(spineHeight: number): number {
  return Math.min(18000, Math.max(3400, spineHeight * 2.6));
}
