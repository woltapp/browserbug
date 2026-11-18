import {
  type BrowserbugDescriptor,
  type ParseResult,
  comparators,
  multiComparators,
  parseBrowserbug,
} from './parser.js';
import { expect, describe, test } from 'vitest';
import fc from 'fast-check';
import browserslist from 'browserslist';

const knownBrowsers = Object.keys(browserslist.data);

describe('parser', () => {
  test('parses expected grammar correctly', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.array(
            fc
              .constantFrom(...knownBrowsers.filter((b) => b !== 'op_mini'))
              .chain((browser) => {
                const getVersionArbitrary = () =>
                  fc.constantFrom(
                    ...(browserslist.data[browser]?.versions ?? []).filter(
                      (version) => {
                        // We do not support the range versions right now, to
                        // avoid confusion with the between comparator. We
                        // also exclude various string versions, such as 'TP'
                        // (Technical Preview, which is a moving target) and
                        // 'all' (a special case that only applies to
                        // op_mini). This might all change in the future.
                        return (
                          !version.includes('-') &&
                          !version.includes('all') &&
                          !isNaN(parseFloat(version))
                        );
                      },
                    ),
                  );

                return fc.tuple(
                  fc.mixedCase(fc.constant(browser)),
                  fc
                    .constantFrom(...comparators)
                    .chain((comparator) =>
                      fc.tuple(
                        fc.constant(comparator),
                        multiComparators.includes(comparator as never)
                          ? fc.tuple(
                              getVersionArbitrary(),
                              getVersionArbitrary(),
                            )
                          : fc.tuple(getVersionArbitrary()),
                      ),
                    ),
                );
              }),
            { minLength: 1 }, // empty strings are invalid
          ),
          fc.option(
            fc.oneof(
              fc.string({ minLength: 1 }),
              fc.string({ unit: 'grapheme', minLength: 1 }),
            ),
          ),
        ),
        ([declarationData, comment]) => {
          const declarations = declarationData
            .map(
              ([browser, [comparator, versions]]) =>
                `${browser} ${comparator} ${versions.join(' ')}`,
            )
            .join(', ');

          const str = `@browserbug ${declarations}${comment && comment.length > 0 ? ` -- ${comment}` : ''}`;

          expect(parseBrowserbug(str, browserslist.data)).toEqual<ParseResult>({
            success: true,
            data: declarationData.map(
              ([browser, [comparator, version]]) =>
                ({
                  browser: browser.toLowerCase(),
                  comparator,
                  version: multiComparators.includes(comparator as never)
                    ? version.map(parseFloat)
                    : parseFloat(version[0]),
                }) as BrowserbugDescriptor,
            ),
          });
        },
      ),
    );
  });

  test('regressions of valid parses', () => {
    expect(
      parseBrowserbug(
        '@browserbug CHROME equal 120 -- Some bug here',
        browserslist.data,
      ),
    ).toEqual<ParseResult>({
      success: true,
      data: [
        {
          browser: 'chrome',
          version: 120,
          comparator: 'equal',
        },
      ],
    });
    expect(
      parseBrowserbug('@browserbug ios_saf lower-than 15.4', browserslist.data),
    ).toEqual<ParseResult>({
      success: true,
      data: [
        {
          browser: 'ios_saf',
          version: 15.4,
          comparator: 'lower-than',
        },
      ],
    });
  });

  test('it fails to parse invalid grammar', () => {
    expect(
      parseBrowserbug(
        '@browserbug chrome 120 -- Some bug here',
        browserslist.data,
      ),
    ).toHaveProperty('error');
  });

  describe('error locations', () => {
    const slice = (input: string, range: { start: number; end: number }) =>
      input.slice(range.start, range.end);

    test('syntax errors point at the offending token', () => {
      const input = '@browserbug chrome 120 -- Some bug here';
      const result = parseBrowserbug(input, browserslist.data);

      expect(result).toMatchObject({
        success: false,
        error: {
          kind: 'syntax',
          rightmostFailurePosition: 19,
          range: { start: 19, end: 22 },
          expected:
            'expected "between", "last-checked", "equal", "lower-than", "lower-than-or-equal", "lt", or "lte"',
        },
      });
      if (result.success || Array.isArray(result.error)) {
        throw new Error('expected a syntax error');
      }
      expect(slice(input, result.error.range)).toBe('120');
    });

    test('syntax errors at the end of the input have an empty range', () => {
      const input = '@browserbug chrome lower-than';
      const result = parseBrowserbug(input, browserslist.data);

      expect(result).toMatchObject({
        success: false,
        error: {
          kind: 'syntax',
          range: { start: input.length, end: input.length },
          expected: 'expected a number',
        },
      });
    });

    test('syntax errors in a later descriptor point past the earlier ones', () => {
      const input = '@browserbug chrome lt 120, firefox 130';
      const result = parseBrowserbug(input, browserslist.data);

      if (result.success || Array.isArray(result.error)) {
        throw new Error('expected a syntax error');
      }
      expect(slice(input, result.error.range)).toBe('130');
    });

    test('syntax error offsets span lines in a multi-line input', () => {
      const input = '@browserbug chrome lt 120,\n  firefox 130\n';
      const result = parseBrowserbug(input, browserslist.data);

      if (result.success || Array.isArray(result.error)) {
        throw new Error('expected a syntax error');
      }
      expect(result.error.range).toEqual({ start: 37, end: 40 });
      expect(slice(input, result.error.range)).toBe('130');
    });

    test('validation errors point at the unknown browser', () => {
      const input = '@browserbug chrome lt 120, notabrowser lt 3';
      const result = parseBrowserbug(input, browserslist.data);

      if (result.success || !Array.isArray(result.error)) {
        throw new Error('expected validation errors');
      }
      expect(result.error).toHaveLength(1);
      expect(result.error[0]).toMatchObject({ kind: 'validation' });
      expect(slice(input, result.error[0]!.range)).toBe('notabrowser');
    });

    test('validation errors point at the unknown version(s)', () => {
      const input =
        '@browserbug chrome lt 20000, safari between 14.9 15.4 -- reason';
      const result = parseBrowserbug(input, browserslist.data);

      if (result.success || !Array.isArray(result.error)) {
        throw new Error('expected validation errors');
      }
      expect(result.error.map((e) => slice(input, e.range))).toEqual([
        '20000',
        '14.9 15.4',
      ]);
    });
  });
});
