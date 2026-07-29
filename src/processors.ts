import { logger } from "./lib/logger";
import { convertMathDelimiters } from "./parse";
import type { ISlurpProcessor, ISlurpProcessorContext, ISlurpProcessors } from "./types";

export async function runSlurpProcessors<T>(
	value: T,
	processors: readonly ISlurpProcessor<T>[],
	context: ISlurpProcessorContext,
): Promise<T> {
	let result = value;
	for (const processor of processors) {
		logger().debug("running pipeline processor", processor.id);
		result = await processor.process(result, context);
	}
	return result;
}

export const DEFAULT_SLURP_PROCESSORS: ISlurpProcessors = {
	document: [],
	article: [],
	markdown: [
		{
			id: "convert-math-delimiters",
			process: (markdown: string, _context: ISlurpProcessorContext): string =>
				convertMathDelimiters(markdown),
		},
	],
};
