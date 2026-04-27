import dotenv from 'dotenv';
dotenv.config();

import Sequelize from 'sequelize';

const sequelize = new Sequelize(process.env.DATABASE_URL, {
	dialect: 'postgres',
	dialectOptions: {
		ssl: {
			require: true,
			rejectUnauthorized: false,
		},
	},
	logging: process.env.NODE_ENV === 'development' ? console.log : false,
	pool: {
		max: 5,
		min: 0,
		acquire: 30000,
		idle: 10000,
	},
});

// Remove dangerous methods — prevents accidental table modification
delete sequelize.sync;
delete sequelize.drop;
delete sequelize.truncate;

const connectPG = async () => {
	try {
		await sequelize.authenticate();
		console.log('PostgreSQL Connected (Supabase)');
	} catch (error) {
		console.error('PostgreSQL Connection failed:', error.message);
	}
};

export { sequelize, connectPG };
