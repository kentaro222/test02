// Run with Node.js: node tests/speed-from-time.cjs
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const source=html.slice(html.indexOf('const MAX_SPEED='),html.indexOf('function cueValidation('));
const device={id:'B1',type:'baton',machineMin:0,machineMax:20300};
const ctx=vm.createContext({dev:()=>device,isDeviceEnabled:()=>true,syncRunTargetFromLabel:()=>{}});
vm.runInContext(source,ctx);
const run=(distance,overrides={})=>({device:'B1',target:distance,speed:1000,acc:2,dec:2,delay:0,use2:false,...overrides});
const cases=[[4137,5,1370],[4415,5,1470],[3904,5,1300],[3927,5,1300],[3930,5,1310],[3933,5,1310],[3904,6,976],[5236,6,1300],[2928,5,976]];
for(const [d,t,v] of cases){const r=run(d),result=ctx.solvePrimarySpeedFromTime(r,0,t);assert.equal(result.ok,true);assert.equal(result.speed,v);assert.equal(r.speed,1000);assert.equal(ctx.validateRun({...r,speed:v},0).ok,true)}
for(const v of [1,9,10,99,100,976,1379,1499,1500]){const r=run(10000,{speed:v});assert.equal(ctx.validateRun(r,0).ok,true);assert.equal(r.speed,v)}
for(const [input,expected] of [[1379,1370],[1310,1310],[1000,1000],[999.999,999],[.123456,.123],[1.001,1],[1e-7,1e-7]])assert.equal(ctx.truncateSpeedToThreeSignificantDigits(input),expected);
for(const invalid of [0,-1,NaN,Infinity])assert.equal(Number.isNaN(ctx.truncateSpeedToThreeSignificantDigits(invalid)),true);
for(const t of [0,-1,NaN,Infinity,2,1,1e9])assert.equal(ctx.solvePrimarySpeedFromTime(run(3904),0,t).ok,false);
assert.equal(ctx.solvePrimarySpeedFromTime(run(0),0,5).ok,false);
assert.equal(ctx.solvePrimarySpeedFromTime(run(10000),0,3).ok,false);
assert.equal(ctx.solvePrimarySpeedFromTime(run(2),0,4).speed,1);
assert.equal(ctx.solvePrimarySpeedFromTime(run(1),0,4).ok,false);
assert.equal(ctx.solvePrimarySpeedFromTime(run(293),0,5).speed,97);
assert.equal(ctx.machineBaseTime(4137,1379),3);
const second=run(10000,{use2:true,pos2:5000,speed2:500});const solved=ctx.solvePrimarySpeedFromTime(second,0,15);assert.equal(solved.ok,true);assert.equal(ctx.validateRun({...second,speed:solved.speed},0).ok,true);assert.equal(second.speed2,500);
device.type='constant';assert.equal(ctx.solvePrimarySpeedFromTime(run(1000),0,5).ok,false);
console.log('PASS: 9 console examples, manual integer speeds, significant-digit boundaries, invalid/zero/sub-minimum speeds, existing timing, two-position validation, fixed-speed rejection');
