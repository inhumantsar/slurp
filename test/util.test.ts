import { cleanTag, cleanTitle, updateStringCase } from "../src/lib/util";

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

