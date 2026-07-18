import { cleanTag, cleanTitle, isEmpty, murmurhash3_32, parseOptionalBoolean, updateStringCase } from "../src/lib/util";

describe('isEmpty', () => {
    it.each([
        [undefined, true],
        [null, true],
        [false, true],
        [true, false],
        [0, true],
        [1, false],
        ['', true],
        ['  ', true],
        ['value', false],
        [[], true],
        [[1], false],
        [new Map(), false],
        [new Set(), false],
    ])('preserves the empty result for %p', (value, expected) => {
        expect(isEmpty(value)).toBe(expected);
    });
});

describe('murmurhash3_32', () => {
    it.each([
        ['', 0, 0],
        ['hello', 0, 613153351],
        ['foo', 0, 4138058784],
        ['Slurp', 0, 129849195],
        ['hello', 42, 3806057185],
    ])('hashes %p with seed %i', (value, seed, expected) => {
        expect(murmurhash3_32(value, seed)).toBe(expected);
    });
});

describe('parseOptionalBoolean', () => {
    it('should parse explicit boolean query parameters', () => {
        expect(parseOptionalBoolean('true')).toBe(true);
        expect(parseOptionalBoolean('false')).toBe(false);
    });

    it('should not override the setting for absent or invalid parameters', () => {
        expect(parseOptionalBoolean()).toBeUndefined();
        expect(parseOptionalBoolean('invalid')).toBeUndefined();
    });
});

describe('cleanTag', () => {
    it('should replace invalid characters', () => {
        const strCase = "iKebab-case";
        expect(cleanTag("Cheese&Bacon", strCase)).toEqual("Cheese-and-Bacon");
        expect(cleanTag("C++", strCase)).toEqual("C");
        expect(cleanTag("Categories:Other", strCase)).toEqual("Categories/Other");
        expect(cleanTag("#hashtag", strCase)).toEqual("hashtag");
        expect(cleanTag("Why++would++you++write++it++like++this?", strCase)).toEqual("Why-would-you-write-it-like-this");
    });
});

describe('cleanTitle', () => {
    it('should replace pipes and colons with hyphens', () => {
        expect(cleanTitle("OpenNeRF: Open Set 3D Neural Scene Segmentation"))
            .toEqual("OpenNeRF - Open Set 3D Neural Scene Segmentation");

        expect(cleanTitle("Local News | Botched home sale costs man his real estate license"))
            .toEqual("Local News - Botched home sale costs man his real estate license");

        expect(cleanTitle("Blog|Some Title")).toEqual("Blog - Some Title");

        expect(cleanTitle("Some Podcast #323")).toEqual("Some Podcast 323");
    })
});

describe('updateStringCase', () => {
    it('should update string case', () => {
        const str = "Cheese and Bacon";
        expect(updateStringCase(str, "iKebab-case")).toEqual("Cheese-and-Bacon");
        expect(updateStringCase(str, "PascalCase")).toEqual("CheeseAndBacon");
        expect(updateStringCase(str, "camelCase")).toEqual("cheeseAndBacon");
        expect(updateStringCase(str, "kebab-case")).toEqual("cheese-and-bacon");
        expect(updateStringCase(str, "snake_case")).toEqual("cheese_and_bacon");
    });
});
