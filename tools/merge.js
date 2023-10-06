/*
 * Desc: JX3 Simplified=>Traditional Dict Builder
 * Author : iRuxu
 * Email : rx6@qq.com
 * Time : 2020-03-03 18:02:57
 * Reference : https://raw.githubusercontent.com/BYVoid/OpenCC/master/data/dictionary/STCharacters.txt
 */

const path = require("path");
const fs = require("fs");
const { exists, readFile, writeJSON } = require("@jx3box/jx3box-build-common/file");
const { initLogger } = require('@jx3box/jx3box-build-common/logger');


const buildMapping = async (input) => {
    const logger = baseLogger.job("buildMapping");

    logger.info(input);


    let cn = [];
    let tr = [];

    // 传入数组则逐个处理
    if (Array.isArray(input))
        for (let i of input) {
            let ret = await buildMapping(i);
            cn = cn.concat(ret.cn);
            tr = tr.concat(ret.tr);
        }
    else {
        // 传入目录则逐个处理
        if (fs.lstatSync(input).isDirectory()) {
            let files = [];
            fs.readdirSync(input).forEach(function (fileName) {
                if (fileName.toLocaleLowerCase().endsWith(".tsv"))
                    files.push(path.join(input, fileName));
            });
            let ret = await buildMapping(files);
            cn = cn.concat(ret.cn);
            tr = tr.concat(ret.tr);
        }
        else {
            let data = await readFile(input, "utf-8");
            data.split("\n").forEach(function (line) {
                if (line.trim()) {
                    let items = line.split("\t");
                    cn.push(items[0].trim());
                    tr.push(items[1].trim().split(" ")[0]);    // 对应 OpenCC 有多个映射的情况
                }
            });
        }
    }
    return {
        "cn": cn,
        "tr": tr
    };
};

const main = async () => {
    baseLogger = initLogger("jx3box-dict");
    const logger = baseLogger;

    try {

        logger.info("构建 OpenCC");
        const openCCPath = path.resolve(__dirname, "../raw/OpenCC.tsv");
        let openCC = await buildMapping(openCCPath);

        logger.info("构建 JX3BOX 所有数据");
        const jx3boxAllPath = path.resolve(__dirname, "../raw/JX3BOX/");
        let jx3boxAll = await buildMapping(jx3boxAllPath);

        logger.info("输出主字典");
        let main = {
            "cn": openCC.cn,
            "tr": openCC.tr,
            "jx3cn": jx3boxAll.cn,
            "jx3tr": jx3boxAll.tr
        }
        const mainPath = path.resolve(__dirname, "../dict.json");
        await writeJSON(mainPath, main);

        logger.info("构建技能与 buff 数据");
        const skillFiles = [
            path.resolve(__dirname, "../temp/SkillNames.tsv"),
            path.resolve(__dirname, "../temp/BuffNames.tsv")
        ];
        for(let file of skillFiles)
            if(!exists(file))
                throw new Error(`文件 ${file} 不存在，请先运行 build.js 进行构建`);
        let skillAndBuff = await buildMapping(skillFiles);

        logger.info("输出技能与 buff 字典");
        const skillAndBuffPath = path.resolve(__dirname, "../output/skill.json");
        await writeJSON(skillAndBuffPath, skillAndBuff);
        
        logger.success();

    } catch (e) {
        logger.fail(e);
    }

    await logger.end();
};

main();
