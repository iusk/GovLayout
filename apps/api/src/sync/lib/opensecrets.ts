/**
 * OpenSecrets *website* link helpers. The OpenSecrets API is retired, but the
 * opensecrets.org site is alive — we deep-link each member to their profile.
 *
 * Without the legacy API we can't get a member's OpenSecrets CID, so we link to
 * the site search for the member's name, which lands the user on (or one click
 * from) their profile. This keeps the requirement's "click -> OpenSecrets"
 * behavior working with a stable, real URL.
 */

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** A working opensecrets.org URL for a member, by name. */
export function opensecretsUrl(fullName: string): string {
  return `https://www.opensecrets.org/search?q=${encodeURIComponent(fullName)}&type=donors`;
}
