import { cleanTag, mergeMetadata } from '../src/parse';
import type { IArticle, IArticleMetadata } from '../src/types';

describe('mergeMetadata', () => {
    it('should not contain duplicate tags', () => {
        const tagPrefix = 'slurp';

        const article: IArticle = {
            title: "fake page",
            content: "fake content",
            slurpedTime: new Date(),
            tags:  [
                {prefix: tagPrefix, tag: "moo"},
                {prefix: tagPrefix, tag: "mootoo"},
                {prefix: tagPrefix, tag: "mootoothree"},
            ] 
        };

        const metadata: IArticleMetadata = {
            slurpedTime: new Date(),
            tags: [
                {prefix: tagPrefix, tag: "moo"},
                {prefix: tagPrefix, tag: "mootoo"},
                {prefix: tagPrefix, tag: "mootoothree"},
            ] 
        };

        const result = mergeMetadata(article, metadata);

        expect(result.tags.length).toEqual(3);
    });
});

describe('cleanTag', () => {
    it('should replace invalid characters', () => {
        const strCase = "iKebab-case";
        expect(cleanTag("Cheese&Bacon", strCase)).toEqual("Cheese-and-Bacon");
        expect(cleanTag("C++",strCase)).toEqual("C");
        expect(cleanTag("Categories:Other", strCase)).toEqual("Categories/Other");
        expect(cleanTag("#hashtag", strCase)).toEqual("hashtag");
        expect(cleanTag("Why++would++you++write++it++like++this?", strCase)).toEqual("Why-would-you-write-it-like-this");
    });

    it('should update string case', () => {
        expect(cleanTag("Cheese&Bacon", "iKebab-case")).toEqual("Cheese-and-Bacon");
        expect(cleanTag("Cheese&Bacon", "PascalCase")).toEqual("CheeseAndBacon");
        expect(cleanTag("Cheese&Bacon", "camelCase")).toEqual("cheeseAndBacon");
        expect(cleanTag("Cheese&Bacon", "kebab-case")).toEqual("cheese-and-bacon");
        expect(cleanTag("Cheese&Bacon", "snake_case")).toEqual("cheese_and_bacon");
    });
})