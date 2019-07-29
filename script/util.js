export function argMax(array) {
    /* array: paired values of elements.
       return: (key, value) where key is the maximum key value in the array.
     */

    return array.reduce((r, a) => (a[0] > r[0] ? a : r));
}

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}