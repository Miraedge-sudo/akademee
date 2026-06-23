const fs=require('fs');const p=process.argv[2];const c=process.argv[3].replace(/BT/g,'\n');console.log('Size: '+fs.statSync(p).size);
