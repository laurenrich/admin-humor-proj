/**
 * Staging DB audit columns (profiles.id for the acting user).
 * created_datetime_utc / modified_datetime_utc are expected to be set by the database.
 */
export function insertAuditFields(profileId: string) {
  return {
    created_by_user_id: profileId,
    modified_by_user_id: profileId,
  } as const;
}

export function updateAuditFields(profileId: string) {
  return {
    modified_by_user_id: profileId,
  } as const;
}
