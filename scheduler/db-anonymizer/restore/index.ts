import { escapeIdentifier } from 'pg'
import type { Client } from 'pg'
import { ANONYMIZED_DATABASE_URL, TARGET_SCHEMA } from '../db'
import { createSQLQueriesForEnums } from './enum'
import { createSQLQueriesForTablesSchemas } from './table-schema'
import { restoreAnonymizedDataWithPsql } from './table-data'
import {
  createSQLQueriesForForeignKeys,
  createSQLQueriesForIndexes
} from './db-indexes'

export interface Queries {
  enums: string[]
  schema: string[]
  indexes: string[]
  foreignKeys: string[]
}

/**
 * SQL Queries to restore source database structure to anonymized target database.
 * 1. Create SQL queries for all enums
 * 2. Create SQL queries for table schemas
 * 3. Create SQL queries to read table data from anonymized csv dumps and restore it to target db
 * 4. CreateSQL queries for restoring indexes (only primary keys and foreign keys)
 */
export async function createQueriesForTargetDatabaseSchema(
  source: Client
): Promise<Queries> {
  const enums = await createSQLQueriesForEnums(source)

  const schema = await createSQLQueriesForTablesSchemas(source)

  const indexes = await createSQLQueriesForIndexes(source)

  const foreignKeys = await createSQLQueriesForForeignKeys(source)

  return {
    enums,
    schema,
    indexes,
    foreignKeys
  }
}

/**
 * Execute queries to restore database schema and anonymized data to target db.
 *
 * Data restored:
 * - enums
 * - table structure (columns with db types)
 * - table data
 * - primary keys and foreign keys for selected tables
 */
export async function createDatabaseSchemaAndRestoreDataToTarget(
  target: Client,
  q: Queries
) {
  // Column types are written without schema (e.g. "BeneficiaryContractType"), so PostgreSQL
  // resolves them through search_path, which defaults to public. Without SET LOCAL search_path TO, target tables
  // would use the source enums instead of the copies created just above, and any migration
  // dropping or recreating a public enum would fail on the dependency.
  // - LOCAL: only applies until COMMIT, the rest of the job uses qualified table names
  // - built-in types (uuid, text…) still resolve, pg_catalog is always searched first
  // - enum array types (e.g. "_BeneficiaryActivityStatus") are created in the same schema as their enum
  // - in production the target schema is public, so behavior is unchanged
  await target.query(
    `BEGIN;SET LOCAL search_path TO ${escapeIdentifier(TARGET_SCHEMA)};${q.enums.join(';\n')};${q.schema.join(';\n')};COMMIT;`
  )

  await restoreAnonymizedDataWithPsql(ANONYMIZED_DATABASE_URL as string)

  await target.query(`BEGIN;${q.indexes.join(';\n')};COMMIT;`)

  // Foreign keys are useful for metabase auto joins
  // See https://www.metabase.com/docs/latest/databases/sync-scan#how-database-syncs-work
  for (const query of q.foreignKeys) {
    try {
      await target.query(`${query};`)
    } catch (e: unknown) {
      console.error(`foreign key restore: ${e}`)
    }
  }
}
