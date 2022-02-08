const Validate = require("./validate");
const {error_message_phoneNumber} = require("../utils/resMessage");
const {TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SERVICE_SID, TEST_MODE} = process.env;

const twilio = require("twilio")(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

sendVerifyCode = async (phoneNumber) => {
  try {
    await Validate({phoneNumber}, {
      phoneNumber: 'string|required|minLength:9|maxLength:12',
    })
    const errors = await Validate({phoneNumber}, {
      phoneNumber: 'string|required|minLength:9|maxLength:20',
    }, {phoneNumber}, true, void 0, {phoneNumber: error_message_phoneNumber})
    if (errors){
      return errors;
    }

    if (TEST_MODE){
      return {status: "pending", code: 1111, sid: "testSid123"}
    } else{
      return await twilio.verify
        .services(TWILIO_SERVICE_SID)
        .verifications
        .create({
          to: phoneNumber,
          channel: "sms",
        })
        .catch((err) => {
          console.log(`code send to ${ phoneNumber } failed err ${ err }`)
        })
    }
  } catch (error) {
    console.log(`Send verify code error ${ error }`)
  }
}

checkVerifyCode = async (phoneNumber, code) => {
  try {
    await Validate({phoneNumber, code}, {
      phoneNumber: 'string|required|minLength:9|maxLength:12',
      code: 'integer|required|minLength:4|maxLength:4',
    })

    if (TEST_MODE){
      if (code === "1111"){
        return {status: "approved", sid: "testSid123"}
      } else{
        return {status: "pending", sid: "testSid123"}
      }
    } else{
      return await twilio.verify
        .services(TWILIO_SERVICE_SID)
        .verificationChecks
        .create({
          to: phoneNumber,
          code: code
        });
    }
  } catch (error) {
    console.log(`Check verify code error ${ error }`)
  }
}

module.exports = {sendVerifyCode, checkVerifyCode};
