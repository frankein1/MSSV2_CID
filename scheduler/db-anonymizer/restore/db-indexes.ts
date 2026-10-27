import { escapeIdentifier, type Client } from 'pg'
import { z } from 'zod'
import { SOURCE_SCHEMA, TARGET_SCHEMA } from '../db'
import { includeColumn, includeTable } from '../utils'

/** Index definition can be directly applied. Only schema name needs to be updated */
const sqlCreateIndex = (row: { indexdef: string }) =>
  row.indexdef.replaceAll(`ON ${SOURCE_SCHEMA}.`, `ON ${TARGET_SCHEMA}.`)

export async function createSQLQueriesForIndexes(source: Client) {
  const querySchema = z.object({
    rows: z.array(
      z.object({
        tablename: z.string(),
        indexdef: z.string(),
        columns: z.array(z.string())
      })
    )
  })

  // Recreate every index of the schema (primary keys, unique and plain
  // performance indexes).
  // `columns` lists the index key columns (pg_index.indkey).
  // Edge case for partial indexes: columns that appear only in the WHERE clause (stored in indpred) aren't in indkey either.
  // They won't be listed.
  const res = await source.query(
    `SELECT i.tablename, i.indexdef,
      ARRAY(
        SELECT a.attname::text
        FROM unnest(ix.indkey) AS k(attnum)
        JOIN pg_attribute a ON a.attrelid = ix.indrelid AND a.attnum = k.attnum
      ) AS columns
    FROM pg_indexes i
    JOIN pg_namespace n ON n.nspname = i.schemaname
    JOIN pg_class ic ON ic.relname = i.indexname AND ic.relnamespace = n.oid
    JOIN pg_index ix ON ix.indexrelid = ic.oid
    WHERE i.schemaname = $1`,
    [SOURCE_SCHEMA]
  )

  const validated = querySchema.safeParse(res)
  if (validated.success === false) {
    throw new Error(
      'createSQLQueriesForIndexes: wrong schema for request result'
    )
  }

  // Filter out an index on an excluded table or on a dropped PII
  // column (e.g. user.email) cannot be built and is skipped.
  const output = validated.data.rows
    .filter(
      ({ tablename, columns }) =>
        includeTable(tablename) &&
        columns.every(column => includeColumn(tablename, column))
    )
    .map(sqlCreateIndex)

  return output
}

const sqlCreateForeignKey = (row: {
  tablename: string
  conname: string
  condef: string
}) => {
  // Adapt the foreign key definition to use the table in the target schema:
  // FOREIGN KEY (<column>) REFERENCES "<table>"(<target_column>) --> FOREIGN KEY (<column>) REFERENCES "<TARGET_SCHEMA>"."<table>"(<target_column>)
  const targetSchemaConstraintDef = row.condef.replace(
    'REFERENCES ',
    `REFERENCES ${escapeIdentifier(TARGET_SCHEMA)}.`
  )
  return `ALTER TABLE ${escapeIdentifier(TARGET_SCHEMA)}.${escapeIdentifier(row.tablename)} ADD CONSTRAINT ${escapeIdentifier(row.conname)} ${targetSchemaConstraintDef}`
}

export async function createSQLQueriesForForeignKeys(source: Client) {
  const querySchema = z.object({
    rows: z.array(
      z.object({
        tablename: z.string(),
        reftable: z.string(),
        conname: z.string(),
        condef: z.string()
      })
    )
  })

  // Filter on  FOREIGN KEY
  // HYPOTHESIS, no PII are indexed
  const res = await source.query(
    `SELECT tc.relname AS tablename, rc.relname AS reftable, pc.conname,
      pg_get_constraintdef(pc.oid) AS condef
    FROM pg_constraint pc
    JOIN pg_catalog.pg_namespace nsp ON nsp.oid = pc.connamespace
    JOIN pg_catalog.pg_class tc ON tc.oid = pc.conrelid
    JOIN pg_catalog.pg_class rc ON rc.oid = pc.confrelid
    WHERE nsp.nspname = $1 AND pc.contype = 'f'`,
    [SOURCE_SCHEMA]
  )

  const validated = querySchema.safeParse(res)
  if (validated.success === false) {
    throw new Error(
      'createSQLQueriesForForeignKeys: wrong schema for request result'
    )
  }

  // Both ends must be kept: a foreign key to an excluded table (e.g. comment) cannot be built
  const output = validated.data.rows
    .filter(
      ({ tablename, reftable }) =>
        includeTable(tablename) && includeTable(reftable)
    )
    .map(sqlCreateForeignKey)

  return output
}
