
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
    // config
    timerType:StepperTimerType;
    cycleType:StepperCycleType;
    easeFunc:easeFunc;
    duration: number; // either a duration in ms, or number of steps, depending on timerType
    pauseAfterCycle: boolean = false;
    inverse: boolean = false;

    // state
    pausedTime: number = 0;
    startTime: number = 0;
    lastT: number = 0;
    cycleBack: boolean = false;
    lastTRes: number = 0;


    constructor(
        timerType:StepperTimerType, 
        duration: number, // either a duration in time, or step size between 0 and 1
        cycleType:StepperCycleType = StepperCycleType.Restart, 
        easeFunc:easeFunc = easeNOOP,
        inverse:boolean = false, 
        pauseAfterCycle: boolean = false,
    ){
        this.timerType = timerType;
        this.easeFunc = easeFunc;
        this.cycleType = cycleType;
        this.duration = duration;
        this.pauseAfterCycle = pauseAfterCycle;
        this.inverse = inverse;

        this.reset();

    }

    reset(): Stepper {
        
        this.pausedTime = 0;
        this.startTime = 0;
        this.cycleBack = this.inverse;
        this.lastT = this.inverse ? 1 : 0;
        this.lastTRes = this.inverse ? 1 : 0;
        return this;
    }

    playing(): boolean{
        return this.startTime > 0 && this.pausedTime == 0
    }
    play(): Stepper {
        if(this.startTime == 0){
            this.startTime = Date.now();
        }
        this.pausedTime = 0;
        return this;
    }
    pause(): Stepper {
        if(this.pausedTime == 0){
            this.pausedTime = Date.now();
        }else{
            if(this.startTime > 0){
                this.startTime += (Date.now()-this.pausedTime)
            }
            this.pausedTime = 0;
        }
        return this;
    }
    stop(): Stepper {
        this.startTime = 0;
        this.pausedTime = 0;
        return this;
    }


    stepTimeT(t: number): number {
        let now = Date.now();
        let since = now-this.startTime;
        t = since / this.duration;
        return t;
    }
    step01T(t: number): number {
        t += 1/this.duration;
        return t;
    }

    
    step(): number {
        if(!this.playing()){
            return this.lastTRes;
        }
        let t = this.lastT;
        switch(this.timerType){
            case StepperTimerType.Time:
                t = this.stepTimeT(t);
            break;
            case StepperTimerType.Step01:
                t = this.step01T(t);
            break;
        }


        if(t >= 1){
            if(this.cycleType == StepperCycleType.End){
                this.startTime = 0;
                this.lastT = 1;
                return 1;
            }else{
                t = 0;
            }
        }

        if(t > 0.999999){
            this.startTime = Date.now();
            t = 1;
        }
        if(t < 0.000001){
            this.startTime = Date.now();
            t = 0;
        }

        this.lastT = t;
        
        if(t == 1 || t == 0){
            if(this.pauseAfterCycle){
                this.pause();
            }
            if(this.cycleType == StepperCycleType.Reverse){
                this.cycleBack = !this.cycleBack;
            }
        }
        if(this.cycleBack){
            t = 1 - t
        }

        this.lastTRes = this.easeFunc(t);
        return this.lastTRes;
    }
}