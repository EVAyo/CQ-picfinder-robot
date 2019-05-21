/*
 * @Author: Jindai Kirin
 * @Date: 2019-05-21 16:53:12
 * @Last Modified by: Jindai Kirin
 * @Last Modified time: 2019-05-21 20:18:29
 */

import {
	get
} from 'axios';
import Fse from 'fs-extra';
import 'lodash.combinations';
import _ from 'lodash';

const AKDATA_PATH = '../../data/akhr.json';
let AKDATA;

async function pullData() {
	let json = await get('https://graueneko.github.io/akhr.json').then(r => r.data);
	json.sort((a, b) => b.level - a.level);
	let characters = [];
	let data = {};
	for (let character of json) {
		if (character.hidden) continue;
		let {
			level,
			name,
			sex,
			tags,
			type
		} = character;
		tags.push(`${sex}性干员`);
		tags.push(`${type}干员`);
		let p = characters.push({
			n: name,
			r: level
		}) - 1;
		for (let tag of tags) {
			if (!data[tag]) data[tag] = [];
			data[tag].push(p);
		}
	}
	return {
		characters,
		data
	};
}

async function updateData() {
	AKDATA = await pullData();
	Fse.writeJsonSync(AKDATA_PATH, AKDATA);
}

function init() {
	if (!Fse.existsSync(AKDATA_PATH)) updateData();
	else AKDATA = Fse.readJsonSync(AKDATA_PATH);
}

function getCharacters(tags) {
	let combs = _.flatMap(tags, (v, i, a) => _.combinations(a, i + 1));
	let result = [];
	for (let comb of combs) {
		let need = [];
		for (let tag of comb) need.push(AKDATA.data[tag]);
		let chars = _.intersection(...need);
		if (!comb.includes('高级资深干员')) _.remove(chars, i => AKDATA.characters[i].r == 6);
		if (chars.length == 0) continue;

		let s1 = _.sumBy(chars, i => AKDATA.characters[i].r) / chars.length;
		let c2 = _.filter(chars, i => AKDATA.characters[i].r >= 3);
		let s2 = _.sumBy(c2, i => AKDATA.characters[i].r) / c2.length;

		result.push({
			comb,
			chars,
			score: _.max([s1, s2])
		});
	}
	result.sort((a, b) => {
		let s = b.score - a.score;
		if (s == 0) s = a.chars.length - b.chars.length;
		if (s == 0) s = a.comb.length - b.comb.length;
		return s;
	});
	return result;
}

function getResultText(words) {
	console.log(words)
	let tags = _.filter(words, w => w in AKDATA.data);
	let combs = getCharacters(tags);
	let text = `识别词条：${tags.join('、')}`;
	for (let r of combs) {
		text += `\n\n【${r.comb.join(' ')}】`;
		let tmp = [];
		for (let i of r.chars) {
			let char = AKDATA.characters[i];
			tmp.push(`(${char.r})${char.n}`);
		}
		text += tmp.join(' ');
	}
	return text;
}

init();

export default {
	updateData,
	getResultText
};