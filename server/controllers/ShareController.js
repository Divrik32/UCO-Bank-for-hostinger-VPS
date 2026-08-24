const ShareInterest = require("../models/ShareInterest.js");
const CreditShare = require("../models/CreditShare.js");
const DebitShare = require("../models/DebitShare.js");
const PersonalInformation = require("../models/PersonalInformation.js");
const ShareOfficialDetails = require("../models/ShareOfficialDetails.js");
const { default: puppeteer } = require("puppeteer");
const loanAdjustmentModel = require("../loanModels/loanAdjustmentModel.js");

const generateTransactionId = async () => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";

  let id;

  do {
    id = "";

    // 3 uppercase letters
    for (let i = 0; i < 3; i++) {
      id += letters[
        Math.floor(Math.random() * letters.length)
      ];
    }

    // 2 numbers
    for (let i = 0; i < 2; i++) {
      id += numbers[
        Math.floor(Math.random() * numbers.length)
      ];
    }

    const exists =
      (await CreditShare.exists({
        transactionId: id,
      })) ||
      (await DebitShare.exists({
        transactionId: id,
      }));

    if (!exists) {
      return id;
    }

  } while (true);
};

/* ================= SHARE PAYMENT METHODS ================= */

exports.getSharePaymentMethods = async (req, res) => {
  try {
    const creditMethods = CreditShare.schema.path("paymentMode").enumValues;
    const debitMethods = DebitShare.schema.path("paymentMode").enumValues;
    return res.status(200).json({
      success: true,
      data: {
        creditMethods,
        debitMethods,
      },
    });
  } catch (error) {
    console.error(
      "Get share payment methods error:",
      error
    );
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment methods",
    });
  }
};

/* ================= MEMBER-WISE SHARE BALANCE ================= */

const getShareCurrentBalance = async (memberId) => {
  const credits = await CreditShare.find({ memberId });

  const debits = await DebitShare.find({ memberId });

  const loanAdjustments = await loanAdjustmentModel.find({
    memberId,
    paymentMode: {
      $in: [
        "Amount given from Share A/C",
        "Both",
      ],
    },
  });

  const totalCredit = credits.reduce(
    (sum, item) => sum + Number(item.investmentAmount || 0),
    0
  );

  const totalDebit = debits.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );

  const totalLoanAdjustment = loanAdjustments.reduce(
    (sum, item) => {
      if (item.paymentMode === "Both") {
        return sum + Number(item.shareAdjustmentAmount || 0);
      }

      return sum + Number(item.adjustmentAmount || 0);
    },
    0
  );

  return totalCredit - totalDebit - totalLoanAdjustment;
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
      memberId
   } = req.body;

  const transactionId = await generateTransactionId();

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

        transactionId,

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
    memberId
  } = req.body;

  const transactionId = await generateTransactionId();

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

      transactionId,

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

   const {memberId} = req.params;

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


   const baseUrl = `${req.protocol}://${req.get("host")}`;


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

exports.getMemberShareTransactions = async (req, res) => {
  try {
    // ==========================================
    // 1. Get ALL approved members
    // ==========================================
    const members = await PersonalInformation.find({
      approval_status: "approved",
    }).select(
      "memberId membershipNumber firstname lastname"
    );

    if (!members.length) {
      return res.status(404).json({
        success: false,
        message: "No approved members found",
      });
    }

    // ==========================================
    // 2. Get all memberIds
    // ==========================================
    const memberIds = members.map(
      (member) => member.memberId
    );

    // ==========================================
    // 3. Get ALL Credit Shares
    // ==========================================
    const credits = await CreditShare.find({
      memberId: { $in: memberIds },
    });

    // ==========================================
    // 4. Get ALL Debit Shares
    // ==========================================
    const debits = await DebitShare.find({
      memberId: { $in: memberIds },
    });

    // ==========================================
    // 5. Create member lookup
    // ==========================================
    const memberMap = new Map();

    members.forEach((member) => {
      memberMap.set(member.memberId, {
        memberId: member.memberId,

        membershipNumber:
          member.membershipNumber || "-",

        memberName:
          `${member.firstname} ${member.lastname}`,
      });
    });

    // ==========================================
    // 6. Format Credit Transactions
    // ==========================================
    const creditTransactions = credits.map(
      (item) => {
        const member =
          memberMap.get(item.memberId);

        return {
          memberId: item.memberId,

          membershipNumber: member
            ? member.membershipNumber
            : "-",

          memberName: member
            ? member.memberName
            : "-",

          transactionDate:
            item.createdAt,

          shareAmount:
            Number(item.investmentAmount || 0),

          paymentMode:
            item.paymentMode || "-",

          transactionId:
            item.transactionId || "-",

          transactionType:
            "Credit",
        };
      }
    );

    // ==========================================
    // 7. Format Debit Transactions
    // ==========================================
    const debitTransactions = debits.map(
      (item) => {
        const member =
          memberMap.get(item.memberId);

        return {
          memberId: item.memberId,

          membershipNumber: member
            ? member.membershipNumber
            : "-",

          memberName: member
            ? member.memberName
            : "-",

          transactionDate:
            item.createdAt,

          shareAmount:
            Number(item.amount || 0),

          paymentMode:
            item.paymentMode || "-",

          transactionId:
            item.transactionId || "-",

          transactionType:
            "Debit",
        };
      }
    );

    // ==========================================
    // 8. Merge Credit + Debit
    // ==========================================
    const allTransactions = [
      ...creditTransactions,
      ...debitTransactions,
    ];

    // ==========================================
    // 9. Latest → Earliest
    // ==========================================
    allTransactions.sort(
      (a, b) =>
        new Date(b.transactionDate) -
        new Date(a.transactionDate)
    );

    // ==========================================
    // 10. Add Serial Number
    // ==========================================
    const formattedData =
      allTransactions.map(
        (item, index) => ({
          serial: index + 1,
          ...item,
        })
      );

    // ==========================================
    // 11. Response
    // ==========================================
    return res.status(200).json({
      success: true,

      totalApprovedMembers:
        members.length,

      totalTransactions:
        formattedData.length,

      data: formattedData,
    });

  } catch (error) {
    console.error(
      "Get approved members share transactions error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.memberShareDetailsById = async (req, res) => {
  try {
    const { memberId } = req.params;

    // ==========================================
    // 1. Get Member Personal Information
    // ==========================================
    const member =
      await PersonalInformation.findOne({
        memberId: memberId,

        approval_status: "approved",
      });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    // ==========================================
    // 2. Get Member's ALL Credit Shares
    // ==========================================
    const credits =
      await CreditShare.find({
        memberId: memberId,
      }).sort({ createdAt: 1 });

    // ==========================================
    // 3. Get Member's ALL Debit Shares
    // ==========================================
    const debits =
      await DebitShare.find({
        memberId: memberId,
      }).sort({ createdAt: 1 });

    // ==========================================
    // 4. Format Credit Transactions
    // ==========================================
    const creditTransactions =
      credits.map((item) => ({
        transactionDate:
          item.createdAt,

        amount:
          Number(
            item.investmentAmount || 0
          ),

        paymentMode:
          item.paymentMode || "-",

        transactionId:
          item.transactionId || "-",

        transactionType:
          "Credit",
      }));

    // ==========================================
    // 5. Format Debit Transactions
    // ==========================================
    const debitTransactions =
      debits.map((item) => ({
        transactionDate:
          item.createdAt,

        amount:
          Number(
            item.amount || 0
          ),

        paymentMode:
          item.paymentMode || "-",

        transactionId:
          item.transactionId || "-",

        transactionType:
          "Debit",
      }));

    // ==========================================
    // 6. Merge Credit + Debit
    // ==========================================
    const transactions = [
      ...creditTransactions,
      ...debitTransactions,
    ];

    // ==========================================
    // 7. Latest → Earliest
    // ==========================================
    transactions.sort(
      (a, b) =>
        new Date(b.transactionDate) -
        new Date(a.transactionDate)
    );

    // ==========================================
    // 8. Calculate Summary
    // ==========================================
    const totalCreditAmount =
      creditTransactions.reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0
      );

    const totalDebitAmount =
      debitTransactions.reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0
      );

    const netShareAmount =
      totalCreditAmount -
      totalDebitAmount;

    // ==========================================
    // 9. First Transaction
    // ==========================================
    let firstTransactionDate = "-";

    if (transactions.length > 0) {

      const sortedTransactions = [
        ...transactions,
      ].sort(
        (a, b) =>
          new Date(a.transactionDate) -
          new Date(b.transactionDate)
      );

      firstTransactionDate =
        sortedTransactions[0]
          .transactionDate
          ? new Date(
              sortedTransactions[0]
                .transactionDate
            )
              .toLocaleDateString("en-GB")
              .replace(/\//g, "-")
          : "-";
    }

    // ==========================================
    // 10. Response
    // ==========================================
    return res.status(200).json({

      success: true,

      data: {

        // ================================
        // Member Information
        // ================================

        memberId:
          member.memberId,

        firstname:
          member.firstname,

        lastname:
          member.lastname,

        dob:
          member.dob,

        age:
          member.age,

        gender:
          member.gender,

        status:
          member.status,

        guardian_firstname:
          member.guardian_firstname,

        guardian_relation:
          member.guardian_relation,

        phoneno:
          member.phoneno,

        email:
          member.email,

        address_line1:
          member.address_line1,

        address_line2:
          member.address_line2,

        state:
          member.state,

        pincode:
          member.pincode,

        pf_no:
          member.pf_no,

        // ================================
        // Share Information
        // ================================

        firstTransactionDate,

        totalCreditAmount,

        totalDebitAmount,

        netShareAmount,

        // ================================
        // All Transactions
        // ================================

        transactions,
      },
    });

  } catch (error) {

    console.error(
      "Member share details error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.printMemberShareDetails = async (req, res) => {
  try {

    const { memberId } = req.params;

    // ==========================================
    // 1. Get Member Personal Information
    // ==========================================
    const member =
      await PersonalInformation.findOne({

        memberId: memberId,

        approval_status: "approved",

      });

    if (!member) {

      return res.status(404).json({

        success: false,

        message: "Member not found",

      });

    }

    // ==========================================
    // 2. Get ALL Credit Shares
    // ==========================================
    const credits =
      await CreditShare.find({

        memberId: memberId,

      }).sort({

        createdAt: 1,

      });

    // ==========================================
    // 3. Get ALL Debit Shares
    // ==========================================
    const debits =
      await DebitShare.find({

        memberId: memberId,

      }).sort({

        createdAt: 1,

      });

    // ==========================================
    // 4. Format Credit Transactions
    // ==========================================
    const creditTransactions =
      credits.map((item) => ({

        transactionDate:
          item.createdAt,

        amount:
          Number(
            item.investmentAmount || 0
          ),

        paymentMode:
          item.paymentMode || "-",

        transactionId:
          item.transactionId || "-",

        transactionType:
          "Credit",

      }));

    // ==========================================
    // 5. Format Debit Transactions
    // ==========================================
    const debitTransactions =
      debits.map((item) => ({

        transactionDate:
          item.createdAt,

        amount:
          Number(
            item.amount || 0
          ),

        paymentMode:
          item.paymentMode || "-",

        transactionId:
          item.transactionId || "-",

        transactionType:
          "Debit",

      }));

    // ==========================================
    // 6. Merge Transactions
    // ==========================================
    const transactions = [

      ...creditTransactions,

      ...debitTransactions,

    ];

    // ==========================================
    // 7. Latest → Earliest
    // ==========================================
    transactions.sort(

      (a, b) =>

        new Date(b.transactionDate) -

        new Date(a.transactionDate)

    );

    // ==========================================
    // 8. Calculate Totals
    // ==========================================

    const totalCreditAmount =
      creditTransactions.reduce(

        (sum, item) =>

          sum + Number(item.amount || 0),

        0

      );

    const totalDebitAmount =
      debitTransactions.reduce(

        (sum, item) =>

          sum + Number(item.amount || 0),

        0

      );

    const netShareAmount =
      totalCreditAmount -
      totalDebitAmount;

    // ==========================================
    // 9. First Transaction Date
    // ==========================================

    let firstTransactionDate = "-";

    if (transactions.length > 0) {

      const sortedTransactions = [

        ...transactions,

      ].sort(

        (a, b) =>

          new Date(a.transactionDate) -

          new Date(b.transactionDate)

      );

      firstTransactionDate =

        sortedTransactions[0]
          .transactionDate

          ? new Date(

              sortedTransactions[0]
                .transactionDate

            )

              .toLocaleDateString("en-GB")

              .replace(/\//g, "-")

          : "-";

    }

    // ==========================================
    // 10. Helpers
    // ==========================================

    const valueOrDash = (value) => {

      return (

        value !== undefined &&

        value !== null &&

        value !== ""

      )

        ? value

        : "-";

    };

    const formatDate = (date) => {

      if (!date) return "-";

      return new Date(date)

        .toLocaleDateString("en-GB")

        .replace(/\//g, "-");

    };

    // ==========================================
    // 11. Transaction Rows
    // ==========================================

    const transactionRows =

      transactions

        .map(

          (transaction, index) => `

            <tr>

              <td>

                ${index + 1}

              </td>

              <td>

                ${formatDate(

                  transaction.transactionDate

                )}

              </td>

              <td>

                ₹${Number(

                  transaction.amount || 0

                ).toLocaleString("en-IN")}

              </td>

              <td>

                ${valueOrDash(

                  transaction.paymentMode

                )}

              </td>

              <td>

                ${valueOrDash(

                  transaction.transactionId

                )}

              </td>

              <td>

                ${valueOrDash(

                  transaction.transactionType

                )}

              </td>

            </tr>

          `

        )

        .join("");

    // ==========================================
    // 12. HTML FOR PDF
    // ==========================================

    const html = `

      <!DOCTYPE html>

      <html>

      <head>

        <meta charset="UTF-8" />

        <style>

          * {
            box-sizing: border-box;
          }

          body {

            margin: 0;

            padding: 0;

            font-family:
              Arial,
              Helvetica,
              sans-serif;

            background: white;

            color: #333;

          }

          .container {

            width: 100%;

            padding: 20px;

          }

          .title {

            text-align: center;

            font-size: 24px;

            font-weight: 700;

            color: #012970;

            margin-bottom: 25px;

          }

          .card {

            border:
              1px solid #dee2e6;

            border-radius: 6px;

            margin-bottom: 22px;

            overflow: hidden;

          }

          .card-title {

            margin: 0;

            padding: 12px 15px;

            background: #f8f9fa;

            border-bottom:
              1px solid #dee2e6;

            font-size: 17px;

            font-weight: 700;

            color: #012970;

          }

          .details-grid {

            display: grid;

            grid-template-columns:
              1fr 1fr;

          }

          .detail-item {

            display: grid;

            grid-template-columns:
              45% 55%;

            min-height: 45px;

            border-right:
              1px solid #dee2e6;

            border-bottom:
              1px solid #dee2e6;

          }

          .detail-item:nth-child(even) {

            border-right: none;

          }

          .label {

            padding: 10px 12px;

            background: #f8f9fa;

            font-size: 13px;

            font-weight: 600;

            color: #444;

          }

          .value {

            padding: 10px 12px;

            font-size: 13px;

            color: #333;

            word-break: break-word;

          }

          table {

            width: 100%;

            border-collapse: collapse;

            font-size: 12px;

          }

          th {

            background: #f8f9fa;

            font-weight: 600;

            color: #444;

            border:
              1px solid #dee2e6;

            padding: 9px;

            text-align: center;

          }

          td {

            border:
              1px solid #dee2e6;

            padding: 9px;

            text-align: center;

            color: #333;

          }

          .footer {

            margin-top: 25px;

            text-align: center;

            font-size: 11px;

            color: #777;

          }

          @page {

            size: A4;

            margin: 15mm;

          }

        </style>

      </head>

      <body>

        <div class="container">

          <div class="title">

            Share Report Details

          </div>


          <!-- ================= MEMBER INFORMATION ================= -->

          <div class="card">

            <h2 class="card-title">

              Member Information

            </h2>

            <div class="details-grid">


              <div class="detail-item">

                <div class="label">

                  Member Code

                </div>

                <div class="value">

                  ${valueOrDash(

                    member.memberId

                  )}

                </div>

              </div>


              <div class="detail-item">

                <div class="label">

                  Member Name

                </div>

                <div class="value">

                  ${valueOrDash(

                    member.firstname

                  )}

                </div>

              </div>


              <div class="detail-item">

                <div class="label">

                  Last Name

                </div>

                <div class="value">

                  ${valueOrDash(

                    member.lastname

                  )}

                </div>

              </div>


              <div class="detail-item">

                <div class="label">

                  Member D.O.B

                </div>

                <div class="value">

                  ${formatDate(

                    member.dob

                  )}

                </div>

              </div>


              <div class="detail-item">

                <div class="label">

                  Age

                </div>

                <div class="value">

                  ${valueOrDash(

                    member.age

                  )}

                </div>

              </div>


              <div class="detail-item">

                <div class="label">

                  Gender

                </div>

                <div class="value">

                  ${valueOrDash(

                    member.gender

                  )}

                </div>

              </div>


              <div class="detail-item">

                <div class="label">

                  Status

                </div>

                <div class="value">

                  ${valueOrDash(

                    member.status

                  )}

                </div>

              </div>


              <div class="detail-item">

                <div class="label">

                  Guardian Name

                </div>

                <div class="value">

                  ${valueOrDash(

                    member.guardian_firstname

                  )}

                </div>

              </div>


              <div class="detail-item">

                <div class="label">

                  Guardian Relation

                </div>

                <div class="value">

                  ${valueOrDash(

                    member.guardian_relation

                  )}

                </div>

              </div>


              <div class="detail-item">

                <div class="label">

                  Phone

                </div>

                <div class="value">

                  ${valueOrDash(

                    member.phoneno

                  )}

                </div>

              </div>


              <div class="detail-item">

                <div class="label">

                  Email Id

                </div>

                <div class="value">

                  ${valueOrDash(

                    member.email

                  )}

                </div>

              </div>


              <div class="detail-item">

                <div class="label">

                  House/Flat No.

                </div>

                <div class="value">

                  ${valueOrDash(

                    member.address_line1

                  )}

                </div>

              </div>


              <div class="detail-item">

                <div class="label">

                  Street No./Area

                </div>

                <div class="value">

                  ${valueOrDash(

                    member.address_line2

                  )}

                </div>

              </div>


              <div class="detail-item">

                <div class="label">

                  State

                </div>

                <div class="value">

                  ${valueOrDash(

                    member.state

                  )}

                </div>

              </div>


              <div class="detail-item">

                <div class="label">

                  Pincode

                </div>

                <div class="value">

                  ${valueOrDash(

                    member.pincode

                  )}

                </div>

              </div>


              <div class="detail-item">

                <div class="label">

                  PF No

                </div>

                <div class="value">

                  ${valueOrDash(

                    member.pf_no

                  )}

                </div>

              </div>


            </div>

          </div>


          <!-- ================= SHARE INFORMATION ================= -->

          <div class="card">

            <h2 class="card-title">

              Share Information

            </h2>

            <div class="details-grid">


              <div class="detail-item">

                <div class="label">

                  First Transaction Date

                </div>

                <div class="value">

                  ${valueOrDash(

                    firstTransactionDate

                  )}

                </div>

              </div>


              <div class="detail-item">

                <div class="label">

                  Total Credit Amount

                </div>

                <div class="value">

                  ₹${Number(

                    totalCreditAmount

                  ).toLocaleString("en-IN")}

                </div>

              </div>


              <div class="detail-item">

                <div class="label">

                  Total Debit Amount

                </div>

                <div class="value">

                  ₹${Number(

                    totalDebitAmount

                  ).toLocaleString("en-IN")}

                </div>

              </div>


              <div class="detail-item">

                <div class="label">

                  Net Share Amount

                </div>

                <div class="value">

                  ₹${Number(

                    netShareAmount

                  ).toLocaleString("en-IN")}

                </div>

              </div>


            </div>

          </div>


          <!-- ================= TRANSACTION INFORMATION ================= -->

          <div class="card">

            <h2 class="card-title">

              Transaction Information

            </h2>

            <table>

              <thead>

                <tr>

                  <th>

                    Sl.

                  </th>

                  <th>

                    Transaction Date

                  </th>

                  <th>

                    Amount

                  </th>

                  <th>

                    Payment Mode

                  </th>

                  <th>

                    Transaction ID

                  </th>

                  <th>

                    Type

                  </th>

                </tr>

              </thead>

              <tbody>

                ${

                  transactionRows ||

                  `

                    <tr>

                      <td colspan="6">

                        No transactions found.

                      </td>

                    </tr>

                  `

                }

              </tbody>

            </table>

          </div>


          <div class="footer">

            Share Fund Report

          </div>

        </div>

      </body>

      </html>

    `;

    // ==========================================
    // 13. CREATE PDF USING PUPPETEER
    // ==========================================

    const browser =
      await puppeteer.launch({

        headless: true,

        args: [

          "--no-sandbox",

          "--disable-setuid-sandbox",

        ],

      });

    const page =
      await browser.newPage();

    await page.setContent(html, {

      waitUntil: "networkidle0",

    });

    const pdf =
      await page.pdf({

        format: "A4",

        printBackground: true,

        margin: {

          top: "15mm",

          right: "15mm",

          bottom: "15mm",

          left: "15mm",

        },

      });

    await browser.close();

    // ==========================================
    // 14. SHOW PDF IN BROWSER
    // ==========================================

    res.set({

      "Content-Type":
        "application/pdf",

      "Content-Disposition":
        `inline; filename="share-report-${memberId}.pdf"`,

      "Content-Length":
        pdf.length,

    });

    res.send(pdf);

  } catch (error) {

    console.error(
      "Member share PDF error:",
      error
    );

    res.status(500).json({

      success: false,

      message: error.message,

    });

  }
};

// ================= PRINT SHARE REPORT =================
exports.printShareReport = async (req, res) => {
  let browser;

  try {
    // ==========================================
    // 1. Get ALL approved members
    // ==========================================

    const members = await PersonalInformation.find({
      approval_status: "approved",
    })
      .select("memberId firstname lastname")
      .sort({ memberId: 1 });

    // ==========================================
    // 2. Get ALL member IDs
    // ==========================================

    const memberIds = members.map(
      (member) => member.memberId
    );

    // ==========================================
    // 3. Get ALL Credit Share entries
    // ==========================================

    const creditShares = await CreditShare.find({
      memberId: { $in: memberIds },
    });

    // ==========================================
    // 4. Get ALL Debit Share entries
    // ==========================================

    const debitShares = await DebitShare.find({
      memberId: { $in: memberIds },
    });

    // ==========================================
    // 5. Create Member Map
    // ==========================================

    const memberMap = new Map();

    members.forEach((member) => {
      memberMap.set(member.memberId, {
        memberId: member.memberId,

        memberName:
          `${member.firstname || ""} ${member.lastname || ""}`.trim(),
      });
    });

    // ==========================================
    // 6. Format Credit Share Transactions
    // ==========================================

    const creditTransactions = creditShares.map(
      (item) => {
        const member = memberMap.get(
          item.memberId
        );

        return {
          memberId: item.memberId,

          memberName: member
            ? member.memberName
            : "-",

          // CreditShare has timestamps: true
          transactionDate:
            item.createdAt,

          // CreditShare amount field
          investmentAmount:
            Number(item.investmentAmount || 0),

          paymentMode:
            item.paymentMode || "-",

          transactionId:
            item.transactionId || "-",

          transactionType: "Credit",
        };
      }
    );

    // ==========================================
    // 7. Format Debit Share Transactions
    // ==========================================

    const debitTransactions = debitShares.map(
      (item) => {
        const member = memberMap.get(
          item.memberId
        );

        return {
          memberId: item.memberId,

          memberName: member
            ? member.memberName
            : "-",

          // DebitShare has timestamps: true
          transactionDate:
            item.createdAt,

          // DebitShare amount field
          investmentAmount:
            Number(item.amount || 0),

          paymentMode:
            item.paymentMode || "-",

          transactionId:
            item.transactionId || "-",

          transactionType: "Debit",
        };
      }
    );

    // ==========================================
    // 8. Merge Credit + Debit Transactions
    // ==========================================

    const allTransactions = [
      ...creditTransactions,
      ...debitTransactions,
    ];

    // ==========================================
    // 9. Latest → Earliest
    // ==========================================

    allTransactions.sort((a, b) => {
      return (
        new Date(b.transactionDate) -
        new Date(a.transactionDate)
      );
    });

    // ==========================================
    // 10. Format Date
    // ==========================================

    const formatDate = (date) => {
      if (!date) return "-";

      const parsedDate = new Date(date);

      if (
        isNaN(parsedDate.getTime())
      ) {
        return "-";
      }

      return parsedDate
        .toLocaleDateString("en-GB")
        .replace(/\//g, "-");
    };

    // ==========================================
    // 11. Generate Table Rows
    // ==========================================

    const rows = allTransactions
      .map((transaction, index) => {
        return `
          <tr>

            <td>
              ${index + 1}
            </td>

            <td>
              ${transaction.memberId || "-"}
            </td>

            <td>
              ${transaction.memberName || "-"}
            </td>

            <td>
              ${formatDate(
                transaction.transactionDate
              )}
            </td>

            <td>
              ₹${Number(
                transaction.investmentAmount || 0
              ).toLocaleString("en-IN")}
            </td>

            <td>
              ${transaction.paymentMode || "-"}
            </td>

            <td>
              ${transaction.transactionId || "-"}
            </td>

            <td>
              ${transaction.transactionType || "-"}
            </td>

          </tr>
        `;
      })
      .join("");

    // ==========================================
    // 12. HTML
    // ==========================================

    const html = `
      <!DOCTYPE html>

      <html>

      <head>

        <meta charset="UTF-8">

        <title>
          Share Report
        </title>

        <style>

          * {
            box-sizing: border-box;
          }

          body {
            font-family:
              Arial,
              Helvetica,
              sans-serif;

            margin: 0;
            padding: 20px;

            color: #333;
          }

          .header {
            text-align: center;

            margin-bottom: 20px;
          }

          .title {
            font-size: 22px;

            font-weight: 700;

            color: #012970;

            margin-bottom: 8px;
          }

          .address {
            font-size: 13px;

            line-height: 1.5;
          }

          table {
            width: 100%;

            border-collapse:
              collapse;

            font-size: 10px;
          }

          th,
          td {
            border:
              1px solid #dee2e6;

            padding: 7px;

            text-align: center;

            vertical-align: middle;
          }

          th {
            background: #f8f9fa;

            font-weight: 600;

            color: #444;
          }

          @page {
            size: A4 landscape;

            margin: 12mm;
          }

        </style>

      </head>

      <body>

        <div class="header">

          <div class="title">
            Share Report
          </div>

          <div class="address">

            <strong>
              Regd. 203, Hari Om Commercial Complex
            </strong>

            <br />

            New Dak Bunglow Road,
            Patna-800001

          </div>

        </div>

        <table>

          <thead>

            <tr>

              <th>
                Sl.
              </th>

              <th>
                Member Code
              </th>

              <th>
                Member Name
              </th>

              <th>
                Transaction Date
              </th>

              <th>
                Amount
              </th>

              <th>
                Payment Mode
              </th>

              <th>
                Transaction ID
              </th>

              <th>
                Type
              </th>

            </tr>

          </thead>

          <tbody>

            ${
              rows ||
              `
                <tr>

                  <td colspan="8">
                    No share report found.
                  </td>

                </tr>
              `
            }

          </tbody>

        </table>

      </body>

      </html>
    `;

    // ==========================================
    // 13. Launch Puppeteer
    // ==========================================

    browser = await puppeteer.launch({
      headless: true,

      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
    });

    const page =
      await browser.newPage();

    // ==========================================
    // 14. Load HTML
    // ==========================================

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    // ==========================================
    // 15. Generate PDF
    // ==========================================

    const pdf = await page.pdf({
      format: "A4",

      landscape: true,

      printBackground: true,

      margin: {
        top: "12mm",
        right: "12mm",
        bottom: "12mm",
        left: "12mm",
      },
    });

    // ==========================================
    // 16. Send PDF
    // ==========================================

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      'inline; filename="share-report.pdf"'
    );

    res.end(pdf);

  } catch (error) {

    console.error(
      "Share report PDF error:",
      error
    );

    res.status(500).json({
      success: false,

      message:
        "Failed to generate share report PDF",

      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });

  } finally {

    if (browser) {
      await browser.close();
    }
  }
};