type VoidFunction = (...args: never[]) => void


export function debounce<T extends VoidFunction>(callback: T, delay: number) {
    let timeoutHandler = -1;
    return function (...args: Parameters<T>) {
        clearTimeout(timeoutHandler);
        timeoutHandler = setTimeout(function () {
            callback(...args);
        }, delay);
    }
}

export function debounceAnimationFrame<T extends VoidFunction>(callback: T) {
    let timeoutHandler = -1;
    return function (...args: Parameters<T>) {
        cancelAnimationFrame(timeoutHandler);
        timeoutHandler = requestAnimationFrame(function () {
            callback(...args);
        });
    }
}