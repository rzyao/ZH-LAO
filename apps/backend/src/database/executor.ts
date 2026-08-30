import type { QueryResult, QueryResultRow } from 'pg';

export interface DatabaseExecutor {
  query<Row extends QueryResultRow = QueryResultRow>(text: string, values?: readonly unknown[]): Promise<QueryResult<Row>>;
}
