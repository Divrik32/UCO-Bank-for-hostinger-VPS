const InterestRate = require("../models/InterestRate.js");
const ThriftFundEntry = require("../models/ThriftFundEntry.js");
const ThriftFundWithdrawal = require("../models/ThriftFundWithdrawal.js");
const PersonalInformation = require("../models/PersonalInformation.js");
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
      (await ThriftFundEntry.exists({
        transactionId: id,
      })) ||
      (await ThriftFundWithdrawal.exists({
        transactionId: id,
      }));

    if (!exists) {
      return id;
    }

  } while (true);
};

const getThriftPaymentMethods = async (req, res) => {
  try {
    const entryMethods = ThriftFundEntry.schema.path("paymentMethod").enumValues;
    const withdrawalMethods = ThriftFundWithdrawal.schema.path("paymentMethod").enumValues;
    res.status(200).json({
      success: true,
      data: {
        entryMethods,
        withdrawalMethods,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment methods",
    });
  }
};

const getCurrentBalance = async (memberId) => {
  const entries = await ThriftFundEntry.find({ memberId });

  const withdrawals = await ThriftFundWithdrawal.find({
    memberId,
  });

  const loanAdjustments = await loanAdjustmentModel.find({
    memberId,
    paymentMode: {
      $in: [
        "Amount given from thrift A/C",
        "Both",
      ],
    },
  });

  const totalCredit = entries.reduce(
    (sum, item) => sum + Number(item.totalAmountReceived || 0),
    0
  );

  const totalWithdrawal = withdrawals.reduce(
    (sum, item) => sum + Number(item.withdrawalAmount || 0),
    0
  );

  const totalLoanAdjustment = loanAdjustments.reduce(
    (sum, item) => {
      if (item.paymentMode === "Both") {
        return sum + Number(item.thriftAdjustmentAmount || 0);
      }

      return sum + Number(item.adjustmentAmount || 0);
    },
    0
  );

  return totalCredit - totalWithdrawal - totalLoanAdjustment;
};

// ================= CREATE ENTRY =================
const createThriftEntry = async (req, res) => {
  try {
    const {
      memberId,
      totalAmountReceived,
      paymentMethod,
      chequeNumber,
      receivedBy,
    } = req.body;

    const transactionId = await generateTransactionId();

    const interestData = await InterestRate.findOne();
    const rate = interestData ? interestData.rate : 7;

    const yearlyInterestAmount = (totalAmountReceived * rate) / 100;

    const currentBalance =
      await getCurrentBalance(memberId);

    const newBalance =
      currentBalance + Number(totalAmountReceived);

    const entry = await ThriftFundEntry.create({
      memberId,
      totalAmountReceived,
      paymentMethod,
      transactionId,
      chequeNumber,
      receivedBy,
      yearlyInterestAmount,
      availableBalance: currentBalance,
      remainingBalance: newBalance,
    });

    return res.status(201).json({
      success: true,
      message: "Entry created successfully",
      data: entry,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ================= CREATE WITHDRAWAL =================
const createThriftWithdrawal = async (req, res) => {
  try {
    const {
      memberId,
      withdrawalAmount,
      paymentMethod,
      chequeNumber,
      approvedBy,
    } = req.body;


    const transactionId = await generateTransactionId();

    const currentBalance =
      await getCurrentBalance(memberId);

    if (withdrawalAmount > currentBalance) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance",
      });
    }

    const remainingBalance =
      currentBalance - Number(withdrawalAmount);

    const withdrawal =
      await ThriftFundWithdrawal.create({
        memberId,
        withdrawalAmount,
        paymentMethod,
        transactionId,
        chequeNumber,
        approvedBy,
        availableBalance: currentBalance,
        remainingBalance,
      });

    return res.status(201).json({
      success: true,
      message: "Withdrawal successful",
      data: withdrawal,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getTotalTransactionDetails = async (req, res) => {
  try {
    const { memberId } = req.params;

    // Get interest rate
    const interestData = await InterestRate.findOne();
    const rate = interestData ? interestData.rate : 7;

    // Fetch all entries
    const entries = await ThriftFundEntry.find({ memberId });

    // Fetch all withdrawals
    const withdrawals = await ThriftFundWithdrawal.find({
      memberId,
    });

    // Format entries as CREDIT
    const creditTransactions = entries.map((item) => ({
      amount: item.totalAmountReceived,
      type: "Credit",
      date: item.entryDate,
      interest:
        (item.totalAmountReceived * rate * 1) / 1200,
      transactionId: item.transactionId,
    }));

    // Format withdrawals as DEBIT
    const debitTransactions = withdrawals.map((item) => ({
      amount: item.withdrawalAmount,
      type: "Debit",
      date: item.withdrawalDate,
      interest: "",
      transactionId: item.transactionId,
    }));

    // Merge + sort by date
    const allTransactions = [
      ...creditTransactions,
      ...debitTransactions,
    ].sort((a, b) => new Date(a.date) - new Date(b.date));

    // Add serial number
    const formattedData = allTransactions.map(
      (item, index) => ({
        serial: index + 1,
        ...item,
      })
    );

    return res.status(200).json({
      success: true,
      totalTransactions: formattedData.length,
      data: formattedData,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getMemberByMemberId = async (req, res) => {
  try {
    const { memberId } = req.params;

    const member = await PersonalInformation.findOne({
      memberId: memberId.trim(),
    }).select(
      "firstname lastname email phoneno profile_image signature_image memberId"
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Member not found",
      });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    return res.status(200).json({
      success: true,
      data: {
        memberId: member.memberId,
        name: `${member.firstname} ${member.lastname}`,
        email: member.email,
        phoneNumber: member.phoneno,

        profileImage: member.profile_image
          ? `${baseUrl}/${member.profile_image.replace(/\\/g, "/")}`
          : "",

        signatureImage: member.signature_image
          ? `${baseUrl}/${member.signature_image.replace(/\\/g, "/")}`
          : "",
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAvailableBalance = async (req, res) => {
  try {
    const { memberId } = req.params;

    const availableBalance =
      await getCurrentBalance(memberId);

    return res.status(200).json({
      success: true,
      memberId,
      availableBalance,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= GET MEMBER THRIFT TRANSACTIONS =================
const getMemberThriftTransactions = async (req, res) => {
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
    // 3. Get ALL thrift entries
    //    belonging to approved members
    // ==========================================
    const entries = await ThriftFundEntry.find({
      memberId: { $in: memberIds },
    });

    // ==========================================
    // 4. Get ALL withdrawals
    //    belonging to approved members
    // ==========================================
    const withdrawals =
      await ThriftFundWithdrawal.find({
        memberId: { $in: memberIds },
      });

    // ==========================================
    // 5. Create member lookup
    // ==========================================
    const memberMap = new Map();

    members.forEach((member) => {
      memberMap.set(member.memberId, {
        memberId: member.memberId,
        membershipNumber: member.membershipNumber || "-",
        memberName: `${member.firstname} ${member.lastname}`,
      });
    });

    // ==========================================
    // 6. Format Thrift Entries
    // ==========================================
    const entryTransactions = entries.map(
      (item) => {
        const member = memberMap.get(item.memberId);

        return {
          memberId: item.memberId,
          membershipNumber: member? member.membershipNumber: "-",
          memberName: member? member.memberName: "-",
          transactionDate: item.entryDate,
          thriftAmount: item.totalAmountReceived,
          interest: item.yearlyInterestAmount || 0,
          paymentMode: item.paymentMethod,
          transactionId:item.transactionId || "-",
          transactionType: "Entry",
        };
      }
    );

    // ==========================================
    // 7. Format Thrift Withdrawals
    // ==========================================
    const withdrawalTransactions =
      withdrawals.map((item) => {
        const member = memberMap.get(
          item.memberId
        );

        return {
          memberId: item.memberId,
          membershipNumber: member? member.membershipNumber : "-",
          memberName: member? member.memberName: "-",
          transactionDate: item.withdrawalDate,
          thriftAmount: item.withdrawalAmount,
          interest: "-",
          paymentMode: item.paymentMethod,
          transactionId:item.transactionId || "-",
          transactionType: "Withdrawal",
        };
      });

    // ==========================================
    // 8. Merge Entry + Withdrawal
    // ==========================================
    const allTransactions = [
      ...entryTransactions,
      ...withdrawalTransactions,
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
      "Get approved members thrift transactions error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const memberThriftDetailsById = async (req, res) => {
  try {
    const { memberId } = req.params;

    // ==========================================
    // 1. Get Member Personal Information
    // ==========================================
    const member = await PersonalInformation.findOne({
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
    // 2. Get Member's ALL Thrift Entries
    // ==========================================
    const entries = await ThriftFundEntry.find({
      memberId: memberId,
    }).sort({ entryDate: 1 });

    // ==========================================
    // 3. Get Member's ALL Thrift Withdrawals
    // ==========================================
    const withdrawals = await ThriftFundWithdrawal.find({
      memberId: memberId,
    }).sort({ withdrawalDate: 1 });

    // ==========================================
    // 4. Format Entry Transactions
    // ==========================================
    const entryTransactions = entries.map((item) => ({
      transactionDate: item.entryDate,

      amount: Number(
        item.totalAmountReceived || 0
      ),

      interest: Number(
        item.yearlyInterestAmount || 0
      ),

      paymentMode: item.paymentMethod || "-",

      transactionId:
        item.transactionId || "-",

      transactionType: "Entry",
    }));

    // ==========================================
    // 5. Format Withdrawal Transactions
    // ==========================================
    const withdrawalTransactions =
      withdrawals.map((item) => ({
        transactionDate:
          item.withdrawalDate,

        amount: Number(
          item.withdrawalAmount || 0
        ),

        interest: "-",

        paymentMode:
          item.paymentMethod || "-",

        transactionId:
          item.transactionId || "-",

        transactionType: "Withdrawal",
      }));

    // ==========================================
    // 6. Merge Entry + Withdrawal
    // ==========================================
    const transactions = [
      ...entryTransactions,
      ...withdrawalTransactions,
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
    const totalEntryAmount = entryTransactions.reduce(
      (sum, item) =>
        sum + Number(item.amount || 0),
      0
    );

    const totalWithdrawalAmount =
      withdrawalTransactions.reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0
      );

    const totalInterest = entryTransactions.reduce(
      (sum, item) =>
        sum + Number(item.interest || 0),
      0
    );

    const netThriftAmount =
      totalEntryAmount -
      totalWithdrawalAmount;

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
        sortedTransactions[0].transactionDate
          ? new Date(
              sortedTransactions[0].transactionDate
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
        memberId: member.memberId,

        firstname: member.firstname,
        lastname: member.lastname,

        dob: member.dob,
        age: member.age,

        gender: member.gender,
        status: member.status,

        guardian_firstname:
          member.guardian_firstname,

        guardian_relation:
          member.guardian_relation,

        phoneno: member.phoneno,
        email: member.email,

        address_line1:
          member.address_line1,

        address_line2:
          member.address_line2,

        state: member.state,
        pincode: member.pincode,

        pf_no: member.pf_no,

        // ================================
        // Thrift Information
        // ================================
        firstTransactionDate,

        totalEntryAmount,

        totalWithdrawalAmount,

        totalInterest,

        netThriftAmount,

        // ================================
        // All Transactions
        // ================================
        transactions,
      },
    });
  } catch (error) {
    console.error(
      "Member thrift details error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const printMemberThriftDetails = async (req, res) => {
  try {
    const { memberId } = req.params;

    // ==========================================
    // 1. Get Member Personal Information
    // ==========================================
    const member = await PersonalInformation.findOne({
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
    // 2. Get ALL Thrift Entries
    // ==========================================
    const entries = await ThriftFundEntry.find({
      memberId: memberId,
    }).sort({ entryDate: 1 });

    // ==========================================
    // 3. Get ALL Thrift Withdrawals
    // ==========================================
    const withdrawals =
      await ThriftFundWithdrawal.find({
        memberId: memberId,
      }).sort({ withdrawalDate: 1 });

    // ==========================================
    // 4. Format Entries
    // ==========================================
    const entryTransactions =
      entries.map((item) => ({
        transactionDate:
          item.entryDate,

        amount: Number(
          item.totalAmountReceived || 0
        ),

        interest: Number(
          item.yearlyInterestAmount || 0
        ),

        paymentMode:
          item.paymentMethod || "-",

        transactionId:
          item.transactionId || "-",

        transactionType: "Entry",
      }));

    // ==========================================
    // 5. Format Withdrawals
    // ==========================================
    const withdrawalTransactions =
      withdrawals.map((item) => ({
        transactionDate:
          item.withdrawalDate,

        amount: Number(
          item.withdrawalAmount || 0
        ),

        interest: "-",

        paymentMode:
          item.paymentMethod || "-",

        transactionId:
          item.transactionId || "-",

        transactionType: "Withdrawal",
      }));

    // ==========================================
    // 6. Merge Transactions
    // ==========================================
    const transactions = [
      ...entryTransactions,
      ...withdrawalTransactions,
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
    const totalEntryAmount =
      entryTransactions.reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0
      );

    const totalWithdrawalAmount =
      withdrawalTransactions.reduce(
        (sum, item) =>
          sum + Number(item.amount || 0),
        0
      );

    const totalInterest =
      entryTransactions.reduce(
        (sum, item) =>
          sum + Number(item.interest || 0),
        0
      );

    const netThriftAmount =
      totalEntryAmount -
      totalWithdrawalAmount;

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
        sortedTransactions[0].transactionDate
          ? new Date(
              sortedTransactions[0].transactionDate
            )
              .toLocaleDateString("en-GB")
              .replace(/\//g, "-")
          : "-";
    }

    // ==========================================
    // 10. Helpers
    // ==========================================
    const valueOrDash = (value) => {
      return value !== undefined &&
        value !== null &&
        value !== ""
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
                ${
                  transaction.interest === "-"
                    ? "-"
                    : `₹${Number(
                        transaction.interest || 0
                      ).toLocaleString("en-IN")}`
                }
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
            border: 1px solid #dee2e6;

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

            border-collapse:
              collapse;

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
            Thrift Fund Report Details
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


          <!-- ================= THRIFT INFORMATION ================= -->

          <div class="card">

            <h2 class="card-title">
              Thrift Information
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
                  Total Entry Amount
                </div>

                <div class="value">
                  ₹${Number(
                    totalEntryAmount
                  ).toLocaleString("en-IN")}
                </div>

              </div>


              <div class="detail-item">

                <div class="label">
                  Total Withdrawal Amount
                </div>

                <div class="value">
                  ₹${Number(
                    totalWithdrawalAmount
                  ).toLocaleString("en-IN")}
                </div>

              </div>


              <div class="detail-item">

                <div class="label">
                  Total Interest
                </div>

                <div class="value">
                  ₹${Number(
                    totalInterest
                  ).toLocaleString("en-IN")}
                </div>

              </div>


              <div class="detail-item">

                <div class="label">
                  Net Thrift Amount
                </div>

                <div class="value">
                  ₹${Number(
                    netThriftAmount
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
                    Interest
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
                      <td colspan="7">
                        No transactions found.
                      </td>
                    </tr>
                  `
                }

              </tbody>

            </table>

          </div>


          <div class="footer">
            Thrift Fund Report
          </div>

        </div>

      </body>

      </html>
    `;

    // ==========================================
    // 13. CREATE PDF USING PUPPETEER
    // ==========================================

    const browser = await puppeteer.launch({
      headless: true,

      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
      ],
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    const pdf = await page.pdf({
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
      "Content-Type": "application/pdf",

      "Content-Disposition":
        `inline; filename="thrift-report-${memberId}.pdf"`,

      "Content-Length": pdf.length,
    });

    res.send(pdf);

  } catch (error) {

    console.error(
      "Member thrift PDF error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ================= PRINT THRIFT FUND REPORT =================
const printThriftFundReport = async (req, res) => {
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
    // 3. Get ALL thrift entries
    // ==========================================

    const entries = await ThriftFundEntry.find({
      memberId: { $in: memberIds },
    });

    // ==========================================
    // 4. Get ALL withdrawals
    // ==========================================

    const withdrawals =
      await ThriftFundWithdrawal.find({
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
          `${member.firstname} ${member.lastname}`,
      });
    });

    // ==========================================
    // 6. Format Entry Transactions
    // ==========================================

    const entryTransactions = entries.map(
      (item) => {
        const member = memberMap.get(
          item.memberId
        );

        return {
          memberId: item.memberId,

          memberName: member
            ? member.memberName
            : "-",

          transactionDate:
            item.entryDate,

          amount: Number(
            item.totalAmountReceived || 0
          ),

          interest: Number(
            item.yearlyInterestAmount || 0
          ),

          paymentMode:
            item.paymentMethod || "-",

          transactionId:
            item.transactionId || "-",

          transactionType: "Entry",
        };
      }
    );

    // ==========================================
    // 7. Format Withdrawal Transactions
    // ==========================================

    const withdrawalTransactions =
      withdrawals.map((item) => {
        const member = memberMap.get(
          item.memberId
        );

        return {
          memberId: item.memberId,

          memberName: member
            ? member.memberName
            : "-",

          transactionDate:
            item.withdrawalDate,

          amount: Number(
            item.withdrawalAmount || 0
          ),

          interest: "-",

          paymentMode:
            item.paymentMethod || "-",

          transactionId:
            item.transactionId || "-",

          transactionType: "Withdrawal",
        };
      });

    // ==========================================
    // 8. Merge Transactions
    // ==========================================

    const allTransactions = [
      ...entryTransactions,
      ...withdrawalTransactions,
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
    // 10. Format Date
    // ==========================================

    const formatDate = (date) => {
      if (!date) return "-";

      const parsedDate = new Date(date);

      if (isNaN(parsedDate.getTime())) {
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
      .map(
        (transaction, index) => {
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
                  transaction.amount || 0
                ).toLocaleString("en-IN")}
              </td>

              <td>
                ${
                  transaction.interest === "-"
                    ? "-"
                    : `₹${Number(
                        transaction.interest || 0
                      ).toLocaleString("en-IN")}`
                }
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
        }
      )
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
          Thrift Fund Report
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
            Thrift Fund Report
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
                Interest
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
                  <td colspan="9">
                    No thrift fund report found.
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
      'inline; filename="thrift-fund-report.pdf"'
    );

    res.end(pdf);

  } catch (error) {

    console.error(
      "Thrift fund report PDF error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to generate thrift fund report PDF",
    });

  } finally {

    if (browser) {
      await browser.close();
    }
  }
};

module.exports = {
  getThriftPaymentMethods,
  createThriftEntry,
  createThriftWithdrawal,
  getTotalTransactionDetails,
  getMemberByMemberId,
  getAvailableBalance,
  getMemberThriftTransactions,
  memberThriftDetailsById,
  printMemberThriftDetails,
  printThriftFundReport
};