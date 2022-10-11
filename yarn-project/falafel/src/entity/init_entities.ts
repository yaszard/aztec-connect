// Default to sqlite.
let db: SupportedDb = 'sqlite';

// It's a bit weird exporting the configurator from here, but we must ensure we initEntities before importing entities.
import { Configurator } from '../configurator.js';
export const configurator = new Configurator();
initEntities(configurator.getConfVars().dbUrl);

export type SupportedDb = 'mysql' | 'postgres' | 'sqlite';

export function bufferColumn(opts: any = {}): [any, any] {
  switch (db) {
    case 'mysql':
      if (opts.length) {
        return ['binary', opts];
      } else {
        return ['blob', opts];
      }
    case 'postgres':
      return ['bytea', { ...opts, length: undefined }];
    case 'sqlite':
      return ['blob', { ...opts, length: undefined }];
  }
}

/**
 * Before we import any of the db entities (which can be imported by any other file), we need to flag which database
 * we're using so the correct column types will be used. TypeORM seemingly decided projects would only ever want to
 * interact with one type of database, so we have to do this awkward stuff with Buffer types...
 */
function initEntities(dbUrl?: string) {
  if (dbUrl) {
    const url = new URL(dbUrl);
    db = url.protocol.slice(0, -1) as SupportedDb;
  }
}
