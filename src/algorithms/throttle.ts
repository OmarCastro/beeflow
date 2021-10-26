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
    let waiting = false
    return (...args: Parameters<T>) => {
        if(!waiting){
            fn(...args)
            waiting = true;
            requestAnimationFrame(() =>{ waiting = false })
        }
    }
}

export function throttleTrailingAnimationFrame<T extends VoidFunction>(fn: T) {
    let waiting = false
    const defaultSavedArgs = [] as Parameters<T>
    let savedArgs: Parameters<T> = defaultSavedArgs
    return (...args: Parameters<T>) => {
        if(!waiting){
            fn(...args)
            waiting = true;
            requestAnimationFrame(function exec(){
                if(savedArgs === defaultSavedArgs){
                    waiting = false
                } else {
                    fn(...savedArgs)
                    savedArgs = defaultSavedArgs
                    requestAnimationFrame(exec)
                }
            })
        } else {
            savedArgs = args
        }
    }
}

export default throttleTimeFrame