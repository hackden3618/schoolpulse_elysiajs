import * as XLSX from "xlsx";
import { readFile } from "fs/promises";
import csv from "csv-parser"
import { Elysia } from "elysia";

export async function convertXLSXToJson(filepath: string) {
    const file = await readFile(filepath)
    const workbook = XLSX.read(file, { type: 'buffer' })
    const result: Record<string, any>[] = {};
    workbook.SheetNames.forEach((sheetName: any) => {
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet)
        result[sheetName] = jsonData
    })
    return result
}

export const conversionTest = new Elysia;
const app = conversionTest;

const filePath = "../TEST_RESOURCES/SchoolPulse_Mock_Students_100.xlsx"
app.get("/converted", async function() {
    return await convertXLSXToJson(filePath)
})

app.get("/converted/:number", async (request) => {
    // const target = params.number
    // const result = await convertXLSXToJson(filePath)
    // return await result.Sheet[target]
    return request.params.number.split(".")
})
