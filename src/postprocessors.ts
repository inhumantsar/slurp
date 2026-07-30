import { parseDocument } from "yaml";
import { createFrontMatter } from "./frontmatter";
import { getFirstImageDestination, saveImagesLocally } from "./lib/images";
import { logger } from "./lib/logger";
import type { IPostProcessor, IPostProcessorContext } from "./types";

export async function runPostProcessors(
    markdown: string,
    processors: readonly IPostProcessor[],
    context: IPostProcessorContext,
): Promise<string> {
    let result = markdown;
    for (const processor of processors) {
        logger().debug("running post-processor", processor.id);
        result = await processor.process(result, context);
    }
    return result;
}

const FRONTMATTER_OPEN = "---\n";
const FRONTMATTER_CLOSE = "\n---\n";

const setBannerFrontMatter = (markdown: string, banner: string | undefined): string => {
    if (banner === undefined || !markdown.startsWith(FRONTMATTER_OPEN)) return markdown;
    const frontMatterEnd = markdown.indexOf(FRONTMATTER_CLOSE, FRONTMATTER_OPEN.length);
    if (frontMatterEnd === -1) return markdown;

    const document = parseDocument(markdown.slice(FRONTMATTER_OPEN.length, frontMatterEnd));
    if (document.errors.length > 0) {
        logger().warn("Unable to set banner because the generated frontmatter is invalid.", document.errors);
        return markdown;
    }
    document.set("banner", banner);
    return `${FRONTMATTER_OPEN}${document.toString().trim()}${markdown.slice(frontMatterEnd)}`;
};

export const DEFAULT_POST_PROCESSORS: readonly IPostProcessor[] = [
    {
        id: "create-frontmatter",
        process: (markdown, context) => {
            const frontMatter = createFrontMatter(
                context.article,
                context.plugin.fmProps,
                context.plugin.settings.fm.includeEmpty,
            );
            logger().debug("created frontmatter", frontMatter);
            return `---\n${frontMatter}\n---\n\n${markdown}`;
        },
    },
    {
        id: "save-images-locally",
        process: (markdown, context) => context.plugin.settings.images.saveLocally
            ? saveImagesLocally(markdown, context)
            : markdown,
    },
    {
        id: "set-banner-frontmatter",
        process: (markdown, context) => context.plugin.settings.images.setBanner
            ? setBannerFrontMatter(markdown, getFirstImageDestination(markdown))
            : markdown,
    },
];
