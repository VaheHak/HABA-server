const {Validator} = require('node-input-validator');
const httpErrors = require('http-errors');
const _ = require('lodash');
const {errorHandler} = require("../utils/responseHandlers");
const {error_message_phoneNumber, error_message_password} = require("../utils/resMessage");
const {phone} = require('phone');

async function Validate(inputs, rules, regex, mobile, customError, messages) {
	let v = new Validator(inputs, rules, messages);
	if (!await v.check() || inputs.password || regex){
		let errors = {};
		_.forEach(regex, (value, key) => {
			if (value && key.toLowerCase().includes('phone') && (!/^\+[1-9]{1}[0-9]{3,14}$/.test(value) || !phone(value, {
				validateMobilePrefix: true,
				strictDetection: true
			}).isValid)){
				if (mobile){
					errors = error_message_phoneNumber;
				} else{
					errors[key] = 'Please enter a valid phone number +(country code)numbers';
				}
			}
		});

		(function checkForm(input) {
			let re;
			if (input.password){
				if (input.password === input.email){
					if (mobile){
						errors = error_message_password;
						return false;
					}
					errors['password'] = 'Password must be different from Username!';
					return false;
				}
				re = /[0-9]/;
				if (!re.test(input.password)){
					if (mobile){
						errors = error_message_password;
						return false;
					}
					errors['password'] = 'Password must contain at least one number (0-9)!';
					return false;
				}
				re = /[a-z]/;
				if (!re.test(input.password)){
					if (mobile){
						errors = error_message_password;
						return false;
					}
					errors['password'] = 'Password must contain at least one lowercase letter (a-z)!';
					return false;
				}
				re = /[A-Z]/;
				if (!re.test(input.password)){
					if (mobile){
						errors = error_message_password;
						return false;
					}
					errors['password'] = 'Password must contain at least one uppercase letter (A-Z)!';
					return false;
				}
				re = /[<>{}]/;
				if (re.test(input.password)){
					if (mobile){
						errors = error_message_password;
						return false;
					}
					errors['password'] = 'Password can\'t contain this special character (<,>,{,})';
					return false;
				}
				return true;
			}
			return true;
		})(inputs);

		_.forEach(v.errors, (e, k) => {
			errors[k] = e.message || e;
		});
		v.errors = errors;
		if (customError){
			v = customError(v);
		}

		if (!_.isEmpty(v.errors)){
			if (mobile){
				return errorHandler(typeof v.errors === 'string' ? v.errors : v.errors[Object.keys(v.errors)[0]]);
			}
			throw httpErrors(422, v)
		}
	}
}

module.exports = Validate;
