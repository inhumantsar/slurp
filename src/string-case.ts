export const STRING_CASES = ["camelCase", "PascalCase", "snake_case", "kebab-case", "iKebab-case"] as const;
export const StringCaseOptions: Record<StringCase, StringCase> = STRING_CASES.reduce((acc, cur) => {
    acc[cur] = cur;
    return acc;
}, {} as Record<StringCase, StringCase>);
export type StringCase = typeof STRING_CASES[number];
