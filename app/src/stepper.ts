
export enum StepperTimerType {
    Step01 = "step01",
    Time = "time",
}
export enum StepperTimerCycleType {
    End = "end",
    Restart = "restart",
    Reverse = "reverseOnce",
}

type easeFunc = (x: number) => number;

export const easeNOOP = (x: number) => (x);

export const easeInOutCubic = (x: number): number => {
    let res = x < 0.5 ? (4 * x * x * x) : (1 - Math.pow(-2 * x + 2, 3) / 2);
    if(res < 0) return 0;
    if(res > 1) return 1;
    return res;
}

export const easeInOutCubicDouble = (x: number): number => {
    if(x < 0.5){
       return easeInOutCubic(x*2)/2 
    }
    return (easeInOutCubic((x-0.5)*2)/2)+0.5
}

export class Stepper{
    timerType:StepperTimerType;
    cycleType:StepperTimerCycleType;
    easeFunc:easeFunc;
    duration: number; // either a duration in ms, or number of steps, depending on timerType


    cycleCount: number = 0;
    startTime: number = 0;

    constructor(
        timerType:StepperTimerType, 
        duration: number, // either a duration in time, or step size between 0 and 1
        cycleType:StepperTimerCycleType = StepperTimerCycleType.Restart, 
        easeFunc:easeFunc = easeNOOP,
    ){
        this.timerType = timerType;
        this.easeFunc = easeFunc;
        this.cycleType = cycleType;
        this.duration = duration;
    }




    step(): number {
        return 0;
    }
}