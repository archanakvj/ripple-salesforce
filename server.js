var express = require("express");
var app = express();
var bodyParser = require('body-parser');
app.use(express.static('public'));
app.use(bodyParser.json());
var RippleAPI = require('ripple-lib').RippleAPI
var api       = new RippleAPI({ server: 'wss://s.altnet.rippletest.net:51233' }) // Public rippled server
var myAddress = 'rhkvquYzzvzYhhvBthdXAx4mtGKnwiukz1'
var mySecret  = 'sn5AhH5V3zJ1rpmZu9RXU6xMc96sw'
app.get('/transaction', function(req, res) {
api.on('error', function (errorCode, errorMessage) {
  console.log(errorCode + ': ' + errorMessage)
})
api.on('connected', function () {

  console.log('connected')


  console.log('getting account info for', myAddress)
  api.getAccountInfo(myAddress).then(function(info){
    console.log('getAccountInfo done, info: ', info)

    var serverstate = api.getServerInfo().then(function (ss) {

      console.log('getServerState', ss)

      var _fee = (ss.validatedLedger.baseFeeXRP*1000*1000)+""

      api.getFee().then(function(e){
        console.log('Estimated fee= ', parseFloat(e)*1000*1000)
      })

      if(parseInt(_fee) > 20){
        _fee = 20
      }

      var transaction = {
          "TransactionType" : "Payment",
          "Account" : myAddress,
          "Fee" : _fee,
          "Destination" : "rMofb3qnbYWrNqdy96iMwNEeSaFo8Dg5QY",
          "Amount" : (10*1000*1000)+"",
          "LastLedgerSequence" : ss.validatedLedger.ledgerVersion+4,
          "Sequence" : info.sequence
          // "Amount" : {
            // "currency" : "XRP",
            // "issuer" : myAddress,
            // "value" : (1*1000*1000)+""
          // }
       }

       // transaction = {"tx_json" : transaction }

       console.log('Transaction: ', transaction)

       var txJSON = JSON.stringify(transaction)
       console.log(txJSON)

       var transactionSigned = api.sign(txJSON,mySecret)

       console.log('Signed Transaction: ', transactionSigned)
       // console.log(transactionSigned.signedTransaction)
       // transactionSigned.id (eg 884A6C2F0340EFAC231AAB20627C58CB9890EDA66E2FEA9B175BB61FE3CA2916)
       // = required to check details

       api.submit(transactionSigned.signedTransaction).then(function(data){
          console.log(data)

          console.log('Tentative Result: ', data.resultCode);
          console.log('Tentative Message: ', data.resultMessage);


          var checkTransactionStatus = setInterval(function(){
              console.log('Checking Transaction Resutls')

               api.getLedgerVersion().then(function(d){
                var ledgerVersion = parseInt(d)
                console.log('Ledger = @ version ', ledgerVersion)

                if(ledgerVersion > ss.validatedLedger.ledgerVersion && ledgerVersion <= ss.validatedLedger.ledgerVersion+4){
                  console.log('... getting transaction ... ')

                     api.getTransaction(transactionSigned.id, {
                        minLedgerVersion: ss.validatedLedger.ledgerVersion,
                        maxLedgerVersion: ledgerVersion
                     }).then(function(d){

                        clearInterval(checkTransactionStatus)
                        console.log('<<<<<< getTransaction results: >>>>')
                        // console.dir(d, { depth: null })
                        console.dir(d.outcome, { depth: null })

                     }).catch(function(e){
                      console.log('Error getting Transaction: ', e)
                     })

                }
                if(ledgerVersion > ss.validatedLedger.ledgerVersion+4){
                  console.log('>>>>>> EXPIRED <<<<<<<')
                  clearInterval(checkTransactionStatus)
                }

               })

          }, 5000);

       }).catch(console.error);

    }).catch(console.error)

  }).catch(console.error)

})
api.on('disconnected', function (code) {
  console.log('disconnected, code: ', code)
})

api.connect()

setTimeout(function(){
  api.disconnect()
}, 100*1000)
});
var port = process.env.PORT || 3000;

app.listen(port, function() {
  console.log('Server running on port: %d', port);
});