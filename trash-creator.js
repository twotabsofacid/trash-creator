'use strict';

const CONFIG = require('./config.json');
const fs = require('fs');
const jetpack = require('fs-jetpack');
require('@tensorflow/tfjs-node-gpu');
const mobilenet = require('@tensorflow-models/mobilenet');
const { createCanvas, loadImage } = require('canvas');
const canvas = createCanvas(1200, 1200);
const ctx = canvas.getContext('2d');

/**
 * Helper array shuffle function
 * @param  {array} array  [the array to be shuffled]
 * @return {array}        [the shuffled array]
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

class TrashCreator {
	constructor() {
		this.createGlitch();
	}
	createGlitch() {
		let buffArray = [];
		let inc = 0;
		jetpack.remove('.tmp');
		fs.mkdirSync('.tmp');
		let images = jetpack.list(CONFIG.saved_trash).filter(file => {
			// check if we have a png or jpg
			return (file.indexOf('.png') != -1 || file.indexOf('.jpg') != -1);
		});
		images.forEach(image => {
			jetpack.copy(`${CONFIG.saved_trash}/${image}`, `.tmp/${image}`);
		});
		shuffleArray(images);
		let bufferCreation = new Promise((resolve, reject) => {
			images.forEach(image => {
				fs.readFile(`.tmp/${image}`, (err, buf) => {
					if (err) {
						reject(err);
					}
					buffArray.push(buf);
					inc++;
					if (inc == images.length) {
						resolve(buffArray);
					}
				});
			});
		}).then((val) => {
			let outputBuffer = val[0];
			let inc = 0;
			let imageCreation = new Promise((resolve, reject) => {
				let ranMultiplier = Math.floor(Math.random() * 10) + 1;
				val.forEach(buf => {
					let ranSwitches = Math.floor(Math.random() * ranMultiplier);
					for (let i = 0; i < ranSwitches; i++) {
						let smallBuffSize = Math.min(outputBuffer.length, buf.length);
						let reduced = Math.floor(smallBuffSize/20);
						let ran = Math.floor(Math.random() * (smallBuffSize - reduced)) + reduced;
						outputBuffer[ran] = buf[ran];
					}
					inc++;
					if (inc == val.length) {
						resolve(outputBuffer);
					}
				});
			}).then((val) => {
				fs.writeFile('.tmp/out.jpg', val, (err) => {
					if (err) throw err;
					this.nameImage();
				})
			});
		});
	}
	nameImage() {
		loadImage('.tmp/out.jpg').then((image) => {
			ctx.drawImage(image, 0, 0, 1200, 1200);
		});
		async function run() {
			const model = await mobilenet.load();
			const predictions = await model.classify(canvas);
			console.log('Predictions: ');
			console.log(predictions);
			const predictionsString = predictions.map(a => a.className.split(', ').join('_').split(' ').join('-')).join('_');
			jetpack.copy('.tmp/out.jpg', `${CONFIG.desktop}${predictionsString}.jpg`);
		}
		run();
	}
}

const trashCreator = new TrashCreator();
