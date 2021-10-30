type VoidFunction = (...args: never[]) => void


export function throttleTimeFrame<T extends VoidFunction>(fn: T, timeFrame: number) {
    let lastTime = 0
    return (...args: Parameters<T>) => {
        const now = Date.now();
        if(now - lastTime >= timeFrame){
            fn(...args)
            lastTime = now
        }
    }
}


export function throttleAnimationFrame<T extends VoidFunction>(fn: T) {
    const wait = () => {}
    const stopWaiting = () => { nextAction = execAndwait }
    const execAndwait = (...args: Parameters<T>) => {
        fn(...args)
        nextAction = wait
        requestAnimationFrame(stopWaiting)
    }
    let nextAction = execAndwait
    return (...args: Parameters<T>) => nextAction(...args)
}

export function throttleTrailingAnimationFrame<T extends VoidFunction>(fn: T) {
    const stopWaiting = () => { nextAction = execAndwait }
    const executeAgain = () => { 
        fn(...savedArgs)
        nextFrameAcion = stopWaiting
        requestAnimationFrame(doNextFrameAcion)
    }
    const doNextFrameAcion = () => nextFrameAcion()
    const saveArgs = (...args: Parameters<T>) => {
        savedArgs = args
        nextFrameAcion = executeAgain
    }
    const execAndwait = (...args: Parameters<T>) => {
        fn(...args)
        nextAction = saveArgs;
        requestAnimationFrame(doNextFrameAcion)
    }
    let savedArgs = [] as Parameters<T>
    let nextAction = execAndwait
    let nextFrameAcion = stopWaiting
    return (...args: Parameters<T>) => nextAction(...args)
}

export default throttleTimeFrame