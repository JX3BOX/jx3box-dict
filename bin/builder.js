/*
 * Desc: JX3 Simplified=>Traditional Dict Builder
 * Author : iRuxu
 * Email : rx6@qq.com
 * Time : 2020-03-03 18:02:57
 * Reference : https://raw.githubusercontent.com/BYVoid/OpenCC/master/data/dictionary/STCharacters.txt
 */

const fs = require("fs");
const iconv = require('iconv-lite');
const parse = require('csv-parse/lib/sync');

let s = [];
let t = [];

buildOpencc()
buildLocalmap()
outputDict()

//Read origin dict and construct the new map
function buildOpencc(){
    let origindata = fs.readFileSync("./STCharacters.txt", { encoding: "utf-8" }) 
    origindata.split("\n").forEach(function(g) {
        let _g = g.split("\t")
        s.push(_g[0])
        t.push(_g[1][0])
    });
}

//Merge the custom dict
function buildLocalmap(){
    let localdata_buffer = fs.readFileSync('../jx3box.csv')
    let localdata = parse(iconv.decode(Buffer.from(localdata_buffer),'gb2312'));
    localdata.forEach(function (g){
        s.push(g[0])
        t.push(g[1])
    })
}

// Output the array for package
function outputDict(){
    let output = `module.exports = {
        'zh-cn' : ${JSON.stringify(s)},
        'zh-tr' : ${JSON.stringify(t)}
    }`;
    fs.writeFile("../main.js", output, function(err) {
        if (err) console.log(err);
    });
}
