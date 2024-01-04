const path = require("path");
const {
    TABLE_DEFAULT_ROW_MODE,
    readFile,
    parseTable,
    ensureDir,
    writeFile,
} = require("@jx3box/jx3box-build-common/file");
const { initLogger } = require("@jx3box/jx3box-build-common/logger");
const kbt = require("./kbt");

let baseLogger = null;

const readFilters = async () => {
    const logger = baseLogger.job("readFilters");
    let ret = new Set();

    logger.info("开始读取 skill_kungfu");
    const skillKungfuFilePath = path.resolve(
        __dirname,
        "../raw/skill_kungfu.txt"
    );
    const skillKungfu = await parseTable(await readFile(skillKungfuFilePath), {
        useDefaultRow: TABLE_DEFAULT_ROW_MODE.USE,
        keepColumns: ["Skill"],
    });
    for (let row of skillKungfu) {
        for (let skillGroup of row.Skill.split(";"))
            for (let skill of skillGroup.split("|"))
                if (skill) ret.add(~~skill);
    }
    logger.info(`skill_kungfu 读取完毕，当前共有 ${ret.size} 个技能`);

    logger.info("开始读取 skill_open_level");
    const skillOpenLevelFilePath = path.resolve(
        __dirname,
        "../raw/skill_open_level.txt"
    );
    const skillOpenLevel = await parseTable(
        await readFile(skillOpenLevelFilePath),
        {
            useDefaultRow: TABLE_DEFAULT_ROW_MODE.NO,
            keepColumns: ["SkillID"],
        }
    );
    for (let row of skillOpenLevel) {
        if (row.SkillID) ret.add(~~row.SkillID);
    }
    logger.info(`skill_open_level 读取完毕，当前共有 ${ret.size} 个技能`);

    logger.info("开始读取 tenextrapoint");
    const tenExtraPointFilePath = path.resolve(
        __dirname,
        "../raw/tenextrapoint.tab"
    );
    const tenExtraPoint = await parseTable(
        await readFile(tenExtraPointFilePath),
        {
            useDefaultRow: TABLE_DEFAULT_ROW_MODE.NO,
            keepColumns: [
                "SkillID1",
                "SkillID2",
                "SkillID3",
                "SkillID4",
                "SkillID5",
            ],
        }
    );
    for (let row of tenExtraPoint) {
        for (let skill of Object.values(row)) if (skill) ret.add(~~skill);
    }
    logger.info(`tenextrapoint 读取完毕，当前共有 ${ret.size} 个技能`);

    return ret;
};

const buildSkillsSimp = async filter => {
    const logger = baseLogger.job("readSkillsSimp");
    let ret = {};

    logger.info("开始读取简体中文 skill");

    const skillSimpFilePath = path.resolve(__dirname, "../raw/skill.txt");
    const skillSimp = await parseTable(await readFile(skillSimpFilePath), {
        useDefaultRow: TABLE_DEFAULT_ROW_MODE.USE,
        keepColumns: ["SkillID", "Level", "Name"],
    });

    for (let row of skillSimp) {
        const skillID = ~~row.SkillID;
        if (!filter || !filter.has(skillID)) continue;
        if (!ret[skillID]) ret[skillID] = {};
        ret[skillID][row.Level] = row.Name;
    }

    logger.info(
        `简体中文 skill 读取完毕，当前共有 ${Object.keys(ret).length} 个技能`
    );
    return ret;
};

const buildSkillsTrad = async filter => {
    const logger = baseLogger.job("readSkillsTrad");
    let ret = {};

    logger.info("开始读取繁体中文 skill（此步骤非常慢请耐心等待！！！）");
    const skillTradFilePath = path.resolve(__dirname, "../raw/skill.kbt");
    const skillTrad = await kbt.parseKBT(skillTradFilePath, [0, 1, 10, 11], {
        0: "SkillID",
        1: "Level",
        10: "Remark",
        11: "Name",
    });

    for (let row of skillTrad) {
        const skillID = ~~row.SkillID;
        if (!filter || !filter.has(skillID)) continue;
        if (!ret[skillID]) ret[skillID] = {};
        ret[skillID][row.Level] = row.Name;
    }

    logger.info(
        `繁体中文 skill 读取完毕，当前共有 ${Object.keys(ret).length} 个技能`
    );
    return ret;
};

const readBuffsSimp = async () => {
    const logger = baseLogger.job("readBuffsSimp");
    let ret = {};

    logger.info("开始读取简体中文 buff");
    const buffSimpFilePath = path.resolve(__dirname, "../raw/buff.txt");
    const buffSimp = await parseTable(await readFile(buffSimpFilePath), {
        useDefaultRow: TABLE_DEFAULT_ROW_MODE.USE,
        keepColumns: ["BuffID", "Level", "IconID", "Show", "Name"],
    });

    for (let row of buffSimp) {
        /*
        // 过滤掉不显示的 buff
        // TODO: 通过 Show 和 IconID 仍然有部分内部 buff 未被排除
        if(!~~row.Show || !~~row.IconID)
            continue;
        */
        const buffID = ~~row.BuffID;
        if (!ret[buffID]) ret[buffID] = {};
        ret[buffID][row.Level] = row.Name;
    }

    logger.info(
        `简体中文 buff 读取完毕，当前共有 ${Object.keys(ret).length} 个 buff`
    );
    return ret;
};

const readBuffsTrad = async () => {
    const logger = baseLogger.job("readBuffsTrad");
    let ret = {};

    logger.info("开始读取繁体中文 buff（此步骤非常慢请耐心等待！！！）");
    const buffTradFilePath = path.resolve(__dirname, "../raw/buff.kbt");
    const buffTrad = await kbt.parseKBT(buffTradFilePath, [0, 1, 2, 5, 7], {
        0: "BuffID",
        1: "Level",
        2: "IconID",
        5: "Show",
        7: "Name",
    });

    for (let row of buffTrad) {
        /*
        // 过滤掉不显示的 buff
        // TODO: 通过 Show 和 IconID 仍然有部分内部 buff 未被排除
        if(!~~row.Show || !~~row.IconID)
            continue;
        */
        const buffID = ~~row.BuffID;
        if (!ret[buffID]) ret[buffID] = {};
        ret[buffID][row.Level] = row.Name;
    }

    logger.info(
        `繁体中文 buff 读取完毕，当前共有 ${Object.keys(ret).length} 个技能`
    );
    return ret;
};

const buildMapping = async (simp, trad) => {
    const logger = baseLogger.job("buildMapping");

    let mapping = {};
    for (let id of Object.keys(simp)) {
        for (let level of Object.keys(simp[id])) {
            const simpName = simp[id][level];
            if (!trad[id]) {
                logger.warn(`繁体中文数据中中无法找到 [${id}] ${simpName}`);
                continue;
            }

            // 优先匹配同等级，如果没有则使用最高等级
            let tradName = trad[id][level];
            if (!tradName) {
                const tradMaxLevel = Math.max(...Object.keys(trad[id]));
                logger.warn(
                    `繁体中文数据中无法找到 [${id}-${level}] ${simpName}，使用最高等级 ${tradMaxLevel}`
                );
                tradName = trad[id][tradMaxLevel];
            }

            // 简繁体相同的不加入
            if (simpName !== tradName) mapping[simpName] = tradName;
        }
    }
    return mapping;
};

const writeMappingTSV = async (path, data) => {
    const logger = baseLogger.job("writeMappingTSV");

    let content = [];
    for (let key of Object.keys(data)) content.push(`${key}\t${data[key]}`);

    await writeFile(path, content.join("\n") + "\n");
};

const main = async () => {
    baseLogger = initLogger("jx3box-dict-generator");
    const logger = baseLogger;

    try {
        logger.info("开始处理 skill 映射");
        const skillFilters = await readFilters();
        const skillsSimp = await buildSkillsSimp(skillFilters);
        const skillsTrad = await buildSkillsTrad(skillFilters);
        const skillsMapping = await buildMapping(skillsSimp, skillsTrad);
        logger.info(
            `skill 映射处理完毕，共 ${Object.keys(skillsMapping).length} 个技能`
        );
        const skillOutputPath = path.resolve(
            __dirname,
            "../temp/SkillNames.tsv"
        );
        await ensureDir(path.dirname(skillOutputPath));
        await writeMappingTSV(skillOutputPath, skillsMapping);
        logger.info(`skill 映射写入成功`);

        logger.info("开始处理 buff 映射");
        const buffsSimp = await readBuffsSimp();
        const buffsTrad = await readBuffsTrad();
        const buffsMapping = await buildMapping(buffsSimp, buffsTrad);
        logger.info(
            `buff 映射处理完毕，共 ${Object.keys(buffsMapping).length} 个 buff`
        );
        const buffOutputPath = path.resolve(__dirname, "../temp/BuffNames.tsv");
        await ensureDir(path.dirname(buffOutputPath));
        await writeMappingTSV(buffOutputPath, buffsMapping);
        logger.info(`buff 映射写入成功`);
        logger.success();
    } catch (e) {
        logger.fail(e);
    }

    await logger.end();
};

main();
