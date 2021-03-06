var truepillarsFields = 'Ref,Date,Description,Debit,Credit,Balance'.split(",")

function stripQuotes(string) {
  return string.replace(/"/g, "");
}

function transformTransaction(transaction, ynabConfig) {
  
  if (!transaction) {
    return null;
  }

  function dateSwizzle(date) {
    return transaction['Date'].split("-").reverse().join("/");
  }

  function beginsWith(type) {
    return transaction['Description'].search(type["match"]) == 0
  }

  function getCSV(type) {
    return type["getCSV"](transaction['Description'].substring(type["match"].length))
  }

  function cleanMoney(key) {
    return stripQuotes(transaction[key].replace("$", "").replace(",", ""))
  }

  // 07/25/10,Sample Payee,,Sample Memo for an outflow,100.00,
  var transactionTypes = [
    {"match": "Allocation of BPAY transfer...",
     "getCSV": function(item) { return null }
    },
    {"match": "Conversion of successful ...",
     "getCSV": function(item) { return null }
    },
    {"match": "Interest earned for investment ",
     "type": "interest",
     "getCSV": function(item) {
        return [dateSwizzle(), ynabConfig["interestPayee"], ynabConfig["interestCategory"], "Interest payment from " + item, "", cleanMoney("Credit")].join(",");
     }
    },
    {"match": "Capital returned for investment ",
     "type": "repayment",
     "getCSV": function(item) {
        return [dateSwizzle(), ynabConfig["loanAccount"], ynabConfig["capitalCategory"], "Capital repayment from " + item, "", cleanMoney("Credit")].join(",");
     }
    },
    {"match": "Cash withdrawal",
     "type": "withdrawal",
     "getCSV": function(item) {
        return [dateSwizzle(), ynabConfig["withdrawAccount"], "", "Withdrawal", cleanMoney("Debit"), ""].join(",");
     }
    }
  ]

  for (type of transactionTypes) {
    if (beginsWith(type)) {
      return getCSV(type);
    }
  }

  return null;
}


$( document ).ready(
  function() {
    pageReady();
    $("#convert").click(
      function() {convert(truepillarsFields)}
    )
  }
)
