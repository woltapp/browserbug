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
              fc.unicodeString({ minLength: 1 }),
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
});
