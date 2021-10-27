
export interface BoundaryTarget<T> {
    left:number,
    rigth:number,
    top:number,
    bottom:number,
    data: T
}


function createEmptyBoundary<T>(): Boundary<T>{
  return new Boundary<T>(0,0,0,0,[]);
}

/**
 * This class is responsible to show the boundary of selected nodes, as well as make multi node operations
 */
export class Boundary<T>{
  public constructor(
    public left:number,
    public rigth:number,
    public top:number,
    public bottom:number,
    public targets:BoundaryTarget<T>[]
  ){}



  static createFromTarget<T>(target:BoundaryTarget<T>): Boundary<T>{
    return new Boundary<T>(target.left, target.rigth, target.top, target.bottom,[target]);
  }

  static createFromTargets<T>(targets:BoundaryTarget<T>[]): Boundary<T>{
    if(targets == null || targets.length === 0){ return createEmptyBoundary<T>(); }
    return targets.slice(1).reduce((acc, target) => acc.addTarget(target), Boundary.createFromTarget(targets[0]))
  }

  addTarget(target: BoundaryTarget<T>): Boundary<T>{
    const left   = Math.min(target.left   ,this.left)
    const rigth  = Math.max(target.rigth  ,this.rigth)
    const top    = Math.min(target.top    ,this.top)
    const bottom = Math.max(target.bottom ,this.bottom)
    const targets = [...this.targets, target]
    return new Boundary (left,rigth,top,bottom,targets)
  }
  
  isEmpty(){
    return this.targets.length = 0;
  }

  extend(boundary2: Boundary<T>): Boundary<T>{
      const left   = Math.min(boundary2.left   ,this.left)
      const rigth  = Math.max(boundary2.rigth  ,this.rigth)
      const top    = Math.min(boundary2.top    ,this.top)
      const bottom = Math.max(boundary2.bottom ,this.bottom)
      const targets = [...this.targets, ...boundary2.targets]
      return new Boundary (left,rigth,top,bottom,targets)
  }

  translateXY(x = 0, y = 0){
    this.left   += x
    this.rigth  += x
    this.top    += y
    this.bottom += y
    this.targets.forEach(target => {
        target.left   += x
        target.rigth  += x
        target.top    += y
        target.bottom += y
  });
  
  }
 
}