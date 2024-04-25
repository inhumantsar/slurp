
/**
 * Calculates the Damerau-Levenshtein (aka Optimal String Alignment) Distance
 * between two strings. The Damerau-Levenshtein Distance is a measure of the
 * similarity between two strings, defined as the minimum number of edits
 * (insertions, deletions, substitutions, and transpositions) required to
 * transform one string into the other.
 *
 * @param strA - The first string.
 * @param strB - The second string.
 * @returns The Damerau-Levenshtein Distance (a positive whole number) between the two strings.
 */
export const damerauLevenshtein = (strA: string, strB: string): number => {
    // this is an implementation of the Damerau-Levenshtein (aka Optimal String Alignment) 
    // Distance algorithm for string similarity. it takes two strings and calculates the minimum 
    // number of edits it would take for one to match the other. it's not the most useful or 
    // performant option for this kind of fuzzy matching, but it works and is easy enough to
    // reason about.
    //
    // could i have used a library with a better algo instead of implementing this myself? 
    // of course! but this was more fun :)  

    // the strings are mapped to mapped to matrix locations 1..n, so to make things
    // easier to reason about, we can create new arrays which start with null
    const a = [null, ...Array.from(strA.toLowerCase())];
    const b = [null, ...Array.from(strB.toLowerCase())];

    // init a matrix the size of a and b to hold the edit distances
    const d = new Array(a.length).fill(null).map(() => Array(b.length).fill(Number.POSITIVE_INFINITY));

    // the first row and column represent distances between the ith character
    // of each word and its first letter.
    //     t o o t h r e e  
    //   0 1 2 3 4 5 6 7 8
    // m 1
    // o 2
    // 0 3
    for (let i = 0; i < a.length; i++) {
        d[i][0] = i;
    }
    for (let i = 0; i < b.length; i++) {
        d[0][i] = i;
    }

    // loop through the matrix (remember that row/col 0 is ignored since it represents a state when
    // both strings are empty) and calculate the cost of each supported operation. 
    for (let i = 1; i < a.length; i++) {
        for (let j = 1; j < b.length; j++) {
            const subCost = a[i] === b[j] ? 0 : 1;

            d[i][j] = Math.min(
                // deletion: 1 for the delete itself, plus the distance from one row back, since the prefix from `a` 
                // up to the deleted character hasn't changed.
                d[i - 1][j] + 1,

                // insertion: 1 for the insert itself, plus the distance from one col back, since we're adding a character 
                // to `a` in order to remain a compatible prefix of `b`.
                d[i][j - 1] + 1,

                // substitution: the distance from one diagonal move back, since it transforms both the prefix of `a` 
                // and the prefix of `b`. the operation cost can be 0 in this case though if both `a` and `b` have the 
                // same character in the same position.
                d[i - 1][j - 1] + subCost);

            // transposition: if the current character in `a` can be swapped with the previous letter of `b` and vice versa, then
            //   the new distance is equal to the distance of the current prefixes, minus the last two characters, plus 1 for the op itself. 
            if (i > 1 && j > 1 && a[i - 1] === b[j] && a[i] === b[j - 1])
                d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        }
    }

    //     t o o t h r e e 
    //   0 1 2 3 4 5 6 7 8
    // m 1 1 2 3 4 5 6 7 8
    // o 2 2 1 2 3 4 5 6 7
    // o 3 3 2 1 2 3 4 5 6 <-- d
    // 
    // the result, d = 6, means it would take at least 6 edits to get from "moo" to "toothree" 
    // or vice versa: substitute "m" for "t" plus append x5 (t-h-r-e-e)
    return d[a.length - 1][b.length - 1];
};