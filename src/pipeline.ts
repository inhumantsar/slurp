import { logger } from './lib/logger';
import { fetchHtml, mergeMetadata, parseHtml, parseMarkdown, parseMetadata, parsePage } from './parse';
import { runSlurpProcessors } from './processors';
import type { IArticle, ISlurpPipelineOptions } from './types';

export async function slurpPipeline(
	url: string,
	options: ISlurpPipelineOptions,
): Promise<IArticle> {
	const { fmProps, tagSettings, frontmatterOnly, processors } = options;
	const log = logger();
	const context = { url };
	log.debug("slurping", { url });

	const doc = parseHtml(await fetchHtml(url));
	const processedDoc = await runSlurpProcessors(doc, processors.document, context);

	const article: IArticle = {
		slurpedTime: new Date(),
		tags: [],
		...parsePage(processedDoc)
	};
	log.debug("parsed page", article);

	const parsedMetadata = parseMetadata(processedDoc, fmProps, tagSettings.prefix, tagSettings.case);
	log.debug("parsed metadata", parsedMetadata);

	const mergedMetadata = mergeMetadata(article, parsedMetadata);
	log.debug("merged metadata", parsedMetadata);

	let resultArticle: IArticle = { ...mergedMetadata, link: url };
	resultArticle = await runSlurpProcessors(resultArticle, processors.article, context);

	if (frontmatterOnly) {
		return { ...resultArticle, content: "" };
	}

	const md = parseMarkdown(resultArticle.content);
	log.debug("converted page to markdown", md);

	const finalMd = await runSlurpProcessors(md, processors.markdown, context);
	log.debug("ran markdown processors", finalMd);

	return { ...resultArticle, content: finalMd };
}
