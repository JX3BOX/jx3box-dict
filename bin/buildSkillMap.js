const fs = require("fs");
const parse = require('csv-parse/lib/sync');

let output = {
    'cn' : [],
    'tr' : [],
};

//Read origin dict and construct the new map
function run(){

    let origin_data = fs.readFileSync('./src/JX3BOX/SkillNames.tsv', { encoding: "utf-8" }) 

    let local_data = parse(origin_data, { delimiter: '\t' });
    local_data.forEach(function(item,i) {
        output.cn.push(item[0])
        output.tr.push(item[1])
    });

    fs.writeFile("./output/skill.json", JSON.stringify(output), function(err) {
        if (err) console.log(err);
    });
}


run();