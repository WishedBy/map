
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


    startTime: number = 0;
    lastNum: number = 0;
    cycleBack: boolean = false;

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


    stepTime(): number {
        if(this.startTime == 0){
            this.startTime = Date.now()
        }
        let cd = Date.now()
        let since = cd-this.startTime;

        
        if(since > this.duration){
            if(this.cycleType == StepperTimerCycleType.End){
                return 1;
            }
        }
        let n = (since%this.duration)*(1/this.duration)
        if(n > 0.999999){
            n = 1;
        }
        if(n < 0.000001){
            n = 0;
        }
        if(this.cycleBack){
            n = 1 - n;
        }

        if(n == 1 || n == 0 && this.cycleType == StepperTimerCycleType.Reverse){
            this.cycleBack = !this.cycleBack;
        }
        this.lastNum = n;
        return n;

    }
    step01(): number {
        let n = this.lastNum;
        if(n == 1){
            if(this.cycleType == StepperTimerCycleType.End){
                return n;
            }else{
                n = 0;
            }
        }
        if(this.cycleBack){
            n -= 1/this.duration;
        }else{
            n += 1/this.duration;
        }
        if(n > 0.999999){
            n = 1;
        }
        if(n < 0.000001){
            n = 0;
        }

        if(n == 1 || n == 0 && this.cycleType == StepperTimerCycleType.Reverse){
            this.cycleBack = !this.cycleBack;
        }
        this.lastNum = n;
        return n;
    }
    step(): number {
        let num = 0;
        switch(this.timerType){
            case StepperTimerType.Time:
                num = this.stepTime();
            break;
            case StepperTimerType.Step01:
                num = this.step01();
            break;
        }
        return this.easeFunc(num);
    }
}