import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

const code = readFileSync(new URL('../google-sheets/Code.gs', import.meta.url), 'utf8');

function runDoGet(failAt?: string) {
  const logs: string[] = [];
  const snapshot = JSON.stringify({ version: '17', masjids: [] });
  let stored = snapshot;
  let responseCalls = 0;
  const properties = {
    getProperty: () => stored,
    setProperty: (_key: string, value: string) => {
      if (failAt === 'LAST_VALID_DATASET.setProperty') throw new Error('SECRET_VALUE_MUST_NOT_BE_LOGGED');
      stored = value;
    },
  };
  const context: Record<string, unknown> = {
    PropertiesService: { getScriptProperties: () => properties },
    console: { error: (message: string) => logs.push(message), log: () => undefined },
  };

  runInNewContext(code, context);
  context.buildDataset_ = () => {
    if (failAt === 'buildDataset_') throw new Error('Duplicate masjid id in Masjids.');
    return { version: '18', masjids: [] };
  };
  context.json_ = (value: unknown) => {
    responseCalls += 1;
    if (failAt === 'response construction' && responseCalls === 1) {
      throw new Error('SECRET_VALUE_MUST_NOT_BE_LOGGED');
    }
    return value;
  };
  if (failAt === 'JSON.stringify') {
    context.JSON = {
      stringify: () => { throw new Error('SECRET_VALUE_MUST_NOT_BE_LOGGED'); },
      parse: JSON.parse,
    };
  }

  return { response: (context.doGet as () => unknown)(), logs, stored };
}

describe('Apps Script doGet diagnostics', () => {
  it.each([
    ['buildDataset_', 'buildDataset_', 'DUPLICATE_MASJID_ID'],
    ['JSON.stringify', 'JSON.stringify', 'SERIALIZATION_ERROR'],
    ['LAST_VALID_DATASET.setProperty', 'LAST_VALID_DATASET.setProperty', 'SCRIPT_PROPERTY_WRITE_ERROR'],
    ['response construction', 'response construction', 'RESPONSE_CONSTRUCTION_ERROR'],
  ])('logs a safe stage and category when %s fails', (failAt, stage, category) => {
    const { response, logs } = runDoGet(failAt);

    expect(logs).toEqual([`SaffReady publisher failure stage=${stage} category=${category}`]);
    expect(logs.join(' ')).not.toContain('SECRET_VALUE_MUST_NOT_BE_LOGGED');
    expect(response).toMatchObject({
      version: failAt === 'response construction' ? '18' : '17',
      sourceStale: true,
    });
  });

  it('keeps the normal success response and snapshot write behavior', () => {
    const { response, logs, stored } = runDoGet();

    expect(response).toMatchObject({ version: '18', sourceStale: false });
    expect(JSON.parse(stored)).toMatchObject({ version: '18', masjids: [] });
    expect(logs).toEqual([]);
  });
});
