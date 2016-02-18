'use strict';

var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId,
	logger = console;

var TokenSchema = new Schema({
	id: ObjectId,
	createdat: {
		type: Date,
		'default': Date.now
	},
	updatedat: {
		type: Date,
		'default': Date.now
	},
  value: { type: String, required: true },
	user_id: {
		type: ObjectId,
		ref: 'User'
	},
	user_entity_type: {
		type: String,
		'default': 'user'
	},
  client_id: {
		type: ObjectId,
		ref: 'Client'
	}
});

// TokenSchema.pre('save', function (next) {
// });

// TokenSchema.post('init', function (doc) {
// 	logger.info('model - user.js - ' + doc._id + ' has been initialized from the db');
// });
// TokenSchema.post('validate', function (doc) {
// 	logger.info('model - user.js - ' + doc._id + ' has been validated (but not saved yet)');
// });
// TokenSchema.post('save', function (doc) {
// 	logger.info('model - user.js - ' + doc._id + ' has been saved');
// });
// TokenSchema.pre('remove', function (doc) {
// 	console.log('==================deleted============');
// 	logger.info('model - user.js - ' + doc._id + ' has been removed');
// });


exports = module.exports = TokenSchema;
