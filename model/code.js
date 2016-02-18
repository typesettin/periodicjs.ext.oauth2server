'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId,
	logger = console;

var CodeSchema = new Schema({
	id: ObjectId,
	createdat: {
		type: Date,
		'default': Date.now
	},
	updatedat: {
		type: Date,
		'default': Date.now
	},
	name: {
		type: String,
		required: true,
		index: {
			unique: true
		}
	},
	title: String,
  value: { type: String, required: true },
	user_id: {
		type: ObjectId,
		ref: 'User'
	},
	user_entity_type: {
		type: String,
		'default': 'user'
	},
  redirect_uri: { type: String, required: true },
  client_id: { type: String, required: true }
});

// CodeSchema.pre('save', function (next) {
// });

// CodeSchema.post('init', function (doc) {
// 	logger.info('model - user.js - ' + doc._id + ' has been initialized from the db');
// });
// CodeSchema.post('validate', function (doc) {
// 	logger.info('model - user.js - ' + doc._id + ' has been validated (but not saved yet)');
// });
// CodeSchema.post('save', function (doc) {
// 	logger.info('model - user.js - ' + doc._id + ' has been saved');
// });
// CodeSchema.pre('remove', function (doc) {
// 	console.log('==================deleted============');
// 	logger.info('model - user.js - ' + doc._id + ' has been removed');
// });

exports = module.exports = CodeSchema;
