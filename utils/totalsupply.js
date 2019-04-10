const axios=require("axios");
require('dotenv').config()

const totalSupply = 1000000000;

//Checkpoint with previously calculated supply , to be updated with new supply and block #
// Whether this updated or not after wont affect the result just skip transaction to check
const lastBlockChecked=7499108;
const lastSupply=29255712.66;

const contract="0xbe6ac6b50f577205c9d107f37b6e205aa6acc5d4";
const hotWallets=[
  "0x9d2872548e4243aea028007b084c3651d6d62c32",
  "0xe20c059378d0e81393b5402b671b7c7697e0a339"
]

const coldWallets=[
  "0x00237423d1a2401f2ac6a693246c38e1b7c458a0",
  "0x13fc71d126158805062e40fd3f4b70908a90709c",
  "0x4918459c9992676d7c40f528943c915b32a428fe",
  "0x556e78d0482f5ee8f964ebe56deb8a27ed1638de",
  "0x80f05218fa37d96bcbac85a1ce147c11ccd845b8",
  "0x8ed04fa8ea9458eecb55954eafc8baa78014ec2b",
  "0x9abb76cf2a76470bbcb8a9b985daac1f02a76252",
  "0xab011cad29a7cb732c0427d973a6f46cb89c8471",
  "0xc6d26e99d1bb79829237d32ecf165c848d00cd02",
  "0xd678fc3857ebf8f5068b0985f0cfd45c0e8f3549",
  "0xd7453c90a6aa50a66ada4e2fab96894e30bd640f",
  "0xe0f22479de0dd924d8cb177bfc593f2aa508fb1c",
  "0xe1315763ff3d4661c6ce9c6136d604df15b470ab",
  "0xf14b49ee3ace5ee8170b1dee4048284524d476fd",
  "0xf74c5673230d887ad3581594a71887712ceec21a"
]

const address_zero="0x0000000000000000000000000000000000000000";


const apiUrlBase="https://api.etherscan.io/api?module=account&action=tokentx";
const apiKey=process.env.ETHERSCAN_API_KEY;

let circSupply=lastSupply;

async function loadData(address){

  let url=apiUrlBase+
    "&contractaddress="+address+
    "&startBlock="+lastBlockChecked+
    "&apiKey="+apiKey;
  let response = await axios.get(url,{responseType:"json"});;
  let txs=response.data.result;
  for(let i=0;i<txs.length;i++){
    let tx=txs[i];
    if(tx.tokenSymbol=="UND" && hotWallets.includes(tx.from) && !coldWallets.includes(tx.to)){
    let txValue = tx.value/1e18;
    circSupply+=txValue;
    }
  }
  return circSupply;
}


async function run(){
  let supply=await loadData(contract);
  let result = {"circSupply":supply};
  console.log("Circulating Supply: "+supply+" UND ( "+(supply/totalSupply)*100+"% )");
  let fileContents = JSON.stringify(result);
  fs.writeFile("supply.json", "Hey there!", function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("Circulating  supply data was saved to supply.json");
}); 
}

run();
