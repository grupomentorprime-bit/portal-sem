import { sameCongressChurch } from "@/core/congress/church-name";
import type { CongressRegistration } from "@/core/congress/types";

export type CongressLeadershipPatch = {
  isChurchGroupLeader?: boolean;
  isZoneLeader?: boolean;
};

/** IDs a los que hay que quitar líder de iglesia al promover a `next`. */
export function churchLeadersToClear(input: {
  next: Pick<CongressRegistration, "_id" | "zoneId" | "churchName">;
  registrations: Array<
    Pick<
      CongressRegistration,
      "_id" | "zoneId" | "churchName" | "isChurchGroupLeader"
    >
  >;
}): string[] {
  return input.registrations
    .filter(
      (r) =>
        r._id !== input.next._id &&
        r.isChurchGroupLeader === true &&
        r.zoneId === input.next.zoneId &&
        sameCongressChurch(r.churchName, input.next.churchName)
    )
    .map((r) => r._id);
}

/** IDs a los que hay que quitar jefe zonal al promover a `next`. */
export function zoneLeadersToClear(input: {
  next: Pick<CongressRegistration, "_id" | "zoneId">;
  registrations: Array<
    Pick<CongressRegistration, "_id" | "zoneId" | "isZoneLeader">
  >;
}): string[] {
  return input.registrations
    .filter(
      (r) =>
        r._id !== input.next._id &&
        r.isZoneLeader === true &&
        r.zoneId === input.next.zoneId
    )
    .map((r) => r._id);
}
