import { CONFIG } from './config'
import type { TableName } from './config'

export const includeTable = (name: string) => Object.keys(CONFIG).includes(name)

/** Check if the column is kept in the target anonymized DB (PII columns are not) */
export const includeColumn = (tableName: string, columnName: string) =>
  includeTable(tableName) &&
  // @ts-expect-error Because of typescript rule noUncheckedIndexedAccess and columnName is not typed, accessing columnName gives a ts error
  Boolean(CONFIG[tableName as TableName][columnName])

/** List of columns names that are kept in the target table (removing PII columns) */
export const getFilteredColumnNames = (tableName: TableName) =>
  Object.keys(CONFIG[tableName]).filter(columnName => {
    // @ts-expect-error Because of typescript rule noUncheckedIndexedAccess and columnName is not typed, accessing columnName gives a ts error
    return CONFIG[tableName][columnName]
  })

export const getCsvFilename = (tableName: TableName) => `/tmp/${tableName}.csv`

// See https://typescriptpro.com/challenges/medium/kebabcase
export type SnakeCase<S extends string> =
  S extends `${infer Letter}${infer Rest}`
    ? Rest extends Uncapitalize<Rest>
      ? `${Uncapitalize<Letter>}${SnakeCase<Rest>}`
      : `${Uncapitalize<Letter>}_${SnakeCase<Rest>}`
    : S
