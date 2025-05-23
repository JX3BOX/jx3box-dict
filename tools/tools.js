const papaparse = require("papaparse");

/**
 * 对数据表默认值行（第二行）的处理方式
 */
const TABLE_DEFAULT_ROW_MODE = {
    // 没有默认值行
    NO: 0,
    // 使用默认值行
    USE: 1,
    // 忽略默认值行
    IGNORE: 2,
};
const isNullEmptyOrWhitespace = str => str == null || str.trim() === "";
/**
 * 读取分隔符分隔的表格数据（自动检测分隔符），并以对象数组的方式返回。
 * @param {String} content 表格数据字符串
 * @param {Object} config 配置
 * @param {TABLE_DEFAULT_ROW_MODE} config.useDefaultRow 默认值行处理方式
 * @param {String} config.delimiter 分隔符
 * @param {Boolean} config.ignoreError 是否忽略解析错误
 * @param {String[]} config.keepColumns 要读取的列名，不指定则读取全部列
 * @returns {Promise<Object[]>} 表格数据
 */
const parseTable = (content, config) =>
    new Promise(async (resolve, reject) => {
        config = Object.assign(
            {
                useDefaultRow: TABLE_DEFAULT_ROW_MODE.NO,
                delimiter: "",
                ignoreError: false,
                keepColumns: [],
                newline: "\r\n",
            },
            config
        );
        papaparse.parse(content, {
            delimiter: config.delimiter,
            skipEmptyLines: "greedy",
            delimitersToGuess: [",", "\t"],
            newline: config.newline,
            quoteChar: config.quoteChar || undefined,

            complete: function (results) {
                // 有任何出错且不忽略则炸
                if (results.errors.length > 0 && !config.ignoreError) {
                    reject(results.errors);
                }

                let result = [];
                let table = results.data;
                let headerRow = table.shift();
                let defaultRow = null;

                // 处理默认值行
                if (
                    config.useDefaultRow === TABLE_DEFAULT_ROW_MODE.USE ||
                    config.useDefaultRow === TABLE_DEFAULT_ROW_MODE.IGNORE
                ) {
                    defaultRow = table.shift();
                }

                for (let row of table) {
                    // FIXME: skipEmptyLines 无效，手动跳过空行
                    if (row.length === 1 && isNullEmptyOrWhitespace(row[0])) {
                        continue;
                    }
                    let rowObj = {};
                    for (let i = 0; i < row.length; i++) {
                        // 如果指定了列名，则跳过不在列名列表中的列
                        if (
                            config.keepColumns.length > 0 &&
                            !config.keepColumns.includes(headerRow[i])
                        ) {
                            continue;
                        }
                        // 空单元格根据设置填充默认值或置空
                        if (isNullEmptyOrWhitespace(row[i])) {
                            if (
                                config.useDefaultRow ===
                                TABLE_DEFAULT_ROW_MODE.USE
                            ) {
                                row[i] = defaultRow[i];
                            } else {
                                row[i] = null;
                            }
                        }
                        rowObj[headerRow[i]] = row[i];
                    }
                    result.push(rowObj);
                }

                resolve(result);
            },
        });
    });

module.exports = { TABLE_DEFAULT_ROW_MODE, parseTable };
