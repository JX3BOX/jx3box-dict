const fs = require('fs/promises');

const readStream = async (fs, len, pos) => {
    let buf = Buffer.alloc(len);
    let bytesRead = (await fs.read(buf, 0, len, pos)).bytesRead;
    if (bytesRead != len)
        throw new Error(`无法从偏移 ${pos} 读取 ${len} 字节，已经读取到末尾？`);
    return buf;
};

const readUInt32 = async (fs, pos) => await readStream(fs, 4, pos).then(buf => buf.readUInt32LE(0));

const readSingleFloat = async (fs, pos) => await readStream(fs, 4, pos).then(buf => buf.readFloatLE(0));

const readFourByteASCII = async (fs, pos) => await readStream(fs, 4, pos).then(buf => buf.toString("ascii").replaceAll('\x00',''));

const readStringZero = async (fs, pos) => {
    let ret = [];
    let buf = Buffer.alloc(1);
    while (true) {
        let result = await fs.read(buf, 0, 1, pos++);
        if (buf[0] == 0 || result.bytesRead <= 0)
            break;
        ret.push(buf[0]);
    }
    return new TextDecoder().decode(Buffer.from(ret));
};

const parseKBT = async (filePath, keepColumns, columnNames) => {
    const handle = await fs.open(filePath, "r");

    // 读取头部
    const sig = await readUInt32(handle);
    if(sig != 0x2054424B)
        throw new Error("KBT 文件签名错误");
    const rowCount = await readUInt32(handle);
    const colCount = await readUInt32(handle);
    await readUInt32(handle);
    await readUInt32(handle);
    
    // 读取列类型
    let colType = [];
    for(let i = 0; i < colCount; ++i) {
        colType.push(await readFourByteASCII(handle));
    }

    // 读取数据体
    const dataBegin = 20 + (colCount * 4);
    const textBegin = dataBegin + (rowCount * colCount * 4);
    let ret = [];
    for(let rowIdx = 0; rowIdx < rowCount; ++rowIdx) {
        let row = columnNames ? {} : [];
        for(let colIdx = 0; colIdx < colCount; ++colIdx) {
            // 未指定保留的列直接跳过
            if(keepColumns && !keepColumns.includes(colIdx))
                continue;

            // 使用绝对位置读取数据，跳过的列不读取，应该能快一丁点
            const cellPos = dataBegin + (rowIdx * colCount * 4) + (colIdx * 4);
            let cellContent = null;
            switch(colType[colIdx]) {
                case "f":
                    cellContent = await readSingleFloat(handle, cellPos);
                    break;
                case "i":
                    cellContent = await readUInt32(handle, cellPos);
                    break;
                case "R":
                case "S":
                case "s":
                case "p":
                    cellContent = await readStringZero(handle, textBegin + await readUInt32(handle, cellPos));
                    break;
                default:
                    throw new Error(`未知的列类型 ${colType[colIdx]} 在第 ${rowIdx} 行第 ${colIdx} 列`);
            }

            // 提供了列名则全部使用列名做 key 的对象，否则使用数组
            if(columnNames)
                if(columnNames[colIdx])
                    row[columnNames[colIdx]] = cellContent;
                else
                    throw new Error(`第 ${rowIdx} 行第 ${colIdx} 列将被保留，但未指定列名`);
            else
                row.push(cellContent);
        }
        ret.push(row);
    }

    await handle.close();
    return ret;
};

module.exports = {
    parseKBT
};