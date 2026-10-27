import { escapeIdentifier } from 'pg'
import type { Client } from 'pg'
import { z } from 'zod'
import { TARGET_SCHEMA, SOURCE_SCHEMA } from '../db'
import { includeColumn, includeTable } from '../utils'

/** Check if the column is included in the target anonymized DB */
function columnIsIncluded<
  T extends { table_name: string; column_name: string }
>(row: T) {
  return includeColumn(row.table_name, row.column_name)
}

/** Order the table columns same as the source table in DB */
function orderColumns<T extends { ordinal_position: number }>(a: T, b: T) {
  return a.ordinal_position - b.ordinal_position
}

/** Queries for creating table and non anonymized columns with the correct DB types.
 *
 * No constraints are added at this step.
 * No column has data that is required or filled by default.
 */
const sqlCreateTableSchema = (
  tableName: string,
  rows:
    | {
        table_name: string
        column_name: string
        ordinal_position: number
        udt_name: string
      }[]
    | undefined
) =>
  `CREATE TABLE ${escapeIdentifier(TARGET_SCHEMA)}.${escapeIdentifier(tableName)} (${(
    rows || []
  )
    .filter(columnIsIncluded) // SECU: PII column deletion in schema
    .sort(orderColumns)

    .map(
      v => `${escapeIdentifier(v.column_name)} ${escapeIdentifier(v.udt_name)}`
    )
    .join(',')})`

/** Create SQL queries for tables schemas by introspecting the list of tables in the source database
 *
 * The columns names, types and order are preserved
 */
export async function createSQLQueriesForTablesSchemas(source: Client) {
  const querySchema = z.object({
    rows: z.array(
      z.object({
        table_name: z.string(),
        column_name: z.string(),
        ordinal_position: z.number(),
        udt_name: z.string()
      })
    )
  })
  const res = await source.query(
    `select table_name,column_name,ordinal_position,udt_name from information_schema.columns where table_schema = $1;`,
    [SOURCE_SCHEMA]
  )

  const validated = querySchema.safeParse(res)
  if (validated.success === false) {
    throw new Error(
      'createSQLQueriesForTablesSchemas: wrong schema for request result'
    )
  }

  const enumData = Object.groupBy(
    validated.data.rows,
    ({ table_name }) => table_name
  )

  const output = Object.entries(enumData)
    .filter(([name, rows]) => includeTable(name) && Boolean(rows?.length)) // SECU: Filter out sensitive tables
    .map(([name, rows]) => sqlCreateTableSchema(name, rows))

  return output
}
