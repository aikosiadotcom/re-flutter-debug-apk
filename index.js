const fs = require('fs');
const readline = require('readline');
const fsExtra = require("fs-extra");
const path = require("path");
const { constants } = require('buffer');

function findByKeyword(line,keywordStart,keywordEnd){
    const start = line.indexOf(keywordStart);
    if(start < 0){
        return false;
    }
    const lineT1 = line.substr(start);

    const newStart = lineT1.indexOf(keywordEnd);
    const lineT2 = lineT1.substr(0,newStart+keywordEnd.length);

    return lineT2;
}

function isValid(str){
    if(typeof(str)!=='string'){
        return false;
    }
    for(var i=0;i<str.length;i++){
        if(str.charCodeAt(i)>127 || str.charCodeAt(i)<32){
            return false;
        }
    }
    return true;
}

(async()=>{
    let counter = 0;
    let limitFile = Number.MAX_SAFE_INTEGER;
    const fileStream = fs.createReadStream('./kernel_blob.bin');
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    
    let isWrite = false;
    let isSave = false;
    let buffer = "";
    let currentFile = "";
    // const module = "file:///Z:/FLUTTER/publish/camis/lib/";
    // const namespace = "./camis/lib/";
    
    const module = "file:///Z:/FLUTTER/publish/";
    const namespace = "./result/";
    for await (const line of rl) {
        isSave = line.includes(module);
        if(isSave){
            if(buffer.length > 0){
                await fsExtra.writeFile(currentFile,buffer);
                buffer = "";
                counter++;

                if(counter > limitFile){
                    break;
                }
            }

            const lineT1 = findByKeyword(line,module,".dart");
            const lineT2 = lineT1.replace(module,namespace);
            await fsExtra.mkdirp(path.dirname(lineT2));
            currentFile = lineT2;
            
            let lineT3 = findByKeyword(line,"import",";");
            let writeHeader = true;
            if(lineT3 == false){
                lineT3 = findByKeyword(line,"library",";");
                if(lineT3 == false){
                    lineT3 = findByKeyword(line,"class","{");
                    if(lineT3 == false){
                        writeHeader = false;
                    }
                }
            }
            if(writeHeader){
                buffer += lineT3+"\n";
            }
            isWrite = true;

            continue;
        }
        
        if(isWrite){
            if(isValid(line)){
                buffer += line+"\n";
            }else{
                isWrite = false;
            }
        }
    }
})();