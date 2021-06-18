const path = require('path')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')

module.exports = (env = {}) => {
	const {mode = 'production'} = env
	const isDev = (mode === 'development')

	return {
		mode: mode,
		// devtool: (isDev ? 'source-map' : false),
		devtool: 'source-map',
		entry: {
			'index':             './src/index.reservise-calendar.js', // back-compat with previous userscripts
			'reservise-clients': './src/index.reservise-clients.js',
			'tournament-tools':  './src/index.tournament-tools.js', 
		},
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
			filename: '[name].js',
			path: path.resolve(__dirname, 'dist'),
		},
		plugins: [
			new CleanWebpackPlugin(),
		],
		devServer: {
			contentBase: path.join(__dirname, 'dist'),
			// compress: true,
			hot: false,
			port: 9000,
			disableHostCheck: true,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Credentials": "true",
				"Access-Control-Allow-Headers": "Content-Type, Authorization, x-id, Content-Length, X-Requested-With",
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			}
		}
	}
}