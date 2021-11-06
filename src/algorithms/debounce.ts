type VoidFunction = (...args: never[]) => void


export function debounce<T extends VoidFunction>(callback: T, delay: number) {
    let timeoutHandler = -1;
    const resolvers = [] as (() => void)[]
    return function (...args: Parameters<T>) {
        clearTimeout(timeoutHandler);
        timeoutHandler = setTimeout(function () {
            callback(...args);
            resolvers.splice(0).forEach((resolve) => resolve())
        }, delay);
        return new Promise<void>(resolve => resolvers.push(resolve))
    }
}

export function debounceAnimationFrame<T extends VoidFunction>(callback: T) {
    let timeoutHandler = -1;
    const resolvers = [] as (() => void)[]
    return function (...args: Parameters<T>) {

        cancelAnimationFrame(timeoutHandler);
        timeoutHandler = requestAnimationFrame(function () {
            callback(...args);
            resolvers.splice(0).forEach((resolve) => resolve())
        });
        return new Promise<void>(resolve => resolvers.push(resolve))
    }
}