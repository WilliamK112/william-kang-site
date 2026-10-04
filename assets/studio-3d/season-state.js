// This clock advances only while the scene is visible and motion is enabled.
// A finite sequence leaves its final geometry still; it never starts intervals.
export function createSeasonClock({ light = true, reducedMotion = false, leafEndTime = 24 } = {}) {
  const smooth = (a,b,value) => { const t=Math.max(0,Math.min(1,(value-a)/(b-a)));return t*t*(3-2*t); };
  const autumnStart=8,autumnColorEnd=autumnStart+18;
  let mode=null,age=0,reduced=reducedMotion;
  let state={autumn:0,winter:0,fallTime:0,leafAmount:0};
  let from={...state};
  function settle() {
    age=mode?autumnStart+leafEndTime:Math.max(22,leafEndTime);
    state={autumn:1,winter:mode?0:1,fallTime:leafEndTime,leafAmount:1};
  }
  function sample() {
    if(mode){
      state.winter=from.winter*(1-smooth(0,12,age));
      state.autumn=age<autumnStart?from.autumn*(1-smooth(0,autumnStart,age)):smooth(autumnStart,autumnColorEnd,age);
      state.fallTime=age<autumnStart?(from.fallTime>0?Math.min(leafEndTime,from.fallTime+age):0):Math.min(leafEndTime,age-autumnStart);
      state.leafAmount=age<autumnStart?from.leafAmount*(1-smooth(0,autumnStart,age)):1;
    }else{
      state.autumn=from.autumn+(1-from.autumn)*smooth(0,8,age);
      state.winter=from.winter+(1-from.winter)*smooth(0,22,age);
      state.fallTime=Math.min(leafEndTime,from.fallTime+age);
      state.leafAmount=from.leafAmount+(1-from.leafAmount)*smooth(0,2,age);
    }
  }
  const clock={
    setTheme(nextLight){
      const next=Boolean(nextLight);if(mode===next)return false;
      from={...state};mode=next;age=0;if(reduced)settle();return true;
    },
    setReducedMotion(value){reduced=Boolean(value);if(reduced)settle();},
    advance(seconds){
      if(!clock.active || !Number.isFinite(seconds) || seconds<=0)return false;
      age=Math.min(age+seconds,mode?autumnStart+leafEndTime:Math.max(22,leafEndTime));sample();return true;
    },
    get active(){return !reduced && age<(mode?autumnStart+leafEndTime:Math.max(22,leafEndTime));},
    get age(){return age;},
    get state(){return {...state};}
  };
  clock.setTheme(light);return clock;
}
