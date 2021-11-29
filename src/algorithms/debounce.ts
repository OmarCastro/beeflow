type VoidFunction = (...args: never[]) => void


export function debounce<T extends VoidFunction>(callback: T, delay: number) {
    let timeoutHandler = -1;
    const resolvers = [] as (() => void)[]
    let debounceArgs = [] as Parameters<T>
    function executeDebounceCallback(){
        callback(...debounceArgs);
        resolvers.splice(0).forEach((resolve) => resolve())
    }
    return function (...args: Parameters<T>) {
        debounceArgs = args
        clearTimeout(timeoutHandler);
        timeoutHandler = setTimeout(executeDebounceCallback, delay);
        return new Promise<void>(resolve => resolvers.push(resolve))
    }
}

export function debounceAnimationFrame<T extends VoidFunction>(callback: T) {
    let timeoutHandler = -1;
    const resolvers = [] as (() => void)[]
    let debounceArgs = [] as Parameters<T>
    function executeDebounceCallback(){
        callback(...debounceArgs);
        resolvers.splice(0).forEach((resolve) => resolve())
    }
    return function (...args: Parameters<T>) {
        debounceArgs = args
        cancelAnimationFrame(timeoutHandler);
        timeoutHandler = requestAnimationFrame(executeDebounceCallback);
        return new Promise<void>(resolve => resolvers.push(resolve))
    }
}