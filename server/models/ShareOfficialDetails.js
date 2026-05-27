const mongoose = require("mongoose");

const shareOfficialDetailsSchema =
new mongoose.Schema(
{
   memberId:{
      type:String,
      required:true,
      trim:true,
      unique:true
   },

   officeName:{
      type:String,
      required:true,
      trim:true
   },

   dateOfJoin:{
      type:Date,
      required:true
   },

   dateOfAllotment:{
      type:Date,
      required:true
   },

   dateOfRetirement:{
      type:Date,
      required:true
   }

},
{
   timestamps:true
}
);

module.exports = mongoose.model(
   "ShareOfficialDetails",
   shareOfficialDetailsSchema
);