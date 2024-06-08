import { mergeMetadata } from '../src/parse';
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
