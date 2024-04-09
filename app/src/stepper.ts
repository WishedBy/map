
export enum StepperTimerType {
    Step01 = "step01",
    Time = "time",
}
export enum StepperCycleType {
    End = "end",
    Restart = "restart",
    Reverse = "reverse",
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
    cycleType:StepperCycleType;
    easeFunc:easeFunc;
    duration: number; // either a duration in ms, or number of steps, depending on timerType


    startTime: number = 0;
    last: number = 0;
    cycleBack: boolean = false;

    constructor(
        timerType:StepperTimerType, 
        duration: number, // either a duration in time, or step size between 0 and 1
        cycleType:StepperCycleType = StepperCycleType.Restart, 
        easeFunc:easeFunc = easeNOOP,
        inverse:boolean = false, 
    ){
        this.timerType = timerType;
        this.easeFunc = easeFunc;
        this.cycleType = cycleType;
        this.duration = duration;
        this.cycleBack = inverse;
    }

    stepTime(): number {
        let now = Date.now();

        if(this.startTime == 0){
            this.startTime = now
            this.last = now
            return 0;
        }
        let since = now-this.startTime;
        
        if(since >= this.duration && this.cycleType == StepperCycleType.End){
            this.last = now
            return 1;
        }
        
        let n = since / this.duration
        if(n > 0.999999){
            n = 1;
        }
        if(n < 0.000001){
            n = 0;
        }
        
        if(this.cycleBack){
            n = 1 - n
        }

        if((n == 1 || n == 0) && this.last != now){
            this.startTime = now
            if(this.cycleType == StepperCycleType.Reverse){
                this.cycleBack = !this.cycleBack;
            }
        }
        this.last = now
        return n;

    }
    step01(): number {
        let n = this.last;
        if(n == 1){
            if(this.cycleType == StepperCycleType.End){
                return n;
            }else{
                n = 0;
            }
        }
        n += 1/this.duration;
        
        if(n > 0.999999){
            n = 1;
        }
        if(n < 0.000001){
            n = 0;
        }

        this.last = n;

        if(this.cycleBack){
            n = 1 - n
        }
        if((n == 1 || n == 0) && this.cycleType == StepperCycleType.Reverse){
            this.cycleBack = !this.cycleBack;
        }
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