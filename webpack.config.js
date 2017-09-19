'use strict';

module.exports = {
	entry: './src/main.ts',
	devtool: 'inline-source-map',
	output: {
		filename: './dist/main.js'
	},
	resolve: {
		extensions: ['.ts', '.tsx', '.js']
	},
	module: {
		rules: [
			{ test: /\.tsx?$/, loader: 'surplus-loader!ts-loader' },
		]
	}
};