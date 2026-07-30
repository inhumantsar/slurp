import { saveImagesLocally } from "./lib/images";
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

export const DEFAULT_POST_PROCESSORS: readonly IPostProcessor[] = [
    {
        id: "create-frontmatter",
        process: (markdown, context) => {
            const frontMatter = context.createFrontMatter();
            logger().debug("created frontmatter", frontMatter);
            return `---\n${frontMatter}\n---\n\n${markdown}`;
        },
    },
    {
        id: "save-images-locally",
        process: (markdown, context) => context.settings.images.saveLocally
            ? saveImagesLocally(markdown, context)
            : markdown,
    },
];
