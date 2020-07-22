const path = require('path')

module.exports = {
	entry: './src/index.js',
	module: {
		rules: [
			{
				test: /.*\.js$/,
				exclude: /node_modules/,
				use: ['babel-loader'],
			},
		],
	},
	resolve: {
		extensions: ['*', '.js'],
	},
	output: {
		filename: 'index.js',
		path: path.resolve(__dirname, 'dist'),
	},
	devServer: {
		contentBase: path.join(__dirname, 'dist'),
		// compress: true,
		port: 9000,
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Credentials": "true",
			"Access-Control-Allow-Headers": "Content-Type, Authorization, x-id, Content-Length, X-Requested-With",
			"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
		}
	}
}