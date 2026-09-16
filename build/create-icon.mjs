import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

// Generate the app's code-native sigma mark without image or font dependencies.
const size = 256;
const rows = Buffer.alloc((size * 4 + 1) * size);
const segments = [[[185,53],[72,53]],[[72,53],[132,127]],[[132,127],[72,203]],[[72,203],[185,203]]];
function distance(x, y, [a,b]) {
  const dx=b[0]-a[0], dy=b[1]-a[1];
  const t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));
  return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy);
}
for(let y=0;y<size;y++) for(let x=0;x<size;x++) {
  const offset=y*(size*4+1)+1+x*4;
  const cornerDistance=Math.hypot(Math.max(32-x,0,x-223),Math.max(32-y,0,y-223));
  const alpha=Math.max(0,Math.min(1,32-cornerDistance));
  const mark=Math.max(0,Math.min(1,8-Math.min(...segments.map(s=>distance(x,y,s)))));
  [82,100,198].forEach((c,i)=>rows[offset+i]=Math.round(c+(255-c)*mark));
  rows[offset+3]=Math.round(alpha*255);
}
function crc32(bytes) {
  let crc=0xffffffff;
  for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
  return (crc^0xffffffff)>>>0;
}
function chunk(type, data) {
  const payload=Buffer.concat([Buffer.from(type),data]);
  const length=Buffer.alloc(4);length.writeUInt32BE(data.length);
  const crc=Buffer.alloc(4);crc.writeUInt32BE(crc32(payload));
  return Buffer.concat([length,payload,crc]);
}
const header=Buffer.alloc(13);header.writeUInt32BE(size,0);header.writeUInt32BE(size,4);header[8]=8;header[9]=6;
const png=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);
const ico=Buffer.alloc(22);ico.writeUInt16LE(1,2);ico.writeUInt16LE(1,4);ico.writeUInt16LE(1,10);ico.writeUInt16LE(32,12);ico.writeUInt32LE(png.length,14);ico.writeUInt32LE(22,18);
writeFileSync(new URL('./icon.ico',import.meta.url),Buffer.concat([ico,png]));
console.log('Created build/icon.ico');
