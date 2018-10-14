const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = {
	mode: 'none',
	entry: {
		'control': './src/web/control.ts',
		'control.min': './src/web/control.ts',
	},
	target: 'web',
	output: {
		filename: '[name].js',
		path: path.resolve(__dirname, 'dist/web'),
	},
	devtool: 'inline-source-map',
	resolve: {
		extensions: ['.ts', '.js'],
		plugins: [new TsconfigPathsPlugin({configFile: './tsconfig.webpack.json'})],
	},
	module: {
		rules: [
			// all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
			{ test: /\.ts$/, loader: 'ts-loader' },
		]
	},
};
