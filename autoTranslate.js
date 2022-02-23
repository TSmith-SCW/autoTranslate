const {Translate} = require('@google-cloud/translate').v2;
const fs = require("fs");

require('dotenv').config();

const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
const path = process.env.LANGUAGE_FOLDER_PATH;
const baseT = process.env.BASE_LANGUAGE;

const SUPPORTED_LANGUAGES = [
    'en', 'de', 'en-gb', 'es', 'fr', 'ko', 'zh'
];

const _translate = new Translate({key: apiKey});
const source = require(`${path}/main-${baseT}.json`);
const sourceKeys = Object.keys(source);

run();

async function run() {
    const results = await Promise.all(SUPPORTED_LANGUAGES.map(async (lang) => {
        await getDiff(lang)
            .then(translate)
            .then(write)
            .then(({target_language}) => {console.log('SUCCESS', target_language)})
            .catch(console.error);
    }));
}

function getDiff(target_language) {
    return new Promise(async (resolve, reject) => {
        const targetData = require(`${path}/main-${target_language}.json`);
        const targetKeys = Object.keys(targetData);
        const data = {};

        const results = await Promise.all(sourceKeys.map((key) => {
            if(!targetKeys.includes(key)) {
                Object.assign(data, { [key]: source[key] });
            }
        }));

        return resolve({data, target_language});
    })
}

function translate({ data, target_language}) {
    return new Promise(async (resolve, reject) => {
        const tData = {};
        const seperatedKeys = Object.keys(data);

        if(target_language === 'en-gb') return resolve({data, target_language});

        const results = await Promise.all(seperatedKeys.map(async (key) => {
            const [translation] = await _translate.translate(data[key], target_language);
            Object.assign(tData, { [key]: translation });
        }));

        return resolve({
            data: tData,
            target_language
        });
    })
}

function write({ data, target_language}) {
    return new Promise(async (resolve, reject) => {
        const targetData = require(`${path}/main-${target_language}.json`);
        await Object.assign(targetData, data);
        fs.writeFile(`${path}/main-${target_language}.json`, JSON.stringify(targetData, null, 2), () => {});
        return resolve({target_language});
    })
}