// Strip private fields before records go out through public (no-login) APIs.

/** A player as anyone may see it: no phone, login id or old-site import data. */
export function publicPlayer(p: any) {
  if (!p) return p;
  const { phone, userId, legacy, ...rest } = p;
  return rest;
}

/** A club as anyone may see it: no contact email, staff list or old-site import data. */
export function publicClub(c: any) {
  if (!c) return c;
  const { email, staff, legacy, ...rest } = c;
  if (Array.isArray(rest.squad)) rest.squad = rest.squad.map(publicPlayer);
  return rest;
}
