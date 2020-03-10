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

let cn = [];
let tr = [];
let jx3box_cn = [];
let jx3box_tr = [];

buildOpencc()
buildLocalmap()
outputDict()

//Read origin dict and construct the new map
function buildOpencc(){
    let origindata = fs.readFileSync('./src/STCharacters.txt', { encoding: "utf-8" }) 
    origindata.split("\n").forEach(function(g) {
        let _g = g.split("\t")
        cn.push(_g[0])
        tr.push(_g[1][0])
    });
}

//Merge the custom dict
function buildLocalmap(){
    let localdata_buffer = fs.readFileSync('./src/jx3box.csv')
    let localdata = parse(iconv.decode(Buffer.from(localdata_buffer),'gb2312'));
    localdata.forEach(function (g){
        jx3box_cn.push(g[0])
        jx3box_tr.push(g[1])
    })
}

// Output the array for package
function outputDict(){
    let output = {
        'zh-cn' : cn,
        'zh-tr' : tr,
        'jx3box-cn' : jx3box_cn,
        'jx3box-tr' : jx3box_tr,
    };
    fs.writeFile("./dict.json", JSON.stringify(output), function(err) {
        if (err) console.log(err);
    });
}
