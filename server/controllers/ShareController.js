const ShareInterest = require("../models/ShareInterest");
const CreditShare = require("../models/CreditShare");
const DebitShare = require("../models/DebitShare");
const PersonalInformation = require("../models/PersonalInformation");
const ShareOfficialDetails = require("../models/ShareOfficialDetails");

/* ================= MEMBER-WISE SHARE BALANCE ================= */

const getShareCurrentBalance = async (memberId)=>{

 const credits =
   await CreditShare.find({ memberId });

 const debits =
   await DebitShare.find({ memberId });

 const totalCredit = credits.reduce(
   (sum,item)=>
      sum + item.investmentAmount,
   0
 );

 const totalDebit = debits.reduce(
   (sum,item)=>
      sum + item.amount,
   0
 );

 return totalCredit - totalDebit;

};



/* ================= SHARE INTEREST ================= */

exports.getShareInterest = async(req,res)=>{

 try{

   const data =
    await ShareInterest.findOne()
    .sort({createdAt:-1});

   res.status(200).json({
      success:true,
      data
   });

 }

 catch(error){

   res.status(500).json({
      success:false,
      message:error.message
   });

 }

};



exports.updateShareInterest = async(req,res)=>{

 try{

   const {
     rate,
     updatedBy,
     remarks
   } = req.body;

   let data =
     await ShareInterest.findOne();

   if(data){

      data.rate = rate;
      data.updatedBy = updatedBy;
      data.remarks = remarks;

      await data.save();

   }

   else{

      data =
       await ShareInterest.create({
         rate,
         updatedBy,
         remarks
       });

   }

   res.status(200).json({
      success:true,
      message:"Share interest updated successfully",
      data
   });

 }

 catch(error){

   res.status(500).json({
      success:false,
      message:error.message
   });

 }

};



/* ================= CREDIT SHARE ================= */

exports.createCreditShare = async(req,res)=>{

 try{

   const {
      memberId,
      transactionId
   } = req.body;


   // duplicate transaction check
   if(transactionId?.trim()){

      const existing =
       await CreditShare.findOne({
         transactionId
       });

      if(existing){

        return res.status(400).json({
          success:false,
          message:"Transaction ID already exists"
        });

      }

   }


   const currentBalance =
      await getShareCurrentBalance(
        memberId
      );

   const newBalance =
      currentBalance +
      Number(req.body.investmentAmount);


   const data =
      await CreditShare.create({

        ...req.body,

        transactionId:
         transactionId?.trim() ||
         undefined,

        availableBalance:
         currentBalance,

        remainingBalance:
         newBalance

      });


   res.status(201).json({
      success:true,
      message:"Credit share created successfully",
      data
   });

 }

 catch(error){

   res.status(500).json({
      success:false,
      message:error.message
   });

 }

};



exports.getAllCreditShare = async(req,res)=>{

 try{

   const {memberId}=req.params;

   const data =
      await CreditShare.find({
         memberId
      }).sort({createdAt:-1});

   res.status(200).json({
      success:true,
      data
   });

 }

 catch(error){

   res.status(500).json({
      success:false,
      message:error.message
   });

 }

};



/* ================= DEBIT SHARE ================= */

exports.createDebitShare = async(req,res)=>{

 try{

  const {
    memberId,
    transactionId
  } = req.body;


  if(transactionId?.trim()){

     const existing =
       await DebitShare.findOne({
         transactionId
       });

     if(existing){

       return res.status(400).json({
         success:false,
         message:"Transaction ID already exists"
       });

     }

  }



  const currentBalance =
    await getShareCurrentBalance(
      memberId
    );


  if(
    req.body.amount >
    currentBalance
  ){

    return res.status(400).json({
      success:false,
      message:"Insufficient share balance"
    });

  }



 const remainingBalance =
    currentBalance -
    Number(req.body.amount);



 const data =
   await DebitShare.create({

      ...req.body,

      transactionId:
        transactionId?.trim() ||
        undefined,

      availableBalance:
        currentBalance,

      remainingBalance

   });


 res.status(201).json({
   success:true,
   message:"Debit share created successfully",
   data
 });

}

catch(error){

 res.status(500).json({
   success:false,
   message:error.message
 });

}

};



exports.getAllDebitShare = async(req,res)=>{

 try{

   const {memberId}=req.params;

   const data =
     await DebitShare.find({
        memberId
     }).sort({createdAt:-1});

   res.status(200).json({
      success:true,
      data
   });

 }

 catch(error){

   res.status(500).json({
      success:false,
      message:error.message
   });

 }

};



/* ================= SHARE AVAILABLE BALANCE ================= */

exports.getShareAvailableBalance =
async(req,res)=>{

 try{

   const {memberId}=req.params;

   const availableBalance =
      await getShareCurrentBalance(
        memberId
      );

   res.status(200).json({
      success:true,
      memberId,
      availableBalance
   });

 }

 catch(error){

   res.status(500).json({
      success:false,
      message:error.message
   });

 }

};



/* ================= TOTAL SHARE TRANSACTIONS ================= */

exports.getShareTransactionDetails =
async(req,res)=>{

 try{

   const {memberId}=req.params;

   const credits =
      await CreditShare.find({
         memberId
      });

   const debits =
      await DebitShare.find({
         memberId
      });


   const creditTx =
      credits.map(item=>({

         amount:
           item.investmentAmount,

         type:"Credit",

         date:item.createdAt,

         transactionId:
           item.transactionId

      }));


   const debitTx =
      debits.map(item=>({

         amount:item.amount,

         type:"Debit",

         date:item.createdAt,

         transactionId:
          item.transactionId

      }));



   const allTransactions =
      [
        ...creditTx,
        ...debitTx
      ].sort(
        (a,b)=>
         new Date(a.date) -
         new Date(b.date)
      );


   const formatted =
      allTransactions.map(
        (item,index)=>({
            serial:index+1,
            ...item
        })
      );


   res.status(200).json({
      success:true,
      totalTransactions:
        formatted.length,
      data:formatted
   });

 }

 catch(error){

   res.status(500).json({
      success:false,
      message:error.message
   });

 }

};



/* ================= MEMBER SEARCH ================= */

// exports.getMemberByMemberId =
// async(req,res)=>{

//  try{

//    const {memberId}=req.params;

//    const member =
//     await PersonalInformation.findOne({
//       memberId:memberId.trim()
//     }).select(
//       "firstname lastname email phoneno profile_image signature_image memberId"
//     );


//    if(!member){

//      return res.status(404).json({
//        success:false,
//        message:"Member not found"
//      });

//    }


//    const baseUrl =
//     `${req.protocol}://${req.get("host")}`;


//    res.status(200).json({

//       success:true,

//       data:{
//         memberId:member.memberId,
//         name:
//          `${member.firstname} ${member.lastname}`,
//         email:member.email,
//         phoneNumber:member.phoneno,

//         profileImage:
//          member.profile_image
//           ? `${baseUrl}/${member.profile_image.replace(/\\/g,"/")}`
//           : "",

//         signatureImage:
//          member.signature_image
//           ? `${baseUrl}/${member.signature_image.replace(/\\/g,"/")}`
//           : ""

//       }

//    });

//  }

//  catch(error){

//    res.status(500).json({
//       success:false,
//       message:error.message
//    });

//  }

// };

/* ================= SAVE / UPDATE OFFICIAL DETAILS ================= */

exports.saveOfficialDetails =
async(req,res)=>{

try{

 const {
   memberId,
   officeName,
   dateOfJoin,
   dateOfAllotment,
   dateOfRetirement
 } = req.body;


 let data =
   await ShareOfficialDetails.findOne({
      memberId
   });


 if(data){

    data.officeName =
      officeName;

    data.dateOfJoin =
      dateOfJoin;

    data.dateOfAllotment =
      dateOfAllotment;

    data.dateOfRetirement =
      dateOfRetirement;

    await data.save();

    return res.status(200).json({
       success:true,
       message:
        "Official details updated successfully",
       data
    });

 }


 data =
  await ShareOfficialDetails.create({

     memberId,
     officeName,
     dateOfJoin,
     dateOfAllotment,
     dateOfRetirement

  });


 return res.status(201).json({

    success:true,
    message:
      "Official details saved successfully",

    data

 });


}

catch(error){

 return res.status(500).json({

    success:false,
    message:error.message

 });

}

};



/* ================= GET BY MEMBER ID ================= */

exports.getOfficialDetails =
async(req,res)=>{

try{

 const {memberId} =
   req.params;


 const data =
   await ShareOfficialDetails.findOne({
      memberId
   });


 if(!data){

   return res.status(404).json({
      success:false,
      message:"Official details not found"
   });

 }


 return res.status(200).json({

    success:true,
    data

 });

}

catch(error){

 return res.status(500).json({

   success:false,
   message:error.message

 });

}

};


exports.getMemberByMemberId =
async (req,res)=>{

 try{

   const {memberId} =
      req.params;

   const member =
    await PersonalInformation.findOne({
      memberId: memberId.trim()
    }).select(
      "firstname lastname email phoneno profile_image signature_image memberId"
    );


   if(!member){

     return res.status(404).json({
       success:false,
       message:"Member not found"
     });

   }


   const baseUrl =
    `${req.protocol}://${req.get("host")}`;


   return res.status(200).json({

      success:true,

      data:{
        memberId:member.memberId,

        name:
         `${member.firstname} ${member.lastname}`,

        email:
         member.email,

        phoneNumber:
         member.phoneno,

        profileImage:
         member.profile_image
          ? `${baseUrl}/${member.profile_image.replace(/\\/g,"/")}`
          : "",

        signatureImage:
         member.signature_image
          ? `${baseUrl}/${member.signature_image.replace(/\\/g,"/")}`
          : ""

      }

   });

 }

 catch(error){

   return res.status(500).json({
      success:false,
      message:error.message
   });

 }

};