const PersonalInformation = require("../models/PersonalInformation");

const OfficialEntry = require("../loanModels/officialEntryModel");
const ThriftFundEntry = require("../models/ThriftFundEntry");
const CreditShare = require("../models/CreditShare");

const DebitShare = require("../models/DebitShare");
const LoanPaymentForEmiDetails = require("../loanModels/loanPaymentForEmiDetailsModel");
const LoanAdjustment = require("../loanModels/loanAdjustmentModel");
const ThriftFundWithdrawal = require("../models/ThriftFundWithdrawal");


exports.getDashboardStats = async (req, res) => {
  try {
    // --------------------------------
    // Existing dashboard counts
    // --------------------------------

    const officialMembers = await OfficialEntry.distinct("memberId");

    const thriftMembers = await ThriftFundEntry.distinct("memberId");

    const creditShareMembers = await CreditShare.distinct("memberId");


    // --------------------------------
    // Approved members
    // --------------------------------

    const approvedMembers = await PersonalInformation.find({
      approval_status: "approved",
    }).select("memberId");


    // --------------------------------
    // Last 90 days date
    // --------------------------------

    const ninetyDaysAgo = new Date();

    ninetyDaysAgo.setDate(
      ninetyDaysAgo.getDate() - 90
    );


    // --------------------------------
    // Find members with transaction
    // in last 90 days
    // --------------------------------

    const activeMemberSets = await Promise.all([
      CreditShare.distinct("memberId", {
        creditDate: { $gte: ninetyDaysAgo },
      }),

      DebitShare.distinct("memberId", {
        debitDate: { $gte: ninetyDaysAgo },
      }),

      OfficialEntry.distinct("memberId", {
        transactionDate: { $gte: ninetyDaysAgo },
      }),

      LoanPaymentForEmiDetails.distinct("memberId", {
        transactionDate: { $gte: ninetyDaysAgo },
      }),

      LoanAdjustment.distinct("memberId", {
        createdAt: { $gte: ninetyDaysAgo },
      }),

      ThriftFundEntry.distinct("memberId", {
        entryDate: { $gte: ninetyDaysAgo },
      }),

      ThriftFundWithdrawal.distinct("memberId", {
        withdrawalDate: { $gte: ninetyDaysAgo },
      }),
    ]);


    // --------------------------------
    // Combine all active member IDs
    // --------------------------------

    const activeMemberIds = new Set();

    activeMemberSets.forEach((memberIds) => {
      memberIds.forEach((memberId) => {
        activeMemberIds.add(memberId);
      });
    });


    // --------------------------------
    // Only approved members
    // can be Active / Inactive
    // --------------------------------

    let activeMemberCount = 0;
    let inactiveMemberCount = 0;


    approvedMembers.forEach((member) => {
      if (activeMemberIds.has(member.memberId)) {
        activeMemberCount++;
      } else {
        inactiveMemberCount++;
      }
    });


    // --------------------------------
    // Response
    // --------------------------------

    res.status(200).json({
      success: true,

      data: {
        officialEntryCount: officialMembers.length,

        thriftFundCount: thriftMembers.length,

        creditShareCount: creditShareMembers.length,

        approvedMemberCount: approvedMembers.length,

        activeMemberCount,

        inactiveMemberCount,
      },
    });

  } catch (error) {

    console.error("Dashboard stats error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};